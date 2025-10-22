"""Data models for the ETL pipeline."""

from datetime import datetime
from typing import Dict, List, Optional, Set
from pydantic import BaseModel


class CamaraLink(BaseModel):
    rel: str
    href: str


class CamaraListResponse(BaseModel):
    dados: List[Dict]
    links: Optional[List[CamaraLink]] = None


class DeputadoApi(BaseModel):
    id: int
    uri: str
    nome: str
    siglaPartido: str
    siglaUf: str
    urlFoto: str


class DespesaApi(BaseModel):
    ano: int
    mes: int
    tipoDespesa: str
    fornecedor: str
    cnpjCpfFornecedor: Optional[str] = None
    valorDocumento: float
    valorLiquido: float
    codDocumento: int
    numDocumento: str
    urlDocumento: Optional[str] = None


class DeputadoResumo(BaseModel):
    id: int
    nome: str
    siglaPartido: str
    siglaUf: str
    totalDespesas: float
    numeroDespesas: int
    fornecedoresIdentificados: int


class CategoriaInfo(BaseModel):
    categoria: str
    total: float


class AnoInfo(BaseModel):
    ano: int
    total: float
    numeroTransacoes: int
    numeroDeputados: int


class FornecedorOutput(BaseModel):
    id: str
    nome: str
    cnpj_cpf: Optional[str]
    tipo_fornecedor: Optional[str] = None
    tipo_despesa_principal: Optional[str] = None
    total_recebido: float
    numero_transacoes: int
    numero_deputados: int
    score_suspeicao: Optional[float] = None
    categorias: List[CategoriaInfo]
    anos: List[AnoInfo]
    ranking: int
    created_at: str


class SupplierAccumulator:
    """Internal accumulator for supplier data processing."""

    def __init__(self, nome: str, cnpj: Optional[str] = None):
        self.nome = nome
        self.cnpj = cnpj
        self.total = 0.0
        self.transacoes = 0
        self.deputados: Set[int] = set()
        self.categorias: Dict[str, float] = {}
        self.anos: Dict[int, Dict[str, any]] = {}

    def add_despesa(self, despesa: DespesaApi, deputado_id: int) -> None:
        """Add a despesa to this supplier's accumulator."""
        valor = despesa.valorLiquido or despesa.valorDocumento or 0.0
        if not valor or valor <= 0:
            return

        self.total += valor
        self.transacoes += 1
        self.deputados.add(deputado_id)

        # Categories
        categoria = despesa.tipoDespesa.strip() if despesa.tipoDespesa else "Despesa não especificada"
        self.categorias[categoria] = self.categorias.get(categoria, 0.0) + valor

        # Years
        if despesa.ano not in self.anos:
            self.anos[despesa.ano] = {
                "total": 0.0,
                "transacoes": 0,
                "deputados": set()
            }

        self.anos[despesa.ano]["total"] += valor
        self.anos[despesa.ano]["transacoes"] += 1
        self.anos[despesa.ano]["deputados"].add(deputado_id)

    def to_output(self, ranking: int) -> FornecedorOutput:
        """Convert accumulator to final output format."""
        # Sort categories by total
        categorias = [
            CategoriaInfo(categoria=cat, total=round(total, 2))
            for cat, total in sorted(self.categorias.items(), key=lambda x: x[1], reverse=True)
        ]

        # Get principal category
        principal_categoria = categorias[0].categoria if categorias else None

        # Sort years
        anos = [
            AnoInfo(
                ano=ano,
                total=round(info["total"], 2),
                numeroTransacoes=info["transacoes"],
                numeroDeputados=len(info["deputados"])
            )
            for ano, info in sorted(self.anos.items())
        ]

        return FornecedorOutput(
            id=self.cnpj or self.nome,
            nome=self.nome,
            cnpj_cpf=self.cnpj,
            tipo_despesa_principal=principal_categoria,
            total_recebido=round(self.total, 2),
            numero_transacoes=self.transacoes,
            numero_deputados=len(self.deputados),
            categorias=categorias,
            anos=anos,
            ranking=ranking,
            created_at=datetime.now().isoformat()
        )