import { HttpClient } from "../client";
import { WgInterface } from "../types";

export class InterfacesApi {
  constructor(private readonly http: HttpClient) {}

  getAll(): Promise<WgInterface[]> {
    return this.http.get("/interface/all");
  }

  getById(id: string): Promise<WgInterface> {
    return this.http.get(`/interface/by-id/${encodeURIComponent(id)}`);
  }

  prepare(): Promise<WgInterface> {
    return this.http.get("/interface/prepare");
  }

  create(data: WgInterface): Promise<WgInterface> {
    return this.http.post("/interface/new", data);
  }

  update(id: string, data: WgInterface): Promise<WgInterface> {
    return this.http.put(`/interface/by-id/${encodeURIComponent(id)}`, data);
  }

  delete(id: string): Promise<void> {
    return this.http.delete(`/interface/by-id/${encodeURIComponent(id)}`);
  }
}
