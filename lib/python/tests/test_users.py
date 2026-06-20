import json

import pytest
from pytest_httpx import HTTPXMock

from wg_portal_client import WgPortalError

from .conftest import (
    API_ERROR_401,
    API_ERROR_403,
    API_ERROR_404,
    API_ERROR_409,
    BASE_URL,
    USER,
    USER_ADMIN,
    USER_LIST,
    mock_error,
    mock_json,
    mock_no_content,
)


class TestUsersGetAll:
    def test_calls_get_all(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/user/all", USER_LIST)
        result = client.users.get_all()
        assert len(result) == 2
        assert result[0]["Identifier"] == "uid-1234567"

    def test_returns_empty_list(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/user/all", [])
        result = client.users.get_all()
        assert result == []

    def test_throws_on_401(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/user/all", *API_ERROR_401)
        with pytest.raises(WgPortalError):
            client.users.get_all()


class TestUsersGetById:
    def test_calls_get_by_id(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/user/by-id/uid-1234567", USER)
        result = client.users.get_by_id("uid-1234567")
        assert result["Email"] == "test@test.com"

    def test_returns_admin_user(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "GET", BASE_URL + "/api/v1/user/by-id/uid-admin", USER_ADMIN)
        result = client.users.get_by_id("uid-admin")
        assert result["IsAdmin"] is True

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "GET", BASE_URL + "/api/v1/user/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.users.get_by_id("nonexistent")


class TestUsersCreate:
    def test_calls_post_new(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/user/new", USER)
        result = client.users.create(USER)
        req = httpx_mock.get_request()
        assert req.method == "POST"
        assert result["Identifier"] == "uid-1234567"

    def test_sends_json_body(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/user/new", USER)
        client.users.create(USER)
        req = httpx_mock.get_request()
        assert json.loads(req.content) == USER

    def test_allows_admin_user(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "POST", BASE_URL + "/api/v1/user/new", USER_ADMIN)
        result = client.users.create(USER_ADMIN)
        assert result["IsAdmin"] is True

    def test_throws_on_409(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "POST", BASE_URL + "/api/v1/user/new", *API_ERROR_409)
        with pytest.raises(WgPortalError) as exc:
            client.users.create(USER)
        assert exc.value.code == 409

    def test_throws_on_403(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "POST", BASE_URL + "/api/v1/user/new", *API_ERROR_403)
        with pytest.raises(WgPortalError):
            client.users.create(USER)


class TestUsersUpdate:
    def test_calls_put_by_id(self, client, httpx_mock: HTTPXMock):
        mock_json(httpx_mock, "PUT", BASE_URL + "/api/v1/user/by-id/uid-1234567", USER)
        client.users.update("uid-1234567", USER)
        req = httpx_mock.get_request()
        assert req.method == "PUT"

    def test_returns_updated_user(self, client, httpx_mock: HTTPXMock):
        updated = {**USER, "Department": "New Department"}
        mock_json(httpx_mock, "PUT", BASE_URL + "/api/v1/user/by-id/uid-1234567", updated)
        result = client.users.update("uid-1234567", updated)
        assert result["Department"] == "New Department"

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "PUT", BASE_URL + "/api/v1/user/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.users.update("nonexistent", USER)


class TestUsersDelete:
    def test_calls_delete_by_id(self, client, httpx_mock: HTTPXMock):
        mock_no_content(httpx_mock, "DELETE", BASE_URL + "/api/v1/user/by-id/uid-1234567")
        client.users.delete("uid-1234567")
        req = httpx_mock.get_request()
        assert req.method == "DELETE"

    def test_throws_on_404(self, client, httpx_mock: HTTPXMock):
        mock_error(httpx_mock, "DELETE", BASE_URL + "/api/v1/user/by-id/nonexistent", *API_ERROR_404)
        with pytest.raises(WgPortalError):
            client.users.delete("nonexistent")
