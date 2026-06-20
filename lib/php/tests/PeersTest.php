<?php

declare(strict_types=1);

namespace WgPortal\Client\Tests;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use WgPortal\Client\HttpClient;
use WgPortal\Client\PeersApi;
use WgPortal\Client\WgPortalException;

class PeersTest extends TestCase
{
    private const BASE_URL = 'http://wg-portal.test:8888';
    private const PEER_ID = 'xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=';

    private function makeApi(array &$queue): PeersApi
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

        return new PeersApi($http);
    }

    private function fixturePeer(): array
    {
        return [
            'Identifier' => self::PEER_ID,
            'InterfaceIdentifier' => 'wg0',
            'PrivateKey' => 'k',
            'PublicKey' => 'k',
            'DisplayName' => 'My Peer',
            'UserIdentifier' => 'uid-1234567',
        ];
    }

    public function testGetById(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode($this->fixturePeer()));

        $result = $api->getById(self::PEER_ID);
        $this->assertEquals(self::PEER_ID, $result['Identifier']);
        $this->assertEquals('wg0', $result['InterfaceIdentifier']);
    }

    public function testGetByInterface(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([$this->fixturePeer()]));

        $result = $api->getByInterface('wg0');
        $this->assertCount(1, $result);
    }

    public function testGetByUser(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([$this->fixturePeer()]));

        $result = $api->getByUser('uid-1234567');
        $this->assertCount(1, $result);
    }

    public function testCreate(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode($this->fixturePeer()));

        $result = $api->create($this->fixturePeer());
        $this->assertEquals(self::PEER_ID, $result['Identifier']);
    }

    public function testDelete(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(204);

        $api->delete(self::PEER_ID);
        $this->assertTrue(true);
    }

    public function testGetByIdThrowsOn404(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(404, ['Content-Type' => 'application/json'], '{"Code":404,"Message":"Not Found"}');

        $this->expectException(WgPortalException::class);
        $api->getById('nonexistent');
    }
}
