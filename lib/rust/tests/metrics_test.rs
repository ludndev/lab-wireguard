use mockito::Server;
use serde_json::json;
use wg_portal_client::WgPortalClient;

fn setup() -> (mockito::ServerGuard, WgPortalClient) {
    let server = Server::new();
    let client = WgPortalClient::new(&server.url(), "admin@wgportal.local", "test-token");
    (server, client)
}

const PEER_ID: &str = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=";

#[test]
fn by_interface() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/metrics/by-interface/wg0")
        .with_body(
            json!({
                "InterfaceIdentifier": "wg0",
                "BytesReceived": 123456789,
                "BytesTransmitted": 987654321
            })
            .to_string(),
        )
        .with_header("content-type", "application/json")
        .create();

    let result = client.metrics().by_interface("wg0").unwrap();
    assert_eq!(result.interface_identifier, "wg0");
    assert_eq!(result.bytes_received, 123456789);
    mock.assert();
}

#[test]
fn by_peer() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", format!("/api/v1/metrics/by-peer/{}", PEER_ID).as_str())
        .with_body(
            json!({
                "PeerIdentifier": PEER_ID,
                "BytesReceived": 1000,
                "BytesTransmitted": 2000,
                "Endpoint": "12.34.56.78",
                "IsPingable": true
            })
            .to_string(),
        )
        .with_header("content-type", "application/json")
        .create();

    let result = client.metrics().by_peer(PEER_ID).unwrap();
    assert_eq!(result.peer_identifier, PEER_ID);
    assert_eq!(result.is_pingable, Some(true));
    mock.assert();
}

#[test]
fn by_user() {
    let (mut server, client) = setup();
    let mock = server
        .mock("GET", "/api/v1/metrics/by-user/uid-1234567")
        .with_body(
            json!({
                "UserIdentifier": "uid-1234567",
                "BytesReceived": 11000,
                "BytesTransmitted": 22000,
                "PeerCount": 2,
                "PeerMetrics": [{
                    "PeerIdentifier": PEER_ID,
                    "BytesReceived": 1000,
                    "BytesTransmitted": 2000
                }]
            })
            .to_string(),
        )
        .with_header("content-type", "application/json")
        .create();

    let result = client.metrics().by_user("uid-1234567").unwrap();
    assert_eq!(result.user_identifier, "uid-1234567");
    assert_eq!(result.peer_count, 2);
    assert_eq!(result.peer_metrics.len(), 1);
    mock.assert();
}
