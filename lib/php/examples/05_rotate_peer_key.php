#!/usr/bin/env php
<?php
/**
 * 05_rotate_peer_key — Replace a peer with a fresh one (key rotation or compromise response).
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/05_rotate_peer_key.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use WgPortal\Client\{WgPortalClient, WgPortalException};

function requireEnv(string $key): string
{
    $value = getenv($key);
    if ($value === false || $value === '') {
        fwrite(STDERR, "Missing required env var: {$key}\n");
        exit(1);
    }
    return $value;
}

function rotatePeer(WgPortalClient $client, string $oldPeerId): void
{
    try {
        $oldPeer = $client->peers()->getById($oldPeerId);
    } catch (WgPortalException $e) {
        if ($e->getHttpCode() === 404) {
            echo "Peer not found: {$oldPeerId}\n";
            return;
        }
        throw $e;
    }

    echo "Rotating key for peer: {$oldPeer['Identifier']}\n";
    echo "  Interface:  {$oldPeer['InterfaceIdentifier']}\n";
    echo '  Display:    ' . ($oldPeer['DisplayName'] ?? '-') . "\n";
    echo '  User:       ' . ($oldPeer['UserIdentifier'] ?? '-') . "\n";

    // Prepare fresh peer with new keys
    $prepared = $client->peers()->prepare($oldPeer['InterfaceIdentifier']);
    echo "  New keys generated: {$prepared['Identifier']}\n";

    // Create replacement peer
    $newPeer = $client->provisioning()->newPeer([
        'InterfaceIdentifier' => $oldPeer['InterfaceIdentifier'],
        'UserIdentifier' => $oldPeer['UserIdentifier'] ?? null,
        'DisplayName' => $oldPeer['DisplayName'] ?? null,
        'PublicKey' => $prepared['PublicKey'] ?? null,
        'PresharedKey' => $oldPeer['PresharedKey'] ?? null,
    ]);
    echo "  New peer created: {$newPeer['Identifier']}\n";

    // Save new config
    $config = $client->provisioning()->getPeerConfig($newPeer['Identifier']);
    $outDir = __DIR__ . "/../output/{$newPeer['Identifier']}";
    mkdir($outDir, 0755, true);
    file_put_contents("{$outDir}/peer.conf", $config);
    echo "  Config saved to {$outDir}/peer.conf\n";

    // Disable old peer
    $client->peers()->update($oldPeerId, array_merge($oldPeer, [
        'Disabled' => true,
        'DisabledReason' => "Rotated → {$newPeer['Identifier']}",
    ]));
    echo "  Old peer disabled (not deleted)\n";
}

$client = new WgPortalClient(
    requireEnv('WG_BASE_URL'),
    requireEnv('WG_ADMIN_USER'),
    requireEnv('WG_API_TOKEN')
);

rotatePeer($client, 'replace-with-peer-public-key');
