/**
 * Pull traffic metrics for all interfaces and their peers.
 *
 * Real case: a monitoring dashboard that polls every 30 s and feeds
 * data into Prometheus, InfluxDB, or a custom UI.
 */

import { WgPortalClient } from "../src";

const client = new WgPortalClient({
  baseUrl: "http://192.168.1.100:8888",
  username: "admin@wgportal.local",
  apiToken: process.env.WG_API_TOKEN!,
});

function formatBytes(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)} MB`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(2)} KB`;
  return `${n} B`;
}

async function printDashboard() {
  const interfaces = await client.interfaces.getAll();

  for (const iface of interfaces) {
    const ifaceMetrics = await client.metrics.byInterface(iface.Identifier);
    console.log(`\n[${iface.Identifier}]  ↓ ${formatBytes(ifaceMetrics.BytesReceived)}  ↑ ${formatBytes(ifaceMetrics.BytesTransmitted)}`);

    const peers = await client.peers.getByInterface(iface.Identifier);
    for (const peer of peers) {
      const m = await client.metrics.byPeer(peer.Identifier);
      const handshake = m.LastHandshake ? new Date(m.LastHandshake).toLocaleString() : "never";
      const online = m.IsPingable ? "● online" : "○ offline";
      console.log(
        `  ${online}  ${peer.DisplayName ?? peer.Identifier.slice(0, 12)}…` +
        `  ↓ ${formatBytes(m.BytesReceived)}  ↑ ${formatBytes(m.BytesTransmitted)}` +
        `  last handshake: ${handshake}`
      );
    }
  }
}

printDashboard();
