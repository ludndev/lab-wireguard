#!/usr/bin/env python3
"""
04_bulk_create_users.py — Import a list of users, create accounts, and provision one peer each.

Usage:
  WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... python 04_bulk_create_users.py
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

USERS = [
    {"email": "bob@example.com", "firstname": "Bob", "lastname": "Smith"},
    {"email": "carol@example.com", "firstname": "Carol", "lastname": "Jones"},
    {"email": "dave@example.com", "firstname": "Dave", "lastname": "Brown"},
]


def main():
    interfaces = CLIENT.interfaces.get_all()
    active = [i for i in interfaces if not i.get("Disabled")]
    if not active:
        print("No active interfaces")
        return
    iface_id = active[0]["Identifier"]

    for u in USERS:
        identifier = u["email"].split("@")[0]
        print(f"\nProcessing {u['email']} ...")

        try:
            info = CLIENT.provisioning.get_user_info(email=u["email"])
            user_id = info["UserIdentifier"]
            print(f"  User exists: {user_id}")
        except WgPortalError:
            user = CLIENT.users.create({
                "Identifier": identifier,
                "Email": u["email"],
                "Firstname": u["firstname"],
                "Lastname": u["lastname"],
                "Password": "changeme123",
            })
            user_id = user["Identifier"]
            print(f"  Created: {user_id}")

        peer = CLIENT.provisioning.new_peer({
            "InterfaceIdentifier": iface_id,
            "UserIdentifier": user_id,
            "DisplayName": f"{u['email']} - device",
        })
        print(f"  Peer: {peer['Identifier']}")


if __name__ == "__main__":
    import sys  # noqa: E402
    main()
