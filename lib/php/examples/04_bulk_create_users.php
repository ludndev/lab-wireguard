#!/usr/bin/env php
<?php
/**
 * 04_bulk_create_users — Import a list of users, create accounts, and provision one peer each.
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/04_bulk_create_users.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use WgPortal\Client\{WgPortalClient, WgPortalException};

$USERS = [
    ['email' => 'bob@example.com', 'firstname' => 'Bob', 'lastname' => 'Smith'],
    ['email' => 'carol@example.com', 'firstname' => 'Carol', 'lastname' => 'Jones'],
    ['email' => 'dave@example.com', 'firstname' => 'Dave', 'lastname' => 'Brown'],
];

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
$active = array_values(array_filter($interfaces, fn(array $i) => !($i['Disabled'] ?? false)));

if (empty($active)) {
    fwrite(STDERR, "No active interfaces\n");
    exit(1);
}
$ifaceId = $active[0]['Identifier'];

foreach ($USERS as $u) {
    $identifier = explode('@', $u['email'])[0];
    echo "\nProcessing {$u['email']} ...\n";

    try {
        $info = $client->provisioning()->getUserInfo(null, $u['email']);
        $userId = $info['UserIdentifier'];
        echo "  User exists: {$userId}\n";
    } catch (WgPortalException $e) {
        if ($e->getHttpCode() === 404) {
            $user = $client->users()->create([
                'Identifier' => $identifier,
                'Email' => $u['email'],
                'Firstname' => $u['firstname'],
                'Lastname' => $u['lastname'],
                'Password' => 'changeme123',
            ]);
            $userId = $user['Identifier'];
            echo "  Created: {$userId}\n";
        } else {
            echo "  Error: {$e->getMessage()}\n";
            continue;
        }
    }

    try {
        $peer = $client->provisioning()->newPeer([
            'InterfaceIdentifier' => $ifaceId,
            'UserIdentifier' => $userId,
            'DisplayName' => "{$u['email']} - device",
        ]);
        echo "  Peer: {$peer['Identifier']}\n";
    } catch (WgPortalException $e) {
        echo "  Failed to provision peer: {$e->getMessage()}\n";
    }
}
