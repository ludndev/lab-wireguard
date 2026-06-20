/// 05_rotate_peer_key — Replace a peer with a fresh one (key rotation or compromise response).
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 05_rotate_peer_key
use std::env;
use std::fs;
use std::path::PathBuf;

use wg_portal_client::{ProvisioningRequest, WgPortalClient, WgPortalError, WgPeer};

fn require_env(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| {
        eprintln!("Missing required env var: {key}");
        std::process::exit(1);
    })
}

fn rotate_peer(client: &WgPortalClient, old_peer_id: &str) {
    let old_peer = match client.peers().get_by_id(old_peer_id) {
        Ok(p) => p,
        Err(WgPortalError { code: 404, .. }) => {
            println!("Peer not found: {old_peer_id}");
            return;
        }
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    };

    println!("Rotating key for peer: {}", old_peer.identifier);
    println!("  Interface:  {}", old_peer.interface_identifier);
    println!(
        "  Display:    {}",
        old_peer.display_name.as_deref().unwrap_or("-")
    );
    println!(
        "  User:       {}",
        old_peer.user_identifier.as_deref().unwrap_or("-")
    );

    // Prepare fresh peer with new keys
    let prepared = client
        .peers()
        .prepare(&old_peer.interface_identifier)
        .unwrap();
    println!("  New keys generated: {}", prepared.identifier);

    // Create replacement peer
    let new_peer = client
        .provisioning()
        .new_peer(&ProvisioningRequest {
            interface_identifier: old_peer.interface_identifier.clone(),
            user_identifier: old_peer.user_identifier.clone(),
            display_name: old_peer.display_name.clone(),
            public_key: prepared.public_key,
            preshared_key: old_peer.preshared_key.clone(),
            ..Default::default()
        })
        .unwrap();
    println!("  New peer created: {}", new_peer.identifier);

    // Save new config
    let config = client
        .provisioning()
        .get_peer_config(&new_peer.identifier)
        .unwrap();
    let out_dir = PathBuf::from("output").join(&new_peer.identifier);
    fs::create_dir_all(&out_dir).unwrap();
    fs::write(out_dir.join("peer.conf"), &config).unwrap();
    println!("  Config saved to {}", out_dir.join("peer.conf").display());

    // Disable old peer
    client
        .peers()
        .update(
            old_peer_id,
            &WgPeer {
                disabled: Some(true),
                disabled_reason: Some(format!("Rotated → {}", new_peer.identifier)),
                ..old_peer
            },
        )
        .unwrap();
    println!("  Old peer disabled (not deleted)");
}

fn main() {
    let client = WgPortalClient::new(
        &require_env("WG_BASE_URL"),
        &require_env("WG_ADMIN_USER"),
        &require_env("WG_API_TOKEN"),
    );

    rotate_peer(&client, "replace-with-peer-public-key");
}
