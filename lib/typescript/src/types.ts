export interface ConfigOption<T> {
  Value: T;
  Overridable: boolean;
}

export type InterfaceMode = "server" | "client" | "any";
export type AuthSource = "db" | "ldap" | "oauth";

export interface WgInterface {
  Identifier: string;
  Mode: InterfaceMode;
  PrivateKey: string;
  PublicKey: string;
  DisplayName?: string;
  Addresses?: string[];
  Dns?: string[];
  DnsSearch?: string[];
  ListenPort?: number;
  Mtu?: number;
  FirewallMark?: number;
  RoutingTable?: string;
  PreUp?: string;
  PostUp?: string;
  PreDown?: string;
  PostDown?: string;
  SaveConfig?: boolean;
  Disabled?: boolean;
  DisabledReason?: string;
  /** @readonly */
  Filename?: string;
  /** @readonly */
  TotalPeers?: number;
  /** @readonly */
  EnabledPeers?: number;
  PeerDefAllowedIPs?: string[];
  PeerDefDns?: string[];
  PeerDefDnsSearch?: string[];
  PeerDefEndpoint?: string;
  PeerDefFirewallMark?: number;
  PeerDefMtu?: number;
  PeerDefNetwork?: string[];
  PeerDefPersistentKeepalive?: number;
  PeerDefPreUp?: string;
  PeerDefPostUp?: string;
  PeerDefPreDown?: string;
  PeerDefPostDown?: string;
  PeerDefRoutingTable?: string;
}

export interface WgPeer {
  Identifier: string;
  InterfaceIdentifier: string;
  PrivateKey: string;
  PublicKey?: string;
  UserIdentifier?: string;
  DisplayName?: string;
  Mode?: InterfaceMode;
  Addresses?: string[];
  AllowedIPs?: ConfigOption<string[]>;
  PresharedKey?: string;
  Dns?: ConfigOption<string[]>;
  DnsSearch?: ConfigOption<string[]>;
  Endpoint?: ConfigOption<string>;
  EndpointPublicKey?: ConfigOption<string>;
  Mtu?: ConfigOption<number>;
  FirewallMark?: ConfigOption<number>;
  RoutingTable?: ConfigOption<string>;
  PersistentKeepalive?: ConfigOption<number>;
  PreUp?: ConfigOption<string>;
  PostUp?: ConfigOption<string>;
  PreDown?: ConfigOption<string>;
  PostDown?: ConfigOption<string>;
  ExpiresAt?: string;
  ExtraAllowedIPs?: string[];
  CheckAliveAddress?: string;
  Notes?: string;
  Disabled?: boolean;
  DisabledReason?: string;
  /** @readonly */
  Filename?: string;
}

export interface WgUser {
  Identifier: string;
  Email?: string;
  Firstname?: string;
  Lastname?: string;
  Phone?: string;
  Department?: string;
  Notes?: string;
  Password?: string;
  ApiToken?: string;
  IsAdmin?: boolean;
  Disabled?: boolean;
  DisabledReason?: string;
  Locked?: boolean;
  LockedReason?: string;
  /** @readonly */
  ApiEnabled?: boolean;
  /** @readonly */
  AuthSources?: AuthSource[];
  /** @readonly */
  PeerCount?: number;
}

export interface ProvisioningRequest {
  InterfaceIdentifier: string;
  DisplayName?: string;
  PublicKey?: string;
  PresharedKey?: string;
  UserIdentifier?: string;
}

export interface UserInformationPeer {
  Identifier: string;
  InterfaceIdentifier: string;
  DisplayName?: string;
  IpAddresses?: string[];
  IsDisabled?: boolean;
}

export interface UserInformation {
  UserIdentifier: string;
  PeerCount: number;
  Peers: UserInformationPeer[];
}

export interface InterfaceMetrics {
  InterfaceIdentifier: string;
  BytesReceived: number;
  BytesTransmitted: number;
}

export interface PeerMetrics {
  PeerIdentifier: string;
  BytesReceived: number;
  BytesTransmitted: number;
  Endpoint?: string;
  LastHandshake?: string;
  LastPing?: string;
  LastSessionStart?: string;
  IsPingable?: boolean;
}

export interface UserMetrics {
  UserIdentifier: string;
  BytesReceived: number;
  BytesTransmitted: number;
  PeerCount: number;
  PeerMetrics: PeerMetrics[];
}

export interface ApiError {
  Code: number;
  Message: string;
  Details: string;
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

export interface WgPortalClientOptions {
  baseUrl: string;
  username: string;
  apiToken: string;
  logger?: Logger;
}
