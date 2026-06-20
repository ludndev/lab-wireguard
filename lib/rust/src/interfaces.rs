use crate::http::{HttpClient, WgPortalError};
use crate::models::WgInterface;

pub struct InterfacesApi<'a> {
    http: &'a HttpClient,
}

impl<'a> InterfacesApi<'a> {
    pub(crate) fn new(http: &'a HttpClient) -> Self {
        Self { http }
    }

    pub fn get_all(&self) -> Result<Vec<WgInterface>, WgPortalError> {
        self.http.get("/interface/all", None)
    }

    pub fn get_by_id(&self, id: &str) -> Result<WgInterface, WgPortalError> {
        self.http.get(&format!("/interface/by-id/{}", id), None)
    }

    pub fn prepare(&self) -> Result<WgInterface, WgPortalError> {
        self.http.get("/interface/prepare", None)
    }

    pub fn create(&self, data: &WgInterface) -> Result<WgInterface, WgPortalError> {
        self.http.post("/interface/new", data)
    }

    pub fn update(&self, id: &str, data: &WgInterface) -> Result<WgInterface, WgPortalError> {
        self.http.put(&format!("/interface/by-id/{}", id), data)
    }

    pub fn delete(&self, id: &str) -> Result<(), WgPortalError> {
        self.http.delete(&format!("/interface/by-id/{}", id))
    }
}
