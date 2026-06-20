<?php

declare(strict_types=1);

namespace WgPortal\Client\Tests;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use WgPortal\Client\HttpClient;
use WgPortal\Client\ProvisioningApi;

class ProvisioningTest extends TestCase
{
    private const BASE_URL = 'http://wg-portal.test:8888';
    private const PEER_ID = 'xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=';

    private function makeApi(array &$queue): ProvisioningApi
    {
        $ref = new \ReflectionClass(HttpClient::class);
        $http = $ref->newInstanceWithoutConstructor();

        $prop = $ref->getProperty('baseUrl');
        $prop->setAccessible(true);
        $prop->setValue($http, self::BASE_URL . '/api/v1');

        $headersProp = $ref->getProperty('headers');
        $headersProp->setAccessible(true);
        $headersProp->setValue($http, ['Authorization' => 'Basic dGVzdDp0ZXN0']);

        $mock = new MockHandler($queue);
        $httpProp = $ref->getProperty('http');
        $httpProp->setAccessible(true);
        $httpProp->setValue($http, new GuzzleClient(['handler' => HandlerStack::create($mock)]));

        return new ProvisioningApi($http);
    }

    public function testNewPeer(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'Identifier' => self::PEER_ID,
            'InterfaceIdentifier' => 'wg0',
            'PrivateKey' => 'k',
            'UserIdentifier' => 'uid-1234567',
        ]));

        $result = $api->newPeer([
            'InterfaceIdentifier' => 'wg0',
            'DisplayName' => 'API Peer',
            'UserIdentifier' => 'uid-1234567',
        ]);
        $this->assertEquals(self::PEER_ID, $result['Identifier']);
    }

    public function testGetPeerConfig(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, [], "[Interface]\nPrivateKey = test");

        $result = $api->getPeerConfig(self::PEER_ID);
        $this->assertStringContainsString('[Interface]', $result);
    }

    public function testGetPeerQrCode(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, [], chr(137) . chr(80) . chr(78) . chr(71));

        $result = $api->getPeerQrCode(self::PEER_ID);
        $this->assertIsString($result);
        $this->assertEquals(4, strlen($result));
    }

    public function testGetUserInfo(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'UserIdentifier' => 'uid-1234567',
            'PeerCount' => 2,
            'Peers' => [],
        ]));

        $result = $api->getUserInfo('uid-1234567');
        $this->assertEquals('uid-1234567', $result['UserIdentifier']);
        $this->assertEquals(2, $result['PeerCount']);
    }

    public function testGetUserInfoByEmail(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'UserIdentifier' => 'uid-1234567',
            'PeerCount' => 0,
            'Peers' => [],
        ]));

        $result = $api->getUserInfo(null, 'test@test.com');
        $this->assertEquals('uid-1234567', $result['UserIdentifier']);
    }
}
