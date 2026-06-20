use mockito::Server;
use wg_portal_client::{WgInterface, WgPortalClient};

fn setup() -> (mockito::ServerGuard, WgPortalClient) {
    let server = Server::new();
    let client = WgPortalClient::new(
        &server.url(),
        "admin@wgportal.local",
        "test-token",
    );
    (server, client)
}

fn fixture_interface() -> serde_json::Value {
    serde_json::json!({
        "Identifier": "wg0",
        "Mode": "server",
        "PrivateKey": "gI6EdUSYvn8ugXOt8QQD6Yc+JyiZxIhp3GInSWRfWGE=",
        "PublicKey": "HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=",
        "DisplayName": "My Interface",
        "Disabled": false
    })
}

fn fixture_interface_list() -> serde_json::Value {
    serde_json::json!([
        fixture_interface(),
        {
            "Identifier": "wg1",
            "Mode": "server",
            "PrivateKey": "gI6EdUSYvn8ugXOt8QQD6Yc+JyiZxIhp3GInSWRfWGE=",
            "PublicKey": "HIgo9xNzJMWLKASShiTqIybxZ0U3wGLiUeJ1PKf8ykw=",
            "DisplayName": "Second Interface"
        }
    ])
}

#[test]
fn get_all_returns_interfaces() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/interface/all")
        .with_body(fixture_interface_list().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.interfaces().get_all().unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].identifier, "wg0");
    mock.assert();
}

#[test]
fn get_all_empty() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/interface/all")
        .with_body("[]")
        .with_header("content-type", "application/json")
        .create();

    let result = client.interfaces().get_all().unwrap();
    assert!(result.is_empty());
    mock.assert();
}

#[test]
fn get_by_id() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/interface/by-id/wg0")
        .with_body(fixture_interface().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.interfaces().get_by_id("wg0").unwrap();
    assert_eq!(result.identifier, "wg0");
    assert_eq!(result.mode, "server");
    mock.assert();
}

#[test]
fn create_interface() {
    let (mut server, client) = setup();
    let mock = server
        .mock("POST", "/api/v1/interface/new")
        .with_body(fixture_interface().to_string())
        .with_header("content-type", "application/json")
        .create();

    let data: WgInterface = serde_json::from_value(fixture_interface()).unwrap();
    let result = client.interfaces().create(&data).unwrap();
    assert_eq!(result.identifier, "wg0");
    mock.assert();
}

#[test]
fn delete_interface() {
    let (mut server, client) = setup();
    let mock = server
        .mock("DELETE", "/api/v1/interface/by-id/wg0")
        .with_status(204)
        .create();

    client.interfaces().delete("wg0").unwrap();
    mock.assert();
}

#[test]
fn get_by_id_throws_on_404() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/interface/by-id/nonexistent")
        .with_status(404)
        .with_body(r#"{"Code":404,"Message":"Not Found","Details":"resource not found"}"#)
        .with_header("content-type", "application/json")
        .create();

    let err = client.interfaces().get_by_id("nonexistent").unwrap_err();
    assert_eq!(err.code, 404);
    mock.assert();
}
