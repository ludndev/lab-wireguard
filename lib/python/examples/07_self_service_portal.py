#!/usr/bin/env python3
"""
07_self_service_portal.py — Backend route: user fetches their own peer list and config by email.

This demonstrates a self-service portal where users authenticate by email (not admin auth).
For a real implementation, you'd add an API key check, rate limiting, etc.

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 07_self_service_portal.py <email>
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


def get_user_peers(email: str):
    """Simulate a self-service endpoint: get all peers + configs for a user."""
    try:
        info = CLIENT.provisioning.get_user_info(email=email)
    except WgPortalError as exc:
        return {"error": exc.message, "code": exc.code}

    user_id = info["UserIdentifier"]
    peers_output = []

    for peer in info["Peers"]:
        peer_data = {
            "identifier": peer["Identifier"],
            "display_name": peer.get("DisplayName"),
            "interface": peer["InterfaceIdentifier"],
            "ips": peer.get("IpAddresses"),
            "disabled": peer.get("IsDisabled", False),
        }

        if not peer.get("IsDisabled"):
            try:
                config = CLIENT.provisioning.get_peer_config(peer["Identifier"])
                peer_data["config"] = config
            except WgPortalError:
                peer_data["config"] = None

        peers_output.append(peer_data)

    return {
        "user_identifier": user_id,
        "peer_count": info["PeerCount"],
        "peers": peers_output,
    }


def main():
    import sys  # noqa: E402
    email = sys.argv[1] if len(sys.argv) > 1 else "alice@example.com"

    import json  # noqa: E402
    result = get_user_peers(email)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    import sys  # noqa: E402
    main()
