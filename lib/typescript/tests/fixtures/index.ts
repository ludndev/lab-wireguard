import {
  WgInterface,
  WgPeer,
  WgUser,
  ProvisioningRequest,
  UserInformation,
  InterfaceMetrics,
  PeerMetrics,
  UserMetrics,
  ApiError,
} from "../../src/types";

export const INTERFACE: WgInterface = {
  Identifier: "wg0",
  Mode: "server",
  PrivateKey: "gI6EdUSYvn8ugXOt8QQD6Yc+JyiZxIhp3GInSWRfWGE=",
  PublicKey: "HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=",
  DisplayName: "My Interface",
  Addresses: ["10.11.12.1/24"],
  Dns: ["1.1.1.1"],
  DnsSearch: ["wg.local"],
  ListenPort: 51820,
  Mtu: 1420,
  Disabled: false,
  SaveConfig: false,
  PeerDefAllowedIPs: ["10.11.12.0/24"],
  PeerDefEndpoint: "wg.example.com:51820",
  PeerDefMtu: 1420,
  PeerDefPersistentKeepalive: 25,
  PeerDefNetwork: ["10.11.12.0/24"],
  TotalPeers: 2,
  EnabledPeers: 2,
  Filename: "wg0.conf",
};

export const INTERFACE_PREPARED: WgInterface = {
  Identifier: "wg1",
  Mode: "server",
  PrivateKey: "newGeneratedPrivateKey+abc/def=",
  PublicKey: "newGeneratedPublicKey+abc/def=",
  Addresses: ["10.11.13.1/24"],
  ListenPort: 51821,
};

export const INTERFACE_LIST: WgInterface[] = [
  INTERFACE,
  { ...INTERFACE, Identifier: "wg1", DisplayName: "Second Interface" },
];

// public key intentionally contains +, /, = to test URL encoding
export const PEER: WgPeer = {
  Identifier: "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
  InterfaceIdentifier: "wg0",
  PrivateKey: "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
  PublicKey: "TrMvSoP4jYQlY6RIzBgbssQqY3vxI2Pi+y71lOWWXX0=",
  DisplayName: "My Peer",
  Mode: "client",
  Addresses: ["10.11.12.2/24"],
  AllowedIPs: { Value: ["10.11.12.0/24"], Overridable: true },
  PresharedKey: "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
  Dns: { Value: ["8.8.8.8"], Overridable: true },
  Endpoint: { Value: "wg.example.com:51820", Overridable: true },
  Mtu: { Value: 1420, Overridable: true },
  PersistentKeepalive: { Value: 25, Overridable: true },
  UserIdentifier: "uid-1234567",
  Disabled: false,
  ExpiresAt: "2027-01-01",
  Notes: "Test peer",
  Filename: "wg_peer_x.conf",
};

export const PEER_PREPARED: WgPeer = {
  Identifier: "glXkHLuXRXQpK9KF0Uv/saYua+1BWvjz2Lq+jm+WfCo=",
  InterfaceIdentifier: "wg0",
  PrivateKey: "newPeerPrivateKey+abc/def=",
  Addresses: ["10.11.12.3/24"],
};

export const PEER_LIST: WgPeer[] = [
  PEER,
  { ...PEER, Identifier: "peer2pubkey==", DisplayName: "Second Peer" },
];

export const PROVISIONING_REQUEST: ProvisioningRequest = {
  InterfaceIdentifier: "wg0",
  DisplayName: "API Peer xyz",
  UserIdentifier: "uid-1234567",
};

export const PROVISIONING_REQUEST_MINIMAL: ProvisioningRequest = {
  InterfaceIdentifier: "wg0",
};

export const PROVISIONING_REQUEST_WITH_KEY: ProvisioningRequest = {
  InterfaceIdentifier: "wg0",
  PublicKey: "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
  PresharedKey: "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
};

export const WG_QUICK_CONFIG = `[Interface]
PrivateKey = yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=
Address = 10.11.12.2/32

[Peer]
PublicKey = HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=
Endpoint = wg.example.com:51820
AllowedIPs = 10.11.12.0/24
PersistentKeepalive = 25
`;

export const QR_PNG_BUFFER = Buffer.from([137, 80, 78, 71]); // PNG magic bytes

export const USER: WgUser = {
  Identifier: "uid-1234567",
  Email: "test@test.com",
  Firstname: "Max",
  Lastname: "Muster",
  Phone: "+1234546789",
  Department: "Software Development",
  Notes: "some sample notes",
  IsAdmin: false,
  Disabled: false,
  DisabledReason: "",
  Locked: false,
  LockedReason: "",
  ApiEnabled: false,
  AuthSources: ["db"],
  PeerCount: 2,
};

export const USER_ADMIN: WgUser = {
  ...USER,
  Identifier: "uid-admin",
  Email: "admin@wgportal.local",
  IsAdmin: true,
  ApiEnabled: true,
};

export const USER_LIST: WgUser[] = [USER, USER_ADMIN];

export const USER_INFORMATION: UserInformation = {
  UserIdentifier: "uid-1234567",
  PeerCount: 2,
  Peers: [
    {
      Identifier: "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
      InterfaceIdentifier: "wg0",
      DisplayName: "My iPhone",
      IpAddresses: ["10.11.12.2/24"],
      IsDisabled: false,
    },
    {
      Identifier: "peer2pubkey==",
      InterfaceIdentifier: "wg0",
      DisplayName: "My Laptop",
      IpAddresses: ["10.11.12.3/24"],
      IsDisabled: false,
    },
  ],
};

export const INTERFACE_METRICS: InterfaceMetrics = {
  InterfaceIdentifier: "wg0",
  BytesReceived: 123456789,
  BytesTransmitted: 987654321,
};

export const PEER_METRICS: PeerMetrics = {
  PeerIdentifier: "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
  BytesReceived: 1000,
  BytesTransmitted: 2000,
  Endpoint: "12.34.56.78",
  LastHandshake: "2026-06-20T14:00:00Z",
  LastPing: "2026-06-20T14:01:00Z",
  LastSessionStart: "2026-06-20T13:00:00Z",
  IsPingable: true,
};

export const USER_METRICS: UserMetrics = {
  UserIdentifier: "uid-1234567",
  BytesReceived: 11000,
  BytesTransmitted: 22000,
  PeerCount: 2,
  PeerMetrics: [PEER_METRICS],
};

export const API_ERROR_401: ApiError = {
  Code: 401,
  Message: "Unauthorized",
  Details: "invalid credentials",
};

export const API_ERROR_403: ApiError = {
  Code: 403,
  Message: "Forbidden",
  Details: "insufficient permissions",
};

export const API_ERROR_404: ApiError = {
  Code: 404,
  Message: "Not Found",
  Details: "resource not found",
};

export const API_ERROR_409: ApiError = {
  Code: 409,
  Message: "Conflict",
  Details: "resource already exists",
};

export const API_ERROR_500: ApiError = {
  Code: 500,
  Message: "Internal Server Error",
  Details: "unexpected error occurred",
};
