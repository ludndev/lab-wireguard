import pytest
from pytest_httpx import HTTPXMock

from wg_portal_client import WgPortalError

from .conftest import (
    API_ERROR_401,
    API_ERROR_404,
    API_ERROR_409,
    BASE_URL,
    PEER,
    PEER_ID,
    PEER_LIST,
    PEER_PREPARED,
    mock_error,
    mock_json,
    mock_no_content,
)


class TestPeersGetById:
    def test_calls_get_by_id(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        mock_json(httpx_mock, "GET", url, PEER)
        result = client.peers.get_by_id(PEER_ID)
        assert result["Identifier"] == PEER_ID

    def test_returns_peer(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        mock_json(httpx_mock, "GET", url, PEER)
        result = client.peers.get_by_id(PEER_ID)
        assert result["InterfaceIdentifier"] == "wg0"

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        mock_error(httpx_mock, "GET", url, *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.peers.get_by_id(PEER_ID)


class TestPeersGetByInterface:
    def test_calls_get_by_interface(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/peer/by-interface/wg0", PEER_LIST)
        result = client.peers.get_by_interface("wg0")
        assert len(result) == 2

    def test_returns_empty_list(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/peer/by-interface/wg0", [])
        result = client.peers.get_by_interface("wg0")
        assert result == []

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/peer/by-interface/wg0", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.peers.get_by_interface("wg0")


class TestPeersGetByUser:
    def test_calls_get_by_user(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/peer/by-user/uid-1234567", PEER_LIST)
        result = client.peers.get_by_user("uid-1234567")
        assert len(result) == 2

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/peer/by-user/uid-1234567", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.peers.get_by_user("uid-1234567")


class TestPeersPrepare:
    def test_calls_prepare(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/peer/prepare/wg0", PEER_PREPARED)
        result = client.peers.prepare("wg0")
        assert result["PrivateKey"] is not None
        assert result["InterfaceIdentifier"] == "wg0"

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/peer/prepare/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.peers.prepare("nonexistent")


class TestPeersCreate:
    def test_calls_post_new(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/peer/new", PEER)
        result = client.peers.create(PEER)
        req = httpx_mock.get_request()
        assert req.method == "POST"
        assert result["Identifier"] == PEER_ID

    def test_throws_on_409(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "POST", BASE_URL + "/api/v1/peer/new", *API_ERROR_409)
        with pytest.raises(WgPortalError):
            client.peers.create(PEER)


class TestPeersUpdate:
    def test_calls_put_by_id(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        mock_json(httpx_mock, "PUT", url, PEER)
        client.peers.update(PEER_ID, PEER)
        req = httpx_mock.get_request()
        assert req.method == "PUT"

    def test_returns_updated_peer(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        updated = {**PEER, "DisplayName": "Renamed Peer"}
        mock_json(httpx_mock, "PUT", url, updated)
        result = client.peers.update(PEER_ID, updated)
        assert result["DisplayName"] == "Renamed Peer"

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "PUT", BASE_URL + "/api/v1/peer/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.peers.update("nonexistent", PEER)


class TestPeersDelete:
    def test_calls_delete_by_id(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        mock_no_content(httpx_mock, "DELETE", url)
        client.peers.delete(PEER_ID)
        req = httpx_mock.get_request()
        assert req.method == "DELETE"

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/peer/by-id/{PEER_ID}"
        mock_error(httpx_mock, "DELETE", url, *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.peers.delete(PEER_ID)
