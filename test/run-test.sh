#!/bin/sh
# Automated end-to-end test for the wg-portal stack.
#
#  1. waits for the wg-portal REST API
#  2. creates a server WireGuard interface  (POST /interface/new)
#  3. provisions a peer on it               (POST /provisioning/new-peer)
#  4. downloads the wg-quick client config  (GET  /provisioning/data/peer-config)
#  5. brings the tunnel up and pings the server's tunnel IP
#  6. confirms a WireGuard handshake happened, then cleans up
#
# Exit code 0 = tunnel works, non-zero = failure (so CI / --exit-code-from can gate on it).
set -eu

API="${WG_PORTAL_URL:-http://wg-portal:8888}/api/v1"
USER="${WG_ADMIN_USER:?WG_ADMIN_USER not set}"
TOKEN="${WG_API_TOKEN:?WG_API_TOKEN not set}"
ENDPOINT_HOST="${WG_ENDPOINT:-wg-portal:51820}"
CLIENT_IF="wgtest0"   # name of the interface created inside THIS container

IFACE_ID=""           # server interface id, filled in later (used by cleanup)

log()  { printf '\n\033[1;34m[test]\033[0m %s\n' "$*"; }
pass() { printf '\n\033[1;32m[PASS]\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m[FAIL]\033[0m %s\n' "$*" >&2; exit 1; }

cleanup() {
  wg-quick down "$CLIENT_IF" >/dev/null 2>&1 || true
  if [ -n "$IFACE_ID" ]; then
    curl -fsS -u "${USER}:${TOKEN}" -X DELETE \
      "${API}/interface/by-id/${IFACE_ID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

api() { curl -fsS -u "${USER}:${TOKEN}" "$@"; }

# ---------------------------------------------------------------------------
# 1. Wait for the API to be reachable and authenticating
# ---------------------------------------------------------------------------
log "Waiting for wg-portal API at ${API} ..."
i=0
until api "${API}/interface/all" >/dev/null 2>&1; do
  i=$((i + 1))
  [ "$i" -gt 60 ] && fail "wg-portal API not reachable / not authenticating after 120s"
  sleep 2
done
log "API is up and the token authenticates."

# ---------------------------------------------------------------------------
# 2. Create a fresh server interface
# ---------------------------------------------------------------------------
log "Preparing and creating a server interface ..."
prepared="$(api "${API}/interface/prepare")"

# Force server mode + a known listen port + an endpoint so the generated
# client config knows how to reach this server on the docker network.
body="$(printf '%s' "$prepared" | jq \
  --arg ep "$ENDPOINT_HOST" \
  '.Mode = "server" | .ListenPort = 51820 | .PeerDefEndpoint = $ep')"

IFACE_ID="$(printf '%s' "$body" | jq -r '.Identifier')"
SERVER_TUNNEL_IP="$(printf '%s' "$body" | jq -r '.Addresses[0]' | cut -d/ -f1)"
log "Interface = ${IFACE_ID}   server tunnel IP = ${SERVER_TUNNEL_IP}"

code="$(curl -sS -o /tmp/iface.json -w '%{http_code}' \
  -u "${USER}:${TOKEN}" -H 'Content-Type: application/json' \
  -X POST --data "$body" "${API}/interface/new")"
case "$code" in
  200 | 201) log "Interface created." ;;
  409)       log "Interface already exists, reusing it." ;;
  *)         cat /tmp/iface.json 2>/dev/null; fail "interface creation failed (HTTP $code)" ;;
esac

# ---------------------------------------------------------------------------
# 3. Provision a peer on the interface
# ---------------------------------------------------------------------------
log "Provisioning a test peer ..."
req="$(jq -n --arg i "$IFACE_ID" --arg u "$USER" \
  '{InterfaceIdentifier: $i, UserIdentifier: $u, DisplayName: "automated-test-peer"}')"
peer="$(api -H 'Content-Type: application/json' -X POST \
  --data "$req" "${API}/provisioning/new-peer")"

PEER_ID="$(printf '%s' "$peer" | jq -r '.Identifier')"
if [ -z "$PEER_ID" ] || [ "$PEER_ID" = "null" ]; then
  printf '%s\n' "$peer"
  fail "peer creation failed"
fi
log "Peer created: ${PEER_ID}"

# ---------------------------------------------------------------------------
# 4. Download the wg-quick client configuration
# ---------------------------------------------------------------------------
log "Downloading client configuration ..."
PEER_ID_ENC="$(printf '%s' "$PEER_ID" | jq -sRr @uri)"   # public key contains +,/,= -> url-encode
mkdir -p /etc/wireguard
api "${API}/provisioning/data/peer-config?PeerId=${PEER_ID_ENC}" -o "/etc/wireguard/${CLIENT_IF}.conf"

# Be defensive: drop any DNS line (avoids needing resolvconf inside the container)
# and make sure the Endpoint points at the server on the docker network.
sed -i '/^[[:space:]]*DNS[[:space:]]*=/d' "/etc/wireguard/${CLIENT_IF}.conf"
if grep -qi '^[[:space:]]*Endpoint' "/etc/wireguard/${CLIENT_IF}.conf"; then
  sed -i "s|^[[:space:]]*Endpoint.*|Endpoint = ${ENDPOINT_HOST}|I" "/etc/wireguard/${CLIENT_IF}.conf"
else
  sed -i "/^\[Peer\]/a Endpoint = ${ENDPOINT_HOST}" "/etc/wireguard/${CLIENT_IF}.conf"
fi

log "Generated client config (private key hidden):"
sed 's/PrivateKey *=.*/PrivateKey = (hidden)/' "/etc/wireguard/${CLIENT_IF}.conf"

# ---------------------------------------------------------------------------
# 5. Bring the tunnel up and test connectivity
# ---------------------------------------------------------------------------
log "Bringing up WireGuard tunnel '${CLIENT_IF}' ..."
wg-quick up "$CLIENT_IF" \
  || fail "wg-quick up failed (is the 'wireguard' kernel module available on the Docker host?)"

log "Interface state:"
wg show "$CLIENT_IF" || true

log "Pinging server tunnel IP ${SERVER_TUNNEL_IP} over the VPN ..."
ping_ok=0
for _ in 1 2 3 4 5 6; do
  if ping -c 1 -W 2 "$SERVER_TUNNEL_IP" >/dev/null 2>&1; then ping_ok=1; break; fi
  sleep 1
done

# A successful handshake is the definitive proof the tunnel negotiated.
handshake="$(wg show "$CLIENT_IF" latest-handshakes 2>/dev/null | awk 'NR==1{print $2}')"
handshake="${handshake:-0}"

# ---------------------------------------------------------------------------
# 6. Verdict
# ---------------------------------------------------------------------------
if [ "$ping_ok" -eq 1 ] && [ "$handshake" -gt 0 ]; then
  pass "WireGuard tunnel established, handshake completed and ping to ${SERVER_TUNNEL_IP} succeeded."
  exit 0
fi
fail "no VPN connectivity (ping_ok=${ping_ok}, last_handshake=${handshake})"
