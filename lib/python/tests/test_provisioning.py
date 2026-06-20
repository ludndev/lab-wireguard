import json

import pytest
from pytest_httpx import HTTPXMock

from wg_portal_client import WgPortalError

from .conftest import (
    API_ERROR_401,
    API_ERROR_403,
    API_ERROR_404,
    API_ERROR_500,
    BASE_URL,
    PEER,
    PEER_ID,
    PROVISIONING_REQUEST,
    PROVISIONING_REQUEST_MINIMAL,
    PROVISIONING_REQUEST_WITH_KEY,
    QR_PNG_BYTES,
    USER_INFORMATION,
    WG_QUICK_CONFIG,
    mock_error,
    mock_json,
)


class TestProvisioningNewPeer:
    def test_calls_post_new_peer(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/provisioning/new-peer", PEER)
        result = client.provisioning.new_peer(PROVISIONING_REQUEST)
        req = httpx_mock.get_request()
        assert req.method == "POST"
        assert result["Identifier"] == PEER_ID

    def test_sends_json_body(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/provisioning/new-peer", PEER)
        client.provisioning.new_peer(PROVISIONING_REQUEST)
        req = httpx_mock.get_request()
        assert json.loads(req.content) == PROVISIONING_REQUEST

    def test_works_with_minimal_request(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/provisioning/new-peer", PEER)
        client.provisioning.new_peer(PROVISIONING_REQUEST_MINIMAL)
        req = httpx_mock.get_request()
        assert json.loads(req.content) == PROVISIONING_REQUEST_MINIMAL

    def test_accepts_optional_keys(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/provisioning/new-peer", PEER)
        client.provisioning.new_peer(PROVISIONING_REQUEST_WITH_KEY)
        req = httpx_mock.get_request()
        body = json.loads(req.content)
        assert body["PublicKey"] == PROVISIONING_REQUEST_WITH_KEY["PublicKey"]

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "POST", BASE_URL + "/api/v1/provisioning/new-peer", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.provisioning.new_peer(PROVISIONING_REQUEST)

    def test_throws_on_403(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "POST", BASE_URL + "/api/v1/provisioning/new-peer", *API_ERROR_403)
        with pytest.raises(WgPortalError):
            client.provisioning.new_peer(PROVISIONING_REQUEST)


class TestProvisioningGetPeerConfig:
    def test_calls_with_peer_id_param(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/peer-config",
            content=WG_QUICK_CONFIG.encode(),
            match_params={"PeerId": PEER_ID},
        )
        result = client.provisioning.get_peer_config(PEER_ID)
        assert isinstance(result, str)

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/peer-config",
            json={"Code": 404, "Message": "Not Found", "Details": "resource not found"},
            status_code=404,
            match_params={"PeerId": "unknown"},
        )
        with pytest.raises(WgPortalError):
            client.provisioning.get_peer_config("unknown")


class TestProvisioningGetPeerQrCode:
    def test_calls_with_peer_id_param(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/peer-qr",
            content=QR_PNG_BYTES,
            match_params={"PeerId": PEER_ID},
        )
        result = client.provisioning.get_peer_qr_code(PEER_ID)
        assert isinstance(result, bytes)

    def test_png_magic_bytes_preserved(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/peer-qr",
            content=QR_PNG_BYTES,
            match_params={"PeerId": PEER_ID},
        )
        result = client.provisioning.get_peer_qr_code(PEER_ID)
        assert result[0] == 137
        assert result[1] == 80
        assert result[2] == 78
        assert result[3] == 71

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/peer-qr",
            json={"Code": 401, "Message": "Unauthorized", "Details": "invalid credentials"},
            status_code=401,
            match_params={"PeerId": PEER_ID},
        )
        with pytest.raises(WgPortalError):
            client.provisioning.get_peer_qr_code(PEER_ID)


class TestProvisioningGetUserInfo:
    def test_calls_with_no_params(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/provisioning/data/user-info", USER_INFORMATION)
        result = client.provisioning.get_user_info()
        assert result["UserIdentifier"] == "uid-1234567"

    def test_sends_user_id_param(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/user-info",
            json=USER_INFORMATION,
            match_params={"UserId": "uid-1234567"},
        )
        client.provisioning.get_user_info(user_id="uid-1234567")
        req = httpx_mock.get_request()
        assert "UserId=uid-1234567" in str(req.url)

    def test_sends_email_param(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/user-info",
            json=USER_INFORMATION,
            match_params={"Email": "test@test.com"},
        )
        client.provisioning.get_user_info(email="test@test.com")
        req = httpx_mock.get_request()
        assert "Email=test%40test.com" in str(req.url)

    def test_prefers_user_id_over_email(self, client, httpx_mock: HTTPXMock):
        httpx_mock.add_response(
            method="GET",
            url=BASE_URL + "/api/v1/provisioning/data/user-info",
            json=USER_INFORMATION,
            match_params={"UserId": "uid-1234567"},
        )
        client.provisioning.get_user_info(user_id="uid-1234567", email="test@test.com")
        req = httpx_mock.get_request()
        assert "UserId=uid-1234567" in str(req.url)
        assert "Email=" not in str(req.url)

    def test_returns_user_information(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/provisioning/data/user-info", USER_INFORMATION)
        result = client.provisioning.get_user_info()
        assert result["PeerCount"] == 2
        assert len(result["Peers"]) == 2

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/provisioning/data/user-info", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.provisioning.get_user_info()
