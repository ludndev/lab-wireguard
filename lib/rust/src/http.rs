use base64::Engine;
use log::{debug, error};
use reqwest::blocking::{Client, Response};
use thiserror::Error;

use crate::models::ApiError;

/// Raised on non-2xx API responses.
#[derive(Debug, Error)]
#[error("{message} (code: {code})")]
pub struct WgPortalError {
    pub code: i32,
    pub message: String,
    pub details: String,
}

/// HTTP transport with Basic auth and structured logging.
pub struct HttpClient {
    base_url: String,
    auth_header: String,
    client: Client,
}

impl HttpClient {
    pub fn new(base_url: &str, username: &str, api_token: &str) -> Self {
        let base_url = format!("{}/api/v1", base_url.trim_end_matches('/'));
        let credentials = format!("{}:{}", username, api_token);
        let auth_header = format!(
            "Basic {}",
            base64::engine::general_purpose::STANDARD.encode(credentials.as_bytes())
        );

        Self {
            base_url,
            auth_header,
            client: Client::new(),
        }
    }

    fn auth_headers(&self) -> reqwest::header::HeaderMap {
        let mut h = reqwest::header::HeaderMap::new();
        h.insert(
            reqwest::header::AUTHORIZATION,
            reqwest::header::HeaderValue::from_str(&self.auth_header).unwrap(),
        );
        h
    }

    fn json_headers(&self) -> reqwest::header::HeaderMap {
        let mut h = self.auth_headers();
        h.insert(
            reqwest::header::CONTENT_TYPE,
            reqwest::header::HeaderValue::from_static("application/json"),
        );
        h
    }

