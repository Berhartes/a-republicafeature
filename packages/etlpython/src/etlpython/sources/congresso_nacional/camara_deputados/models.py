"""Câmara dos Deputados specific models."""

from typing import Optional

from ..shared.models import CongressoDespesa, CongressoLegislador


class DeputadoApi(CongressoLegislador):
    """Deputado model from Câmara API."""

    @property
    def tipo_legislador(self) -> str:
        return "deputado"

    @property
    def partido(self) -> str:
        return self.siglaPartido

    @property
    def uf(self) -> str:
        return self.siglaUf


class DespesaApi(CongressoDespesa):
    """Despesa model from Câmara API."""
    # All fields inherited from CongressoDespesa
    pass