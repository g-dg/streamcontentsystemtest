use std::{fs, path, sync::Arc};

use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, put},
};

use crate::app::AppServices;

/// Show routes
pub fn route() -> Router<Arc<AppServices>> {
    Router::new()
        .route("/", get(list_shows))
        .route("/{:filename}", get(get_show))
        .route("/{:filename}", put(set_show))
        .route("/{:filename}", delete(delete_show))
}

/// Lists all the show files
pub async fn list_shows(State(state): State<Arc<AppServices>>) -> impl IntoResponse {
    let Ok(dir) = fs::read_dir(state.config.show_directory.clone()) else {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    };

    let mut files = Vec::new();
    for file in dir {
        let Ok(file) = file else {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        let Ok(filename) = file.file_name().into_string() else {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        let Ok(file_type) = file.file_type() else {
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        };

        if !file_type.is_file() {
            continue;
        }

        let sanitized_filename = sanitize_filename(&filename);
        let path = file.path();
        if !path.is_file() {
            continue;
        }

        files.push(sanitized_filename);
    }

    Json(files).into_response()
}

/// Gets the content of a single show file
pub async fn get_show(
    State(state): State<Arc<AppServices>>,
    Path(filename): Path<String>,
) -> impl IntoResponse {
    let filename = sanitize_filename(&filename);

    let mut path = path::PathBuf::from(&state.config.show_directory.clone());
    path.push(&filename);

    if !path.is_file() {
        return StatusCode::NOT_FOUND.into_response();
    }

    let Ok(contents) = fs::read_to_string(path) else {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    };

    contents.into_response()
}

/// Sets the content of a single show file
pub async fn set_show(
    State(state): State<Arc<AppServices>>,
    Path(filename): Path<String>,
    text: String,
) -> impl IntoResponse {
    let filename = sanitize_filename(&filename);

    let mut path = path::PathBuf::from(&state.config.show_directory.clone());
    path.push(&filename);

    if fs::write(path, text).is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    StatusCode::NO_CONTENT.into_response()
}

/// Deletes a show file
pub async fn delete_show(
    State(state): State<Arc<AppServices>>,
    Path(filename): Path<String>,
) -> impl IntoResponse {
    let filename = sanitize_filename(&filename);

    let mut path = path::PathBuf::from(&state.config.show_directory.clone());
    path.push(&filename);

    if !path.is_file() {
        return StatusCode::NOT_FOUND.into_response();
    }

    if fs::remove_file(path).is_err() {
        return StatusCode::INTERNAL_SERVER_ERROR.into_response();
    }

    StatusCode::NO_CONTENT.into_response()
}

/// Sanitizes the filenames passed into the client endpoints.
pub fn sanitize_filename(filename: &str) -> String {
    sanitize_filename::sanitize(filename)
}
