"""Shared models for Congresso Nacional (Câmara + Senado)."""

from typing import Optional
from pydantic import Field

from ....core.base_models import BaseDespesa, BaseLegislador


class CongressoLegislador(BaseLegislador):
    """Base legislator model for Congresso Nacional."""
    uri: str
    url_foto: Optional[str] = Field(default=None, alias="urlFoto")
    email: Optional[str] = None
    id_legislatura: int = Field(alias="idLegislatura")
    siglaPartido: str
    siglaUf: str
    
    class Config:
        populate_by_name = True

    @property
    def tipo_legislador(self) -> str:
        return "legislador"


class CongressoDespesa(BaseDespesa):
    """Base expense model for Congresso Nacional."""
    # Concrete fields from BaseDespesa with aliases
    valorDocumento: float
    valorLiquido: Optional[float] = None
    tipoDespesa: str
    nomeFornecedor: str
    
    # CongressoNacional-specific fields
    codDocumento: int
    tipoDocumento: Optional[str] = None
    codTipoDocumento: Optional[int] = None
    dataDocumento: Optional[str] = None
    numDocumento: Optional[str] = None
    urlDocumento: Optional[str] = None
    cnpjCpfFornecedor: Optional[str] = None
    valorGlosa: Optional[float] = 0.0
    numRessarcimento: Optional[str] = ""
    codLote: Optional[int] = None
    parcela: Optional[int] = 0
    
    class Config:
        populate_by_name = True

    @property
    def valor_documento(self) -> float:
        return self.valorDocumento
    
    @property
    def valor_liquido(self) -> Optional[float]:
        return self.valorLiquido
    
    @property
    def tipo_despesa(self) -> str:
        return self.tipoDespesa
    
    @property
    def fornecedor(self) -> str:
        return self.nomeFornecedor

    @property
    def documento_id(self) -> int:
        return self.codDocumento

    @property
    def documento_numero(self) -> str:
        return self.numDocumento or ""

    @property
    def documento_url(self) -> Optional[str]:
        return self.urlDocumento

    @property
    def documento_data(self) -> Optional[str]:
        return self.dataDocumento

    @property
    def fornecedor_documento(self) -> Optional[str]:
        return self.cnpjCpfFornecedor