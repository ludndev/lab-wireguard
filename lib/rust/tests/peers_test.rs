use mockito::Server;
use serde_json::json;
use wg_portal_client::{WgPeer, WgPortalClient};

fn setup() -> (mockito::ServerGuard, WgPortalClient) {
    let server = Server::new();
    let client = WgPortalClient::new(&server.url(), "admin@wgportal.local", "test-token");
    (server, client)
}

const PEER_ID: &str = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=";

fn fixture_peer() -> serde_json::Value {
    json!({
        "Identifier": PEER_ID,
        "InterfaceIdentifier": "wg0",
        "PrivateKey": "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
        "PublicKey": "TrMvSoP4jYQlY6RIzBgbssQqY3vxI2Pi+y71lOWWXX0=",
        "DisplayName": "My Peer",
        "UserIdentifier": "uid-1234567"
    })
}

fn fixture_peer_list() -> serde_json::Value {
    json!([fixture_peer(), {
        "Identifier": "peer2pubkey==",
        "InterfaceIdentifier": "wg0",
        "PrivateKey": "k",
        "DisplayName": "Second Peer"
    }])
}

#[test]
fn get_by_id() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", format!("/api/v1/peer/by-id/{}", PEER_ID).as_str())
        .with_body(fixture_peer().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.peers().get_by_id(PEER_ID).unwrap();
    assert_eq!(result.identifier, PEER_ID);
    assert_eq!(result.interface_identifier, "wg0");
    mock.assert();
}

#[test]
fn get_by_interface() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/peer/by-interface/wg0")
        .with_body(fixture_peer_list().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.peers().get_by_interface("wg0").unwrap();
    assert_eq!(result.len(), 2);
    mock.assert();
}

#[test]
fn get_by_user() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/peer/by-user/uid-1234567")
        .with_body(fixture_peer_list().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client.peers().get_by_user("uid-1234567").unwrap();
    assert_eq!(result.len(), 2);
    mock.assert();
}

#[test]
fn create_peer() {
    let (mut server, client) = setup();
    let mock = server
        .mock("POST", "/api/v1/peer/new")
        .with_body(fixture_peer().to_string())
        .with_header("content-type", "application/json")
        .create();

    let data: WgPeer = serde_json::from_value(fixture_peer()).unwrap();
    let result = client.peers().create(&data).unwrap();
    assert_eq!(result.identifier, PEER_ID);
    mock.assert();
}

#[test]
fn delete_peer() {
    let (mut server, client) = setup();
    let mock = server
        .mock("DELETE", format!("/api/v1/peer/by-id/{}", PEER_ID).as_str())
        .with_status(204)
        .create();

    client.peers().delete(PEER_ID).unwrap();
    mock.assert();
}
