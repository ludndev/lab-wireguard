/**
 * Bulk-create users from a list and provision one peer each.
 *
 * Real case: onboarding a new team — import from CSV, create accounts,
 * assign a peer on the default interface, hand out configs.
 */

import { writeFileSync } from "fs";
import { WgPortalClient, WgPortalError, WgUser } from "../src";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
  logger: console,
});

const INTERFACE_ID = "wg0";

const newUsers: WgUser[] = [
  { Identifier: "alice", Email: "alice@corp.com", Firstname: "Alice", Lastname: "Smith", Password: "ChangeMe123!456" },
  { Identifier: "bob",   Email: "bob@corp.com",   Firstname: "Bob",   Lastname: "Jones", Password: "ChangeMe123!456" },
];

async function onboard(user: WgUser) {
  // Create user account
  let created;
  try {
    created = await client.users.create(user);
  } catch (err) {
    if (err instanceof WgPortalError && err.code === 409) {
      console.warn(`User ${user.Identifier} already exists, skipping creation`);
      created = user;
    } else {
      throw err;
    }
  }

  // Provision a peer
  const peer = await client.provisioning.newPeer({
    InterfaceIdentifier: INTERFACE_ID,
    UserIdentifier: created.Identifier,
    DisplayName: `${created.Firstname} ${created.Lastname} - default`,
  });

  // Save config
  const config = await client.provisioning.getPeerConfig(peer.Identifier);
  writeFileSync(`${created.Identifier}.conf`, config, "utf-8");
  console.log(`✓ ${created.Email}  peer: ${peer.Identifier}  config: ${created.Identifier}.conf`);
}

async function run() {
  for (const user of newUsers) {
    await onboard(user);
  }
}

run().catch(console.error);
