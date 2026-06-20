<?php

declare(strict_types=1);

namespace WgPortal\Client;

/**
 * API methods for WireGuard traffic metrics.
 */
class MetricsApi
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /** @return array<string, mixed> */
    public function byInterface(string $interfaceId): array
    {
        return $this->http->get("/metrics/by-interface/{$interfaceId}");
    }

    /** @return array<string, mixed> */
    public function byPeer(string $peerId): array
    {
        return $this->http->get("/metrics/by-peer/{$peerId}");
    }

    /** @return array<string, mixed> */
    public function byUser(string $userId): array
    {
        return $this->http->get("/metrics/by-user/{$userId}");
    }
}
