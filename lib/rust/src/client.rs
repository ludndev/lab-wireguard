use crate::http::HttpClient;
use crate::interfaces::InterfacesApi;
use crate::metrics::MetricsApi;
use crate::peers::PeersApi;
use crate::provisioning::ProvisioningApi;
use crate::users::UsersApi;

/// Synchronous client for the WireGuard Portal v2 REST API.
///
/// ```no_run
/// use wg_portal_client::WgPortalClient;
///
/// let client = WgPortalClient::new(
///     "http://192.168.1.100:8888",
///     "admin@wgportal.local",
///     "your-api-token",
/// );
/// let interfaces = client.interfaces().get_all().unwrap();
/// ```
pub struct WgPortalClient {
    http: HttpClient,
}

impl WgPortalClient {
    pub fn new(base_url: &str, username: &str, api_token: &str) -> Self {
        Self {
            http: HttpClient::new(base_url, username, api_token),
        }
    }

    pub fn interfaces(&self) -> InterfacesApi<'_> {
        InterfacesApi::new(&self.http)
    }

    pub fn peers(&self) -> PeersApi<'_> {
        PeersApi::new(&self.http)
    }

    pub fn provisioning(&self) -> ProvisioningApi<'_> {
        ProvisioningApi::new(&self.http)
    }

    pub fn users(&self) -> UsersApi<'_> {
        UsersApi::new(&self.http)
    }

    pub fn metrics(&self) -> MetricsApi<'_> {
        MetricsApi::new(&self.http)
    }
}
