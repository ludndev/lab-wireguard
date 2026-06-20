#!/usr/bin/env php
<?php
/**
 * 06_disable_inactive_peers — Disable peers with no handshake in the last N days (hygiene cron).
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/06_disable_inactive_peers.php [days]
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use WgPortal\Client\WgPortalClient;

function requireEnv(string $key): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        fwrite(STDERR, "Missing required env var: {$key}\n");
        exit(1);
    }
    return $value;
}

$inactiveDays = isset($argv[1]) ? (int) $argv[1] : 30;
$cutoff = (new DateTimeImmutable())->sub(new DateInterval("P{$inactiveDays}D"));
echo "Checking peers inactive since {$cutoff->format('Y-m-d')} ...\n\n";

$client = new WgPortalClient(
    requireEnv('WG_BASE_URL'),
    requireEnv('WG_ADMIN_USER'),
    requireEnv('WG_API_TOKEN')
);

$interfaces = $client->interfaces()->getAll();
$disabledCount = 0;

foreach ($interfaces as $iface) {
    $peers = $client->peers()->getByInterface($iface['Identifier']);
    foreach ($peers as $peer) {
        if ($peer['Disabled'] ?? false) {
            continue;
        }

        try {
            $metrics = $client->metrics()->byPeer($peer['Identifier']);
        } catch (\Throwable $e) {
            continue;
        }

        $shouldDisable = false;
        $reason = '';

        if (empty($metrics['LastHandshake'])) {
            echo "  Disabling {$peer['Identifier']} (never connected)\n";
            $shouldDisable = true;
            $reason = "No handshake (never connected, check > {$inactiveDays} days)";
        } else {
            try {
                $hs = new DateTimeImmutable($metrics['LastHandshake']);
                if ($hs < $cutoff) {
                    $last = $metrics['LastHandshake'];
                    echo "  Disabling {$peer['Identifier']} (last handshake: {$last})\n";
                    $shouldDisable = true;
                    $reason = "No handshake since {$last} (check > {$inactiveDays} days)";
                }
            } catch (\Throwable $e) {
                // can't parse date, skip
            }
        }

        if ($shouldDisable) {
            $client->peers()->update($peer['Identifier'], array_merge($peer, [
                'Disabled' => true,
                'DisabledReason' => $reason,
            ]));
            $disabledCount++;
        }
    }
}

echo "\nDisabled {$disabledCount} peer(s)\n";
