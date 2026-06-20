#!/usr/bin/env python3
"""
02_offboard_user.py — Delete all peers for a user, then delete the user account.

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 02_offboard_user.py
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
    user_id = "alice"

    try:
        CLIENT.users.get_by_id(user_id)
    except WgPortalError:
        print(f"User {user_id} not found")
        sys.exit(0)

    peers = CLIENT.peers.get_by_user(user_id)
    for peer in peers:
        print(f"Deleting peer: {peer['Identifier']} ({peer.get('DisplayName', '-')})")
        CLIENT.peers.delete(peer["Identifier"])

    CLIENT.users.delete(user_id)
    print(f"User {user_id} deleted")


if __name__ == "__main__":
    main()
