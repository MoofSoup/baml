# This file is generated by the BAML compiler.
# Do not edit this file directly.
# Instead, edit the BAML files and recompile.
#
# BAML version: 0.0.1
# Generated Date: __DATE__
# Generated by: aaronvillalpando

from ...._impl.deserializer import register_deserializer
from enum import Enum


@register_deserializer()
class PersonType(str, Enum):
    BAD = "BAD"
    GOOD = "GOOD"
    NEUTRAL = "NEUTRAL"
