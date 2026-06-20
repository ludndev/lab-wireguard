from __future__ import annotations

import base64

import pytest

from wg_portal_client import WgPortalClient
from wg_portal_client._http import _HttpClient

BASE_URL = "http://wg-portal.test:8888"
USERNAME = "admin@wgportal.local"
API_TOKEN = "test-token"
EXPECTED_AUTH = "Basic " + base64.b64encode(f"{USERNAME}:{API_TOKEN}".encode()).decode()


@pytest.fixture
def http():
    return _HttpClient(BASE_URL, USERNAME, API_TOKEN)


@pytest.fixture
def client():
    return WgPortalClient(BASE_URL, USERNAME, API_TOKEN)


# ── Mock helpers ──────────────────────────────────────────────────────────────

def mock_json(httpx_mock, method: str, url: str, body: object, status: int = 200):
    httpx_mock.add_response(method=method, url=url, json=body, status_code=status)


def mock_bytes(httpx_mock, method: str, url: str, content: bytes, status: int = 200):
    httpx_mock.add_response(method=method, url=url, content=content, status_code=status)


def mock_error(httpx_mock, method: str, url: str, code: int, message: str, details: str):
    httpx_mock.add_response(method=method, url=url, json={"Code": code, "Message": message, "Details": details}, status_code=code)


def mock_no_content(httpx_mock, method: str, url: str):
    httpx_mock.add_response(method=method, url=url, status_code=204)


# ── Fixture data ──────────────────────────────────────────────────────────────

INTERFACE = {
    "Identifier": "wg0",
    "Mode": "server",
    "PrivateKey": "gI6EdUSYvn8ugXOt8QQD6Yc+JyiZxIhp3GInSWRfWGE=",
    "PublicKey": "HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=",
    "DisplayName": "My Interface",
    "Addresses": ["10.11.12.1/24"],
    "Dns": ["1.1.1.1"],
    "DnsSearch": ["wg.local"],
    "ListenPort": 51820,
    "Mtu": 1420,
    "Disabled": False,
    "SaveConfig": False,
    "PeerDefAllowedIPs": ["10.11.12.0/24"],
    "PeerDefEndpoint": "wg.example.com:51820",
    "PeerDefMtu": 1420,
    "PeerDefPersistentKeepalive": 25,
    "PeerDefNetwork": ["10.11.12.0/24"],
    "TotalPeers": 2,
    "EnabledPeers": 2,
    "Filename": "wg0.conf",
}

INTERFACE_PREPARED = {
    "Identifier": "wg1",
    "Mode": "server",
    "PrivateKey": "newGeneratedPrivateKey+abc/def=",
    "PublicKey": "newGeneratedPublicKey+abc/def=",
    "Addresses": ["10.11.13.1/24"],
    "ListenPort": 51821,
}

INTERFACE_LIST = [
    INTERFACE,
    {**INTERFACE, "Identifier": "wg1", "DisplayName": "Second Interface"},
]

PEER_ID = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="

PEER = {
    "Identifier": PEER_ID,
    "InterfaceIdentifier": "wg0",
    "PrivateKey": "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
    "PublicKey": "TrMvSoP4jYQlY6RIzBgbssQqY3vxI2Pi+y71lOWWXX0=",
    "DisplayName": "My Peer",
    "Mode": "client",
    "Addresses": ["10.11.12.2/24"],
    "AllowedIPs": {"Value": ["10.11.12.0/24"], "Overridable": True},
    "PresharedKey": "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
    "Dns": {"Value": ["8.8.8.8"], "Overridable": True},
    "Endpoint": {"Value": "wg.example.com:51820", "Overridable": True},
    "Mtu": {"Value": 1420, "Overridable": True},
    "PersistentKeepalive": {"Value": 25, "Overridable": True},
    "UserIdentifier": "uid-1234567",
    "Disabled": False,
    "ExpiresAt": "2027-01-01",
    "Notes": "Test peer",
    "Filename": "wg_peer_x.conf",
}

