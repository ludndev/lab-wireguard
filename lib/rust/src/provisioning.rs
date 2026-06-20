use crate::http::{HttpClient, WgPortalError};
use crate::models::{ProvisioningRequest, UserInformation, WgPeer};

pub struct ProvisioningApi<'a> {
    http: &'a HttpClient,
}

impl<'a> ProvisioningApi<'a> {
    pub(crate) fn new(http: &'a HttpClient) -> Self {
        Self { http }
    }

    pub fn new_peer(&self, request: &ProvisioningRequest) -> Result<WgPeer, WgPortalError> {
        self.http.post("/provisioning/new-peer", request)
    }

    pub fn get_peer_config(&self, peer_id: &str) -> Result<String, WgPortalError> {
        let raw = self
            .http
            .get_raw("/provisioning/data/peer-config", Some(&[("PeerId", peer_id)]))?;
        String::from_utf8(raw).map_err(|e| WgPortalError {
            code: 0,
            message: format!("invalid UTF-8 in config: {}", e),
            details: String::new(),
        })
    }

    pub fn get_peer_qr_code(&self, peer_id: &str) -> Result<Vec<u8>, WgPortalError> {
        self.http
            .get_raw("/provisioning/data/peer-qr", Some(&[("PeerId", peer_id)]))
    }

    pub fn get_user_info(
        &self,
        user_id: Option<&str>,
        email: Option<&str>,
    ) -> Result<UserInformation, WgPortalError> {
        let params: Vec<(&str, &str)> = if let Some(uid) = user_id {
            vec![("UserId", uid)]
        } else if let Some(em) = email {
            vec![("Email", em)]
        } else {
            vec![]
        };
        self.http.get("/provisioning/data/user-info", Some(&params))
    }
}
