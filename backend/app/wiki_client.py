"""Thin async client for MediaWiki Action API + REST API."""

import httpx
from app.config import settings


class WikiClient:
    """Manages a persistent httpx session for MediaWiki requests."""

    def __init__(self) -> None:
        self._client: httpx.AsyncClient | None = None

    async def start(self) -> None:
        self._client = httpx.AsyncClient(timeout=15.0)

    async def stop(self) -> None:
        if self._client:
            await self._client.aclose()

    @property
    def client(self) -> httpx.AsyncClient:
        assert self._client is not None, "WikiClient not started"
        return self._client

    # ── Action API helpers ──

    async def action_query(self, **params) -> dict:
        """Call action=query with given params, return the 'query' block."""
        params.update(action="query", format="json", formatversion="2")
        resp = await self.client.get(settings.mediawiki_api_url, params=params)
        resp.raise_for_status()
        data = resp.json()
        return data.get("query", {})

    async def action_parse(self, **params) -> dict:
        """Call action=parse, return the 'parse' block."""
        params.update(action="parse", format="json", formatversion="2")
        resp = await self.client.get(settings.mediawiki_api_url, params=params)
        resp.raise_for_status()
        data = resp.json()
        if "error" in data:
            raise ValueError(data["error"].get("info", "Unknown error"))
        return data["parse"]

    async def action_post(self, **params) -> dict:
        """POST to the Action API (for edits, login, etc.)."""
        params.update(format="json", formatversion="2")
        resp = await self.client.post(settings.mediawiki_api_url, data=params)
        resp.raise_for_status()
        return resp.json()

    # ── REST API helpers ──

    async def rest_get(self, path: str, **params) -> dict:
        url = f"{settings.mediawiki_rest_url}/{path}"
        resp = await self.client.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    # ── Token management ──

    async def get_csrf_token(self) -> str:
        data = await self.action_query(meta="tokens", type="csrf")
        return data["tokens"]["csrftoken"]

    async def login(self, username: str, password: str) -> dict:
        # Step 1: get login token
        data = await self.action_query(meta="tokens", type="login")
        login_token = data["tokens"]["logintoken"]
        # Step 2: login
        result = await self.action_post(
            action="login",
            lgname=username,
            lgpassword=password,
            lgtoken=login_token,
        )
        return result.get("login", {})


wiki_client = WikiClient()