PEER_PREPARED = {
    "Identifier": "glXkHLuXRXQpK9KF0Uv/saYua+1BWvjz2Lq+jm+WfCo=",
    "InterfaceIdentifier": "wg0",
    "PrivateKey": "newPeerPrivateKey+abc/def=",
    "Addresses": ["10.11.12.3/24"],
}

PEER_LIST = [PEER, {**PEER, "Identifier": "peer2pubkey==", "DisplayName": "Second Peer"}]

PROVISIONING_REQUEST = {
    "InterfaceIdentifier": "wg0",
    "DisplayName": "API Peer xyz",
    "UserIdentifier": "uid-1234567",
}

PROVISIONING_REQUEST_MINIMAL = {"InterfaceIdentifier": "wg0"}

PROVISIONING_REQUEST_WITH_KEY = {
    "InterfaceIdentifier": "wg0",
    "PublicKey": PEER_ID,
    "PresharedKey": "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
}

WG_QUICK_CONFIG = (
    "[Interface]\n"
    "PrivateKey = yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=\n"
    "Address = 10.11.12.2/32\n\n"
    "[Peer]\n"
    "PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=\n"
    "Endpoint = wg.example.com:51820\n"
    "AllowedIPs = 10.11.12.0/24\n"
    "PersistentKeepalive = 25\n"
)

QR_PNG_BYTES = bytes([137, 80, 78, 71])

USER = {
    "Identifier": "uid-1234567",
    "Email": "test@test.com",
    "Firstname": "Max",
    "Lastname": "Muster",
    "Phone": "+1234546789",
    "Department": "Software Development",
    "Notes": "some sample notes",
    "IsAdmin": False,
    "Disabled": False,
    "DisabledReason": "",
    "Locked": False,
    "LockedReason": "",
    "ApiEnabled": False,
    "AuthSources": ["db"],
    "PeerCount": 2,
}

USER_ADMIN = {
    **USER,
    "Identifier": "uid-admin",
    "Email": "admin@wgportal.local",
    "IsAdmin": True,
    "ApiEnabled": True,
}

USER_LIST = [USER, USER_ADMIN]

USER_INFORMATION = {
    "UserIdentifier": "uid-1234567",
    "PeerCount": 2,
    "Peers": [
        {
            "Identifier": PEER_ID,
            "InterfaceIdentifier": "wg0",
            "DisplayName": "My iPhone",
            "IpAddresses": ["10.11.12.2/24"],
            "IsDisabled": False,
        },
        {
            "Identifier": "peer2pubkey==",
            "InterfaceIdentifier": "wg0",
            "DisplayName": "My Laptop",
            "IpAddresses": ["10.11.12.3/24"],
            "IsDisabled": False,
        },
    ],
}

INTERFACE_METRICS = {
    "InterfaceIdentifier": "wg0",
    "BytesReceived": 123456789,
    "BytesTransmitted": 987654321,
}

PEER_METRICS = {
    "PeerIdentifier": PEER_ID,
    "BytesReceived": 1000,
    "BytesTransmitted": 2000,
    "Endpoint": "12.34.56.78",
    "LastHandshake": "2026-06-20T14:00:00Z",
    "LastPing": "2026-06-20T14:01:00Z",
    "LastSessionStart": "2026-06-20T13:00:00Z",
    "IsPingable": True,
}

USER_METRICS = {
    "UserIdentifier": "uid-1234567",
    "BytesReceived": 11000,
    "BytesTransmitted": 22000,
    "PeerCount": 2,
    "PeerMetrics": [PEER_METRICS],
}

API_ERROR_401 = (401, "Unauthorized", "invalid credentials")
API_ERROR_403 = (403, "Forbidden", "insufficient permissions")
API_ERROR_404 = (404, "Not Found", "resource not found")
API_ERROR_409 = (409, "Conflict", "resource already exists")
API_ERROR_500 = (500, "Internal Server Error", "unexpected error occurred")
