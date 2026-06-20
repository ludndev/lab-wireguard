import logging
from typing import Optional

from ._http import _HttpClient
from .interfaces import InterfacesApi
from .metrics import MetricsApi
from .peers import PeersApi
from .provisioning import ProvisioningApi
from .users import UsersApi


class WgPortalClient:
    """Synchronous client for the WireGuard Portal v2 REST API.

    Usage::

        client = WgPortalClient(
            base_url="http://192.168.1.100:8888",
            username="admin@wgportal.local",
            api_token="your-api-token",
        )
        interfaces = client.interfaces.get_all()
    """

    def __init__(
        self,
        base_url: str,
        username: str,
        api_token: str,
        logger: Optional[logging.Logger] = None,
    ) -> None:
        http = _HttpClient(base_url, username, api_token, logger)
        self.interfaces = InterfacesApi(http)
        self.peers = PeersApi(http)
        self.provisioning = ProvisioningApi(http)
        self.users = UsersApi(http)
        self.metrics = MetricsApi(http)
