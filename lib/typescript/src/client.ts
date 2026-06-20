import { ApiError, WgPortalClientOptions } from "./types";

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

  constructor(options: WgPortalClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "") + "/api/v1";
    this.authHeader =
      "Basic " +
      Buffer.from(`${options.username}:${options.apiToken}`).toString("base64");
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, { headers: this.headers() });
    return this.parse<T>(res);
  }

  async getRaw(path: string, params?: Record<string, string>): Promise<Buffer> {
    const url = this.buildUrl(path, params);
    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) {
      const err: ApiError = await res.json();
      throw new WgPortalError(err);
    }
    return Buffer.from(await res.arrayBuffer());
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(this.buildUrl(path), {
      method: "PUT",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  async delete(path: string): Promise<void> {
    const res = await fetch(this.buildUrl(path), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 204) {
      const err: ApiError = await res.json();
      throw new WgPortalError(err);
    }
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

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const err: ApiError = await res.json();
      throw new WgPortalError(err);
    }
    return res.json() as Promise<T>;
  }
}
