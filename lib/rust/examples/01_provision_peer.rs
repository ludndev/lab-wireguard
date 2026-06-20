/// 01_provision_peer — Create a peer for a user, write the .conf file and QR code to disk.
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 01_provision_peer
use std::env;
use std::fs;
use std::path::PathBuf;

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

    // Resolve or create user
    let email = "alice@example.com";
    let user_id = match client.provisioning().get_user_info(None, Some(email)) {
        Ok(info) => {
            println!("User exists: {}", info.user_identifier);
            info.user_identifier
        }
        Err(WgPortalError { .. }) => {
            use wg_portal_client::WgUser;
            let user = client
                .users()
                .create(&WgUser {
                    identifier: "alice".into(),
                    email: Some(email.into()),
                    firstname: Some("Alice".into()),
                    password: Some("changeme123".into()),
                    ..Default::default()
                })
                .unwrap();
            println!("Created user: {}", user.identifier);
            user.identifier
        }
    };

    // Get active interface
    let interfaces = client.interfaces().get_all().unwrap();
    let active: Vec<_> = interfaces
        .into_iter()
        .filter(|i| !i.disabled.unwrap_or(false))
        .collect();

    if active.is_empty() {
        eprintln!("No active interfaces");
        std::process::exit(1);
    }
    let iface_id = &active[0].identifier;

    // Provision peer
    use wg_portal_client::ProvisioningRequest;
    let peer = client
        .provisioning()
        .new_peer(&ProvisioningRequest {
            interface_identifier: iface_id.clone(),
            user_identifier: Some(user_id),
            display_name: Some(format!("{email} - laptop")),
            ..Default::default()
        })
        .unwrap();
    println!("Peer: {}", peer.identifier);

    // Save artifacts
    let config = client.provisioning().get_peer_config(&peer.identifier).unwrap();
    let qr_png = client
        .provisioning()
        .get_peer_qr_code(&peer.identifier)
        .unwrap();

    let out_dir = PathBuf::from("output").join(&peer.identifier);
    fs::create_dir_all(&out_dir).unwrap();
    fs::write(out_dir.join("peer.conf"), &config).unwrap();
    fs::write(out_dir.join("qr.png"), &qr_png).unwrap();
    println!("Saved to {}", out_dir.display());
}
