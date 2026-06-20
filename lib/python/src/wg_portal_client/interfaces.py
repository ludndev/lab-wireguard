from ._http import _HttpClient
from ._models import WgInterface


class InterfacesApi:
    """API methods for WireGuard interfaces."""

    def __init__(self, http: _HttpClient) -> None:
        self._http = http

    def get_all(self) -> list[WgInterface]:
        return self._http.get("/interface/all")  # type: ignore[return-value]

    def get_by_id(self, id: str) -> WgInterface:
        return self._http.get(f"/interface/by-id/{id}")  # type: ignore[return-value]

    def prepare(self) -> WgInterface:
        return self._http.get("/interface/prepare")  # type: ignore[return-value]

    def create(self, data: WgInterface) -> WgInterface:
        return self._http.post("/interface/new", data)  # type: ignore[return-value]

    def update(self, id: str, data: WgInterface) -> WgInterface:
        return self._http.put(f"/interface/by-id/{id}", data)  # type: ignore[return-value]

    def delete(self, id: str) -> None:
        self._http.delete(f"/interface/by-id/{id}")
