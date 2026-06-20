from typing import List, Optional, TypedDict


class ConfigOption(TypedDict, total=False):
    Value: object
    Overridable: bool


# ── Interfaces ───────────────────────────────────────────────────────────────

class _WgInterfaceRequired(TypedDict):
    Identifier: str
    Mode: str
    PrivateKey: str
    PublicKey: str


class WgInterface(_WgInterfaceRequired, total=False):
    DisplayName: str
    Addresses: List[str]
    Dns: List[str]
    DnsSearch: List[str]
    ListenPort: int
    Mtu: int
    FirewallMark: int
    RoutingTable: str
    PreUp: str
    PostUp: str
    PreDown: str
    PostDown: str
    SaveConfig: bool
    Disabled: bool
    DisabledReason: str
    Filename: str
    TotalPeers: int
    EnabledPeers: int
    PeerDefAllowedIPs: List[str]
    PeerDefDns: List[str]
    PeerDefDnsSearch: List[str]
    PeerDefEndpoint: str
    PeerDefFirewallMark: int
    PeerDefMtu: int
    PeerDefNetwork: List[str]
    PeerDefPersistentKeepalive: int
    PeerDefPreUp: str
    PeerDefPostUp: str
    PeerDefPreDown: str
    PeerDefPostDown: str
    PeerDefRoutingTable: str


# ── Peers ────────────────────────────────────────────────────────────────────

class _WgPeerRequired(TypedDict):
    Identifier: str
    InterfaceIdentifier: str
    PrivateKey: str


class WgPeer(_WgPeerRequired, total=False):
    PublicKey: str
    UserIdentifier: str
    DisplayName: str
    Mode: str
    Addresses: List[str]
    AllowedIPs: ConfigOption
    PresharedKey: str
    Dns: ConfigOption
    DnsSearch: ConfigOption
    Endpoint: ConfigOption
    EndpointPublicKey: ConfigOption
    Mtu: ConfigOption
    FirewallMark: ConfigOption
    RoutingTable: ConfigOption
    PersistentKeepalive: ConfigOption
    PreUp: ConfigOption
    PostUp: ConfigOption
    PreDown: ConfigOption
    PostDown: ConfigOption
    ExpiresAt: str
    ExtraAllowedIPs: List[str]
    CheckAliveAddress: str
    Notes: str
    Disabled: bool
    DisabledReason: str
    Filename: str


# ── Users ────────────────────────────────────────────────────────────────────

class _WgUserRequired(TypedDict):
    Identifier: str


class WgUser(_WgUserRequired, total=False):
    Email: str
    Firstname: str
    Lastname: str
    Phone: str
    Department: str
    Notes: str
    Password: str
    ApiToken: str
    IsAdmin: bool
    Disabled: bool
    DisabledReason: str
    Locked: bool
    LockedReason: str
    ApiEnabled: bool
    AuthSources: List[str]
    PeerCount: int


# ── Provisioning ─────────────────────────────────────────────────────────────

class _ProvisioningRequestRequired(TypedDict):
    InterfaceIdentifier: str


class ProvisioningRequest(_ProvisioningRequestRequired, total=False):
    DisplayName: str
    PublicKey: str
    PresharedKey: str
    UserIdentifier: str


class UserInformationPeer(TypedDict, total=False):
    Identifier: str
    InterfaceIdentifier: str
    DisplayName: str
    IpAddresses: List[str]
    IsDisabled: bool


class _UserInformationRequired(TypedDict):
    UserIdentifier: str
    PeerCount: int
    Peers: List[UserInformationPeer]


class UserInformation(_UserInformationRequired, total=False):
    pass


# ── Metrics ──────────────────────────────────────────────────────────────────

class _InterfaceMetricsRequired(TypedDict):
    InterfaceIdentifier: str
    BytesReceived: int
    BytesTransmitted: int


class InterfaceMetrics(_InterfaceMetricsRequired, total=False):
    pass


class PeerMetrics(TypedDict, total=False):
    PeerIdentifier: str
    BytesReceived: int
    BytesTransmitted: int
    Endpoint: str
    LastHandshake: str
    LastPing: str
    LastSessionStart: str
    IsPingable: bool


class _UserMetricsRequired(TypedDict):
    UserIdentifier: str
    BytesReceived: int
    BytesTransmitted: int
    PeerCount: int
    PeerMetrics: List[PeerMetrics]


class UserMetrics(_UserMetricsRequired, total=False):
    pass


# ── API error ────────────────────────────────────────────────────────────────

class _ApiErrorRequired(TypedDict):
    Code: int
    Message: str
    Details: str


class ApiError(_ApiErrorRequired, total=False):
    pass
