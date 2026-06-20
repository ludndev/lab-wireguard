from ._http import _HttpClient
from ._models import InterfaceMetrics, PeerMetrics, UserMetrics


class MetricsApi:
    """API methods for WireGuard traffic metrics."""

    def __init__(self, http: _HttpClient) -> None:
        self._http = http

    def by_interface(self, interface_id: str) -> InterfaceMetrics:
        return self._http.get(f"/metrics/by-interface/{interface_id}")  # type: ignore[return-value]

    def by_peer(self, peer_id: str) -> PeerMetrics:
        return self._http.get(f"/metrics/by-peer/{peer_id}")  # type: ignore[return-value]

    def by_user(self, user_id: str) -> UserMetrics:
        return self._http.get(f"/metrics/by-user/{user_id}")  # type: ignore[return-value]
