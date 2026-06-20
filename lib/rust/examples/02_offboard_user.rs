/// 02_offboard_user — Delete all peers for a user, then delete the user account.
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 02_offboard_user
use std::env;

use wg_portal_client::{WgPortalClient, WgPortalError};

fn require_env(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| {
        eprintln!("Missing required env var: {key}");
        std::process::exit(1);
    })
}

fn main() {
    let client = WgPortalClient::new(
        &require_env("WG_BASE_URL"),
        &require_env("WG_ADMIN_USER"),
        &require_env("WG_API_TOKEN"),
    );

    let user_id = "alice";

    match client.users().get_by_id(user_id) {
        Err(WgPortalError { code: 404, .. }) => {
            println!("User {user_id} not found");
            return;
        }
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
        Ok(_) => {}
    }

    let peers = client.peers().get_by_user(user_id).unwrap();
    for peer in &peers {
        println!(
            "Deleting peer: {} ({})",
            peer.identifier,
            peer.display_name.as_deref().unwrap_or("-")
        );
        client.peers().delete(&peer.identifier).unwrap();
    }

    client.users().delete(user_id).unwrap();
    println!("User {user_id} deleted");
}
