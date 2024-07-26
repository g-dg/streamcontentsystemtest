use std::{collections::HashMap, fs, path, sync::Arc};

use axum::{
    extract::{Path, State},
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use reqwest::StatusCode;

use crate::app::AppServices;

pub fn route() -> Router<Arc<AppServices>> {
    Router::new()
        .route("/", get(list_content))
        .route("/:filename", get(get_content))
}

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

pub fn sanitize_filename(filename: &str) -> String {
    String::from(match filename {
        ".." => ".",
        _ => filename,
    })
}
