<?php

declare(strict_types=1);

namespace WgPortal\Client;

/**
 * Synchronous client for the WireGuard Portal v2 REST API.
 *
 * ```php
 * $client = new WgPortalClient(
 *     'http://192.168.1.100:8888',
 *     'admin@wgportal.local',
 *     'your-api-token'
 * );
 * $interfaces = $client->interfaces()->getAll();
 * ```
 */
class WgPortalClient
{
    /** @var HttpClient */
    private $http;

    /** @var InterfacesApi */
    private $interfacesApi;

    /** @var PeersApi */
    private $peersApi;

    /** @var ProvisioningApi */
    private $provisioningApi;

    /** @var UsersApi */
    private $usersApi;

    /** @var MetricsApi */
    private $metricsApi;

    public function __construct(
        string $baseUrl,
        string $username,
        string $apiToken,
        ?callable $logger = null
    ) {
        $this->http = new HttpClient($baseUrl, $username, $apiToken, $logger);
        $this->interfacesApi = new InterfacesApi($this->http);
        $this->peersApi = new PeersApi($this->http);
        $this->provisioningApi = new ProvisioningApi($this->http);
        $this->usersApi = new UsersApi($this->http);
        $this->metricsApi = new MetricsApi($this->http);
    }

    public function interfaces(): InterfacesApi
    {
        return $this->interfacesApi;
    }

    public function peers(): PeersApi
    {
        return $this->peersApi;
    }

    public function provisioning(): ProvisioningApi
    {
        return $this->provisioningApi;
    }

    public function users(): UsersApi
    {
        return $this->usersApi;
    }

    public function metrics(): MetricsApi
    {
        return $this->metricsApi;
    }
}
