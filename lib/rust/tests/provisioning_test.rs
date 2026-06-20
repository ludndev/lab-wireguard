use mockito::Server;
use serde_json::json;
use wg_portal_client::{ProvisioningRequest, WgPortalClient};

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
        "UserIdentifier": "uid-1234567"
    })
}

fn fixture_user_info() -> serde_json::Value {
    json!({
        "UserIdentifier": "uid-1234567",
        "PeerCount": 2,
        "Peers": [
            {"Identifier": PEER_ID, "InterfaceIdentifier": "wg0", "DisplayName": "My iPhone"},
            {"Identifier": "peer2pubkey==", "InterfaceIdentifier": "wg0", "DisplayName": "My Laptop"}
        ]
    })
}

#[test]
fn new_peer() {
    let (mut server, client) = setup();
    let mock = server
        .mock("POST", "/api/v1/provisioning/new-peer")
        .with_body(fixture_peer().to_string())
        .with_header("content-type", "application/json")
        .create();

    let request: ProvisioningRequest = serde_json::from_value(json!({
        "InterfaceIdentifier": "wg0",
        "DisplayName": "API Peer xyz",
        "UserIdentifier": "uid-1234567"
    }))
    .unwrap();

    let result = client.provisioning().new_peer(&request).unwrap();
    assert_eq!(result.identifier, PEER_ID);
    mock.assert();
}

#[test]
fn get_peer_config() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/provisioning/data/peer-config")
        .match_query(mockito::Matcher::AllOf(vec![
            mockito::Matcher::UrlEncoded("PeerId".into(), PEER_ID.into()),
        ]))
        .with_body("[Interface]\nPrivateKey = test")
        .create();

    let result = client.provisioning().get_peer_config(PEER_ID).unwrap();
    assert!(result.contains("[Interface]"));
    mock.assert();
}

#[test]
fn get_peer_qr_code() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/provisioning/data/peer-qr")
        .match_query(mockito::Matcher::AllOf(vec![
            mockito::Matcher::UrlEncoded("PeerId".into(), PEER_ID.into()),
        ]))
        .with_body(vec![137, 80, 78, 71])
        .create();

    let result = client.provisioning().get_peer_qr_code(PEER_ID).unwrap();
    assert_eq!(result, vec![137, 80, 78, 71]);
    mock.assert();
}

#[test]
fn get_user_info() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/provisioning/data/user-info")
        .match_query(mockito::Matcher::AllOf(vec![
            mockito::Matcher::UrlEncoded("UserId".into(), "uid-1234567".into()),
        ]))
        .with_body(fixture_user_info().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client
        .provisioning()
        .get_user_info(Some("uid-1234567"), None)
        .unwrap();
    assert_eq!(result.user_identifier, "uid-1234567");
    assert_eq!(result.peer_count, 2);
    assert_eq!(result.peers.len(), 2);
    mock.assert();
}

#[test]
fn get_user_info_by_email() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/provisioning/data/user-info")
        .match_query(mockito::Matcher::AllOf(vec![
            mockito::Matcher::UrlEncoded("Email".into(), "test@test.com".into()),
        ]))
        .with_body(fixture_user_info().to_string())
        .with_header("content-type", "application/json")
        .create();

    let result = client
        .provisioning()
        .get_user_info(None, Some("test@test.com"))
        .unwrap();
    assert_eq!(result.user_identifier, "uid-1234567");
    mock.assert();
}
