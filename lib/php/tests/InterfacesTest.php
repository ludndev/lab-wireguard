<?php

declare(strict_types=1);

namespace WgPortal\Client\Tests;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use WgPortal\Client\HttpClient;
use WgPortal\Client\InterfacesApi;
use WgPortal\Client\WgPortalException;

class InterfacesTest extends TestCase
{
    private const BASE_URL = 'http://wg-portal.test:8888';

    private function makeApi(array &$queue): InterfacesApi
    {
        $mock = new MockHandler($queue);
        $handlerStack = HandlerStack::create($mock);
        $guzzle = new GuzzleClient(['handler' => $handlerStack]);

        $http = $this->createHttpClient($guzzle);
        return new InterfacesApi($http);
    }

    private function createHttpClient(GuzzleClient $guzzle): HttpClient
    {
        $ref = new \ReflectionClass(HttpClient::class);
        $client = $ref->newInstanceWithoutConstructor();

        $prop = $ref->getProperty('baseUrl');
        $prop->setAccessible(true);
        $prop->setValue($client, self::BASE_URL . '/api/v1');

        $headersProp = $ref->getProperty('headers');
        $headersProp->setAccessible(true);
        $headersProp->setValue($client, [
            'Authorization' => 'Basic dGVzdDp0ZXN0',
        ]);

        $httpProp = $ref->getProperty('http');
        $httpProp->setAccessible(true);
        $httpProp->setValue($client, $guzzle);

        return $client;
    }

    public function testGetAll(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);

        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            ['Identifier' => 'wg0', 'Mode' => 'server', 'PrivateKey' => 'k1', 'PublicKey' => 'k2'],
            ['Identifier' => 'wg1', 'Mode' => 'server', 'PrivateKey' => 'k3', 'PublicKey' => 'k4'],
        ]));

        $result = $api->getAll();
        $this->assertCount(2, $result);
        $this->assertEquals('wg0', $result[0]['Identifier']);
    }

    public function testGetAllEmpty(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);

        $queue[] = new Response(200, ['Content-Type' => 'application/json'], '[]');

        $result = $api->getAll();
        $this->assertIsArray($result);
        $this->assertEmpty($result);
    }

    public function testGetById(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);

        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'Identifier' => 'wg0', 'Mode' => 'server', 'PrivateKey' => 'k1', 'PublicKey' => 'k2',
        ]));

        $result = $api->getById('wg0');
        $this->assertEquals('wg0', $result['Identifier']);
        $this->assertEquals('server', $result['Mode']);
    }

    public function testCreate(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);

        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            'Identifier' => 'wg0', 'Mode' => 'server', 'PrivateKey' => 'k1', 'PublicKey' => 'k2',
        ]));

        $result = $api->create(['Identifier' => 'wg0', 'Mode' => 'server']);
        $this->assertEquals('wg0', $result['Identifier']);
    }

    public function testDelete(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);

        $queue[] = new Response(204);

        $api->delete('wg0');
        $this->assertTrue(true); // no exception
    }

    public function testGetByIdThrowsOn404(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);

        $queue[] = new Response(
            404,
            ['Content-Type' => 'application/json'],
            '{"Code":404,"Message":"Not Found","Details":"resource not found"}'
        );

        $this->expectException(WgPortalException::class);
        $this->expectExceptionCode(404);

        $api->getById('nonexistent');
    }
}
