# wg-portal-client

Python client library for the [WireGuard Portal v2](https://github.com/h44z/wg-portal) REST API.

## Requirements

- Python >= 3.9
- [httpx](https://www.python-httpx.org/) >= 0.27

## Installation

```bash
pip install -e .
```

## Usage

```python
from wg_portal_client import WgPortalClient

client = WgPortalClient(
    base_url="http://192.168.1.100:8888",
    username="admin@wgportal.local",
    api_token="your-api-token",
)
```

## API

The client is organized into five namespaces matching the API groups.

### `client.interfaces`

| Method | Description |
|--------|-------------|
| `get_all()` | List all interfaces |
| `get_by_id(id)` | Get interface by identifier |
| `prepare()` | Get a pre-filled interface template (fresh keys, IP pool) |
| `create(data)` | Create a new interface |
| `update(id, data)` | Update an existing interface |
| `delete(id)` | Delete an interface |

### `client.peers`

| Method | Description |
|--------|-------------|
| `get_by_id(id)` | Get peer by identifier (public key) |
| `get_by_interface(interface_id)` | List all peers for an interface |
| `get_by_user(user_id)` | List all peers for a user |
| `prepare(interface_id)` | Get a pre-filled peer template for an interface |
| `create(data)` | Create a new peer (admin only) |
| `update(id, data)` | Update an existing peer (admin only) |
| `delete(id)` | Delete a peer |

### `client.provisioning`

| Method | Description |
|--------|-------------|
| `new_peer(request)` | Provision a new peer for an interface and user |
| `get_peer_config(peer_id)` | Get the peer `wg-quick` config as a `str` |
| `get_peer_qr_code(peer_id)` | Get the peer config as a QR code PNG (`bytes`) |
| `get_user_info(user_id=None, email=None)` | Get peer summary for a user |

### `client.users`

| Method | Description |
|--------|-------------|
| `get_all()` | List all users |
| `get_by_id(id)` | Get user by identifier |
| `create(data)` | Create a new user (admin only) |
| `update(id, data)` | Update a user (admin only) |
| `delete(id)` | Delete a user |

### `client.metrics`

| Method | Description |
|--------|-------------|
| `by_interface(interface_id)` | Get traffic metrics for an interface |
| `by_peer(peer_id)` | Get traffic metrics for a peer |
| `by_user(user_id)` | Get traffic metrics for a user |

## Examples

Runnable examples are in [`examples/`](./examples/). Each file is self-contained and documents its use case at the top.

| File | Use case |
|------|----------|
| [`01_provision_peer.py`](./examples/01_provision_peer.py) | Create a peer for a user, write the `.conf` file and QR code to disk |
| [`02_offboard_user.py`](./examples/02_offboard_user.py) | Delete all peers for a user, then delete the user account |
| [`03_dashboard_metrics.py`](./examples/03_dashboard_metrics.py) | Pull live traffic metrics for every interface and peer |
| [`04_bulk_create_users.py`](./examples/04_bulk_create_users.py) | Import a list of users, create accounts, and provision one peer each |
| [`05_rotate_peer_key.py`](./examples/05_rotate_peer_key.py) | Replace a peer with a fresh one (key rotation or compromise response) |
| [`06_disable_inactive_peers.py`](./examples/06_disable_inactive_peers.py) | Disable peers with no handshake in the last N days (hygiene cron) |
| [`07_self_service_portal.py`](./examples/07_self_service_portal.py) | Backend route: user fetches their own peer list and config by email |

## Error handling

All methods throw `WgPortalError` on non-2xx responses:

```python
from wg_portal_client import WgPortalClient, WgPortalError

try:
    client.interfaces.get_by_id("wg0")
except WgPortalError as err:
    print(err.code, err.message, err.details)
```

## Auth

Authentication uses **HTTP Basic Auth** where:
- username = admin email (`WG_ADMIN_USER`)
- password = API token (`WG_API_TOKEN`)

The API is only enabled when `admin_api_token` is set in wg-portal's config.

## API spec

The OpenAPI spec is available at [`../v1_swagger.yaml`](../v1_swagger.yaml), or live at `http://<host>:<port>/doc/v1_swagger.yaml`.

## Author

**Judicaël AHYI** (ludndev) — ludndev@gmail.com
