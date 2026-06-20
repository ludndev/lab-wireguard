from typing import Optional

from ._http import _HttpClient
from ._models import ProvisioningRequest, UserInformation, WgPeer


class ProvisioningApi:
    """API methods for peer provisioning and config retrieval."""

    def __init__(self, http: _HttpClient) -> None:
        self._http = http

    def new_peer(self, request: ProvisioningRequest) -> WgPeer:
        return self._http.post("/provisioning/new-peer", request)  # type: ignore[return-value]

    def get_peer_config(self, peer_id: str) -> str:
        raw = self._http.get_raw("/provisioning/data/peer-config", {"PeerId": peer_id})
        return raw.decode("utf-8")

    def get_peer_qr_code(self, peer_id: str) -> bytes:
        return self._http.get_raw("/provisioning/data/peer-qr", {"PeerId": peer_id})

    def get_user_info(
        self,
        *,
        user_id: Optional[str] = None,
        email: Optional[str] = None,
    ) -> UserInformation:
        params: dict[str, str] = {}
        if user_id is not None:
            params["UserId"] = user_id
        elif email is not None:
            params["Email"] = email
        return self._http.get("/provisioning/data/user-info", params)  # type: ignore[return-value]
