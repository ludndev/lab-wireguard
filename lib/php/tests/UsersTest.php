<?php

declare(strict_types=1);

namespace WgPortal\Client\Tests;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use WgPortal\Client\HttpClient;
use WgPortal\Client\UsersApi;
use WgPortal\Client\WgPortalException;

class UsersTest extends TestCase
{
    private const BASE_URL = 'http://wg-portal.test:8888';

    private function makeApi(array &$queue): UsersApi
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

        return new UsersApi($http);
    }

    private function fixtureUser(): array
    {
        return [
            'Identifier' => 'uid-1234567',
            'Email' => 'test@test.com',
            'Firstname' => 'Max',
            'Lastname' => 'Muster',
            'IsAdmin' => false,
            'ApiEnabled' => false,
            'PeerCount' => 2,
        ];
    }

    public function testGetAll(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode([
            $this->fixtureUser(),
            ['Identifier' => 'uid-admin', 'Email' => 'admin@wgportal.local', 'IsAdmin' => true],
        ]));

        $result = $api->getAll();
        $this->assertCount(2, $result);
        $this->assertEquals('uid-1234567', $result[0]['Identifier']);
    }

    public function testGetById(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode($this->fixtureUser()));

        $result = $api->getById('uid-1234567');
        $this->assertEquals('test@test.com', $result['Email']);
    }

    public function testCreate(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], json_encode($this->fixtureUser()));

        $result = $api->create($this->fixtureUser());
        $this->assertEquals('uid-1234567', $result['Identifier']);
    }

    public function testDelete(): void
    {
        $queue = [];
        $api = $this->makeApi($queue);
        $queue[] = new Response(204);

        $api->delete('uid-1234567');
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
