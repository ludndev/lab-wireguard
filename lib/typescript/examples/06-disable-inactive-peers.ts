/**
 * Disable peers that haven't had a handshake in N days.
 *
 * Real case: hygiene script run on a cron — flag stale peers to reduce
 * the attack surface without permanently deleting them.
 */

import { WgPortalClient } from "../src";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
  logger: console,
});

const STALE_DAYS = 30;
const staleMs = STALE_DAYS * 24 * 60 * 60 * 1000;

async function disableInactivePeers(interfaceId: string) {
  const peers = await client.peers.getByInterface(interfaceId);
  const now = Date.now();
  let disabled = 0;

  for (const peer of peers) {
    if (peer.Disabled) continue;

    const metrics = await client.metrics.byPeer(peer.Identifier);
    const lastSeen = metrics.LastHandshake ? new Date(metrics.LastHandshake).getTime() : 0;
    const idleMs = now - lastSeen;

    if (idleMs > staleMs) {
      await client.peers.update(peer.Identifier, {
        ...peer,
        Disabled: true,
        DisabledReason: `No handshake for ${Math.floor(idleMs / 86400000)} days (auto-disabled)`,
      });
      console.log(`Disabled: ${peer.DisplayName ?? peer.Identifier} — last seen: ${lastSeen ? new Date(lastSeen).toISOString() : "never"}`);
      disabled++;
    }
  }

  console.log(`\nDone. ${disabled}/${peers.length} peer(s) disabled on ${interfaceId}.`);
}

disableInactivePeers(process.argv[2] ?? "wg0").catch(console.error);
