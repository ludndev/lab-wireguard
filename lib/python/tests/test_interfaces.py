import json

import pytest
from pytest_httpx import HTTPXMock

from wg_portal_client import WgPortalError

from .conftest import (
    API_ERROR_401,
    API_ERROR_403,
    API_ERROR_404,
    API_ERROR_409,
    API_ERROR_500,
    BASE_URL,
    INTERFACE,
    INTERFACE_LIST,
    INTERFACE_PREPARED,
    mock_error,
    mock_json,
    mock_no_content,
)


class TestInterfacesGetAll:
    def test_calls_get_all(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", INTERFACE_LIST)
        result = client.interfaces.get_all()
        assert len(result) == 2
        assert result[0]["Identifier"] == "wg0"

    def test_returns_empty_list(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", [])
        result = client.interfaces.get_all()
        assert result == []

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.interfaces.get_all()

    def test_throws_on_500(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", *API_ERROR_500)
        with pytest.raises(WgPortalError):
            client.interfaces.get_all()


class TestInterfacesGetById:
    def test_calls_get_by_id(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/by-id/wg0", INTERFACE)
        result = client.interfaces.get_by_id("wg0")
        assert result["Identifier"] == "wg0"

    def test_url_encodes_space(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/by-id/wg%200", INTERFACE)
        client.interfaces.get_by_id("wg 0")

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.interfaces.get_by_id("nonexistent")


class TestInterfacesPrepare:
    def test_calls_prepare(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/prepare", INTERFACE_PREPARED)
        result = client.interfaces.prepare()
        assert result["Identifier"] == "wg1"

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/prepare", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.interfaces.prepare()


class TestInterfacesCreate:
    def test_calls_post_new(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/interface/new", INTERFACE)
        result = client.interfaces.create(INTERFACE)
        req = httpx_mock.get_request()
        assert req.method == "POST"
        assert result["Identifier"] == "wg0"

    def test_sends_json_body(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/interface/new", INTERFACE)
        client.interfaces.create(INTERFACE)
        req = httpx_mock.get_request()
        assert json.loads(req.content) == INTERFACE

    def test_throws_on_409(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "POST", BASE_URL + "/api/v1/interface/new", *API_ERROR_409)
        with pytest.raises(WgPortalError):
            client.interfaces.create(INTERFACE)


class TestInterfacesUpdate:
    def test_calls_put_by_id(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "PUT", BASE_URL + "/api/v1/interface/by-id/wg0", INTERFACE)
        client.interfaces.update("wg0", INTERFACE)
        req = httpx_mock.get_request()
        assert req.method == "PUT"

    def test_returns_updated_interface(self, client, httpx_mock: HTTPXMock):
        updated = {**INTERFACE, "DisplayName": "Updated Name"}
        mock_json(httpx_mock, "PUT", BASE_URL + "/api/v1/interface/by-id/wg0", updated)
        result = client.interfaces.update("wg0", updated)
        assert result["DisplayName"] == "Updated Name"

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "PUT", BASE_URL + "/api/v1/interface/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.interfaces.update("nonexistent", INTERFACE)


class TestInterfacesDelete:
    def test_calls_delete_by_id(self, client, httpx_mock: HTTPXMock):
        mock_no_content(httpx_mock, "DELETE", BASE_URL + "/api/v1/interface/by-id/wg0")
        client.interfaces.delete("wg0")
        req = httpx_mock.get_request()
        assert req.method == "DELETE"

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "DELETE", BASE_URL + "/api/v1/interface/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.interfaces.delete("nonexistent")
