"""Abstract base client for government APIs."""

from abc import ABC, abstractmethod
from typing import List, Optional
from urllib.parse import urljoin

import requests
from rich.console import Console

from .base_models import BaseApiResponse, BaseDespesa, BaseLegislador
from .rate_limiter import get_rate_limiter

console = Console()


class BaseApiClient(ABC):
    """Abstract base class for government API clients."""

    def __init__(self, base_url: str, wait_ms: int = 150, user_agent: str = "a-republica-etl/0.1"):
        self.base_url = base_url
        self.wait_seconds = wait_ms / 1000.0
        self.rate_limiter = get_rate_limiter()
        self.rate_limiter.set_min_interval(self.wait_seconds)
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": user_agent
        })

    def _fetch_json(self, url: str) -> dict:
        """Fetch JSON data from API endpoint with error handling."""
        try:
            if not url.lower().startswith(("http://", "https://")):
                base = self.base_url.rstrip('/') + '/'
                url = urljoin(base, url.lstrip('/'))

            self.rate_limiter.wait_if_needed()
            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            # Debug: check content type
            content_type = response.headers.get('Content-Type', '')
            if 'json' not in content_type.lower():
                console.print(f"[yellow]Warning: API returned {content_type} instead of JSON[/yellow]")
                console.print(f"[dim]Response preview: {response.text[:200]}[/dim]")

            return response.json()
        except requests.JSONDecodeError as je:
            raise Exception(f"Failed to fetch {url}: Expecting value: line 1 column 1 (char 0)")
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch {url}: {e}")

    def _paginated_fetch(self, endpoint: str, params: dict) -> List[dict]:
        """Fetch all pages of data from a paginated endpoint."""
        all_data = []

        # Build URL properly - remove leading slash from endpoint if base_url doesn't end with slash
        if not self.base_url.endswith('/') and endpoint.startswith('/'):
            endpoint = endpoint[1:]

        url = urljoin(self.base_url + '/', endpoint)

        # Add query parameters
        if params:
            param_strings = [f"{k}={v}" for k, v in params.items()]
            url = f"{url}?{'&'.join(param_strings)}"

        while url:
            console.print(f"[dim]Fetching: {url}[/dim]")

            data = self._fetch_json(url)
            response = BaseApiResponse(**data)

            all_data.extend(response.dados)

            # Find next URL
            next_url = None
            if response.links:
                for link in response.links:
                    if link.get("rel") == "next":
                        next_url = link.get("href")
                        break

            url = next_url

        return all_data

    @abstractmethod
    def fetch_legislators(self, legislatura: int, limit: Optional[int] = None) -> List[BaseLegislador]:
        """Fetch legislators for a given legislature."""
        pass

    @abstractmethod
    def fetch_expenses(self, legislator_id: int, anos: List[int]) -> List[BaseDespesa]:
        """Fetch expenses for a legislator across multiple years."""
        pass

    @property
    @abstractmethod
    def platform_name(self) -> str:
        """Return the platform name (e.g., 'congresso_nacional')."""
        pass

    @property
    @abstractmethod
    def source_name(self) -> str:
        """Return the source name (e.g., 'camara_deputados')."""
        pass