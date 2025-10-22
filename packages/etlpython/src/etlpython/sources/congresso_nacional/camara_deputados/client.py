"""Câmara dos Deputados API client."""

from typing import List, Optional

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

    @property
    def platform_name(self) -> str:
        return "congresso_nacional"

    @property
    def source_name(self) -> str:
        return "camara_deputados"

    def fetch_legislators(self, legislatura: int, limit: Optional[int] = None) -> List[DeputadoApi]:
        """Fetch all deputados for a given legislatura."""
        from rich.console import Console
        console = Console()

        console.print(f"[cyan]Fetching deputados for legislatura {legislatura}...[/cyan]")

        params = {
            "idLegislatura": legislatura,
            "ordem": "ASC",
            "ordenarPor": "nome",
            "itens": "100"
        }

        data = self._paginated_fetch("/deputados", params)
        deputados = [DeputadoApi(**item) for item in data]

        if limit and limit > 0:
            deputados = deputados[:limit]

        console.print(f"[green]Found {len(deputados)} deputados[/green]")
        return deputados

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