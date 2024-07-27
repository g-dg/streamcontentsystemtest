pub mod server_info;
pub mod shutdown;

use std::sync::Arc;

use axum::Router;

use crate::{app::AppServices, client_options, content, state};

/// API routes
pub fn route() -> Router<Arc<AppServices>> {
    Router::new()
        .nest("/server-info", server_info::route())
        .nest("/shutdown", shutdown::route())
        .nest("/content", content::api::route())
        .nest("/state", state::api::route())
        .nest("/config", client_options::api::route())
}
