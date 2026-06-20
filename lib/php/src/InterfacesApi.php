<?php

declare(strict_types=1);

namespace WgPortal\Client;

/**
 * API methods for WireGuard interfaces.
 */
class InterfacesApi
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /** @return array<int, array<string, mixed>> */
    public function getAll(): array
    {
        return $this->http->get('/interface/all');
    }

    /** @return array<string, mixed> */
    public function getById(string $id): array
    {
        return $this->http->get("/interface/by-id/{$id}");
    }

    /** @return array<string, mixed> */
    public function prepare(): array
    {
        return $this->http->get('/interface/prepare');
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        return $this->http->post('/interface/new', $data);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function update(string $id, array $data): array
    {
        return $this->http->put("/interface/by-id/{$id}", $data);
    }

    public function delete(string $id): void
    {
        $this->http->delete("/interface/by-id/{$id}");
    }
}
