pub mod server_info;
pub mod shutdown;

use std::sync::Arc;

use axum::Router;

use crate::{app::AppServices, content, state, text};

pub fn route() -> Router<Arc<AppServices>> {
    Router::new()
        .nest("/server-info", server_info::route())
        .nest("/shutdown", shutdown::route())
        .nest("/content", content::api::route())
        .nest("/state", state::api::route())
        .nest("/text", text::api::route())
}
