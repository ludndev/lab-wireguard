import { ApiError } from "../../src/types";

export interface MockOptions {
  ok: boolean;
  status: number;
  body?: unknown;
  raw?: Buffer;
}

export function mockFetch(opts: MockOptions): jest.Mock {
  const mock = jest.fn().mockResolvedValue({
    ok: opts.ok,
    status: opts.status,
    json: jest.fn().mockResolvedValue(opts.body),
    arrayBuffer: jest.fn().mockResolvedValue(
      opts.raw
        ? opts.raw.buffer.slice(opts.raw.byteOffset, opts.raw.byteOffset + opts.raw.byteLength)
        : Buffer.from(JSON.stringify(opts.body ?? "")).buffer
    ),
  });
  global.fetch = mock;
  return mock;
}

export function mockOk(body: unknown, status = 200): jest.Mock {
  return mockFetch({ ok: true, status, body });
}

export function mockOkRaw(raw: Buffer, status = 200): jest.Mock {
  return mockFetch({ ok: true, status, raw });
}

export function mockNoContent(): jest.Mock {
  return mockFetch({ ok: true, status: 204 });
}

export function mockError(error: ApiError): jest.Mock {
  return mockFetch({ ok: false, status: error.Code, body: error });
}

export function lastCall(): { url: string; init: RequestInit } {
  const mock = global.fetch as jest.Mock;
  const [url, init] = mock.mock.calls[0];
  return { url: url as string, init: init as RequestInit };
}

export function callCount(): number {
  return (global.fetch as jest.Mock).mock.calls.length;
}
