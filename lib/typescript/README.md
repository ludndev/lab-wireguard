# wg-portal-client

TypeScript client library for the [WireGuard Portal v2](https://github.com/h44z/wg-portal) REST API.

## Requirements

- Node.js >= 18 (uses native `fetch`)
- TypeScript >= 5

## Installation

```bash
npm install
npm run build
```

## Usage

```typescript
import { WgPortalClient } from './dist';

const client = new WgPortalClient({
  baseUrl: 'http://192.168.1.100:8888',
  username: 'admin@wgportal.local',
  apiToken: 'your-api-token',
});
```

## API

The client is organized into five namespaces matching the API groups.

### `client.interfaces`

| Method | Description |
|--------|-------------|
| `getAll()` | List all interfaces |
| `getById(id)` | Get interface by identifier |
| `prepare()` | Get a pre-filled interface template (fresh keys, IP pool) |
| `create(data)` | Create a new interface |
| `update(id, data)` | Update an existing interface |
| `delete(id)` | Delete an interface |

### `client.peers`

| Method | Description |
|--------|-------------|
| `getById(id)` | Get peer by identifier (public key) |
| `getByInterface(interfaceId)` | List all peers for an interface |
| `getByUser(userId)` | List all peers for a user |
| `prepare(interfaceId)` | Get a pre-filled peer template for an interface |
| `create(data)` | Create a new peer (admin only) |
| `update(id, data)` | Update an existing peer (admin only) |
| `delete(id)` | Delete a peer |

### `client.provisioning`

| Method | Description |
|--------|-------------|
| `newPeer(request)` | Provision a new peer for an interface and user |
| `getPeerConfig(peerId)` | Get the peer `wg-quick` config as a string |
| `getPeerQrCode(peerId)` | Get the peer config as a QR code PNG (`Buffer`) |
| `getUserInfo(options?)` | Get peer summary for a user (by `userId` or `email`) |

### `client.users`

| Method | Description |
|--------|-------------|
| `getAll()` | List all users |
| `getById(id)` | Get user by identifier |
| `create(data)` | Create a new user (admin only) |
| `update(id, data)` | Update a user (admin only) |
| `delete(id)` | Delete a user |

### `client.metrics`

| Method | Description |
|--------|-------------|
| `byInterface(interfaceId)` | Get traffic metrics for an interface |
| `byPeer(peerId)` | Get traffic metrics for a peer |
| `byUser(userId)` | Get traffic metrics for a user |

## Error handling

All methods throw `WgPortalError` on non-2xx responses:

```typescript
import { WgPortalClient, WgPortalError } from './dist';

try {
  await client.interfaces.getById('wg0');
} catch (err) {
  if (err instanceof WgPortalError) {
    console.error(err.code, err.message, err.details);
  }
}
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
