<?php

declare(strict_types=1);

namespace WgPortal\Client;

/**
 * API methods for peer provisioning and config retrieval.
 */
class ProvisioningApi
{
    /** @var HttpClient */
    private $http;

    public function __construct(HttpClient $http)
    {
        $this->http = $http;
    }

    /**
     * @param array<string, mixed> $request
     * @return array<string, mixed>
     */
    public function newPeer(array $request): array
    {
        return $this->http->post('/provisioning/new-peer', $request);
    }

    public function getPeerConfig(string $peerId): string
    {
        return $this->http->getRaw('/provisioning/data/peer-config', ['PeerId' => $peerId]);
    }

    public function getPeerQrCode(string $peerId): string
    {
        return $this->http->getRaw('/provisioning/data/peer-qr', ['PeerId' => $peerId]);
    }

    /** @return array<string, mixed> */
    public function getUserInfo(?string $userId = null, ?string $email = null): array
    {
        $params = [];
        if ($userId !== null) {
            $params['UserId'] = $userId;
        } elseif ($email !== null) {
            $params['Email'] = $email;
        }

        return $this->http->get('/provisioning/data/user-info', $params);
    }
}
