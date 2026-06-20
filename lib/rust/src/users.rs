use crate::http::{HttpClient, WgPortalError};
use crate::models::WgUser;

pub struct UsersApi<'a> {
    http: &'a HttpClient,
}

impl<'a> UsersApi<'a> {
    pub(crate) fn new(http: &'a HttpClient) -> Self {
        Self { http }
    }

    pub fn get_all(&self) -> Result<Vec<WgUser>, WgPortalError> {
        self.http.get("/user/all", None)
    }

    pub fn get_by_id(&self, id: &str) -> Result<WgUser, WgPortalError> {
        self.http.get(&format!("/user/by-id/{}", id), None)
    }

    pub fn create(&self, data: &WgUser) -> Result<WgUser, WgPortalError> {
        self.http.post("/user/new", data)
    }

    pub fn update(&self, id: &str, data: &WgUser) -> Result<WgUser, WgPortalError> {
        self.http.put(&format!("/user/by-id/{}", id), data)
    }

    pub fn delete(&self, id: &str) -> Result<(), WgPortalError> {
        self.http.delete(&format!("/user/by-id/{}", id))
    }
}
