/**
 * Provision a new peer for a user and hand them their config.
 *
 * Real case: a user signs up, you create their WireGuard peer and
 * email them the wg-quick config file and a QR code to scan on mobile.
 */

import { writeFileSync } from "fs";
import { WgPortalClient, WgPortalError } from "../src";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
  logger: console,
});

async function provisionPeer(userId: string, interfaceId: string) {
  // 1. Create the peer
  const peer = await client.provisioning.newPeer({
    InterfaceIdentifier: interfaceId,
    UserIdentifier: userId,
    DisplayName: `${userId} - laptop`,
  });

  console.log(`Peer created: ${peer.Identifier}`);
  console.log(`Assigned IPs: ${peer.Addresses?.join(", ")}`);

  // 2. Download wg-quick config (save to file or email as attachment)
  const config = await client.provisioning.getPeerConfig(peer.Identifier);
  writeFileSync(`${userId}.conf`, config, "utf-8");
  console.log(`Config written to ${userId}.conf`);

  // 3. Download QR code (for mobile — display in UI or attach to email)
  const qr = await client.provisioning.getPeerQrCode(peer.Identifier);
  writeFileSync(`${userId}-qr.png`, qr);
  console.log(`QR code written to ${userId}-qr.png`);

  return peer;
}

provisionPeer("uid-1234567", "wg0").catch((err) => {
  if (err instanceof WgPortalError) {
    console.error(`API error ${err.code}: ${err.message} — ${err.details}`);
  } else {
    throw err;
  }
});
