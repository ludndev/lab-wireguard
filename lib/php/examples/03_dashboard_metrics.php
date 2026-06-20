#!/usr/bin/env php
<?php
/**
 * 03_dashboard_metrics — Pull live traffic metrics for every interface and peer.
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/03_dashboard_metrics.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use WgPortal\Client\WgPortalClient;

function fmtBytes(int $b): string
{
    foreach (['B', 'KB', 'MB', 'GB', 'TB'] as $unit) {
        if ($b < 1024) {
            return sprintf('%.1f %s', $b, $unit);
        }
        $b = (int) ($b / 1024);
    }
    return sprintf('%.1f PB', $b);
}

function requireEnv(string $key): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        fwrite(STDERR, "Missing required env var: {$key}\n");
        exit(1);
    }
    return $value;
}

$client = new WgPortalClient(
    requireEnv('WG_BASE_URL'),
    requireEnv('WG_ADMIN_USER'),
    requireEnv('WG_API_TOKEN')
);

$interfaces = $client->interfaces()->getAll();
foreach ($interfaces as $iface) {
    echo "\n" . str_repeat('=', 60) . "\n";
    echo "  Interface: {$iface['Identifier']}\n";

    try {
        $m = $client->metrics()->byInterface($iface['Identifier']);
        echo '  Traffic:   ↓' . fmtBytes($m['BytesReceived']) . '  ↑' . fmtBytes($m['BytesTransmitted']) . "\n";
    } catch (\Throwable $e) {
        echo "  Traffic:   (unavailable)\n";
    }

    $peers = $client->peers()->getByInterface($iface['Identifier']);
    foreach ($peers as $peer) {
        $display = $peer['DisplayName'] ?? '-';
        echo "\n  Peer: {$peer['Identifier']} ({$display})\n";

        try {
            $pm = $client->metrics()->byPeer($peer['Identifier']);
            echo '    Traffic: ↓' . fmtBytes($pm['BytesReceived']) . '  ↑' . fmtBytes($pm['BytesTransmitted']) . "\n";
            if (isset($pm['LastHandshake'])) {
                echo "    Handshake: {$pm['LastHandshake']}\n";
            }
        } catch (\Throwable $e) {
            echo "    Traffic: (unavailable)\n";
        }
    }
}
echo "\n";
