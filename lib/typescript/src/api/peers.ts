import { HttpClient } from "../client";
import { WgPeer } from "../types";

export class PeersApi {
  constructor(private readonly http: HttpClient) {}

  getById(id: string): Promise<WgPeer> {
    return this.http.get(`/peer/by-id/${encodeURIComponent(id)}`);
  }

  getByInterface(interfaceId: string): Promise<WgPeer[]> {
    return this.http.get(`/peer/by-interface/${encodeURIComponent(interfaceId)}`);
  }

  getByUser(userId: string): Promise<WgPeer[]> {
    return this.http.get(`/peer/by-user/${encodeURIComponent(userId)}`);
  }

  prepare(interfaceId: string): Promise<WgPeer> {
    return this.http.get(`/peer/prepare/${encodeURIComponent(interfaceId)}`);
  }

  create(data: WgPeer): Promise<WgPeer> {
    return this.http.post("/peer/new", data);
  }

  update(id: string, data: WgPeer): Promise<WgPeer> {
    return this.http.put(`/peer/by-id/${encodeURIComponent(id)}`, data);
  }

  delete(id: string): Promise<void> {
    return this.http.delete(`/peer/by-id/${encodeURIComponent(id)}`);
  }
}
