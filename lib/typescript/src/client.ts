import { ApiError, Logger, WgPortalClientOptions } from "./types";

export class WgPortalError extends Error {
  readonly code: number;
  readonly details: string;

  constructor(error: ApiError) {
    super(error.Message);
    this.name = "WgPortalError";
    this.code = error.Code;
    this.details = error.Details;
  }
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly logger?: Logger;

  constructor(options: WgPortalClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "") + "/api/v1";
    this.authHeader =
      "Basic " +
      Buffer.from(`${options.username}:${options.apiToken}`).toString("base64");
    this.logger = options.logger;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(path, params);
    this.logger?.debug(`→ GET ${url}`);
    const res = await fetch(url, { headers: this.headers() });
    return this.parse<T>("GET", url, res);
  }

  async getRaw(path: string, params?: Record<string, string>): Promise<Buffer> {
    const url = this.buildUrl(path, params);
    this.logger?.debug(`→ GET ${url}`);
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      const err: ApiError = await res.json();
      this.logger?.error(`✗ GET ${url} [${res.status}]`, err);
      throw new WgPortalError(err);
    }
    this.logger?.debug(`✓ GET ${url} [${res.status}]`);
    return Buffer.from(await res.arrayBuffer());
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    this.logger?.debug(`→ POST ${url}`);
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    return this.parse<T>("POST", url, res);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const url = this.buildUrl(path);
    this.logger?.debug(`→ PUT ${url}`);
    const res = await fetch(url, {
      method: "PUT",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    return this.parse<T>("PUT", url, res);
  }

  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    this.logger?.debug(`→ DELETE ${url}`);
    const res = await fetch(url, {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 204) {
      const err: ApiError = await res.json();
      this.logger?.error(`✗ DELETE ${url} [${res.status}]`, err);
      throw new WgPortalError(err);
    }
    this.logger?.debug(`✓ DELETE ${url} [${res.status}]`);
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(this.baseUrl + path);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    return url.toString();
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    return { Authorization: this.authHeader, ...extra };
  }

  private async parse<T>(method: string, url: string, res: Response): Promise<T> {
    if (!res.ok) {
      const err: ApiError = await res.json();
      this.logger?.error(`✗ ${method} ${url} [${res.status}]`, err);
      throw new WgPortalError(err);
    }
    this.logger?.debug(`✓ ${method} ${url} [${res.status}]`);
    return res.json() as Promise<T>;
  }
}
