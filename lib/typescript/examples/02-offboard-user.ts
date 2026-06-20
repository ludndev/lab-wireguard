/**
 * Offboard a user: delete all their peers then delete the user account.
 *
 * Real case: employee leaves, HR triggers deprovisioning. All their
 * WireGuard access is revoked atomically.
 */

import { WgPortalClient, WgPortalError } from "../src";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
  logger: console,
});

async function offboardUser(userId: string) {
  // 1. Fetch all peers belonging to the user
  const peers = await client.peers.getByUser(userId);
  console.log(`Found ${peers.length} peer(s) for user ${userId}`);

  // 2. Delete each peer
  for (const peer of peers) {
    await client.peers.delete(peer.Identifier);
    console.log(`Deleted peer ${peer.Identifier} (${peer.DisplayName ?? "unnamed"})`);
  }

  // 3. Delete the user account
  await client.users.delete(userId);
  console.log(`User ${userId} deleted`);
}

offboardUser(process.argv[2] ?? "uid-1234567").catch((err) => {
  if (err instanceof WgPortalError) {
    console.error(`API error ${err.code}: ${err.message} — ${err.details}`);
    process.exit(1);
  }
  throw err;
});