    pub fn get<T: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        params: Option<&[(&str, &str)]>,
    ) -> Result<T, WgPortalError> {
        let url = format!("{}{}", self.base_url, path);
        debug!("→ GET {}", url);

        let mut req = self.client.get(&url).headers(self.auth_headers());
        if let Some(p) = params {
            req = req.query(&p.iter().map(|&(k, v)| (k, v)).collect::<Vec<_>>());
        }

        let res = req.send().map_err(|e| WgPortalError {
            code: 0,
            message: format!("request failed: {}", e),
            details: String::new(),
        })?;

        Self::parse_json("GET", &url, res)
    }

    pub fn get_raw(
        &self,
        path: &str,
        params: Option<&[(&str, &str)]>,
    ) -> Result<Vec<u8>, WgPortalError> {
        let url = format!("{}{}", self.base_url, path);
        debug!("→ GET {}", url);

        let mut req = self.client.get(&url).headers(self.auth_headers());
        if let Some(p) = params {
            req = req.query(&p.iter().map(|&(k, v)| (k, v)).collect::<Vec<_>>());
        }

        let res = req.send().map_err(|e| WgPortalError {
            code: 0,
            message: format!("request failed: {}", e),
            details: String::new(),
        })?;

        let status = res.status();
        if status.is_client_error() || status.is_server_error() {
            let err: ApiError = res.json().map_err(|e| WgPortalError {
                code: status.as_u16() as i32,
                message: format!("failed to parse error body: {}", e),
                details: String::new(),
            })?;
            error!("✗ GET {} [{}] {:?}", url, status, err);
            return Err(WgPortalError {
                code: err.code,
                message: err.message,
                details: err.details,
            });
        }
        debug!("✓ GET {} [{}]", url, status);

        let bytes = res.bytes().map_err(|e| WgPortalError {
            code: 0,
            message: format!("failed to read body: {}", e),
            details: String::new(),
        })?;
        Ok(bytes.to_vec())
    }

    pub fn post<T: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        body: &impl serde::Serialize,
    ) -> Result<T, WgPortalError> {
        let url = format!("{}{}", self.base_url, path);
        debug!("→ POST {}", url);

        let res = self
            .client
            .post(&url)
            .headers(self.json_headers())
            .json(body)
            .send()
            .map_err(|e| WgPortalError {
                code: 0,
                message: format!("request failed: {}", e),
                details: String::new(),
            })?;

        Self::parse_json("POST", &url, res)
    }

    pub fn put<T: serde::de::DeserializeOwned>(
        &self,
        path: &str,
        body: &impl serde::Serialize,
    ) -> Result<T, WgPortalError> {
        let url = format!("{}{}", self.base_url, path);
        debug!("→ PUT {}", url);

        let res = self
            .client
            .put(&url)
            .headers(self.json_headers())
            .json(body)
            .send()
            .map_err(|e| WgPortalError {
                code: 0,
                message: format!("request failed: {}", e),
                details: String::new(),
            })?;

        Self::parse_json("PUT", &url, res)
    }

    pub fn delete(&self, path: &str) -> Result<(), WgPortalError> {
        let url = format!("{}{}", self.base_url, path);
        debug!("→ DELETE {}", url);

        let res = self
            .client
            .delete(&url)
            .headers(self.auth_headers())
            .send()
            .map_err(|e| WgPortalError {
                code: 0,
                message: format!("request failed: {}", e),
                details: String::new(),
            })?;

        let status = res.status();
        if status.is_client_error() || status.is_server_error() {
            let err: ApiError = res.json().map_err(|e| WgPortalError {
                code: status.as_u16() as i32,
                message: format!("failed to parse error body: {}", e),
                details: String::new(),
            })?;
            error!("✗ DELETE {} [{}] {:?}", url, status, err);
            return Err(WgPortalError {
                code: err.code,
                message: err.message,
                details: err.details,
            });
        }
        debug!("✓ DELETE {} [{}]", url, status);
        Ok(())
    }

    fn parse_json<T: serde::de::DeserializeOwned>(
        method: &str,
        url: &str,
        res: Response,
    ) -> Result<T, WgPortalError> {
        let status = res.status();

        if status.is_client_error() || status.is_server_error() {
            let err: ApiError = res.json().map_err(|e| WgPortalError {
                code: status.as_u16() as i32,
                message: format!("failed to parse error body: {}", e),
                details: String::new(),
            })?;
            error!("✗ {} {} [{}] {:?}", method, url, status, err);
            return Err(WgPortalError {
                code: err.code,
                message: err.message,
                details: err.details,
            });
        }
        debug!("✓ {} {} [{}]", method, url, status);

        res.json().map_err(|e| WgPortalError {
            code: 0,
            message: format!("failed to parse response: {}", e),
            details: String::new(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const USERNAME: &str = "admin@wgportal.local";
    const API_TOKEN: &str = "test-api-token";

    fn make_client(base_url: &str) -> HttpClient {
        HttpClient::new(base_url, USERNAME, API_TOKEN)
    }

    #[test]
    fn sets_basic_auth_on_get() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/api/v1/interface/all")
            .match_header(
                "authorization",
                "Basic YWRtaW5Ad2dwb3J0YWwubG9jYWw6dGVzdC1hcGktdG9rZW4=",
            )
            .with_body("[]")
            .with_header("content-type", "application/json")
            .create();
        let _ = make_client(&server.url()).get::<serde_json::Value>("/interface/all", None);
        mock.assert();
    }

    #[test]
    fn strips_trailing_slash_from_base_url() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/api/v1/interface/all")
            .with_body("[]")
            .with_header("content-type", "application/json")
            .create();
        let client = HttpClient::new(&format!("{}/", server.url()), USERNAME, API_TOKEN);
        let _ = client.get::<serde_json::Value>("/interface/all", None);
        mock.assert();
    }

    #[test]
    fn appends_query_params() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/api/v1/provisioning/data/peer-config")
            .match_query(mockito::Matcher::AllOf(vec![
                mockito::Matcher::UrlEncoded("PeerId".into(), "abc123".into()),
            ]))
            .with_body("{}")
            .with_header("content-type", "application/json")
            .create();
        let _ = make_client(&server.url())
            .get::<serde_json::Value>("/provisioning/data/peer-config", Some(&[("PeerId", "abc123")]));
        mock.assert();
    }

    #[test]
    fn post_sends_json_body() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("POST", "/api/v1/interface/new")
            .match_body(mockito::Matcher::JsonString(
                r#"{"identifier":"wg0","mode":"server","private_key":"k","public_key":"k"}"#.into(),
            ))
            .with_body("{}")
            .with_header("content-type", "application/json")
            .create();
        let body = serde_json::json!({"identifier": "wg0", "mode": "server", "private_key": "k", "public_key": "k"});
        let _ = make_client(&server.url()).post::<serde_json::Value>("/interface/new", &body);
        mock.assert();
    }

    #[test]
    fn delete_resolves_on_204() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("DELETE", "/api/v1/interface/by-id/wg0")
            .with_status(204)
            .create();
        let _ = make_client(&server.url()).delete("/interface/by-id/wg0");
        mock.assert();
    }

    #[test]
    fn get_raw_returns_bytes() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/api/v1/provisioning/data/peer-qr")
            .match_query(mockito::Matcher::AllOf(vec![
                mockito::Matcher::UrlEncoded("PeerId".into(), "abc".into()),
            ]))
            .with_body(vec![137, 80, 78, 71])
            .create();
        let result = make_client(&server.url())
            .get_raw("/provisioning/data/peer-qr", Some(&[("PeerId", "abc")]))
            .unwrap();
        assert_eq!(result, vec![137, 80, 78, 71]);
        mock.assert();
    }

    #[test]
    fn throws_wg_portal_error_on_401() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/api/v1/interface/all")
            .with_status(401)
            .with_body(r#"{"Code":401,"Message":"Unauthorized","Details":"invalid credentials"}"#)
            .with_header("content-type", "application/json")
            .create();
        let err = make_client(&server.url())
            .get::<serde_json::Value>("/interface/all", None)
            .unwrap_err();
        assert_eq!(err.code, 401);
        assert_eq!(err.message, "Unauthorized");
        mock.assert();
    }

    #[test]
    fn wg_portal_error_has_correct_details() {
        let mut server = mockito::Server::new();
        let mock = server
            .mock("GET", "/api/v1/interface/all")
            .with_status(500)
            .with_body(r#"{"Code":500,"Message":"Internal Server Error","Details":"unexpected error occurred"}"#)
            .with_header("content-type", "application/json")
            .create();
        let err = make_client(&server.url())
            .get::<serde_json::Value>("/interface/all", None)
            .unwrap_err();
        assert_eq!(err.details, "unexpected error occurred");
        mock.assert();
    }
}
