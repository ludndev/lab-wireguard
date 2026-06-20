#!/usr/bin/env python3
"""
01_provision_peer.py — Create a peer for a user, write the .conf file and QR code to disk.

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 01_provision_peer.py
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from wg_portal_client import WgPortalClient, WgPortalError

CLIENT = WgPortalClient(
    base_url=os.getenv("WG_BASE_URL", "http://192.168.1.100:8888"),
    username=os.getenv("WG_ADMIN_USER", "admin@wgportal.local"),
    api_token=os.getenv("WG_API_TOKEN", ""),
)


def main():
    # Resolve or create user
    email = "alice@example.com"
    try:
        info = CLIENT.provisioning.get_user_info(email=email)
        user_id = info["UserIdentifier"]
        print(f"User exists: {user_id}")
    except WgPortalError:
        user = CLIENT.users.create({
            "Identifier": "alice",
            "Email": email,
            "Firstname": "Alice",
            "Password": "changeme123",
        })
        user_id = user["Identifier"]
        print(f"Created user: {user_id}")

    # Get active interface
    interfaces = CLIENT.interfaces.get_all()
    active = [i for i in interfaces if not i.get("Disabled")]
    if not active:
        print("No active interfaces")
        sys.exit(1)
    iface_id = active[0]["Identifier"]

    # Provision peer
    peer = CLIENT.provisioning.new_peer({
        "InterfaceIdentifier": iface_id,
        "UserIdentifier": user_id,
        "DisplayName": f"{email} - laptop",
    })
    print(f"Peer: {peer['Identifier']}")

    # Save artifacts
    config = CLIENT.provisioning.get_peer_config(peer["Identifier"])
    qr_png = CLIENT.provisioning.get_peer_qr_code(peer["Identifier"])

    out_dir = Path.cwd() / "output" / peer["Identifier"]
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "peer.conf").write_text(config)
    (out_dir / "qr.png").write_bytes(qr_png)
    print(f"Saved to {out_dir}")


if __name__ == "__main__":
    main()
