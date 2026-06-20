/**
 * Rotate a peer's keys by replacing it with a fresh provisioned peer.
 *
 * Real case: periodic key rotation policy, or a user suspects their
 * private key was compromised.
 */

import { WgPortalClient, WgPortalError } from "../src";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
  logger: console,
});

async function rotatePeer(oldPeerId: string) {
  // 1. Fetch current peer to copy its metadata
  const old = await client.peers.getById(oldPeerId);

  // 2. Delete the old peer
  await client.peers.delete(old.Identifier);
  console.log(`Deleted old peer ${old.Identifier}`);

  // 3. Provision a new peer on the same interface, same user
  const fresh = await client.provisioning.newPeer({
    InterfaceIdentifier: old.InterfaceIdentifier,
    UserIdentifier: old.UserIdentifier,
    DisplayName: old.DisplayName,
  });

  console.log(`New peer: ${fresh.Identifier}`);
  console.log(`Assigned IPs: ${fresh.Addresses?.join(", ")}`);

  // 4. Return the new config for distribution
  const config = await client.provisioning.getPeerConfig(fresh.Identifier);
  return { peer: fresh, config };
}

const targetPeerId = process.argv[2];
if (!targetPeerId) {
  console.error("Usage: ts-node 05-rotate-peer-key.ts <peerId>");
  process.exit(1);
}

rotatePeer(targetPeerId)
  .then(({ config }) => {
    console.log("\n--- New wg-quick config ---");
    console.log(config);
  })
  .catch((err) => {
    if (err instanceof WgPortalError) {
      console.error(`API error ${err.code}: ${err.message} — ${err.details}`);
      process.exit(1);
    }
    throw err;
  });
