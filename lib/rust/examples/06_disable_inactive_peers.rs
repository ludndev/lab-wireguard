/// 06_disable_inactive_peers — Disable peers with no handshake in the last N days (hygiene cron).
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 06_disable_inactive_peers [days]
use std::env;

use wg_portal_client::{WgPeer, WgPortalClient};

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

    let args: Vec<String> = env::args().collect();
    let inactive_days: i64 = args.get(1).and_then(|s| s.parse().ok()).unwrap_or(30);
    let cutoff = chrono::Utc::now() - chrono::Duration::days(inactive_days);
    println!("Checking peers inactive since {} ...\n", cutoff.format("%Y-%m-%d"));

    let interfaces = client.interfaces().get_all().unwrap();
    let mut disabled_count = 0;

    for iface in &interfaces {
        let peers = client.peers().get_by_interface(&iface.identifier).unwrap();
        for peer in &peers {
            if peer.disabled.unwrap_or(false) {
                continue;
            }

            let last_handshake = match client.metrics().by_peer(&peer.identifier) {
                Ok(m) => m.last_handshake,
                Err(_) => continue,
            };

            let should_disable = match last_handshake {
                None => {
                    println!(
                        "  Disabling {} (never connected)",
                        peer.identifier
                    );
                    true
                }
                Some(ref hs) => {
                    if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(hs) {
                        if dt < cutoff {
                            println!(
                                "  Disabling {} (last handshake: {hs})",
                                peer.identifier
                            );
                            true
                        } else {
                            false
                        }
                    } else {
                        false
                    }
                }
            };

            if should_disable {
                client
                    .peers()
                    .update(
                        &peer.identifier,
                        &WgPeer {
                            disabled: Some(true),
                            disabled_reason: Some(format!(
                                "No handshake since {last_handshake:?} (check > {inactive_days} days)"
                            )),
                            ..peer.clone()
                        },
                    )
                    .unwrap();
                disabled_count += 1;
            }
        }
    }

    println!("\nDisabled {disabled_count} peer(s)");
}
