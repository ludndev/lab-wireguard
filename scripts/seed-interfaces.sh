#!/bin/sh
# Seed wg0 (system) and wg1 (backoffice) WireGuard interfaces via the wg-portal REST API.
#
# Usage:
#   WG_PORTAL_URL=http://localhost:8888 \
#   WG_ADMIN_USER=admin@wgportal.local  \
#   WG_API_TOKEN=<token>                \
#   WG_EXTERNAL_HOST=<host-or-ip>       \
#   ./scripts/seed-interfaces.sh
#
# The script is idempotent: it skips creation when an interface already exists (HTTP 409).
set -eu

API="${WG_PORTAL_URL:-http://localhost:8888}/api/v1"
USER="${WG_ADMIN_USER:?WG_ADMIN_USER not set}"
TOKEN="${WG_API_TOKEN:?WG_API_TOKEN not set}"
EXT_HOST="${WG_EXTERNAL_HOST:-localhost}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
IFACE_DIR="${SCRIPT_DIR}/../config/interfaces"

log()  { printf '\n\033[1;34m[seed]\033[0m %s\n' "$*"; }
ok()   { printf '\033[1;32m[ok]\033[0m   %s\n'   "$*"; }
skip() { printf '\033[1;33m[skip]\033[0m %s\n'   "$*"; }
fail() { printf '\033[1;31m[fail]\033[0m %s\n' "$*" >&2; exit 1; }

api() { curl -fsS -u "${USER}:${TOKEN}" "$@"; }

# ---------------------------------------------------------------------------
# Wait for the API to be ready
# ---------------------------------------------------------------------------
log "Waiting for wg-portal API at ${API} ..."
i=0
until api "${API}/interface/all" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && fail "wg-portal API not reachable after 120 s"
  sleep 2
done
log "API is up."

# ---------------------------------------------------------------------------
# Seed one interface from a JSON template file.
# $1 = template file path (e.g. config/interfaces/wg0.json)
# ---------------------------------------------------------------------------
seed_interface() {
  tmpl="$1"
  iface_id="$(grep -o '"Identifier"[[:space:]]*:[[:space:]]*"[^"]*"' "$tmpl" | grep -o '"[^"]*"$' | tr -d '"')"
  display="$(grep -o '"DisplayName"[[:space:]]*:[[:space:]]*"[^"]*"' "$tmpl" | grep -o '"[^"]*"$' | tr -d '"')"

  log "Seeding interface '${iface_id}' (${display}) ..."

  # Fetch a fresh prepared object to get a generated key pair, then merge our template on top.
  prepared="$(api "${API}/interface/prepare")"

  # Build the final body: start from the prepared skeleton, override with our
  # template values and substitute EXTERNAL_HOST at runtime.
  body="$(printf '%s' "$prepared" | jq \
    --argjson tpl "$(sed "s/EXTERNAL_HOST/${EXT_HOST}/g" "$tmpl")" \
    '. * $tpl')"

  code="$(curl -sS -o /tmp/seed_iface.json -w '%{http_code}' \
    -u "${USER}:${TOKEN}" \
    -H 'Content-Type: application/json' \
    -X POST --data "$body" \
    "${API}/interface/new")"

  case "$code" in
    200|201) ok  "Interface '${iface_id}' created." ;;
    409)     skip "Interface '${iface_id}' already exists, skipping." ;;
    *)       cat /tmp/seed_iface.json 2>/dev/null; fail "Failed to create '${iface_id}' (HTTP ${code})" ;;
  esac
}

# ---------------------------------------------------------------------------
# Seed wg0 (system) then wg1 (backoffice)
# ---------------------------------------------------------------------------
seed_interface "${IFACE_DIR}/wg0.json"
seed_interface "${IFACE_DIR}/wg1.json"

log "Done. Both interfaces are seeded."
