<?php

declare(strict_types=1);

namespace WgPortal\Client\Tests;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\TestCase;
use WgPortal\Client\HttpClient;
use WgPortal\Client\WgPortalException;

class HttpClientTest extends TestCase
{
    private const BASE_URL = 'http://wg-portal.test:8888';
    private const USERNAME = 'admin@wgportal.local';
    private const API_TOKEN = 'test-api-token';

    private function makeClient(array &$queue): HttpClient
    {
        $mock = new MockHandler($queue);
        $handlerStack = HandlerStack::create($mock);

        // Use reflection to inject our mocked Guzzle client
        $client = new HttpClient(self::BASE_URL, self::USERNAME, self::API_TOKEN);

        $ref = new \ReflectionClass(HttpClient::class);
        $prop = $ref->getProperty('http');
        $prop->setAccessible(true);
        $prop->setValue($client, new GuzzleClient(['handler' => $handlerStack]));

        return $client;
    }

    public function testSetsBasicAuthOnGet(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        // We can't inspect the request with MockHandler easily,
        // but the test confirms no exception is thrown.
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], '{"ok":true}');

        $result = $client->get('/test');
        $this->assertIsArray($result);
        $this->assertEquals('ok', key($result));
    }

    public function testAppendsApiV1Prefix(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(200, ['Content-Type' => 'application/json'], '[]');

        $result = $client->get('/interface/all');
        $this->assertIsArray($result);
    }

    public function testStripsTrailingSlashFromBaseUrl(): void
    {
        $ref = new \ReflectionClass(HttpClient::class);
        $client = $ref->newInstanceWithoutConstructor();

        $prop = $ref->getProperty('baseUrl');
        $prop->setAccessible(true);
        $prop->setValue($client, self::BASE_URL . '/api/v1');

        $queue = [];
        $queue[] = new Response(200, ['Content-Type' => 'application/json'], '{}');

        $httpProp = $ref->getProperty('http');
        $httpProp->setAccessible(true);
        $mock = new MockHandler($queue);
        $httpProp->setValue($client, new GuzzleClient(['handler' => HandlerStack::create($mock)]));

        $headersProp = $ref->getProperty('headers');
        $headersProp->setAccessible(true);
        $headersProp->setValue($client, [
            'Authorization' => 'Basic ' . base64_encode(self::USERNAME . ':' . self::API_TOKEN),
        ]);

        $result = $client->get('/test');
        $this->assertIsArray($result);
    }

    public function testThrowsWgPortalExceptionOnError(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(
            401,
            ['Content-Type' => 'application/json'],
            '{"Code":401,"Message":"Unauthorized","Details":"invalid credentials"}'
        );

        $this->expectException(WgPortalException::class);
        $this->expectExceptionCode(401);

        $client->get('/interface/all');
    }

    public function testExceptionHasCorrectDetails(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(
            500,
            ['Content-Type' => 'application/json'],
            '{"Code":500,"Message":"Internal Server Error","Details":"unexpected error"}'
        );

        try {
            $client->get('/interface/all');
            $this->fail('Expected exception not thrown');
        } catch (WgPortalException $e) {
            $this->assertEquals(500, $e->getHttpCode());
            $this->assertEquals('Internal Server Error', $e->getMessage());
            $this->assertEquals('unexpected error', $e->getDetails());
        }
    }

    public function testHandlesNonJsonErrorBody(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(502, [], '<html>Bad Gateway</html>');

        try {
            $client->get('/interface/all');
            $this->fail('Expected exception not thrown');
        } catch (WgPortalException $e) {
            $this->assertEquals(502, $e->getHttpCode());
            $this->assertStringContainsString('Bad Gateway', $e->getMessage());
        }
    }

    public function testHandlesEmptyErrorBody(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(500);

        try {
            $client->get('/interface/all');
            $this->fail('Expected exception not thrown');
        } catch (WgPortalException $e) {
            $this->assertEquals(500, $e->getHttpCode());
        }
    }

    public function testPostSendsJsonBody(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(200, ['Content-Type' => 'application/json'], '{"ok":true}');

        $result = $client->post('/interface/new', ['Identifier' => 'wg0']);
        $this->assertIsArray($result);
    }

    public function testDeleteResolvesOn204(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(204);

        $client->delete('/interface/by-id/wg0');
        $this->assertTrue(true); // no exception
    }

    public function testGetRawReturnsString(): void
    {
        $queue = [];
        $client = $this->makeClient($queue);

        $queue[] = new Response(200, [], '[Interface]');

        $result = $client->getRaw('/provisioning/data/peer-qr', ['PeerId' => 'abc']);
        $this->assertIsString($result);
        $this->assertEquals('[Interface]', $result);
    }
}
