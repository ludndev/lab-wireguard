from ._http import _HttpClient
from ._models import WgUser


class UsersApi:
    """API methods for user management."""

    def __init__(self, http: _HttpClient) -> None:
        self._http = http

    def get_all(self) -> list[WgUser]:
        return self._http.get("/user/all")  # type: ignore[return-value]

    def get_by_id(self, id: str) -> WgUser:
        return self._http.get(f"/user/by-id/{id}")  # type: ignore[return-value]

    def create(self, data: WgUser) -> WgUser:
        return self._http.post("/user/new", data)  # type: ignore[return-value]

    def update(self, id: str, data: WgUser) -> WgUser:
        return self._http.put(f"/user/by-id/{id}", data)  # type: ignore[return-value]

    def delete(self, id: str) -> None:
        self._http.delete(f"/user/by-id/{id}")
