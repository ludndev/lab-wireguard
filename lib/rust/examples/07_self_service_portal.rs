/// 07_self_service_portal — Backend route: user fetches their own peer list and config by email.
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 07_self_service_portal <email>
use std::env;

use serde::Serialize;
use wg_portal_client::{WgPortalClient, WgPortalError};

fn require_env(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| {
        eprintln!("Missing required env var: {key}");
        std::process::exit(1);
    })
}

#[derive(Serialize)]
struct PeerData {
    identifier: String,
    display_name: Option<String>,
    interface: String,
    ips: Option<Vec<String>>,
    disabled: bool,
    config: Option<String>,
}

#[derive(Serialize)]
struct UserPortal {
    user_identifier: String,
    peer_count: i64,
    peers: Vec<PeerData>,
}

fn get_user_peers(client: &WgPortalClient, email: &str) -> Result<UserPortal, WgPortalError> {
    let info = client.provisioning().get_user_info(None, Some(email))?;

    let mut peers_output = Vec::new();
    for p in &info.peers {
        let disabled = p.is_disabled.unwrap_or(false);
        let config = if !disabled {
            client
                .provisioning()
                .get_peer_config(&p.identifier)
                .ok()
        } else {
            None
        };

        peers_output.push(PeerData {
            identifier: p.identifier.clone(),
            display_name: p.display_name.clone(),
            interface: p.interface_identifier.clone().unwrap_or_default(),
            ips: p.ip_addresses.clone(),
            disabled,
            config,
        });
    }

    Ok(UserPortal {
        user_identifier: info.user_identifier,
        peer_count: info.peer_count,
        peers: peers_output,
    })
}

fn main() {
    let client = WgPortalClient::new(
        &require_env("WG_BASE_URL"),
        &require_env("WG_ADMIN_USER"),
        &require_env("WG_API_TOKEN"),
    );

    let args: Vec<String> = env::args().collect();
    let email = args.get(1).map(|s| s.as_str()).unwrap_or("alice@example.com");

    match get_user_peers(&client, email) {
        Ok(portal) => println!("{}", serde_json::to_string_pretty(&portal).unwrap()),
        Err(e) => eprintln!("Error [{code}]: {message}", code = e.code, message = e.message),
    }
}
