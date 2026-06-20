<?php

declare(strict_types=1);

namespace WgPortal\Client;

/**
 * API methods for user management.
 */
class UsersApi
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
        return $this->http->get('/user/all');
    }

    /** @return array<string, mixed> */
    public function getById(string $id): array
    {
        return $this->http->get("/user/by-id/{$id}");
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function create(array $data): array
    {
        return $this->http->post('/user/new', $data);
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function update(string $id, array $data): array
    {
        return $this->http->put("/user/by-id/{$id}", $data);
    }

    public function delete(string $id): void
    {
        $this->http->delete("/user/by-id/{$id}");
    }
}
