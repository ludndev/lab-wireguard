use serde::{Deserialize, Serialize};

/// A configuration option that can be overridden by peers.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ConfigOption<T> {
    pub value: T,
    pub overridable: bool,
}

// ── Interfaces ───────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct WgInterface {
    pub identifier: String,
    pub mode: String,
    pub private_key: String,
    pub public_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub addresses: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dns: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dns_search: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub listen_port: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mtu: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub firewall_mark: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub routing_table: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pre_up: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_up: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pre_down: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_down: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub save_config: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_peers: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled_peers: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_allowed_i_ps: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_dns: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_dns_search: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_endpoint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_firewall_mark: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_mtu: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_network: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_persistent_keepalive: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_pre_up: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_post_up: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_pre_down: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_post_down: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_def_routing_table: Option<String>,
}

// ── Peers ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct WgPeer {
    pub identifier: String,
    pub interface_identifier: String,
    pub private_key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_identifier: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub addresses: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allowed_i_ps: Option<ConfigOption<Vec<String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preshared_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dns: Option<ConfigOption<Vec<String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dns_search: Option<ConfigOption<Vec<String>>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoint_public_key: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mtu: Option<ConfigOption<i64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub firewall_mark: Option<ConfigOption<i64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub routing_table: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub persistent_keepalive: Option<ConfigOption<i64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pre_up: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_up: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pre_down: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub post_down: Option<ConfigOption<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra_allowed_i_ps: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub check_alive_address: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filename: Option<String>,
}

// ── Users ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct WgUser {
    pub identifier: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub email: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub firstname: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lastname: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phone: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub department: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_admin: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locked: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub locked_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth_sources: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub peer_count: Option<i64>,
}

// ── Provisioning ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct ProvisioningRequest {
    pub interface_identifier: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub public_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preshared_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_identifier: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct UserInformationPeer {
    pub identifier: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_identifier: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ip_addresses: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_disabled: Option<bool>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct UserInformation {
    pub user_identifier: String,
    pub peer_count: i64,
    pub peers: Vec<UserInformationPeer>,
}

// ── Metrics ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct InterfaceMetrics {
    pub interface_identifier: String,
    pub bytes_received: i64,
    pub bytes_transmitted: i64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct PeerMetrics {
    pub peer_identifier: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bytes_received: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bytes_transmitted: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub endpoint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_handshake: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_ping: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_session_start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_pingable: Option<bool>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct UserMetrics {
    pub user_identifier: String,
    pub bytes_received: i64,
    pub bytes_transmitted: i64,
    pub peer_count: i64,
    pub peer_metrics: Vec<PeerMetrics>,
}

// ── API error ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub(crate) struct ApiError {
    pub code: i32,
    pub message: String,
    pub details: String,
}
