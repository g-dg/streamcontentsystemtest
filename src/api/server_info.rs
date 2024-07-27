use std::sync::Arc;

use axum::{
    routing::{get, post},
    Router,
};

use crate::app::AppServices;

/// Server info routes
pub fn route() -> Router<Arc<AppServices>> {
    Router::new()
        .route("/ping", post(ping))
        .route("/version", get(version))
        .route("/license", get(license))
}

/// Pings the server
pub async fn ping(request: String) -> String {
    request
}

/// Returns the license of the server
pub async fn license() -> &'static str {
    include_str!("../../LICENSE")
}

/// Returns the server version
pub async fn version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}
