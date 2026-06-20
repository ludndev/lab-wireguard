import { HttpClient } from "../client";
import { InterfaceMetrics, PeerMetrics, UserMetrics } from "../types";

export class MetricsApi {
  constructor(private readonly http: HttpClient) {}

  byInterface(interfaceId: string): Promise<InterfaceMetrics> {
    return this.http.get(`/metrics/by-interface/${encodeURIComponent(interfaceId)}`);
  }

  byPeer(peerId: string): Promise<PeerMetrics> {
    return this.http.get(`/metrics/by-peer/${encodeURIComponent(peerId)}`);
  }

  byUser(userId: string): Promise<UserMetrics> {
    return this.http.get(`/metrics/by-user/${encodeURIComponent(userId)}`);
  }
}
