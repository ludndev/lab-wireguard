<?php

declare(strict_types=1);

namespace WgPortal\Client;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Http\Message\ResponseInterface;

/**
 * Raised on non-2xx API responses.
 */
class WgPortalException extends \RuntimeException
{
    /** @var int */
    private $httpCode;

    /** @var string */
    private $details;

    public function __construct(int $httpCode, string $message, string $details = '')
    {
        parent::__construct($message, $httpCode);
        $this->httpCode = $httpCode;
        $this->details = $details;
    }

    public function getHttpCode(): int
    {
        return $this->httpCode;
    }

    public function getDetails(): string
    {
        return $this->details;
    }
}

/**
 * HTTP transport with Basic auth and structured logging.
 *
 * @internal
 */
class HttpClient
{
    /** @var string */
    private $baseUrl;

    /** @var array<string, string> */
    private $headers;

    /** @var GuzzleClient */
    private $http;

    /** @var callable|null */
    private $logger;

    public function __construct(
        string $baseUrl,
        string $username,
        string $apiToken,
        ?callable $logger = null
    ) {
        $this->baseUrl = rtrim($baseUrl, '/') . '/api/v1';
        $this->headers = [
            'Authorization' => 'Basic ' . base64_encode("{$username}:{$apiToken}"),
        ];
        $this->http = new GuzzleClient();
        $this->logger = $logger;
    }

    private function log(string $level, string $message): void
    {
        if ($this->logger !== null) {
            ($this->logger)($level, $message);
        }
    }

    /**
     * @param array<string, string> $params
     * @return mixed
     * @throws WgPortalException
     */
    public function get(string $path, array $params = [])
    {
        $url = $this->baseUrl . $path;
        $this->log('debug', "→ GET {$url}");

        try {
            $res = $this->http->get($url, [
                'headers' => $this->headers,
                'query' => $params,
            ]);
        } catch (GuzzleException $e) {
            throw new WgPortalException(0, $e->getMessage());
        }

        return $this->parseJson('GET', $url, $res);
    }

    /**
     * @param array<string, string> $params
     * @throws WgPortalException
     */
    public function getRaw(string $path, array $params = []): string
    {
        $url = $this->baseUrl . $path;
        $this->log('debug', "→ GET {$url}");

        try {
            $res = $this->http->get($url, [
                'headers' => $this->headers,
                'query' => $params,
            ]);
        } catch (GuzzleException $e) {
            throw new WgPortalException(0, $e->getMessage());
        }

        $status = $res->getStatusCode();
        $body = (string) $res->getBody();

        if ($status >= 400) {
            $err = $this->parseError($status, $body);
            $this->log('error', "✗ GET {$url} [{$status}] {$err->getMessage()}");
            throw $err;
        }

        $this->log('debug', "✓ GET {$url} [{$status}]");
        return $body;
    }

    /**
     * @param mixed $body
     * @return mixed
     * @throws WgPortalException
     */
    public function post(string $path, $body)
    {
        $url = $this->baseUrl . $path;
        $this->log('debug', "→ POST {$url}");

        try {
            $res = $this->http->post($url, [
                'headers' => $this->headers + ['Content-Type' => 'application/json'],
                'json' => $body,
            ]);
        } catch (GuzzleException $e) {
            throw new WgPortalException(0, $e->getMessage());
        }

        return $this->parseJson('POST', $url, $res);
    }

    /**
     * @param mixed $body
     * @return mixed
     * @throws WgPortalException
     */
    public function put(string $path, $body)
    {
        $url = $this->baseUrl . $path;
        $this->log('debug', "→ PUT {$url}");

        try {
            $res = $this->http->put($url, [
                'headers' => $this->headers + ['Content-Type' => 'application/json'],
                'json' => $body,
            ]);
        } catch (GuzzleException $e) {
            throw new WgPortalException(0, $e->getMessage());
        }

        return $this->parseJson('PUT', $url, $res);
    }

    /**
     * @throws WgPortalException
     */
    public function delete(string $path): void
    {
        $url = $this->baseUrl . $path;
        $this->log('debug', "→ DELETE {$url}");

        try {
            $res = $this->http->delete($url, [
                'headers' => $this->headers,
            ]);
        } catch (GuzzleException $e) {
            throw new WgPortalException(0, $e->getMessage());
        }

        $status = $res->getStatusCode();
        if ($status >= 400) {
            $body = (string) $res->getBody();
            $err = $this->parseError($status, $body);
            $this->log('error', "✗ DELETE {$url} [{$status}] {$err->getMessage()}");
            throw $err;
        }

        $this->log('debug', "✓ DELETE {$url} [{$status}]");
    }

    /**
     * @return mixed
     * @throws WgPortalException
     */
    private function parseJson(string $method, string $url, ResponseInterface $res)
    {
        $status = $res->getStatusCode();
        $body = (string) $res->getBody();

        if ($status >= 400) {
            $err = $this->parseError($status, $body);
            $this->log('error', "✗ {$method} {$url} [{$status}] {$err->getMessage()}");
            throw $err;
        }

        $this->log('debug', "✓ {$method} {$url} [{$status}]");

        $data = json_decode($body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new WgPortalException(0, 'failed to parse response: ' . json_last_error_msg());
        }

        return $data;
    }

    private function parseError(int $status, string $body): WgPortalException
    {
        $data = json_decode($body, true);

        if (is_array($data) && isset($data['Code'])) {
            return new WgPortalException(
                (int) $data['Code'],
                $data['Message'] ?? $body,
                $data['Details'] ?? ''
            );
        }

        if (trim($body) === '') {
            return new WgPortalException($status, 'HTTP ' . $status);
        }

        return new WgPortalException($status, trim($body));
    }
}
