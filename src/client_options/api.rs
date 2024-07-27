use std::sync::Arc;

use axum::{extract::State, response::IntoResponse, routing::get, Json, Router};

use crate::app::AppServices;

/// Client options route
pub fn route() -> Router<Arc<AppServices>> {
    Router::new().route("/", get(get_client_options))
}

/// Returns the contents of the "client_options" key in the app config
pub async fn get_client_options(State(state): State<Arc<AppServices>>) -> impl IntoResponse {
    Json(state.config.client_options.clone()).into_response()
}
