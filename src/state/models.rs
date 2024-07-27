use serde::{Deserialize, Serialize};
use serde_json::Value;

/// State object
#[derive(Clone, Serialize, Deserialize)]
pub struct CurrentState {
    /// ID used to detect state changes
    pub id: String,
    /// State contents (client-defined, can be any JSON)
    pub content: Value,
}

impl CurrentState {
    pub fn new() -> Self {
        Self {
            id: String::default(),
            content: Value::Null,
        }
    }
}

impl Default for CurrentState {
    fn default() -> Self {
        Self::new()
    }
}
