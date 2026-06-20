import { HttpClient } from "../client";
import { WgUser } from "../types";

export class UsersApi {
  constructor(private readonly http: HttpClient) {}

  getAll(): Promise<WgUser[]> {
    return this.http.get("/user/all");
  }

  getById(id: string): Promise<WgUser> {
    return this.http.get(`/user/by-id/${encodeURIComponent(id)}`);
  }

  create(data: WgUser): Promise<WgUser> {
    return this.http.post("/user/new", data);
  }

  update(id: string, data: WgUser): Promise<WgUser> {
    return this.http.put(`/user/by-id/${encodeURIComponent(id)}`, data);
  }

  delete(id: string): Promise<void> {
    return this.http.delete(`/user/by-id/${encodeURIComponent(id)}`);
  }
}
