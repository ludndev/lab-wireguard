#!/usr/bin/env php
<?php
/**
 * 07_self_service_portal — Backend route: user fetches their own peer list and config by email.
 *
 * Usage:
 *   WG_BASE_URL=http://... WG_ADMIN_USER=... WG_API_TOKEN=... php examples/07_self_service_portal.php <email>
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

function getUserPeers(WgPortalClient $client, string $email): array
{
    $info = $client->provisioning()->getUserInfo(null, $email);

    $peersOutput = [];
    foreach ($info['Peers'] as $p) {
        $disabled = $p['IsDisabled'] ?? false;
        $config = null;
        if (!$disabled) {
            try {
                $config = $client->provisioning()->getPeerConfig($p['Identifier']);
            } catch (WgPortalException $e) {
                $config = null;
            }
        }

        $peersOutput[] = [
            'identifier' => $p['Identifier'],
            'display_name' => $p['DisplayName'] ?? null,
            'interface' => $p['InterfaceIdentifier'] ?? '-',
            'ips' => $p['IpAddresses'] ?? [],
            'disabled' => $disabled,
            'config' => $config,
        ];
    }

    return [
        'user_identifier' => $info['UserIdentifier'],
        'peer_count' => $info['PeerCount'],
        'peers' => $peersOutput,
    ];
}

$client = new WgPortalClient(
    requireEnv('WG_BASE_URL'),
    requireEnv('WG_ADMIN_USER'),
    requireEnv('WG_API_TOKEN')
);

$email = $argv[1] ?? 'alice@example.com';

try {
    $result = getUserPeers($client, $email);
    echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
} catch (WgPortalException $e) {
    fwrite(STDERR, "Error [{$e->getHttpCode()}]: {$e->getMessage()}\n");
    exit(1);
}
