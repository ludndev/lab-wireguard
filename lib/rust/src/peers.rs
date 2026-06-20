use crate::http::{HttpClient, WgPortalError};
use crate::models::WgPeer;

pub struct PeersApi<'a> {
    http: &'a HttpClient,
}

impl<'a> PeersApi<'a> {
    pub(crate) fn new(http: &'a HttpClient) -> Self {
        Self { http }
    }

    pub fn get_by_id(&self, id: &str) -> Result<WgPeer, WgPortalError> {
        self.http.get(&format!("/peer/by-id/{}", id), None)
    }

    pub fn get_by_interface(&self, interface_id: &str) -> Result<Vec<WgPeer>, WgPortalError> {
        self.http
            .get(&format!("/peer/by-interface/{}", interface_id), None)
    }

    pub fn get_by_user(&self, user_id: &str) -> Result<Vec<WgPeer>, WgPortalError> {
        self.http.get(&format!("/peer/by-user/{}", user_id), None)
    }

    pub fn prepare(&self, interface_id: &str) -> Result<WgPeer, WgPortalError> {
        self.http
            .get(&format!("/peer/prepare/{}", interface_id), None)
    }

    pub fn create(&self, data: &WgPeer) -> Result<WgPeer, WgPortalError> {
        self.http.post("/peer/new", data)
    }

    pub fn update(&self, id: &str, data: &WgPeer) -> Result<WgPeer, WgPortalError> {
        self.http.put(&format!("/peer/by-id/{}", id), data)
    }

    pub fn delete(&self, id: &str) -> Result<(), WgPortalError> {
        self.http.delete(&format!("/peer/by-id/{}", id))
    }
}
