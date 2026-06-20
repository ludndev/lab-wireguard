#!/usr/bin/env php
<?php
/**
 * 02_offboard_user — Delete all peers for a user, then delete the user account.
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/02_offboard_user.php
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

$userId = 'alice';

try {
    $client->users()->getById($userId);
} catch (WgPortalException $e) {
    if ($e->getHttpCode() === 404) {
        echo "User {$userId} not found\n";
        exit(0);
    }
    fwrite(STDERR, "Error: {$e->getMessage()}\n");
    exit(1);
}

$peers = $client->peers()->getByUser($userId);
foreach ($peers as $peer) {
    $display = $peer['DisplayName'] ?? '-';
    echo "Deleting peer: {$peer['Identifier']} ({$display})\n";
    $client->peers()->delete($peer['Identifier']);
}

$client->users()->delete($userId);
echo "User {$userId} deleted\n";
