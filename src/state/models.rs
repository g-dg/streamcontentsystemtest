use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

#[derive(Clone, Serialize, Deserialize)]
pub struct CurrentState {
    pub id: String,
    pub content: Value,
}

impl CurrentState {
    pub fn new() -> Self {
        Self {
            id: String::default(),
            content: json!(None::<String>),
        }
    }
}

impl Default for CurrentState {
    fn default() -> Self {
        Self::new()
    }
}
