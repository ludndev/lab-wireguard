import { HttpClient } from "../client";
import { ProvisioningRequest, UserInformation, WgPeer } from "../types";

export class ProvisioningApi {
  constructor(private readonly http: HttpClient) {}

  newPeer(request: ProvisioningRequest): Promise<WgPeer> {
    return this.http.post("/provisioning/new-peer", request);
  }

  getPeerConfig(peerId: string): Promise<string> {
    return this.http
      .getRaw("/provisioning/data/peer-config", { PeerId: peerId })
      .then((buf) => buf.toString("utf8"));
  }

  getPeerQrCode(peerId: string): Promise<Buffer> {
    return this.http.getRaw("/provisioning/data/peer-qr", { PeerId: peerId });
  }

  getUserInfo(options?: { userId?: string; email?: string }): Promise<UserInformation> {
    const params: Record<string, string> = {};
    if (options?.userId) params["UserId"] = options.userId;
    else if (options?.email) params["Email"] = options.email;
    return this.http.get("/provisioning/data/user-info", params);
  }
}
