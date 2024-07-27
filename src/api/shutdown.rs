use std::sync::Arc;

use axum::{extract::State, routing::post, Router};

use crate::app::AppServices;

/// Shutdown route
pub fn route() -> Router<Arc<AppServices>> {
    Router::new().route("/", post(shutdown))
}

/// Sends the shutdown signal
pub async fn shutdown(State(state): State<Arc<AppServices>>) {
    state.shutdown_token.cancel()
}
