<?php

declare(strict_types=1);

namespace WgPortal\Client\Tests;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use WgPortal\Client\HttpClient;
use WgPortal\Client\MetricsApi;

class MetricsTest extends TestCase
{
    private const BASE_URL = 'http://wg-portal.test:8888';
    private const PEER_ID = 'xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=';

    private function makeApi(array &$queue): MetricsApi
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

        return new MetricsApi($http);
    }

    public function testByInterface(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'InterfaceIdentifier' => 'wg0',
            'BytesReceived' => 123456789,
            'BytesTransmitted' => 987654321,
        ]));

        $result = $api->byInterface('wg0');
        $this->assertEquals('wg0', $result['InterfaceIdentifier']);
        $this->assertEquals(123456789, $result['BytesReceived']);
    }

    public function testByPeer(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'PeerIdentifier' => self::PEER_ID,
            'BytesReceived' => 1000,
            'BytesTransmitted' => 2000,
            'IsPingable' => true,
        ]));

        $result = $api->byPeer(self::PEER_ID);
        $this->assertEquals(self::PEER_ID, $result['PeerIdentifier']);
        $this->assertTrue($result['IsPingable']);
    }

    public function testByUser(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'UserIdentifier' => 'uid-1234567',
            'BytesReceived' => 11000,
            'BytesTransmitted' => 22000,
            'PeerCount' => 2,
            'PeerMetrics' => [],
        ]));

        $result = $api->byUser('uid-1234567');
        $this->assertEquals('uid-1234567', $result['UserIdentifier']);
        $this->assertEquals(2, $result['PeerCount']);
    }
}
