mod context_manager;
// mod expression_helper;
pub mod on_log_event;
mod response;
pub(crate) mod runtime_context;
mod stream;
mod trace_stats;

pub use context_manager::RuntimeContextManager;
pub use response::{FunctionResult, TestFailReason, TestResponse, TestStatus};
pub use runtime_context::{RuntimeContext, SpanCtx};
pub use stream::FunctionResultStream;
pub use trace_stats::{InnerTraceStats, TraceStats};

#[derive(Debug, Clone, Copy)]
pub struct RenderCurlSettings {
    pub stream: bool,
    pub as_shell_commands: bool,
}
