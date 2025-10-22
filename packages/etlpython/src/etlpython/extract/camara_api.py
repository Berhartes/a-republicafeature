"""Câmara API client for extracting deputados and despesas data."""

import time
from typing import List, Optional
from urllib.parse import urljoin

import requests
from rich.console import Console

from ..models import CamaraListResponse, DeputadoApi, DespesaApi

console = Console()

CAMARA_API_BASE = "https://dadosabertos.camara.leg.br/api/v2"
WAIT_BETWEEN_REQUESTS_MS = 150
MAX_EXPENSES_PER_DEPUTADO = 1200


class CamaraApiClient:
    """Client for interacting with Câmara dos Deputados API."""

    def __init__(self, base_url: str = CAMARA_API_BASE, wait_ms: int = WAIT_BETWEEN_REQUESTS_MS):
        self.base_url = base_url
        self.wait_seconds = wait_ms / 1000.0
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "a-republica-etl/0.1 (https://github.com/a-republica)"
        })

    def _fetch_json(self, url: str) -> dict:
        """Fetch JSON data from API endpoint with error handling."""
        try:
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch {url}: {e}")

    def _paginated_fetch(self, endpoint: str, params: dict) -> List[dict]:
        """Fetch all pages of data from a paginated endpoint."""
        all_data = []
        url = urljoin(self.base_url, endpoint)

        # Add query parameters
        if params:
            param_strings = [f"{k}={v}" for k, v in params.items()]
            url = f"{url}?{'&'.join(param_strings)}"

        while url:
            console.print(f"[dim]Fetching: {url}[/dim]")

            data = self._fetch_json(url)
            response = CamaraListResponse(**data)

            all_data.extend(response.dados)

            # Find next URL
            next_url = None
            if response.links:
                for link in response.links:
                    if link.rel == "next":
                        next_url = link.href
                        break

            url = next_url

            if url:
                time.sleep(self.wait_seconds)

        return all_data

    def fetch_deputados(self, legislatura: int, limit: Optional[int] = None) -> List[DeputadoApi]:
        """Fetch all deputados for a given legislatura."""
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

    def fetch_despesas(self, deputado_id: int, anos: List[int], max_items: int = MAX_EXPENSES_PER_DEPUTADO) -> List[DespesaApi]:
        """Fetch despesas for a deputado across multiple years."""
        console.print(f"[dim]Fetching despesas for deputado {deputado_id} for years {anos}[/dim]")

        all_despesas = []

        for ano in anos:
            params = {
                "ano": ano,
                "itens": "100",
                "ordem": "DESC",
                "ordenarPor": "mes"
            }

            endpoint = f"/deputados/{deputado_id}/despesas"
            data = self._paginated_fetch(endpoint, params)

            despesas_ano = [DespesaApi(**item) for item in data]
            all_despesas.extend(despesas_ano)

            # Check if we've reached the limit
            if len(all_despesas) >= max_items:
                all_despesas = all_despesas[:max_items]
                break

        return all_despesas