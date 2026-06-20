# wg-portal-client

Rust client library for the [WireGuard Portal v2](https://github.com/h44z/wg-portal) REST API.

## Requirements

- Rust edition 2021
- `reqwest` (blocking), `serde`, `thiserror`, `log`

## Usage

```rust
use wg_portal_client::WgPortalClient;

let client = WgPortalClient::new(
    "http://192.168.1.100:8888",
    "admin@wgportal.local",
    "your-api-token",
);

let interfaces = client.interfaces().get_all().unwrap();
for iface in interfaces {
    println!("{} — {} peers", iface.identifier, iface.enabled_peers.unwrap_or(0));
}
```

## API

The client is organized into five namespaces matching the API groups.

### `client.interfaces()`

| Method | Description |
|--------|-------------|
| `get_all()` | List all interfaces |
| `get_by_id(id)` | Get interface by identifier |
| `prepare()` | Get a pre-filled interface template |
| `create(data)` | Create a new interface |
| `update(id, data)` | Update an existing interface |
| `delete(id)` | Delete an interface |

### `client.peers()`

| Method | Description |
|--------|-------------|
| `get_by_id(id)` | Get peer by public key |
| `get_by_interface(interface_id)` | List peers for an interface |
| `get_by_user(user_id)` | List peers for a user |
| `prepare(interface_id)` | Get a pre-filled peer template |
| `create(data)` | Create a new peer |
| `update(id, data)` | Update an existing peer |
| `delete(id)` | Delete a peer |

### `client.provisioning()`

| Method | Description |
|--------|-------------|
| `new_peer(request)` | Provision a new peer |
| `get_peer_config(peer_id)` | Get `wg-quick` config as `String` |
| `get_peer_qr_code(peer_id)` | Get QR code PNG as `Vec<u8>` |
| `get_user_info(user_id, email)` | Get peer summary for a user |

### `client.users()`

| Method | Description |
|--------|-------------|
| `get_all()` | List all users |
| `get_by_id(id)` | Get user by identifier |
| `create(data)` | Create a new user |
| `update(id, data)` | Update a user |
| `delete(id)` | Delete a user |

### `client.metrics()`

| Method | Description |
|--------|-------------|
| `by_interface(id)` | Traffic metrics for an interface |
| `by_peer(id)` | Traffic metrics for a peer |
| `by_user(id)` | Traffic metrics for a user |

## Error handling

All methods return `Result<T, WgPortalError>`:

```rust
use wg_portal_client::{WgPortalClient, WgPortalError};

match client.interfaces().get_by_id("wg0") {
    Ok(iface) => println!("{}", iface.display_name.unwrap_or_default()),
    Err(WgPortalError { code, message, details }) => {
        eprintln!("API error {code}: {message} ({details})")
    }
}
```

## Auth

Authentication uses **HTTP Basic Auth** where:
- username = admin email
- password = API token

The API is only enabled when `admin_api_token` is set in wg-portal's config.

## Author

**Judicaël AHYI** (ludndev) — ludndev@gmail.com
