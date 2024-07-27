use std::io::ErrorKind;

use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tokio::fs;

/// App config read from file
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppConfig {
    /// Host IP
    #[serde(default = "default_host")]
    pub host: String,

    /// Server Port
    #[serde(default = "default_port")]
    pub port: u16,

    /// List of CORS allowed origins
    #[serde(default = "default_cors_allowed_origins")]
    pub cors_allowed_origins: Vec<String>,

    /// Client server URL used for development client proxy
    #[serde(default = "default_client_proxy_url")]
    pub client_proxy_url: Option<String>,

    /// Directory served by content endpoint
    #[serde(default = "default_content_directory")]
    pub content_directory: String,

    /// Client static file root
    #[serde(default = "default_static_file_root")]
    pub static_file_root: String,

    /// Index file for client inside of the client root
    #[serde(default = "default_static_file_index")]
    pub static_file_index: String,

    /// Max HTTP caching age
    #[serde(default = "default_http_caching_max_age")]
    pub http_caching_max_age: u64,

    /// Options passed to the client
    #[serde(default = "default_client_options")]
    pub client_options: Value,
}

impl AppConfig {
    /// Loads the app config from the specified file
    pub async fn load(filename: &str) -> Self {
        let contents = match fs::read_to_string(filename).await {
            Ok(value) => value,
            Err(err) => {
                if err.kind() == ErrorKind::NotFound {
                    String::from("{}")
                } else {
                    panic!(
                        "Error occurred reading config file \"{}\": {:?}",
                        filename, err
                    )
                }
            }
        };

        serde_json::from_str(&contents).expect("Error occurred parsing config file")
    }
}

fn default_host() -> String {
    String::from("127.0.0.1")
}
fn default_port() -> u16 {
    4316
}
fn default_cors_allowed_origins() -> Vec<String> {
    Vec::from([
        // String::from("http://localhost:5173"),
        // String::from("http://127.0.0.1:5173"),
    ])
}
fn default_client_proxy_url() -> Option<String> {
    None
}
fn default_content_directory() -> String {
    String::from("./content")
}
fn default_static_file_root() -> String {
    String::from("./client/dist/")
}
fn default_static_file_index() -> String {
    String::from("index.html")
}
fn default_http_caching_max_age() -> u64 {
    60 * 60
}
fn default_client_options() -> Value {
    json!({})
}
