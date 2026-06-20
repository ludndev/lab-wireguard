/// 03_dashboard_metrics — Pull live traffic metrics for every interface and peer.
///
/// Usage:
///   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... cargo run --example 03_dashboard_metrics
use std::env;

use wg_portal_client::WgPortalClient;

fn require_env(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| {
        eprintln!("Missing required env var: {key}");
        std::process::exit(1);
    })
}

fn fmt_bytes(b: i64) -> String {
    let units = ["B", "KB", "MB", "GB", "TB"];
    let mut value = b as f64;
    for unit in units {
        if value < 1024.0 {
            return format!("{value:.1} {unit}");
        }
        value /= 1024.0;
    }
    format!("{value:.1} PB")
}

fn main() {
    let client = WgPortalClient::new(
        &require_env("WG_BASE_URL"),
        &require_env("WG_ADMIN_USER"),
        &require_env("WG_API_TOKEN"),
    );

    let interfaces = client.interfaces().get_all().unwrap();
    for iface in &interfaces {
        println!("\n{}", "=".repeat(60));
        println!("  Interface: {}", iface.identifier);

        match client.metrics().by_interface(&iface.identifier) {
            Ok(m) => println!(
                "  Traffic:   ↓{}  ↑{}",
                fmt_bytes(m.bytes_received),
                fmt_bytes(m.bytes_transmitted)
            ),
            Err(_) => println!("  Traffic:   (unavailable)"),
        }

        let peers = client.peers().get_by_interface(&iface.identifier).unwrap();
        for peer in &peers {
            println!(
                "\n  Peer: {} ({})",
                peer.identifier,
                peer.display_name.as_deref().unwrap_or("-")
            );
            match client.metrics().by_peer(&peer.identifier) {
                Ok(pm) => {
                    println!(
                        "    Traffic: ↓{}  ↑{}",
                        fmt_bytes(pm.bytes_received.unwrap_or(0)),
                        fmt_bytes(pm.bytes_transmitted.unwrap_or(0))
                    );
                    if let Some(ref hs) = pm.last_handshake {
                        println!("    Handshake: {hs}");
                    }
                }
                Err(_) => println!("    Traffic: (unavailable)"),
            }
        }
    }
    println!();
}
