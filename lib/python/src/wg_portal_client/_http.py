import base64
import logging
from typing import Optional

import httpx

from ._models import ApiError


class WgPortalError(Exception):
    """Raised on non-2xx API responses."""

    def __init__(self, code: int, message: str, details: str) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details


class _HttpClient:
    """Internal HTTP transport with Basic auth and structured logging."""

    def __init__(
        self,
        base_url: str,
        username: str,
        api_token: str,
        logger: Optional[logging.Logger] = None,
    ) -> None:
        self._base_url = base_url.rstrip("/") + "/api/v1"
        credentials = f"{username}:{api_token}"
        self._auth = "Basic " + base64.b64encode(credentials.encode()).decode()
        self._logger = logger
        self._client = httpx.Client()

    def _headers(self, extra: Optional[dict[str, str]] = None) -> dict[str, str]:
        h = {"Authorization": self._auth}
        if extra:
            h.update(extra)
        return h

    def get(self, path: str, params: Optional[dict[str, str]] = None) -> object:
        url = self._base_url + path
        if self._logger:
            self._logger.debug("→ GET %s", url)
        res = self._client.get(url, headers=self._headers(), params=params)
        return self._parse("GET", url, res)

    def get_raw(self, path: str, params: Optional[dict[str, str]] = None) -> bytes:
        url = self._base_url + path
        if self._logger:
            self._logger.debug("→ GET %s", url)
        res = self._client.get(url, headers=self._headers(), params=params)
        if res.is_error:
            err: ApiError = res.json()
            if self._logger:
                self._logger.error("✗ GET %s [%d] %s", url, res.status_code, err)
            raise WgPortalError(err["Code"], err["Message"], err["Details"])
        if self._logger:
            self._logger.debug("✓ GET %s [%d]", url, res.status_code)
        return res.content

    def post(self, path: str, body: object) -> object:
        url = self._base_url + path
        if self._logger:
            self._logger.debug("→ POST %s", url)
        res = self._client.post(
            url,
            headers=self._headers({"Content-Type": "application/json"}),
            json=body,
        )
        return self._parse("POST", url, res)

    def put(self, path: str, body: object) -> object:
        url = self._base_url + path
        if self._logger:
            self._logger.debug("→ PUT %s", url)
        res = self._client.put(
            url,
            headers=self._headers({"Content-Type": "application/json"}),
            json=body,
        )
        return self._parse("PUT", url, res)

    def delete(self, path: str) -> None:
        url = self._base_url + path
        if self._logger:
            self._logger.debug("→ DELETE %s", url)
        res = self._client.delete(url, headers=self._headers())
        if res.is_error:
            err: ApiError = res.json()
            if self._logger:
                self._logger.error("✗ DELETE %s [%d] %s", url, res.status_code, err)
            raise WgPortalError(err["Code"], err["Message"], err["Details"])
        if self._logger:
            self._logger.debug("✓ DELETE %s [%d]", url, res.status_code)

    def _parse(self, method: str, url: str, res: httpx.Response) -> object:
        if res.is_error:
            err: ApiError = res.json()
            if self._logger:
                self._logger.error("✗ %s %s [%d] %s", method, url, res.status_code, err)
            raise WgPortalError(err["Code"], err["Message"], err["Details"])
        if self._logger:
            self._logger.debug("✓ %s %s [%d]", method, url, res.status_code)
        return res.json()

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "_HttpClient":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()
