use std::any::Any;

use crate::deserializer::{deserialize_flags::Flag, types::BamlValueWithFlags};
use anyhow::Result;
use internal_baml_core::{ast::Field, ir::FieldType};

use super::{ParsingContext, ParsingError};

pub fn coerce_array_to_singular(
    ctx: &ParsingContext,
    target: &FieldType,
    items: &[&crate::jsonish::Value],
    coercion: &dyn (Fn(&crate::jsonish::Value) -> Result<BamlValueWithFlags, ParsingError>),
) -> Result<BamlValueWithFlags, ParsingError> {
    let parsed = items.iter().map(|item| coercion(item)).collect::<Vec<_>>();

    pick_best(ctx, target, &parsed)
}

pub(super) fn pick_best(
    ctx: &ParsingContext,
    target: &FieldType,
    res: &[Result<BamlValueWithFlags, ParsingError>],
) -> Result<BamlValueWithFlags, ParsingError> {
    let Some(first) = res.first() else {
        return Err(ctx.error_unexpected_empty_array(target));
    };
    if res.len() == 1 {
        return first.clone();
    }

    let res_index = (0..res.len())
        .map(|i| match res[i] {
            Ok(ref v) => (i, v.score()),
            Err(_) => (i, i32::MAX),
        })
        .collect::<Vec<_>>();

    // Pick the best one, but in case of picking "default" values like null or empty list, prefer picking the first one
    let mut all_valid_scores = res_index
        .iter()
        .filter_map(|&(i, score)| match res.get(i) {
            Some(Ok(r)) => Some((
                i,
                score,
                match r {
                    BamlValueWithFlags::List(flags, items) => {
                        items.is_empty()
                            && flags.flags.iter().any(|f| matches!(f, Flag::SingleToArray))
                    }
                    _ => false,
                },
                r,
            )),
            _ => None,
        })
        .collect::<Vec<_>>();

    // Sort by (false, score, index)
    all_valid_scores.sort_by(
        |&(a, a_score, a_default, a_val), &(b, b_score, b_default, b_val)| {
            // TODO: This is a bit of a hack. We should likely use some is_subtype_of logic here
            // to ensure that we're accepting the "best" type.
            // E.g. if a is a subtype of b, we should prefer a over b. (empty list is a subtype of any list)
            if matches!(a_val, BamlValueWithFlags::List(_, _))
                && matches!(b_val, BamlValueWithFlags::List(_, _))
            {
                let a_is_single = a_val
                    .conditions()
                    .flags
                    .iter()
                    .any(|f| matches!(f, Flag::SingleToArray));
                let b_is_single = b_val
                    .conditions()
                    .flags
                    .iter()
                    .any(|f| matches!(f, Flag::SingleToArray));

                match (a_is_single, b_is_single) {
                    // Return B
                    (true, false) => return std::cmp::Ordering::Greater,
                    // Return A
                    (false, true) => return std::cmp::Ordering::Less,
                    _ => {
                        if let (
                            BamlValueWithFlags::List(_, items_a),
                            BamlValueWithFlags::List(_, items_b),
                        ) = (a_val, b_val)
                        {
                            let unparseables_a = a_val
                                .conditions()
                                .flags
                                .iter()
                                .filter(|f| matches!(f, Flag::ArrayItemParseError(..)))
                                .count();
                            let unparseables_b = b_val
                                .conditions()
                                .flags
                                .iter()
                                .filter(|f| matches!(f, Flag::ArrayItemParseError(..)))
                                .count();
                            match (unparseables_a, unparseables_b) {
                                // If A has no unparseables and B has unparseables and B is empty, prefer A
                                (0, b) if b > 0 && items_b.is_empty() => {
                                    return std::cmp::Ordering::Less
                                }
                                // If A has unparseables and B has no unparseables and A is empty, prefer B
                                (a, 0) if a > 0 && items_a.is_empty() => {
                                    return std::cmp::Ordering::Greater
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }

            // De-value default values when comparing
            if let (
                BamlValueWithFlags::Class(_, a_conds, a_props),
                BamlValueWithFlags::Class(_, b_conds, b_props),
            ) = (a_val, b_val)
            {
                // If matching on a union, and one of the choices is picking an object that only
                // had a single string coerced from JSON, prefer the other one
                // (since string cost is low, its better to pick the other one if possible)
                if matches!(target, FieldType::Union(_)) {
                    let a_is_coerced_string = a_props.len() == 1
                        && a_props.iter().all(|(_, cond)| {
                            matches!(cond, BamlValueWithFlags::String(..))
                                && cond
                                    .conditions()
                                    .flags
                                    .iter()
                                    .any(|f| matches!(f, Flag::ImpliedKey(..)))
                        });

                    let b_is_coerced_string = b_props.len() == 1
                        && b_props.iter().all(|(_, cond)| {
                            matches!(cond, BamlValueWithFlags::String(..))
                                && cond
                                    .conditions()
                                    .flags
                                    .iter()
                                    .any(|f| matches!(f, Flag::ImpliedKey(..)))
                        });

                    match (a_is_coerced_string, b_is_coerced_string) {
                        // Return B
                        (true, false) => return std::cmp::Ordering::Greater,
                        // Return A
                        (false, true) => return std::cmp::Ordering::Less,
                        _ => {}
                    }
                }

                let a_is_default = a_props.iter().all(|(k, cond)| {
                    cond.conditions().flags.iter().any(|f| {
                        matches!(
                            f,
                            Flag::OptionalDefaultFromNoValue | Flag::DefaultFromNoValue
                        )
                    })
                });
                let b_is_default = b_props.iter().all(|(k, cond)| {
                    cond.conditions().flags.iter().any(|f| {
                        matches!(
                            f,
                            Flag::OptionalDefaultFromNoValue | Flag::DefaultFromNoValue
                        )
                    })
                });

                match (a_is_default, b_is_default) {
                    // Return B
                    (true, false) => return std::cmp::Ordering::Greater,
                    // Return A
                    (false, true) => return std::cmp::Ordering::Less,
                    _ => {}
                }
            }

            match a_default.cmp(&b_default) {
                std::cmp::Ordering::Equal => match a_score.cmp(&b_score) {
                    std::cmp::Ordering::Equal => a.cmp(&b),
                    std::cmp::Ordering::Less => std::cmp::Ordering::Less,
                    std::cmp::Ordering::Greater => std::cmp::Ordering::Greater,
                },
                std::cmp::Ordering::Less => std::cmp::Ordering::Less,
                std::cmp::Ordering::Greater => std::cmp::Ordering::Greater,
            }
        },
    );

    log::trace!(
        "Picking {} from {:?} items. Picked({:?}):\n{}",
        target,
        res_index,
        first,
        res.as_ref()
            .iter()
            .enumerate()
            .map(|(idx, r)| match r {
                Ok(r) => format!("{idx} {r:#}"),
                Err(e) => format!("{idx} {e:#}"),
            })
            .collect::<Vec<_>>()
            .join("\n")
    );

    // Take the best one
    match all_valid_scores.first() {
        Some(&(i, _, _, v)) => {
            let mut v = v.clone();
            if res.len() > 1 {
                v.add_flag(if matches!(target, FieldType::Union(_)) {
                    Flag::UnionMatch(i, res.to_vec())
                } else {
                    Flag::FirstMatch(i, res.to_vec())
                });
            }
            Ok(v.to_owned())
        }
        None => {
            if !res.is_empty() {
                let errors = res.iter().filter_map(|r| match r {
                    Ok(_) => None,
                    Err(e) => Some(e),
                });
                Err(ctx.error_merge_multiple(
                    &format!("Failed to find any {} in {} items", target, res.len()),
                    errors,
                ))
            } else {
                Err(ctx.error_internal("Index out of bounds"))
            }
        }
    }
}
