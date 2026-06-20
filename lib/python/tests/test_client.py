import base64

import pytest
from pytest_httpx import HTTPXMock

from wg_portal_client._http import _HttpClient, WgPortalError

from .conftest import (
    API_ERROR_401,
    API_ERROR_403,
    API_ERROR_404,
    API_ERROR_500,
    API_TOKEN,
    BASE_URL,
    EXPECTED_AUTH,
    USERNAME,
    mock_bytes,
    mock_error,
    mock_json,
    mock_no_content,
)


def _client(base_url: str = BASE_URL) -> _HttpClient:
    return _HttpClient(base_url, username=USERNAME, api_token=API_TOKEN)


class TestHttpClientAuth:
    def test_sets_basic_auth_on_get(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", {})
        _client().get("/interface/all")
        req = httpx_mock.get_request()
        assert req.headers["Authorization"] == EXPECTED_AUTH

    def test_sets_basic_auth_on_post(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/interface/new", {})
        _client().post("/interface/new", {})
        req = httpx_mock.get_request()
        assert req.headers["Authorization"] == EXPECTED_AUTH

    def test_sets_basic_auth_on_put(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "PUT", BASE_URL + "/api/v1/interface/by-id/wg0", {})
        _client().put("/interface/by-id/wg0", {})
        req = httpx_mock.get_request()
        assert req.headers["Authorization"] == EXPECTED_AUTH

    def test_sets_basic_auth_on_delete(self, httpx_mock: HTTPXMock):
        mock_no_content(httpx_mock, "DELETE", BASE_URL + "/api/v1/interface/by-id/wg0")
        _client().delete("/interface/by-id/wg0")
        req = httpx_mock.get_request()
        assert req.headers["Authorization"] == EXPECTED_AUTH

    def test_encodes_credentials_as_base64(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/test", {})
        client = _HttpClient(BASE_URL, username="user@test.com", api_token="tok3n!")
        client.get("/test")
        req = httpx_mock.get_request()
        expected = "Basic " + base64.b64encode(b"user@test.com:tok3n!").decode()
        assert req.headers["Authorization"] == expected


class TestHttpClientUrl:
    def test_appends_api_v1_prefix(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", {})
        _client().get("/interface/all")
        req = httpx_mock.get_request()
        assert str(req.url) == BASE_URL + "/api/v1/interface/all"

    def test_strips_trailing_slash_from_base_url(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", {})
        _client(BASE_URL + "/").get("/interface/all")
        req = httpx_mock.get_request()
        assert str(req.url) == BASE_URL + "/api/v1/interface/all"

    def test_appends_query_params(self, httpx_mock: HTTPXMock):
        url = BASE_URL + "/api/v1/provisioning/data/peer-config"
        httpx_mock.add_response(method="GET", url=url, json={}, match_params={"PeerId": "abc123"})
        _client().get("/provisioning/data/peer-config", {"PeerId": "abc123"})
        req = httpx_mock.get_request()
        assert "PeerId=abc123" in str(req.url)


class TestHttpClientMethods:
    def test_get_does_not_send_body(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", {})
        _client().get("/interface/all")
        req = httpx_mock.get_request()
        assert req.content == b""

    def test_post_sends_json_body(self, httpx_mock: HTTPXMock):
        import json as _json
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/interface/new", {})
        payload = {"Identifier": "wg0", "Mode": "server"}
        _client().post("/interface/new", payload)
        req = httpx_mock.get_request()
        assert _json.loads(req.content) == payload

    def test_post_sets_content_type_json(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/interface/new", {})
        _client().post("/interface/new", {})
        req = httpx_mock.get_request()
        assert req.headers["Content-Type"] == "application/json"

    def test_put_sends_method_put(self, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "PUT", BASE_URL + "/api/v1/interface/by-id/wg0", {})
        _client().put("/interface/by-id/wg0", {})
        req = httpx_mock.get_request()
        assert req.method == "PUT"

    def test_delete_resolves_on_204(self, httpx_mock: HTTPXMock):
        mock_no_content(httpx_mock, "DELETE", BASE_URL + "/api/v1/interface/by-id/wg0")
        result = _client().delete("/interface/by-id/wg0")
        assert result is None


class TestHttpClientGetRaw:
    def test_returns_bytes_on_success(self, httpx_mock: HTTPXMock):
        raw = b"raw binary data"
        url = BASE_URL + "/api/v1/provisioning/data/peer-qr"
        httpx_mock.add_response(method="GET", url=url, content=raw, match_params={"PeerId": "abc"})
        result = _client().get_raw("/provisioning/data/peer-qr", {"PeerId": "abc"})
        assert isinstance(result, bytes)

    def test_throws_wg_portal_error_on_failure(self, httpx_mock: HTTPXMock):
        url = BASE_URL + "/api/v1/provisioning/data/peer-qr"
        httpx_mock.add_response(method="GET", url=url, json={"Code": 404, "Message": "Not Found", "Details": "resource not found"}, status_code=404, match_params={"PeerId": "abc"})
        with pytest.raises(WgPortalError):
            _client().get_raw("/provisioning/data/peer-qr", {"PeerId": "abc"})


class TestHttpClientErrors:
    @pytest.mark.parametrize("code,message,details", [
        API_ERROR_401,
        API_ERROR_403,
        API_ERROR_404,
        API_ERROR_500,
    ])
    def test_throws_wg_portal_error(self, httpx_mock: HTTPXMock, code, message, details):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", code, message, details)
        with pytest.raises(WgPortalError) as exc:
            _client().get("/interface/all")
        assert exc.value.code == code

    def test_error_has_correct_message(self, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", *API_ERROR_404)
        with pytest.raises(WgPortalError) as exc:
            _client().get("/interface/all")
        assert exc.value.message == "Not Found"

    def test_error_has_correct_details(self, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", *API_ERROR_500)
        with pytest.raises(WgPortalError) as exc:
            _client().get("/interface/all")
        assert exc.value.details == "unexpected error occurred"

    def test_error_is_instance_of_exception(self, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/interface/all", *API_ERROR_401)
        with pytest.raises(Exception):
            _client().get("/interface/all")
