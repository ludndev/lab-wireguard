#!/usr/bin/env php
<?php
/**
 * 01_provision_peer — Create a peer for a user, write the .conf and QR code to disk.
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/01_provision_peer.php
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

$client = new WgPortalClient(
    requireEnv('WG_BASE_URL'),
    requireEnv('WG_ADMIN_USER'),
    requireEnv('WG_API_TOKEN')
);

$email = 'alice@example.com';

// Resolve or create user
try {
    $info = $client->provisioning()->getUserInfo(null, $email);
    $userId = $info['UserIdentifier'];
    echo "User exists: {$userId}\n";
} catch (WgPortalException $e) {
    if ($e->getHttpCode() === 404) {
        echo "Creating user {$email} ...\n";
        $user = $client->users()->create([
            'Identifier' => 'alice',
            'Email' => $email,
            'Firstname' => 'Alice',
            'Password' => 'changeme123',
        ]);
        $userId = $user['Identifier'];
        echo "Created user: {$userId}\n";
    } else {
        fwrite(STDERR, "Error: {$e->getMessage()}\n");
        exit(1);
    }
}

// Get active interface
$interfaces = $client->interfaces()->getAll();
$active = array_values(array_filter($interfaces, fn(array $i) => !($i['Disabled'] ?? false)));

if (empty($active)) {
    fwrite(STDERR, "No active interfaces\n");
    exit(1);
}
$ifaceId = $active[0]['Identifier'];

// Provision peer
$peer = $client->provisioning()->newPeer([
    'InterfaceIdentifier' => $ifaceId,
    'UserIdentifier' => $userId,
    'DisplayName' => "{$email} - laptop",
]);
echo "Peer: {$peer['Identifier']}\n";

// Save artifacts
$config = $client->provisioning()->getPeerConfig($peer['Identifier']);
$qrPng = $client->provisioning()->getPeerQrCode($peer['Identifier']);

$outDir = __DIR__ . "/../output/{$peer['Identifier']}";
mkdir($outDir, 0755, true);
file_put_contents("{$outDir}/peer.conf", $config);
file_put_contents("{$outDir}/qr.png", $qrPng);
echo "Saved to {$outDir}\n";
