#!/usr/bin/env python3
"""
06_disable_inactive_peers.py — Disable peers with no handshake in the last N days (hygiene cron).

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 06_disable_inactive_peers.py [days]
"""
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # noqa: E402
from wg_portal_client import WgPortalClient  # noqa: E402

CLIENT = WgPortalClient(
    base_url=os.getenv("WG_BASE_URL", "http://192.168.1.100:8888"),
    username=os.getenv("WG_ADMIN_USER", "admin@wgportal.local"),
    api_token=os.getenv("WG_API_TOKEN", ""),
)


def main(inactive_days: int = 30):
    cutoff = datetime.now(timezone.utc) - timedelta(days=inactive_days)
    print(f"Checking peers inactive since {cutoff:%Y-%m-%d} ...\n")

    interfaces = CLIENT.interfaces.get_all()
    disabled_count = 0

    for iface in interfaces:
        peers = CLIENT.peers.get_by_interface(iface["Identifier"])
        for peer in peers:
            if peer.get("Disabled"):
                continue

            try:
                metrics = CLIENT.metrics.by_peer(peer["Identifier"])
            except Exception:
                continue

            last_handshake = metrics.get("LastHandshake")
            if not last_handshake:
                # Never connected — treat as inactive
                print(f"  Disabling {peer['Identifier']} (never connected)")
                CLIENT.peers.update(peer["Identifier"], {
                    **peer,
                    "Disabled": True,
                    "DisabledReason": f"No handshake (never connected, check > {inactive_days} days)",
                })
                disabled_count += 1
                continue

            try:
                hs = datetime.fromisoformat(last_handshake)
            except (ValueError, TypeError):
                continue

            if hs < cutoff:
                print(f"  Disabling {peer['Identifier']} (last handshake: {last_handshake})")
                CLIENT.peers.update(peer["Identifier"], {
                    **peer,
                    "Disabled": True,
                    "DisabledReason": f"No handshake since {last_handshake} (check > {inactive_days} days)",
                })
                disabled_count += 1

    print(f"\nDisabled {disabled_count} peer(s)")


if __name__ == "__main__":
    import sys  # noqa: E402
    days = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    main(days)
