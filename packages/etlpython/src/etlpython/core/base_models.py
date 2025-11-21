"""Base models for ETL pipeline."""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Set
from pydantic import BaseModel, ConfigDict, Field


class BaseApiResponse(BaseModel):
    """Base API response structure for government APIs."""
    dados: List[Dict[str, Any]]
    links: Optional[List[Dict[str, str]]] = None


class BaseLink(BaseModel):
    """Base link structure for pagination."""
    rel: str
    href: str


class BaseLegislador(BaseModel, ABC):
    """Abstract base model for any legislator (deputado, senador, etc.)"""
    id: int
    nome: str
    partido: str
    uf: str

    @property
    @abstractmethod
    def tipo_legislador(self) -> str:
        """Return the type of legislator (deputado, senador, etc.)"""
        pass


class BaseDespesa(BaseModel, ABC):
    """Abstract base model for any government expense."""
    ano: int
    mes: int
    
    @property
    @abstractmethod
    def valor_documento(self) -> float:
        """Return document value."""
        pass
    
    @property
    @abstractmethod
    def valor_liquido(self) -> Optional[float]:
        """Return net value."""
        pass
    
    @property
    @abstractmethod
    def tipo_despesa(self) -> str:
        """Return expense type."""
        pass
    
    @property
    @abstractmethod
    def fornecedor(self) -> str:
        """Return supplier name."""
        pass
    
    @property
    @abstractmethod
    def documento_id(self) -> int:
        """Return document ID."""
        pass
    
    @property
    @abstractmethod
    def documento_numero(self) -> str:
        """Return document number."""
        pass
    
    @property
    def documento_url(self) -> Optional[str]:
        """Return document URL."""
        return None
    
    @property
    def documento_data(self) -> Optional[str]:
        """Return document date."""
        return None
    
    @property
    def fornecedor_documento(self) -> Optional[str]:
        """Return supplier document (CNPJ/CPF)."""
        return None

    @property
    def valor_efetivo(self) -> float:
        """Return the effective value (liquid or document value)."""
        return self.valor_liquido or self.valor_documento or 0.0


class CategoriaInfo(BaseModel):
    """Information about expense categories."""
    categoria: str
    total: float


class AnoInfo(BaseModel):
    """Information about yearly expenses."""
    ano: int
    total: float
    numero_transacoes: int
    numero_legisladores: int


class BaseFornecedor(BaseModel):
    """Base model for suppliers/fornecedores."""
    id: str
    nome: str
    documento: Optional[str] = None  # CNPJ/CPF
    tipo_fornecedor: Optional[str] = None
    tipo_despesa_principal: Optional[str] = None
    total_recebido: float
    numero_transacoes: int
    numero_legisladores: int
    score_suspeicao: Optional[float] = None
    categorias: List[CategoriaInfo] = Field(default_factory=list)
    anos: List[AnoInfo] = Field(default_factory=list)
    ranking: Optional[int] = None
    created_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class BaseLegisladorResumo(BaseModel):
    """Base summary model for legislators."""

    model_config = ConfigDict(populate_by_name=True)

    id: int
    nome: str
    nome_eleitoral: Optional[str] = Field(default=None, alias="nomeEleitoral")
    partido: str
    sigla_partido: Optional[str] = Field(default=None, alias="siglaPartido")
    uf: str
    sigla_uf: Optional[str] = Field(default=None, alias="siglaUf")
    total_despesas: float = Field(alias="totalDespesas")
    numero_despesas: int = Field(alias="numeroDespesas")
    fornecedores_identificados: int = Field(alias="fornecedoresIdentificados")


class BaseManifest(BaseModel):
    """Base manifest model for ETL results."""
    generated_at: str
    legislatura: int
    anos: List[int]
    total_legisladores: int
    total_fornecedores: int
    total_despesas: float
    platform: str  # "congresso_nacional", etc.
    source: str     # "camara_deputados", "senado", etc.


class FornecedorAccumulator:
    """Internal accumulator for supplier data processing."""

    def __init__(self, nome: str, documento: Optional[str] = None):
        self.nome = nome
        self.documento = documento
        self.total = 0.0
        self.transacoes = 0
        self.legisladores: Set[int] = set()
        self.categorias: Dict[str, float] = {}
        self.anos: Dict[int, Dict[str, Any]] = {}

    def add_despesa(self, despesa: BaseDespesa, legislador_id: int) -> None:
        """Add an expense to this supplier's accumulator."""
        tipo_despesa_value = despesa.tipo_despesa.strip() if despesa.tipo_despesa else "Despesa não especificada"
        self.add_despesa_with_normalized_values(despesa, legislador_id, tipo_despesa_value)
    
    def add_despesa_with_normalized_values(self, despesa: BaseDespesa, legislador_id: int, tipo_despesa_norm: str) -> None:
        """Add an expense to this supplier's accumulator with normalized tipo_despesa."""
        valor = despesa.valor_efetivo
        if not valor or valor <= 0:
            return

        self.total += valor
        self.transacoes += 1
        self.legisladores.add(legislador_id)

        # Categories (use normalized value)
        categoria = tipo_despesa_norm.strip() if tipo_despesa_norm else "Despesa não especificada"
        self.categorias[categoria] = self.categorias.get(categoria, 0.0) + valor

        # Years
        if despesa.ano not in self.anos:
            self.anos[despesa.ano] = {
                "total": 0.0,
                "transacoes": 0,
                "legisladores": set()
            }

        self.anos[despesa.ano]["total"] += valor
        self.anos[despesa.ano]["transacoes"] += 1
        self.anos[despesa.ano]["legisladores"].add(legislador_id)

    def to_output(self, ranking: int) -> BaseFornecedor:
        """Convert accumulator to final output format."""
        categorias = [
            CategoriaInfo(categoria=cat, total=round(total, 2))
            for cat, total in sorted(self.categorias.items(), key=lambda item: item[1], reverse=True)
        ]
        principal_categoria = categorias[0].categoria if categorias else None

        anos = [
            AnoInfo(
                ano=ano,
                total=round(info["total"], 2),
                numero_transacoes=info["transacoes"],
                numero_legisladores=len(info["legisladores"]),
            )
            for ano, info in sorted(self.anos.items())
        ]

        return BaseFornecedor(
            id=self.documento or self.nome,
            nome=self.nome,
            documento=self.documento,
            tipo_despesa_principal=principal_categoria,
            total_recebido=round(self.total, 2),
            numero_transacoes=self.transacoes,
            numero_legisladores=len(self.legisladores),
            categorias=categorias,
            anos=anos,
            ranking=ranking,
            created_at=datetime.now().isoformat(),
        )


def normalize_categoria_despesa(categoria: Optional[str]) -> str:
    """Normalize expense category by removing trailing dots and extra spaces."""
    if not categoria:
        return "Despesa não especificada"

    normalized = categoria.strip()
    if normalized.endswith('.'):
        normalized = normalized[:-1].strip()

    return normalized if normalized else "Despesa não especificada"


def normalize_cnpj_cpf(documento: Optional[str]) -> Optional[str]:
    """Normalize CNPJ/CPF by removing non-numeric characters."""
    if not documento:
        return None

    # Remove all non-numeric characters
    normalized = ''.join(filter(str.isdigit, documento))

    # Return None if empty or invalid length
    if not normalized or len(normalized) not in [11, 14]:
        return None

    return normalized
