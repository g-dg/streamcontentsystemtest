#![windows_subsystem = "windows"]

pub mod api;
pub mod app;
pub mod client_options;
pub mod config;
pub mod content;
pub mod helpers;
pub mod state;

use std::time::Duration;

use app::App;
use config::file::AppConfig;
use tokio::{signal, time::sleep};
use tokio_util::sync::CancellationToken;

const CONFIG_FILE: &str = "./config.json";

#[tokio::main]
pub async fn main() {
    let config = AppConfig::load(CONFIG_FILE).await;

    let app = App::build(&config).await;

    let browser_port = config.port;

    if let Ok(app) = app {
        let shutdown_token = app.shutdown_token.clone();
        let browser_task = tokio::spawn(async move {
            tokio::select! {
                _ = sleep(Duration::from_secs(1)) => {},
                _ = shutdown_token.cancelled() => {},
            }
            let _ = open_browser(browser_port);
        });

        axum::serve(app.listener, app.router)
            .with_graceful_shutdown(shutdown_signal(app.shutdown_token))
            .await
            .expect("Error occurred in web server task");

        let _ = browser_task.await;
    } else {
        let _ = open_browser(browser_port);
    }
}

fn open_browser(port: u16) -> Result<(), std::io::Error> {
    webbrowser::open(&format!("http://localhost:{}/", port))
}

async fn shutdown_signal(shutdown_token: CancellationToken) {
    let ctrl_c = async {
        signal::ctrl_c().await.unwrap();
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .unwrap()
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => shutdown_token.cancel(),
        _ = terminate => shutdown_token.cancel(),
        _ = shutdown_token.cancelled() => {},
    }
}
