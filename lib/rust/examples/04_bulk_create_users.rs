/// 04_bulk_create_users — Import a list of users, create accounts, and provision one peer each.
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 04_bulk_create_users
use std::env;

use wg_portal_client::{ProvisioningRequest, WgPortalClient, WgPortalError, WgUser};

fn require_env(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| {
        eprintln!("Missing required env var: {key}");
        std::process::exit(1);
    })
}

struct UserEntry {
    email: &'static str,
    firstname: &'static str,
    lastname: &'static str,
}

const USERS: &[UserEntry] = &[
    UserEntry { email: "bob@example.com", firstname: "Bob", lastname: "Smith" },
    UserEntry { email: "carol@example.com", firstname: "Carol", lastname: "Jones" },
    UserEntry { email: "dave@example.com", firstname: "Dave", lastname: "Brown" },
];

fn main() {
    let client = WgPortalClient::new(
        &require_env("WG_BASE_URL"),
        &require_env("WG_ADMIN_USER"),
        &require_env("WG_API_TOKEN"),
    );

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

    for u in USERS {
        let identifier = u.email.split('@').next().unwrap();
        println!("\nProcessing {} ...", u.email);

        let user_id = match client.provisioning().get_user_info(None, Some(u.email)) {
            Ok(info) => {
                println!("  User exists: {}", info.user_identifier);
                info.user_identifier
            }
            Err(WgPortalError { .. }) => {
                let user = client
                    .users()
                    .create(&WgUser {
                        identifier: identifier.into(),
                        email: Some(u.email.into()),
                        firstname: Some(u.firstname.into()),
                        lastname: Some(u.lastname.into()),
                        password: Some("changeme123".into()),
                        ..Default::default()
                    })
                    .unwrap();
                println!("  Created: {}", user.identifier);
                user.identifier
            }
        };

        let peer = client
            .provisioning()
            .new_peer(&ProvisioningRequest {
                interface_identifier: iface_id.clone(),
                user_identifier: Some(user_id),
                display_name: Some(format!("{} - device", u.email)),
                ..Default::default()
            })
            .unwrap();
        println!("  Peer: {}", peer.identifier);
    }
}
