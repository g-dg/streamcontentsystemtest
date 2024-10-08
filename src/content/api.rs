use std::{collections::HashMap, fs, path, sync::Arc};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, put},
    Json, Router,
};

use crate::app::AppServices;

/// Content routes
pub fn route() -> Router<Arc<AppServices>> {
    Router::new()
        .route("/", get(list_content))
        .route("/:filename", get(get_content))
        .route("/:filename", put(set_content))
}

/// Lists all the content files and their contents
pub async fn list_content(State(state): State<Arc<AppServices>>) -> impl IntoResponse {
    let Ok(dir) = fs::read_dir(state.config.content_directory.clone()) else {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    };

    let mut files = HashMap::new();
    for file in dir {
        let Ok(file) = file else {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        let Ok(filename) = file.file_name().into_string() else {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        let sanitized_filename = sanitize_filename(&filename);
        let path = file.path();
        if !path.is_file() {
            continue;
        }

        let Ok(contents) = fs::read_to_string(path) else {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        files.insert(sanitized_filename, contents);
    }

    Json(files).into_response()
}

/// Gets the value of a single content file
pub async fn get_content(
    State(state): State<Arc<AppServices>>,
    Path(filename): Path<String>,
) -> impl IntoResponse {
    let filename = sanitize_filename(&filename);

    let mut path = path::PathBuf::from(&state.config.content_directory.clone());
    path.push(&filename);

    if !path.is_file() {
        return StatusCode::NOT_FOUND.into_response();
    }

    let Ok(contents) = fs::read_to_string(path) else {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    };

    contents.into_response()
}

/// Sets the value of a single content file
pub async fn set_content(
    State(state): State<Arc<AppServices>>,
    Path(filename): Path<String>,
    text: String,
) -> impl IntoResponse {
    let filename = sanitize_filename(&filename);

    let mut path = path::PathBuf::from(&state.config.content_directory.clone());
    path.push(&filename);

    if !path.is_file() {
        return StatusCode::NOT_FOUND.into_response();
    }

    if fs::write(path, text).is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    StatusCode::NO_CONTENT.into_response()
}

/// Sanitizes the filenames passed into the client endpoints.
pub fn sanitize_filename(filename: &str) -> String {
    sanitize_filename::sanitize(filename)
}
