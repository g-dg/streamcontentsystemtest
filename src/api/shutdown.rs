use std::sync::Arc;

use axum::{extract::State, routing::post, Router};

use crate::app::AppServices;

pub fn route() -> Router<Arc<AppServices>> {
    Router::new().route("/", post(shutdown))
}

pub async fn shutdown(State(state): State<Arc<AppServices>>) {
    state.shutdown_token.cancel()
}
