# WireGuard + wg-portal stack (with an automated VPN test)

Self-contained [`h44z/wg-portal`](https://github.com/h44z/wg-portal) **v2** deployment.
wg-portal runs the WireGuard interface **inside its own container** (no separate
`linuxserver/wireguard` needed), and a profiled `wg-test` container proves the VPN
actually works end-to-end.

```
wg-portal-stack/
├── Makefile                # convenient commands (make help)
├── .gitignore              # ignore .env, data/, and other sensitive files
├── .env.example            # configuration template (committed to git)
├── docker-compose.yml      # wg-portal + (profiled) wg-test
├── config/
│   └── config.yaml         # wg-portal configuration
└── test/
    └── run-test.sh         # automated end-to-end VPN test
```

## Configuration

The `.env` file is created automatically from `.env.example` on first run. To set it up manually:

```bash
make env
# Edit .env to change credentials and ports
```

Or manually:

```bash
cp .env.example .env
```

⚠️ **Default credentials** are provided for dev/test use only — change
`WG_ADMIN_PASSWORD` and `WG_API_TOKEN` before any real deployment.

**`.env` is in `.gitignore`** — only `.env.example` is committed to version control.

## Run the portal

Using make (recommended):

```bash
make up
```

Or directly with docker compose:

```bash
docker compose up -d
```

* Web UI: http://127.0.0.1:8888 — login `admin@wgportal.local` / `Sup3rSecret-Admin-Pw!`
* WireGuard listens on `udp/51820`.

For all available commands, run:

```bash
make help
```

## Run the automated test

Using make:

```bash
make up-test
```

Or directly:

```bash
docker compose --profile test up --abort-on-container-exit --exit-code-from wg-test
```

The `wg-test` container will:

1. wait for the wg-portal REST API to come up and authenticate (Basic auth = admin
   email + API token);
2. create a server interface via `POST /interface/new`;
3. provision a peer via `POST /provisioning/new-peer`;
4. download the `wg-quick` client config via `GET /provisioning/data/peer-config`;
5. `wg-quick up` the tunnel and ping the server's tunnel IP;
6. confirm a WireGuard handshake occurred, clean up, and exit `0` (pass) / non-zero (fail).

Because of `--exit-code-from wg-test`, the whole `docker compose` command inherits
that exit code, so it drops straight into CI.

Expected tail on success:

```
[PASS] WireGuard tunnel established, handshake completed and ping to 10.11.12.1 succeeded.
```

## Makefile commands

All commands load configuration from `.env` automatically:

| Command | Purpose |
|---------|---------|
| `make help` | Show all available commands |
| `make env-create` | Create `.env` from `.env.example` (skips if exists) |
| `make up` | Start wg-portal (portal only) |
| `make up-test` | Start wg-portal with automated test |
| `make down` | Stop all containers |
| `make down-clean` | Stop containers and remove volumes |
| `make logs` | Show logs from all containers |
| `make logs-portal` | Show wg-portal logs only |
| `make status` | Show configuration and container status |
| `make health` | Check container health |
| `make ps` | List running containers |
| `make shell-portal` | Open shell in wg-portal container |
| `make ui` | Open web UI in browser |
| `make restart` | Restart the stack |
| `make clean` | Full cleanup (containers + volumes) |

## .gitignore

The following files and directories are ignored (not committed to git):

* `.env` — local configuration with credentials (use `.env.example` as template)
* `.env.local` — local overrides
* `/data/` — persistent SQLite database and wg-portal state
* `/wg-configs/` — exported wg-quick configurations
* `/docker-compose.log` — compose logs
* OS and editor files (`.DS_Store`, `.vscode/`, `.idea/`, etc.)

**Only commit `.env.example`** to version control — it serves as the template for new deployments.

## Environment variables (.env)

Key configuration variables:

* `WG_ADMIN_USER` / `WG_ADMIN_PASSWORD` — web UI and REST API credentials
* `WG_API_TOKEN` — enables the REST API (`/api/v1/*` endpoints)
* `WG_WEB_HOST` — socket bind address (`0.0.0.0` = all interfaces, `127.0.0.1` = localhost only)
* `WG_EXTERNAL_HOST` — public hostname or IP used in the web UI URL and WebAuthn RPID
* `WG_WEB_PORT` / `WG_VPN_PORT` — port mappings
* `WG_TEST_ENDPOINT` — how the test peer reaches the server

> `WG_WEB_HOST` and `WG_EXTERNAL_HOST` are intentionally separate: `WG_WEB_HOST` controls what address
> the container binds to, while `WG_EXTERNAL_HOST` is what users put in their browser.
> For LAN access set `WG_WEB_HOST=0.0.0.0` and `WG_EXTERNAL_HOST=<your server IP or hostname>`.

All variables are required and must be set in `.env` before running.

## Requirements / notes

* **Linux Docker host with the `wireguard` kernel module** (`sudo modprobe wireguard`).
  wg-portal's image bundles a userspace fallback, but the test client uses the
  kernel module via `wg-quick`. Kernel ≥ 5.6 ships it built-in.
* `NET_ADMIN`, `/dev/net/tun` and `net.ipv4.conf.all.src_valid_mark=1` are granted to
  both containers — that's the minimum WireGuard needs in a container.
* State persists in `./data` (SQLite) and `./wg-configs`. The test deletes the
  interface it creates, so reruns stay clean. For a full reset: `make clean`
  or `docker compose down -v && rm -rf ./data`.
* The test reaches the server at the hostname specified in `WG_TEST_ENDPOINT` over the
  compose bridge network, which is why the script forces `PeerDefEndpoint` / the config's
  `Endpoint` to that value.
  