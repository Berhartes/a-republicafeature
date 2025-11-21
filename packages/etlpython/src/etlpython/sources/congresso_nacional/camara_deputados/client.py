"""Câmara dos Deputados API client."""

from typing import List, Optional
from urllib.parse import urljoin

from ....core.base_client import BaseApiClient
from .models import DeputadoApi, DespesaApi

CAMARA_API_BASE = "https://dadosabertos.camara.leg.br/api/v2"
MAX_EXPENSES_PER_DEPUTADO = 1200


class CamaraApiClient(BaseApiClient):
    """Client for interacting with Câmara dos Deputados API."""

    def __init__(self, wait_ms: int = 150):
        super().__init__(
            base_url=CAMARA_API_BASE,
            wait_ms=wait_ms,
            user_agent="a-republica-etl/0.1 (https://github.com/a-republica)"
        )
        # Ensure the global rate limiter reflects this client's configuration
        try:
            self.rate_limiter.set_min_interval(self.wait_seconds)
        except Exception:
            pass

    @property
    def platform_name(self) -> str:
        return "congresso_nacional"

    @property
    def source_name(self) -> str:
        return "camara_deputados"

    def fetch_legislators(self, legislatura: int, limit: Optional[int] = None) -> List[DeputadoApi]:
        """Fetch deputados for a given legislatura, stopping early at ``limit``.

        This implementation avoids traversing all API pages when a limit is
        provided, reducing the risk of gateway timeouts.
        """
        from rich.console import Console
        console = Console()

        console.print(f"[cyan]Fetching deputados for legislatura {legislatura}...[/cyan]")

        # Base endpoint and query (100 per page to minimize requests)
        endpoint = "/deputados"
        params = {
            "idLegislatura": legislatura,
            "ordem": "ASC",
            "ordenarPor": "nome",
            "itens": "100",
        }

        # Construct initial URL
        base_url = urljoin(self.base_url + '/', endpoint.lstrip('/'))
        param_strings = [f"{k}={v}" for k, v in params.items()]
        url = f"{base_url}?{'&'.join(param_strings)}"

        collected: List[dict] = []

        # Iterate pages; stop once we have enough items
        while url:
            console.print(f"[dim]Fetching: {url}[/dim]")
            data = self._fetch_json(url)
            response = self._parse_response(data)

            collected.extend(response["dados"])  # type: ignore[index]
            # Early stop when limit is reached
            if limit and limit > 0 and len(collected) >= limit:
                break

            # Find next URL
            next_url = None
            links = response.get("links") or []  # type: ignore[attr-defined]
            for link in links:
                if link.get("rel") == "next":
                    next_url = link.get("href")
                    break
            url = next_url

        # Slice to limit if provided
        if limit and limit > 0:
            collected = collected[:limit]

        deputados = [DeputadoApi(**item) for item in collected]
        console.print(f"[green]Found {len(deputados)} deputados[/green]")
        return deputados

    # Helper to parse API response keeping compatibility with BaseApiResponse
    def _parse_response(self, data: dict) -> dict:
        """Parse response JSON into a dict with keys 'dados' and 'links'."""
        # The API returns these keys already; this method is here for symmetry
        # and potential future validation/logging.
        if not isinstance(data, dict):
            return {"dados": [], "links": []}
        dados = data.get("dados")
        links = data.get("links")
        if not isinstance(dados, list):
            dados = []
        if not isinstance(links, list):
            links = []
        return {"dados": dados, "links": links}

    def fetch_deputy_details(self, deputy_id: int) -> dict:
        """Fetch detailed deputy information including nomeEleitoral and siglaPartido."""
        from rich.console import Console
        console = Console()

        console.print(f"[dim]Fetching detailed info for deputado {deputy_id}[/dim]")

        endpoint = f"/deputados/{deputy_id}"
        response = self._fetch_json(endpoint)

        if not isinstance(response, dict):
            return {}

        return {
            "dados": response.get("dados", {}),
            "links": response.get("links", []),
        }

    def fetch_expenses(self, legislator_id: int, anos: List[int], max_items: int = MAX_EXPENSES_PER_DEPUTADO) -> List[DespesaApi]:
        """Fetch despesas for a deputado across multiple years."""
        from rich.console import Console
        console = Console()

        console.print(f"[dim]Fetching despesas for deputado {legislator_id} for years {anos}[/dim]")

        all_despesas = []

        for ano in anos:
            params = {
                "ano": ano,
                "itens": "100",
                "ordem": "DESC",
                "ordenarPor": "mes"
            }

            endpoint = f"/deputados/{legislator_id}/despesas"
            data = self._paginated_fetch(endpoint, params)

            despesas_ano = [DespesaApi(**item) for item in data]
            all_despesas.extend(despesas_ano)

            # Check if we've reached the limit
            if len(all_despesas) >= max_items:
                all_despesas = all_despesas[:max_items]
                break

        return all_despesas