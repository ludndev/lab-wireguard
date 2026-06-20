from ._http import _HttpClient
from ._models import WgPeer


class PeersApi:
    """API methods for WireGuard peers."""

    def __init__(self, http: _HttpClient) -> None:
        self._http = http

    def get_by_id(self, id: str) -> WgPeer:
        return self._http.get(f"/peer/by-id/{id}")  # type: ignore[return-value]

    def get_by_interface(self, interface_id: str) -> list[WgPeer]:
        return self._http.get(f"/peer/by-interface/{interface_id}")  # type: ignore[return-value]

    def get_by_user(self, user_id: str) -> list[WgPeer]:
        return self._http.get(f"/peer/by-user/{user_id}")  # type: ignore[return-value]

    def prepare(self, interface_id: str) -> WgPeer:
        return self._http.get(f"/peer/prepare/{interface_id}")  # type: ignore[return-value]

    def create(self, data: WgPeer) -> WgPeer:
        return self._http.post("/peer/new", data)  # type: ignore[return-value]

    def update(self, id: str, data: WgPeer) -> WgPeer:
        return self._http.put(f"/peer/by-id/{id}", data)  # type: ignore[return-value]

    def delete(self, id: str) -> None:
        self._http.delete(f"/peer/by-id/{id}")
