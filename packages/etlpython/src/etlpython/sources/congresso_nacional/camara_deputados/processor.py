"""Câmara dos Deputados data processor."""

from __future__ import annotations

from typing import Any, Callable, List, Optional

from ....core.base_models import BaseLegisladorResumo
from ....core.base_processor import BaseDataProcessor
from .models import DeputadoApi
from .client import CamaraApiClient


class CamaraDataProcessor(BaseDataProcessor):
    """Data processor for Câmara dos Deputados."""

    def __init__(
        self,
        client: CamaraApiClient | None = None,
        event_logger: Optional[Callable[[str], None]] = None,
    ):
        super().__init__()
        self.deputados_info = {}
        self.client = client
        self._event_logger = event_logger

    def _emit_event(self, event: str, **payload: Any) -> None:
        if self._event_logger:
            try:
                self._event_logger(event, **payload)
            except Exception:
                pass

    def process_deputado_despesas(self, deputado: DeputadoApi, despesas: List) -> DeputadoApi:
        """Process expenses for a single deputado and return the enriched record."""
        # Enhance deputado with detailed information if the detailed endpoint is reachable
        enhanced_deputado = self._enhance_deputado_with_details(deputado)

        # Store enhanced deputado info for later use (summaries, SQLite, etc.)
        self.deputados_info[enhanced_deputado.id] = enhanced_deputado

        # Process using base class method
        self.process_legislador_despesas(enhanced_deputado, despesas)

        stats = self.legisladores_stats.get(enhanced_deputado.id, {})
        self._emit_event(
            "deputado_processed",
            deputado_id=enhanced_deputado.id,
            nome=enhanced_deputado.nome,
            nome_eleitoral=getattr(enhanced_deputado, "nomeEleitoral", None),
            total_despesas=round(stats.get("total_despesas", 0.0), 2),
            numero_despesas=stats.get("numero_despesas", 0),
            fornecedores_identificados=len(stats.get("fornecedores", set())) if stats else 0,
        )

        return enhanced_deputado

    def _enhance_deputado_with_details(self, deputado: DeputadoApi) -> DeputadoApi:
        """Enhance deputado with detailed information from API."""
        detalhes_existentes = getattr(deputado, 'detalhes_completos', None)
        if detalhes_existentes:
            return self._apply_deputado_details(deputado, detalhes_existentes)

        if not self.client:
            return deputado

        try:
            details = self.client.fetch_deputy_details(deputado.id)
            if details:
                return self._apply_deputado_details(deputado, details)
            return deputado
        except Exception as e:
            from rich.console import Console
            console = Console()
            console.print(f"[yellow]Warning: Could not fetch details for deputado {deputado.id}: {e}[/yellow]")
            return deputado

    def _apply_deputado_details(self, deputado: DeputadoApi, details: Any) -> DeputadoApi:
        """Apply detalhes payload to a deputado instance."""
        detalhes_payload = details.get('dados') if isinstance(details, dict) else details
        ultimo_status = {}

        if isinstance(detalhes_payload, dict):
            ultimo_status = detalhes_payload.get('ultimoStatus', {})

        # Mutate current model to avoid alias/validation pitfalls
        try:
            deputado.nomeEleitoral = (
                ultimo_status.get('nomeEleitoral')
                if isinstance(ultimo_status, dict) else None
            ) or getattr(deputado, 'nomeEleitoral', None)
        except Exception:
            pass
        try:
            deputado.siglaPartido = (
                ultimo_status.get('siglaPartido')
                if isinstance(ultimo_status, dict) else None
            ) or deputado.siglaPartido
        except Exception:
            pass
        try:
            deputado.siglaUf = (
                ultimo_status.get('siglaUf')
                if isinstance(ultimo_status, dict) else None
            ) or deputado.siglaUf
        except Exception:
            pass
        try:
            email_source = None
            if isinstance(ultimo_status, dict):
                email_source = ultimo_status.get('email')
            if not email_source and isinstance(detalhes_payload, dict):
                email_source = detalhes_payload.get('email')

            deputado.email = email_source or getattr(deputado, 'email', None)
        except Exception:
            pass
        try:
            # Accept either key as source, store on alias field
            foto_source = None
            if isinstance(ultimo_status, dict):
                foto_source = ultimo_status.get('urlFoto')
            if not foto_source and isinstance(detalhes_payload, dict):
                foto_source = detalhes_payload.get('urlFoto') or detalhes_payload.get('url_foto')

            deputado.url_foto = foto_source or getattr(deputado, 'url_foto', None)
        except Exception:
            pass
        try:
            # Store full detailed payload for downstream serialization
            deputado.detalhes_completos = details
        except Exception:
            pass

        return deputado

    def get_legisladores_resumo(self) -> List[BaseLegisladorResumo]:
        """Get summary of all processed deputados."""
        resumo_list = []

        for deputado_id, stats in self.legisladores_stats.items():
            deputado = self.deputados_info.get(deputado_id)
            if not deputado:
                continue

            resumo = DeputadoResumo(
                id=deputado.id,
                nome=deputado.nomeEleitoral or deputado.nome,
                nome_eleitoral=deputado.nomeEleitoral or deputado.nome,
                partido=deputado.siglaPartido,
                sigla_partido=deputado.siglaPartido,
                uf=deputado.siglaUf,
                sigla_uf=deputado.siglaUf,
                total_despesas=round(stats["total_despesas"], 2),
                numero_despesas=stats["numero_despesas"],
                fornecedores_identificados=len(stats["fornecedores"])
            )
            resumo_list.append(resumo)

        # Sort by total expenses (descending)
        return sorted(resumo_list, key=lambda x: x.total_despesas, reverse=True)


class DeputadoResumo(BaseLegisladorResumo):
    """Resumo específico para deputados."""

    @property
    def siglaPartido(self) -> str:
        return self.sigla_partido or self.partido

    @property
    def siglaUf(self) -> str:
        return self.sigla_uf or self.uf

    @property
    def nomeEleitoral(self) -> str:
        return self.nome_eleitoral or self.nome
