import pytest
from pytest_httpx import HTTPXMock

from wg_portal_client import WgPortalError

from .conftest import (
    API_ERROR_401,
    API_ERROR_404,
    BASE_URL,
    INTERFACE_METRICS,
    PEER_ID,
    PEER_METRICS,
    USER_METRICS,
    mock_error,
    mock_json,
)


class TestMetricsByInterface:
    def test_calls_get_metrics_by_interface(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-interface/wg0", INTERFACE_METRICS)
        result = client.metrics.by_interface("wg0")
        assert result["InterfaceIdentifier"] == "wg0"
        assert result["BytesReceived"] == 123456789

    def test_returns_zero_metrics(self, client, httpx_mock: HTTPXMock):
        empty = {"InterfaceIdentifier": "wg0", "BytesReceived": 0, "BytesTransmitted": 0}
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-interface/wg0", empty)
        result = client.metrics.by_interface("wg0")
        assert result["BytesReceived"] == 0

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-interface/wg0", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.metrics.by_interface("wg0")


class TestMetricsByPeer:
    def test_calls_get_metrics_by_peer(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/metrics/by-peer/{PEER_ID}"
        mock_json(httpx_mock, "GET", url, PEER_METRICS)
        result = client.metrics.by_peer(PEER_ID)
        assert result["PeerIdentifier"] == PEER_ID
        assert result["IsPingable"] is True

    def test_returns_offline_peer(self, client, httpx_mock: HTTPXMock):
        url = BASE_URL + f"/api/v1/metrics/by-peer/{PEER_ID}"
        offline = {"PeerIdentifier": PEER_ID, "BytesReceived": 0, "BytesTransmitted": 0, "IsPingable": False}
        mock_json(httpx_mock, "GET", url, offline)
        result = client.metrics.by_peer(PEER_ID)
        assert result["IsPingable"] is False

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-peer/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.metrics.by_peer("nonexistent")


class TestMetricsByUser:
    def test_calls_get_metrics_by_user(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-user/uid-1234567", USER_METRICS)
        result = client.metrics.by_user("uid-1234567")
        assert result["UserIdentifier"] == "uid-1234567"
        assert result["PeerCount"] == 2

    def test_returns_per_peer_metrics(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-user/uid-1234567", USER_METRICS)
        result = client.metrics.by_user("uid-1234567")
        assert len(result["PeerMetrics"]) == 1

    def test_returns_empty_peer_metrics(self, client, httpx_mock: HTTPXMock):
        empty = {
            "UserIdentifier": "uid-nopeer",
            "BytesReceived": 0,
            "BytesTransmitted": 0,
            "PeerCount": 0,
            "PeerMetrics": [],
        }
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-user/uid-nopeer", empty)
        result = client.metrics.by_user("uid-nopeer")
        assert result["PeerMetrics"] == []

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/metrics/by-user/uid-1234567", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.metrics.by_user("uid-1234567")
