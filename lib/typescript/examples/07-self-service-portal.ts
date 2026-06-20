/**
 * Self-service portal backend: user fetches their own peer list and config.
 *
 * Real case: an Express/Fastify route that lets an authenticated user
 * download their own wg-quick config or QR code without admin involvement.
 * Uses provisioning endpoints which scope to the calling user's identity.
 */

import { WgPortalClient, WgPortalError } from "../src";

// In a real app these would come from the session / JWT
const LOGGED_IN_USER_EMAIL = "alice@corp.com";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
});

async function getSelfServiceInfo(email: string) {
  // Get the user's peer summary (works without knowing their userId)
  const info = await client.provisioning.getUserInfo({ email });

  console.log(`User: ${info.UserIdentifier}`);
  console.log(`Total peers: ${info.PeerCount}`);

  for (const peer of info.Peers) {
    console.log(`\n  Peer: ${peer.DisplayName ?? peer.Identifier}`);
    console.log(`  Interface: ${peer.InterfaceIdentifier}`);
    console.log(`  IPs: ${peer.IpAddresses?.join(", ")}`);
    console.log(`  Disabled: ${peer.IsDisabled ?? false}`);

    if (!peer.IsDisabled) {
      // Download config on demand
      const config = await client.provisioning.getPeerConfig(peer.Identifier);
      console.log(`\n  wg-quick config:\n${config}`);
    }
  }
}

getSelfServiceInfo(LOGGED_IN_USER_EMAIL).catch((err) => {
  if (err instanceof WgPortalError) {
    console.error(`${err.code}: ${err.message}`);
  } else {
    throw err;
  }
});
