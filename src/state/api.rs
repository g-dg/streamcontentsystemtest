use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
    routing::get,
    Router,
};
use futures::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, watch};

use crate::app::AppServices;

use super::models::CurrentState;

/// State routes
pub fn route() -> Router<Arc<AppServices>> {
    Router::new().route("/", get(handler))
}

/// State requests from the client
#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum StateRequest {
    Get { get: bool },
    Set { state: CurrentState },
    Ping { ping: String },
    Pong { pong: String },
}

/// State responses from the server
#[derive(Serialize, Deserialize)]
#[serde(untagged)]
pub enum StateResponse {
    State { state: CurrentState },
    Ping { ping: String },
    Pong { pong: String },
}

/// Handles the connection and upgrades to websockets
pub async fn handler(State(state): State<Arc<AppServices>>, ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(|socket| websocket_handler(socket, state))
}

/// Websocket handler
pub async fn websocket_handler(socket: WebSocket, state: Arc<AppServices>) {
    let (mut ws_send, mut ws_recv) = socket.split();

    // send a message to this queue to send it to the client
    let (queue_send, mut queue_recv) = mpsc::channel::<String>(1);

    // sends messages to the client from the message queue
    let mut send_task = tokio::spawn(async move {
        while let Some(response) = queue_recv.recv().await {
            ws_send.send(Message::Text(response)).await.unwrap();
        }
    });

    let r_state = state.clone();
    let r_queue_send = queue_send.clone();

    // handles incoming requests from the client
    let mut recv_task = tokio::spawn(async move {
        let mut watch_recv = r_state.state_service.watch_recv.clone();
        let watch_send = r_state.state_service.watch_send.clone();

        // sends a response
        async fn send_response(
            response: &StateResponse,
            queue_send: &mpsc::Sender<String>,
        ) -> Result<(), ()> {
            let response_json = serde_json::to_string(&response).unwrap();
            if queue_send.send(response_json).await.is_err() {
                return Err(());
            }
            Ok(())
        }

        // sends the current state
        async fn send_current_state(
            watch_recv: &mut watch::Receiver<CurrentState>,
            queue_send: &mpsc::Sender<String>,
        ) -> Result<(), ()> {
            let state = watch_recv.borrow_and_update().clone();
            let response = StateResponse::State { state };
            send_response(&response, queue_send).await
        }

        // handle messages
        while let Some(Ok(msg)) = ws_recv.next().await {
            match msg {
                // all messages are text-based
                Message::Text(msg) => {
                    // parse request
                    let request: StateRequest =
                        serde_json::from_str(&msg).expect("Failed to parse state request");

                    match request {
                        // request to get current state
                        StateRequest::Get { get: _ } => {
                            // respond with current state
                            if send_current_state(&mut watch_recv, &r_queue_send)
                                .await
                                .is_err()
                            {
                                return;
                            }
                        }

                        // request to set new state
                        StateRequest::Set { state } => {
                            // set state (will trigger response)
                            if watch_send.send(state).is_err() {
                                return;
                            }
                        }

                        // ping request
                        StateRequest::Ping { ping } => {
                            let send_result =
                                send_response(&StateResponse::Pong { pong: ping }, &r_queue_send)
                                    .await;
                            if send_result.is_err() {
                                return;
                            }
                        }

                        // pong request
                        StateRequest::Pong { pong: _ } => {}
                    }
                }
                Message::Close(_) => return,
                _ => {}
            }
        }
    });

    // watch for changed state
    let watch_task = tokio::spawn(async move {
        let mut watch_recv = state.state_service.watch_recv.clone();
        while let Ok(()) = watch_recv.changed().await {
            let state = watch_recv.borrow_and_update().clone();
            let response = StateResponse::State { state };
            let response_json = serde_json::to_string(&response).unwrap();
            if queue_send.send(response_json).await.is_err() {
                return;
            }
        }
    });

    // abort tasks if send or receive task exit
    tokio::select! {
        _ = (&mut send_task) => {
            recv_task.abort();
            watch_task.abort();
        },
        _ = (&mut recv_task) => {
            send_task.abort();
            watch_task.abort();
        }
    }
}
