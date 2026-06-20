use crate::http::{HttpClient, WgPortalError};
use crate::models::{InterfaceMetrics, PeerMetrics, UserMetrics};

pub struct MetricsApi<'a> {
    http: &'a HttpClient,
}

impl<'a> MetricsApi<'a> {
    pub(crate) fn new(http: &'a HttpClient) -> Self {
        Self { http }
    }

    pub fn by_interface(&self, interface_id: &str) -> Result<InterfaceMetrics, WgPortalError> {
        self.http
            .get(&format!("/metrics/by-interface/{}", interface_id), None)
    }

    pub fn by_peer(&self, peer_id: &str) -> Result<PeerMetrics, WgPortalError> {
        self.http
            .get(&format!("/metrics/by-peer/{}", peer_id), None)
    }

    pub fn by_user(&self, user_id: &str) -> Result<UserMetrics, WgPortalError> {
        self.http
            .get(&format!("/metrics/by-user/{}", user_id), None)
    }
}
