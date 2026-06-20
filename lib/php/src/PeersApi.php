<?php

declare(strict_types=1);

namespace WgPortal\Client;

/**
 * API methods for WireGuard peers.
 */
class PeersApi
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /** @return array<string, mixed> */
    public function getById(string $id): array
    {
        return $this->http->get("/peer/by-id/{$id}");
    }

    /** @return array<int, array<string, mixed>> */
    public function getByInterface(string $interfaceId): array
    {
        return $this->http->get("/peer/by-interface/{$interfaceId}");
    }

    /** @return array<int, array<string, mixed>> */
    public function getByUser(string $userId): array
    {
        return $this->http->get("/peer/by-user/{$userId}");
    }

    /** @return array<string, mixed> */
    public function prepare(string $interfaceId): array
    {
        return $this->http->get("/peer/prepare/{$interfaceId}");
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        return $this->http->post('/peer/new', $data);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function update(string $id, array $data): array
    {
        return $this->http->put("/peer/by-id/{$id}", $data);
    }

    public function delete(string $id): void
    {
        $this->http->delete("/peer/by-id/{$id}");
    }
}
