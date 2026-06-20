#!/usr/bin/env python3
"""
03_dashboard_metrics.py — Pull live traffic metrics for every interface and peer.

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 03_dashboard_metrics.py
"""
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # noqa: E402
from wg_portal_client import WgPortalClient  # noqa: E402

CLIENT = WgPortalClient(
    base_url=os.getenv("WG_BASE_URL", "http://192.168.1.100:8888"),
    username=os.getenv("WG_ADMIN_USER", "admin@wgportal.local"),
    api_token=os.getenv("WG_API_TOKEN", ""),
)


def fmt_bytes(b: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if b < 1024:
            return f"{b:.1f} {unit}"
        b /= 1024
    return f"{b:.1f} TB"


def main():
    interfaces = CLIENT.interfaces.get_all()
    for iface in interfaces:
        print(f"\n{'='*60}")
        print(f"  Interface: {iface['Identifier']}")
        try:
            m = CLIENT.metrics.by_interface(iface["Identifier"])
            print(f"  Traffic:   ↓{fmt_bytes(m['BytesReceived'])}  ↑{fmt_bytes(m['BytesTransmitted'])}")
        except Exception:
            print("  Traffic:   (unavailable)")

        peers = CLIENT.peers.get_by_interface(iface["Identifier"])
        for peer in peers:
            print(f"\n  Peer: {peer['Identifier']} ({peer.get('DisplayName', '-')})")
            try:
                pm = CLIENT.metrics.by_peer(peer["Identifier"])
                print(f"    Traffic: ↓{fmt_bytes(pm['BytesReceived'])}  ↑{fmt_bytes(pm['BytesTransmitted'])}")
                if pm.get("LastHandshake"):
                    print(f"    Handshake: {pm['LastHandshake']}")
            except Exception:
                print("    Traffic: (unavailable)")

    print()


if __name__ == "__main__":
    import sys  # noqa: E402
    main()
