import { HttpClient } from "./client";
import { InterfacesApi } from "./api/interfaces";
import { PeersApi } from "./api/peers";
import { ProvisioningApi } from "./api/provisioning";
import { UsersApi } from "./api/users";
import { MetricsApi } from "./api/metrics";
import { WgPortalClientOptions } from "./types";

export class WgPortalClient {
  readonly interfaces: InterfacesApi;
  readonly peers: PeersApi;
  readonly provisioning: ProvisioningApi;
  readonly users: UsersApi;
  readonly metrics: MetricsApi;

  constructor(options: WgPortalClientOptions) {
    const http = new HttpClient(options);
    this.interfaces = new InterfacesApi(http);
    this.peers = new PeersApi(http);
    this.provisioning = new ProvisioningApi(http);
    this.users = new UsersApi(http);
    this.metrics = new MetricsApi(http);
  }
}

export { WgPortalError } from "./client";
export * from "./types";
