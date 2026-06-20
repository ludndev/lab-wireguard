#!/usr/bin/env python3
"""
05_rotate_peer_key.py — Replace a peer with a fresh one (key rotation or compromise response).

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 05_rotate_peer_key.py
"""
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))  # noqa: E402
from wg_portal_client import WgPortalClient, WgPortalError  # noqa: E402

CLIENT = WgPortalClient(
    base_url=os.getenv("WG_BASE_URL", "http://192.168.1.100:8888"),
    username=os.getenv("WG_ADMIN_USER", "admin@wgportal.local"),
    api_token=os.getenv("WG_API_TOKEN", ""),
)


def rotate_peer(old_peer_id: str):
    try:
        old_peer = CLIENT.peers.get_by_id(old_peer_id)
    except WgPortalError:
        print(f"Peer not found: {old_peer_id}")
        return

    print(f"Rotating key for peer: {old_peer['Identifier']}")
    print(f"  Interface:  {old_peer['InterfaceIdentifier']}")
    print(f"  Display:    {old_peer.get('DisplayName', '-')}")
    print(f"  User:       {old_peer.get('UserIdentifier', '-')}")

    # Prepare fresh peer with new keys
    prepared = CLIENT.peers.prepare(old_peer["InterfaceIdentifier"])
    print(f"  New keys generated: {prepared['Identifier']}")

    # Create replacement peer with same settings
    new_peer = CLIENT.provisioning.new_peer({
        "InterfaceIdentifier": old_peer["InterfaceIdentifier"],
        "UserIdentifier": old_peer.get("UserIdentifier"),
        "DisplayName": old_peer.get("DisplayName"),
        "PublicKey": prepared.get("PublicKey"),
        "PresharedKey": old_peer.get("PresharedKey"),
    })
    print(f"  New peer created: {new_peer['Identifier']}")

    # Save new config
    config = CLIENT.provisioning.get_peer_config(new_peer["Identifier"])
    out_dir = Path.cwd() / "output" / new_peer["Identifier"]
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "peer.conf").write_text(config)
    print(f"  Config saved to {out_dir / 'peer.conf'}")

    # Disable old peer (don't delete yet — keep for audit)
    CLIENT.peers.update(old_peer_id, {
        **old_peer,
        "Disabled": True,
        "DisabledReason": f"Rotated → {new_peer['Identifier']}",
    })
    print(f"  Old peer disabled (not deleted)")


def main():
    # Replace with actual peer public key
    rotate_peer("replace-with-peer-public-key")


if __name__ == "__main__":
    import sys  # noqa: E402
    main()
