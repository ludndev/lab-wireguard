use mockito::Server;
use serde_json::json;
use wg_portal_client::{WgUser, WgPortalClient};

fn setup() -> (mockito::ServerGuard, WgPortalClient) {
    let server = Server::new();
    let client = WgPortalClient::new(&server.url(), "admin@wgportal.local", "test-token");
    (server, client)
}

fn fixture_user() -> serde_json::Value {
    json!({
        "Identifier": "uid-1234567",
        "Email": "test@test.com",
        "Firstname": "Max",
        "Lastname": "Muster",
        "IsAdmin": false,
        "ApiEnabled": false,
        "PeerCount": 2
    })
}

fn fixture_user_list() -> serde_json::Value {
    json!([fixture_user(), {
        "Identifier": "uid-admin",
        "Email": "admin@wgportal.local",
        "IsAdmin": true,
        "ApiEnabled": true
    }])
}

#[test]
fn get_all() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/user/all")
        .with_body(fixture_user_list().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.users().get_all().unwrap();
    assert_eq!(result.len(), 2);
    assert_eq!(result[0].identifier, "uid-1234567");
    mock.assert();
}

#[test]
fn get_by_id() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/user/by-id/uid-1234567")
        .with_body(fixture_user().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.users().get_by_id("uid-1234567").unwrap();
    assert_eq!(result.email.as_deref(), Some("test@test.com"));
    mock.assert();
}

#[test]
fn create_user() {
    let (mut server, client) = setup();
    let mock = server
        .mock("POST", "/api/v1/user/new")
        .with_body(fixture_user().to_string())
        .with_header("content-type", "application/json")
        .create();

    let data: WgUser = serde_json::from_value(fixture_user()).unwrap();
    let result = client.users().create(&data).unwrap();
    assert_eq!(result.identifier, "uid-1234567");
    mock.assert();
}

#[test]
fn delete_user() {
    let (mut server, client) = setup();
    let mock = server
        .mock("DELETE", "/api/v1/user/by-id/uid-1234567")
        .with_status(204)
        .create();

    client.users().delete("uid-1234567").unwrap();
    mock.assert();
}
