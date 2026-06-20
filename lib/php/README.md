# wg-portal-client

PHP client library for the [WireGuard Portal v2](https://github.com/h44z/wg-portal) REST API.

## Requirements

- PHP ^7.4 || ^8.0
- [Composer](https://getcomposer.org/)
- ext-json

## Installation

```bash
composer install
```

## Usage

```php
use WgPortal\Client\WgPortalClient;

$client = new WgPortalClient(
    'http://192.168.1.100:8888',
    'admin@wgportal.local',
    'your-api-token'
);

$interfaces = $client->interfaces()->getAll();
foreach ($interfaces as $iface) {
    echo $iface['Identifier'] . ' — ' . ($iface['EnabledPeers'] ?? 0) . " peers\n";
}
```

## API

The client is organized into five namespaces matching the API groups.

### `$client->interfaces()`

| Method | Description |
|--------|-------------|
| `getAll()` | List all interfaces |
| `getById($id)` | Get interface by identifier |
| `prepare()` | Get a pre-filled interface template |
| `create($data)` | Create a new interface |
| `update($id, $data)` | Update an existing interface |
| `delete($id)` | Delete an interface |

### `$client->peers()`

| Method | Description |
|--------|-------------|
| `getById($id)` | Get peer by public key |
| `getByInterface($interfaceId)` | List peers for an interface |
| `getByUser($userId)` | List peers for a user |
| `prepare($interfaceId)` | Get a pre-filled peer template |
| `create($data)` | Create a new peer |
| `update($id, $data)` | Update an existing peer |
| `delete($id)` | Delete a peer |

### `$client->provisioning()`

| Method | Description |
|--------|-------------|
| `newPeer($request)` | Provision a new peer |
| `getPeerConfig($peerId)` | Get `wg-quick` config as string |
| `getPeerQrCode($peerId)` | Get QR code PNG as raw bytes |
| `getUserInfo($userId?, $email?)` | Get peer summary for a user |

### `$client->users()`

| Method | Description |
|--------|-------------|
| `getAll()` | List all users |
| `getById($id)` | Get user by identifier |
| `create($data)` | Create a new user |
| `update($id, $data)` | Update a user |
| `delete($id)` | Delete a user |

### `$client->metrics()`

| Method | Description |
|--------|-------------|
| `byInterface($id)` | Traffic metrics for an interface |
| `byPeer($id)` | Traffic metrics for a peer |
| `byUser($id)` | Traffic metrics for a user |

All methods that return data return PHP associative arrays with the API's PascalCase keys (e.g. `$result['Identifier']`, `$result['EnabledPeers']`).

## Error handling

All methods throw `WgPortalException` on non-2xx responses:

```php
use WgPortal\Client\{WgPortalClient, WgPortalException};

try {
    $client->interfaces()->getById('wg0');
} catch (WgPortalException $e) {
    echo $e->getHttpCode() . ': ' . $e->getMessage();
    if ($e->getDetails()) {
        echo ' — ' . $e->getDetails();
    }
}
```

`WgPortalException` extends `\RuntimeException` and provides:
- `getHttpCode(): int` — HTTP status code
- `getMessage(): string` — error message (inherited)
- `getDetails(): string` — API error details

## Auth

Authentication uses **HTTP Basic Auth** where:
- username = admin email
- password = API token

Pass them to the `WgPortalClient` constructor. The API is only enabled when `admin_api_token` is set in wg-portal's config.

## Testing

```bash
composer test
```

## Author

**Judicaël AHYI** (ludndev) — ludndev@gmail.com
