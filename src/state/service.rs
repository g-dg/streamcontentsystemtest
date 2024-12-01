use std::collections::HashMap;

use tokio::sync::{watch, Mutex};

use super::models::CurrentState;

/// State service
pub struct StateService {
    pub channels: Mutex<HashMap<String, StateChannel>>,
}

impl StateService {
    pub fn new() -> Self {
        Self {
            channels: Mutex::new(HashMap::new()),
        }
    }

    /// Gets or creates a state channel
    pub async fn get_channel(&self, channel_name: &str) -> StateChannel {
        let mut channel = self.channels.lock().await;
        channel
            .entry(String::from(channel_name))
            .or_default()
            .clone()
    }
}

impl Default for StateService {
    fn default() -> Self {
        Self::new()
    }
}

/// State channels
#[derive(Clone)]
pub struct StateChannel {
    pub watch_send: watch::Sender<CurrentState>,
    pub watch_recv: watch::Receiver<CurrentState>,
}

impl StateChannel {
    pub fn new() -> Self {
        let (send, recv) = watch::channel(CurrentState::default());

        Self {
            watch_send: send,
            watch_recv: recv,
        }
    }
}

impl Default for StateChannel {
    fn default() -> Self {
        Self::new()
    }
}
