"""Câmara dos Deputados data processor."""

from typing import List

from ....core.base_models import BaseLegisladorResumo
from ....core.base_processor import BaseDataProcessor
from .models import DeputadoApi


class CamaraDataProcessor(BaseDataProcessor):
    """Data processor for Câmara dos Deputados."""

    def __init__(self):
        super().__init__()
        self.deputados_info = {}

    def process_deputado_despesas(self, deputado: DeputadoApi, despesas: List) -> None:
        """Process expenses for a single deputado."""
        # Store deputado info for later use
        self.deputados_info[deputado.id] = deputado

        # Process using base class method
        self.process_legislador_despesas(deputado, despesas)

    def get_legisladores_resumo(self) -> List[BaseLegisladorResumo]:
        """Get summary of all processed deputados."""
        resumo_list = []

        for deputado_id, stats in self.legisladores_stats.items():
            deputado = self.deputados_info.get(deputado_id)
            if not deputado:
                continue

            resumo = DeputadoResumo(
                id=deputado.id,
                nome=deputado.nome,
                partido=deputado.siglaPartido,
                uf=deputado.siglaUf,
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
        return self.partido

    @property
    def siglaUf(self) -> str:
        return self.uf