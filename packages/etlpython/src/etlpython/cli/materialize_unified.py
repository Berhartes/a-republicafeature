
"""Materialize fornecedores dataset into a unified SQLite database.

This CLI mirrors the legacy TypeScript workflow so that the Python ETL
can reuse the same contracts during the transition period.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple, Union

from rich.console import Console
from rich.table import Table

console = Console()

# Search order closely follows the TypeScript implementation
DEFAULT_DATASET_CANDIDATES = (
    "bancoDados/monitordespesas/fornecedores/fornecedores.json",
    "bancoDados/monitordespesas/fornecedores.json",
    "bancoDados/raw/fornecedores.json",
    "bancodeDados/monitordespesas/fornecedores/fornecedores.json",
    "bancodeDados/monitordespesas/fornecedores.json",
    "bancodeDados/raw/fornecedores.json",
    "data/fornecedores.json",
    "packages/etl/data/fornecedores.json",
    "packages/etl/sample-data/fornecedores.mock.json",
)

DEFAULT_OUTPUT = "bancoDados/monitordespesas/monitordespesas.db"
DEFAULT_CACHE_DIR = "packages/monitor-despesas-next/public/cache"


def find_project_root(start: Path) -> Path:
    """Ascend directories until a repo root is found."""
    current = start.resolve()
    while True:
        if (current / "pnpm-workspace.yaml").exists() or (current / ".git").exists():
            return current
        if current.parent == current:
            return start.resolve()
        current = current.parent


def resolve_path(candidate: Optional[str], project_root: Path, *, defaults: Sequence[str]) -> Path:
    if candidate:
        resolved = (project_root / candidate).resolve()
        if not resolved.exists():
            console.log(f"Tentando resolver: {candidate}")
            console.log(f"Caminho resolvido: {resolved}")
            raise FileNotFoundError(f"Dataset informado não encontrado em {resolved}")
        return resolved

    for rel_path in defaults:
        maybe = (project_root / rel_path).resolve()
        if maybe.exists():
            return maybe

    raise FileNotFoundError(
        "Nenhum dataset de fornecedores encontrado. Informe --dataset ou gere o arquivo antes."
    )


def load_dataset(path: Path) -> List[Dict[str, Any]]:
    with path.open("r", encoding="utf-8") as fh:
        payload = json.load(fh)

    if not isinstance(payload, list):
        raise ValueError("O dataset precisa ser um array JSON de fornecedores.")
    return payload


@dataclass
class NormalizedFornecedor:
    id: str
    nome: str
    cnpj_cpf: Optional[str]
    tipo_fornecedor: Optional[str]
    tipo_despesa_principal: Optional[str]
    total_recebido: float
    numero_transacoes: int
    numero_deputados: int
    score_suspeicao: Optional[float]
    categorias: str
    anos: str
    ranking: Optional[int]
    created_at: str

    def as_tuple(self) -> tuple:
        return (
            self.id,
            self.nome,
            self.cnpj_cpf,
            self.tipo_fornecedor,
            self.tipo_despesa_principal,
            self.total_recebido,
            self.numero_transacoes,
            self.numero_deputados,
            self.score_suspeicao,
            self.categorias,
            self.anos,
            self.ranking,
            self.created_at,
        )


@dataclass
class NormalizedPremiacao:
    id: str
    tipo: str  # Ex: 'MAIOR_GASTO', 'MENOR_GASTO', 'MAIOR_SCORE_SUSPEICAO'
    entidade_id: str  # ID do deputado ou fornecedor
    entidade_nome: str
    valor: float
    unidade: str  # Ex: 'R$', 'Alertas', 'Score'
    data_referencia: str  # Ano ou período
    descricao: str
    created_at: str

    def as_tuple(self) -> tuple:
        return (
            self.id,
            self.tipo,
            self.entidade_id,
            self.entidade_nome,
            self.valor,
            self.unidade,
            self.data_referencia,
            self.descricao,
            self.created_at,
        )


@dataclass
class NormalizedAlerta:
    id: str
    tipo: str
    gravidade: str
    deputado: str
    deputadoId: str
    descricao: str
    valor: float
    dataDeteccao: str
    detalhes: Dict[str, Any]

    def as_tuple(self) -> tuple:
        return (
            self.id,
            self.tipo,
            self.gravidade,
            self.deputado,
            self.deputadoId,
            self.descricao,
            self.valor,
            self.dataDeteccao,
            json.dumps(self.detalhes),
        )


@dataclass
class NormalizedDeputado:
    id: str
    nome: str
    partido: Optional[str]
    uf: Optional[str]
    total_despesas: float
    numero_despesas: int
    fornecedores_identificados: int
    created_at: str

    def as_tuple(self) -> tuple:
        return (
            self.id,
            self.nome,
            self.partido,
            self.uf,
            self.total_despesas,
            self.numero_despesas,
            self.fornecedores_identificados,
            self.created_at,
        )


def _first_present(data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return default


def generate_premiacoes(normalized_deputados: Sequence[NormalizedDeputado]) -> List[NormalizedPremiacao]:
    premiacoes: List[NormalizedPremiacao] = []
    processed_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    # Premiação: Deputado com maior gasto total
    if normalized_deputados:
        maior_gasto_dep = max(normalized_deputados, key=lambda dep: dep.total_despesas)
        premiacoes.append(
            NormalizedPremiacao(
                id=f"PREMIO-MAIOR-GASTO-{maior_gasto_dep.id}",
                tipo="MAIOR_GASTO",
                entidade_id=maior_gasto_dep.id,
                entidade_nome=maior_gasto_dep.nome,
                valor=maior_gasto_dep.total_despesas,
                unidade="R$",
                data_referencia="2022-2025", # Exemplo, pode ser dinâmico
                descricao=f"Deputado com o maior gasto total: R$ {maior_gasto_dep.total_despesas:,.2f}",
                created_at=processed_at,
            )
        )
    
    # Premiação: Deputado com menor gasto total (excluindo 0)
    if normalized_deputados:
        menor_gasto_dep = min([dep for dep in normalized_deputados if dep.total_despesas > 0], key=lambda dep: dep.total_despesas, default=None)
        if menor_gasto_dep:
            premiacoes.append(
                NormalizedPremiacao(
                    id=f"PREMIO-MENOR-GASTO-{menor_gasto_dep.id}",
                    tipo="MENOR_GASTO",
                    entidade_id=menor_gasto_dep.id,
                    entidade_nome=menor_gasto_dep.nome,
                    valor=menor_gasto_dep.total_despesas,
                    unidade="R$",
                    data_referencia="2022-2025",
                    descricao=f"Deputado com o menor gasto total (acima de zero): R$ {menor_gasto_dep.total_despesas:,.2f}",
                    created_at=processed_at,
                )
            )

    # Adicionar outras premiações conforme necessário (ex: maior número de alertas, mais fornecedores)

    return premiacoes

def generate_alertas(normalized_deputados: Sequence[NormalizedDeputado], normalized_fornecedores: Sequence[NormalizedFornecedor]) -> List[NormalizedAlerta]:
    alertas: List[NormalizedAlerta] = []
    # Lógica de geração de alertas (simplificada para demonstração)
    # Em um cenário real, isso seria muito mais complexo e baseado em regras de negócio

    for dep in normalized_deputados:
        # Exemplo: Alerta de alto gasto
        if dep.total_despesas > 2000000: # Exemplo de limite
            alertas.append(
                NormalizedAlerta(
                    id=f"ALERTA-ALTO-GASTO-{dep.id}",
                    tipo="ALTO_GASTO",
                    gravidade="ALTA",
                    deputado=dep.nome,
                    deputadoId=dep.id,
                    descricao=f"Deputado {dep.nome} teve gastos totais muito altos: R$ {dep.total_despesas:,.2f}",
                    valor=dep.total_despesas,
                    dataDeteccao=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    detalhes={
                        "total_despesas": dep.total_despesas,
                        "numero_despesas": dep.numero_despesas,
                    },
                )
            )
        
        # Exemplo: Alerta de muitas transações
        if dep.numero_despesas > 1500: # Exemplo de limite
            alertas.append(
                NormalizedAlerta(
                    id=f"ALERTA-MUITAS-TRANSACOES-{dep.id}",
                    tipo="MUITAS_TRANSACOES",
                    gravidade="MEDIA",
                    deputado=dep.nome,
                    deputadoId=dep.id,
                    descricao=f"Deputado {dep.nome} realizou um grande número de transações: {dep.numero_despesas}",
                    valor=0, # Não se aplica diretamente a valor aqui
                    dataDeteccao=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    detalhes={
                        "numero_despesas": dep.numero_despesas,
                        "total_despesas": dep.total_despesas,
                    },
                )
            )

    # Exemplo: Alerta de fornecedor suspeito (simplificado)
    for forn in normalized_fornecedores:
        if forn.score_suspeicao and forn.score_suspeicao > 50: # Exemplo de score
            alertas.append(
                NormalizedAlerta(
                    id=f"ALERTA-FORNECEDOR-SUSPEITO-{forn.id}",
                    tipo="FORNECEDOR_SUSPEITO",
                    gravidade="ALTA",
                    deputado="MÚLTIPLOS", # Pode ser mais específico se tiver dados de deputados atendidos
                    deputadoId="",
                    descricao=f"Fornecedor {forn.nome} possui alto score de suspeição: {forn.score_suspeicao:,.2f}",
                    valor=forn.total_recebido,
                    dataDeteccao=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                    detalhes={
                        "fornecedor_nome": forn.nome,
                        "cnpj_cpf": forn.cnpj_cpf,
                        "score_suspeicao": forn.score_suspeicao,
                    },
                )
            )

    return alertas

def normalize_deputados(raw_entries: Iterable[Dict[str, Any]]) -> List[NormalizedDeputado]:
    normalized: List[NormalizedDeputado] = []

    for index, entry in enumerate(raw_entries):
        try:
            deputado_id = str(_first_present(entry, "id"))
            nome = _first_present(entry, "nome")
            if not nome:
                raise ValueError("Campo 'nome' é obrigatório")

            partido = _first_present(entry, "partido", default=None)
            uf = _first_present(entry, "uf", default=None)
            total_despesas = float(_first_present(entry, "total_despesas", default=0))
            numero_despesas = int(_first_present(entry, "numero_despesas", default=0))
            fornecedores_identificados = int(_first_present(entry, "fornecedores_identificados", default=0))
            created_at = _first_present(entry, "created_at", default=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))

            normalized.append(
                NormalizedDeputado(
                    id=deputado_id,
                    nome=nome,
                    partido=partido,
                    uf=uf,
                    total_despesas=total_despesas,
                    numero_despesas=numero_despesas,
                    fornecedores_identificados=fornecedores_identificados,
                    created_at=created_at,
                )
            )
        except (ValueError, TypeError) as exc:
            console.log(f"Erro ao normalizar deputado no índice {index}: {exc}")
            console.log(entry)

    return normalized

def normalize_fornecedores(raw_entries: Iterable[Dict[str, Any]]) -> List[NormalizedFornecedor]:
    normalized: List[NormalizedFornecedor] = []
    current_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    for index, entry in enumerate(raw_entries):
        try:
            # Legacy compat: some entries have `fornecedor` prefix
            cnpj_cpf = _first_present(entry, "cnpj_cpf", "fornecedor_cnpj_cpf")
            if not cnpj_cpf:
                raise ValueError("Campo 'cnpj_cpf' é obrigatório")

            nome = _first_present(entry, "nome", "fornecedor_nome")
            if not nome:
                raise ValueError("Campo 'nome' é obrigatório")

            # Legacy compat: some entries have `id` as number
            fornecedor_id = str(_first_present(entry, "id", default=cnpj_cpf))

            normalized.append(
                NormalizedFornecedor(
                    id=fornecedor_id,
                    nome=nome,
                    cnpj_cpf=cnpj_cpf,
                    tipo_fornecedor=_first_present(entry, "tipo_fornecedor"),
                    tipo_despesa_principal=_first_present(entry, "tipo_despesa_principal"),
                    total_recebido=float(_first_present(entry, "total_recebido", default=0)),
                    numero_transacoes=int(
                        _first_present(entry, "numero_transacoes", default=0)
                    ),
                    numero_deputados=int(
                        _first_present(entry, "numero_deputados", default=0)
                    ),
                    score_suspeicao=float(
                        _first_present(entry, "score_suspeicao", default=0)
                    ),
                    categorias=json.dumps(_first_present(entry, "categorias", default=[])),
                    anos=json.dumps(_first_present(entry, "anos", default=[])),
                    ranking=int(_first_present(entry, "ranking", default=0)),
                    created_at=current_time,
                )
            )
        except (ValueError, TypeError) as exc:
            console.log(f"Erro ao normalizar fornecedor no índice {index}: {exc}")
            console.log(entry)

    return normalized


def create_schema(conn: sqlite3.Connection):
    cursor = conn.cursor()

    cursor.execute("DROP TABLE IF EXISTS fornecedores")
    cursor.execute(
        """
        CREATE TABLE fornecedores (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cnpj_cpf TEXT,
            tipo_fornecedor TEXT,
            tipo_despesa_principal TEXT,
            total_recebido REAL,
            numero_transacoes INTEGER,
            numero_deputados INTEGER,
            score_suspeicao REAL,
            categorias TEXT,
            anos TEXT,
            ranking INTEGER,
            created_at TEXT
        )
        """
    )

    cursor.execute("DROP TABLE IF EXISTS deputados")
    cursor.execute(
        """
        CREATE TABLE deputados (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            partido TEXT,
            uf TEXT,
            total_despesas REAL,
            numero_despesas INTEGER,
            fornecedores_identificados INTEGER,
            created_at TEXT
        )
        """
    )

    cursor.execute("DROP TABLE IF EXISTS premiacoes")
    cursor.execute(
        """
        CREATE TABLE premiacoes (
            id TEXT PRIMARY KEY,
            tipo TEXT NOT NULL,
            entidade_id TEXT,
            entidade_nome TEXT,
            valor REAL,
            unidade TEXT,
            data_referencia TEXT,
            descricao TEXT,
            created_at TEXT
        )
        """
    )

    cursor.execute("DROP TABLE IF EXISTS alertas")
    cursor.execute(
        """
        CREATE TABLE alertas (
            id TEXT PRIMARY KEY,
            tipo TEXT NOT NULL,
            gravidade TEXT,
            deputado TEXT,
            deputadoId TEXT,
            descricao TEXT,
            valor REAL,
            dataDeteccao TEXT,
            detalhes TEXT
        )
        """
    )

    conn.commit()


def insert_batch(conn: sqlite3.Connection, table: str, batch: Iterable[Tuple[Any, ...]]):
    if not batch:
        return

    placeholders = ", ".join(["?"] * len(batch[0]))
    query = f"INSERT INTO {table} VALUES ({placeholders})"
    conn.executemany(query, batch)
    conn.commit()


def _load_categories(supplier: NormalizedFornecedor) -> List[Dict[str, Any]]:
    try:
        return json.loads(supplier.categorias)
    except (json.JSONDecodeError, TypeError):
        return []


def _load_years(supplier: NormalizedFornecedor) -> List[Dict[str, Any]]:
    try:
        return json.loads(supplier.anos)
    except (json.JSONDecodeError, TypeError):
        return []


def _alertas_por_score(score: Optional[float]) -> List[str]:
    if score is None:
        return []
    if score > 80:
        return ["Score altíssimo de suspeição"]
    if score > 50:
        return ["Score alto de suspeição"]
    if score > 20:
        return ["Score médio de suspeição"]
    return []


def build_deputy_detail_cache(
    deputy: NormalizedDeputado,
    dataset_path: Path,
    *,
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    
    payload = {
        "metadata": {
            "generatedAt": processed_at,
            "source": "etlpython-materialize",
            "arquivoFonte": dataset_path.name,
            "version": version,
            "legislatura": legislatura,
            "deputadoId": deputy.id,
        },
        "data": {
            "id": deputy.id,
            "nome": deputy.nome,
            "partido": deputy.partido,
            "uf": deputy.uf,
            "totalDespesas": deputy.total_despesas,
            "numeroDespesas": deputy.numero_despesas,
            "fornecedoresIdentificados": deputy.fornecedores_identificados,
            "createdAt": deputy.created_at,
        }
    }
    return payload

def build_deputies_cache(
    rows: Sequence[NormalizedDeputado],
    dataset_path: Path,
    *,
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    deputies_payload: List[Dict[str, Any]] = []

    for row in rows:
        deputies_payload.append(
            {
                "id": row.id,
                "nome": row.nome,
                "partido": row.partido,
                "uf": row.uf,
                "totalDespesas": row.total_despesas,
                "numeroDespesas": row.numero_despesas,
                "fornecedoresIdentificados": row.fornecedores_identificados,
            }
        )

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "arquivoFonte": dataset_path.name,
        "version": version,
        "legislatura": legislatura,
        "totalDeputados": len(rows),
    }

    return {"metadata": metadata, "data": deputies_payload}

def build_premiacoes_cache(
    rows: Sequence[NormalizedPremiacao],
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    premiacoes_payload = []
    for row in rows:
        premiacoes_payload.append(
            {
                "id": row.id,
                "tipo": row.tipo,
                "entidadeId": row.entidade_id,
                "entidadeNome": row.entidade_nome,
                "valor": row.valor,
                "unidade": row.unidade,
                "dataReferencia": row.data_referencia,
                "descricao": row.descricao,
                "createdAt": row.created_at,
            }
        )

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "version": version,
        "legislatura": legislatura,
        "totalPremiacoes": len(rows),
    }

    return {"metadata": metadata, "data": premiacoes_payload}

def build_analysis_cache(
    normalized_deputados: Sequence[NormalizedDeputado],
    normalized_alertas: Sequence[NormalizedAlerta],
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    total_deputados = len(normalized_deputados)
    total_alertas = len(normalized_alertas)
    total_gastos = sum(dep.total_despesas for dep in normalized_deputados)
    media_gastos = total_gastos / total_deputados if total_deputados > 0 else 0

    # Alertas por Gravidade
    gravidade_data_raw = {}
    for alerta in normalized_alertas:
        gravidade_data_raw[alerta.gravidade] = gravidade_data_raw.get(alerta.gravidade, 0) + 1
    gravidade_data = [{
        "n": gravidade,
        "v": count
    } for gravidade, count in gravidade_data_raw.items()]

    # Gastos por Partido
    partidos_data_raw = {}
    for dep in normalized_deputados:
        if dep.partido:
            partidos_data_raw[dep.partido] = partidos_data_raw.get(dep.partido, 0) + dep.total_despesas
    partidos_data = sorted(
        [{
            "p": partido,
            "g": round(gasto, 2)
        } for partido, gasto in partidos_data_raw.items()],
        key=lambda x: x["g"], reverse=True
    )[:10] # Top 10

    payload = {
        "metadata": {
            "generatedAt": processed_at,
            "source": "etlpython-materialize",
            "version": version,
            "legislatura": legislatura,
        },
        "data": {
            "uiMetrics": {
                "td": total_deputados,
                "ta": total_alertas,
                "tg": round(total_gastos, 2),
                "mg": round(media_gastos, 2),
            },
            "uiChartData": {
                "alertas": gravidade_data,
                "partidos": partidos_data,
            },
        }
    }
    return payload

def build_categories_cache(
    normalized_fornecedores: Sequence[NormalizedFornecedor],
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    categories_map: Dict[str, Dict[str, Any]] = {}
    for fornecedor in normalized_fornecedores:
        for category_info in _load_categories(fornecedor):
            category_name = str(category_info.get("categoria") or category_info.get("nome") or "NÃO CLASSIFICADO")
            if category_name not in categories_map:
                categories_map[category_name] = {
                    "nome": category_name,
                    "totalGasto": 0.0,
                    "numeroTransacoes": 0,
                    "numeroFornecedores": 0,
                }
            categories_map[category_name]["totalGasto"] += fornecedor.total_recebido
            categories_map[category_name]["numeroTransacoes"] += fornecedor.numero_transacoes
            categories_map[category_name]["numeroFornecedores"] += 1 # Contagem simples, pode ser mais sofisticada

    categories_payload = []
    for category_name, data in categories_map.items():
        categories_payload.append({
            "id": hashlib.sha256(category_name.encode("utf-8")).hexdigest(), # Gerar um ID único para a categoria
            "nome": data["nome"],
            "totalGasto": round(data["totalGasto"], 2),
            "numeroTransacoes": data["numeroTransacoes"],
            "numeroFornecedores": data["numeroFornecedores"],
        })

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "version": version,
        "legislatura": legislatura,
        "totalCategorias": len(categories_payload),
    }

    return {"metadata": metadata, "data": categories_payload}

def build_alerts_cache(
    rows: Sequence[NormalizedAlerta],
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    alerts_payload = []
    for row in rows:
        alerts_payload.append(
            {
                "id": row.id,
                "tipo": row.tipo,
                "gravidade": row.gravidade,
                "deputado": row.deputado,
                "deputadoId": row.deputadoId,
                "descricao": row.descricao,
                "valor": row.valor,
                "dataDeteccao": row.dataDeteccao,
                "detalhes": row.detalhes,
            }
        )

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "version": version,
        "legislatura": legislatura,
        "totalAlertas": len(rows),
    }

    return {"metadata": metadata, "data": alerts_payload}

def build_supplier_detail_cache(
    supplier: NormalizedFornecedor,
    dataset_path: Path,
    *,
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    
    categorias = _load_categories(supplier)
    anos = _load_years(supplier)

    categoria_names = [
        str(cat.get("categoria") or cat.get("nome") or "NÃO CLASSIFICADO")
        for cat in categorias
        if isinstance(cat, dict)
    ]
    categoria_principal = categoria_names[0] if categoria_names else "NÃO CLASSIFICADO"

    distribuicao_tipos = {
        nome: {
            "valor": round(float(cat.get("total", 0)), 2),
            "quantidade": supplier.numero_transacoes,
        }
        for nome, cat in zip(categoria_names, categorias)
    }

    evolucao_anual = {
        str(item.get("ano")): {
            "valor": round(float(item.get("total", 0)), 2),
            "transacoes": int(item.get("numeroTransacoes", 0)),
            "deputados": int(item.get("numeroDeputados", 0)),
        }
        for item in anos
        if isinstance(item, dict) and item.get("ano") is not None
    }

    categorias_info = {
        "principal": categoria_principal,
        "normalizadas": categoria_names,
        "principalOriginal": categoria_principal,
        "originais": categoria_names,
    }

    payload = {
        "metadata": {
            "generatedAt": processed_at,
            "source": "etlpython-materialize",
            "arquivoFonte": dataset_path.name,
            "version": version,
            "legislatura": legislatura,
            "cnpj": supplier.cnpj_cpf or "",
        },
        "data": {
            "cnpj": supplier.cnpj_cpf or "",
            "nome": supplier.nome,
            "nomeFornecedor": supplier.nome,
            "totalTransacionado": supplier.total_recebido,
            "totalRecebido": supplier.total_recebido,
            "totalRecebidoTodos": supplier.total_recebido,
            "transacoes": supplier.numero_transacoes,
            "numeroTransacoes": supplier.numero_transacoes,
            "numeroDeputadosAtendidos": supplier.numero_deputados,
            "deputadosAtendidos": supplier.numero_deputados,
            "categoria": categoria_principal,
            "categoriaOriginal": categoria_principal,
            "categorias": categoria_names,
            "categoriasOriginais": categoria_names,
            "categoriasInfo": categorias_info,
            "distribuicaoTipos": distribuicao_tipos,
            "distribuicaoTiposOriginais": distribuicao_tipos,
            "scoreSuspeicao": supplier.score_suspeicao or 0,
            "evolucaoAnual": evolucao_anual,
            "alertas": _alertas_por_score(supplier.score_suspeicao),
            "medalhas": [],
            "padroesSazonais": {},
            "temDetalhes": bool(evolucao_anual),
        }
    }
    return payload

def build_suppliers_cache(
    rows: Sequence[NormalizedFornecedor],
    dataset_path: Path,
    *,
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    total_volume = sum(row.total_recebido for row in rows)
    unique_years: set[int] = set()

    suppliers_payload: List[Dict[str, Any]] = []

    for row in rows:
        categorias = _load_categories(row)
        anos = _load_years(row)

        if anos:
            for ano in anos:
                if isinstance(ano, dict) and isinstance(ano.get("ano"), int):
                    unique_years.add(ano["ano"])

        categoria_names = [
            str(cat.get("categoria") or cat.get("nome") or "NÃO CLASSIFICADO")
            for cat in categorias
            if isinstance(cat, dict)
        ]
        categoria_principal = categoria_names[0] if categoria_names else "NÃO CLASSIFICADO"

        distribuicao_tipos = {
            nome: {
                "valor": round(float(cat.get("total", 0)), 2),
                "quantidade": row.numero_transacoes,
            }
            for nome, cat in zip(categoria_names, categorias)
        }

        evolucao_anual = {
            str(item.get("ano")): {
                "valor": round(float(item.get("total", 0)), 2),
                "transacoes": int(item.get("numeroTransacoes", 0)),
                "deputados": int(item.get("numeroDeputados", 0)),
            }
            for item in anos
            if isinstance(item, dict) and item.get("ano") is not None
        }

        categorias_info = {
            "principal": categoria_principal,
            "normalizadas": categoria_names,
            "principalOriginal": categoria_principal,
            "originais": categoria_names,
        }

        suppliers_payload.append(
            {
                "cnpj": row.cnpj_cpf or "",
                "nome": row.nome,
                "nomeFornecedor": row.nome,
                "totalTransacionado": row.total_recebido,
                "totalRecebido": row.total_recebido,
                "totalRecebidoTodos": row.total_recebido,
                "transacoes": row.numero_transacoes,
                "numeroTransacoes": row.numero_transacoes,
                "numeroDeputadosAtendidos": row.numero_deputados,
                "deputadosAtendidos": row.numero_deputados,
                "categoria": categoria_principal,
                "categoriaOriginal": categoria_principal,
                "categorias": categoria_names,
                "categoriasOriginais": categoria_names,
                "categoriasInfo": categorias_info,
                "distribuicaoTipos": distribuicao_tipos,
                "distribuicaoTiposOriginais": distribuicao_tipos,
                "scoreSuspeicao": row.score_suspeicao or 0,
                "evolucaoAnual": evolucao_anual,
                "alertas": _alertas_por_score(row.score_suspeicao),
                "medalhas": [],
                "padroesSazonais": {},
                "temDetalhes": bool(evolucao_anual),
            }
        )

    total_deputados_estimado = sum(row.numero_deputados for row in rows)
    anos_ordenados = sorted(unique_years)

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "arquivoFonte": dataset_path.name,
        "version": version,
        "legislatura": legislatura,
        "totalFornecedores": len(rows),
        "totalDeputados": total_deputados_estimado,
        "valorTotalGeral": round(total_volume, 2),
        "periodoAnalise": {
            "anos": anos_ordenados,
            "inicio": anos_ordenados[0] if anos_ordenados else None,
            "fim": anos_ordenados[-1] if anos_ordenados else None,
            "geradoEm": processed_at.split("T")[0],
        },
    }

    return {"metadata": metadata, "data": suppliers_payload}

def generate_frontend_caches(
    normalized_fornecedores: Sequence[NormalizedFornecedor],
    normalized_deputados: Sequence[NormalizedDeputado],
    fornecedores_dataset_path: Path,
    deputados_dataset_path: Path,
    project_root: Path,
    *,
    legislatura: int,
    version: str,
) -> None:
    cache_dir = project_root / DEFAULT_CACHE_DIR
    cache_dir.mkdir(exist_ok=True, parents=True)

    # Generate caches
    suppliers_cache = build_suppliers_cache(
        normalized_fornecedores, fornecedores_dataset_path, legislatura=legislatura, version=version
    )
    deputies_cache = build_deputies_cache(
        normalized_deputados, deputados_dataset_path, legislatura=legislatura, version=version
    )
    normalized_alertas = generate_alertas(normalized_deputados, normalized_fornecedores)
    alerts_cache = build_alerts_cache(normalized_alertas, legislatura=legislatura, version=version)
    premiacoes_cache = build_premiacoes_cache(
        generate_premiacoes(normalized_deputados), legislatura=legislatura, version=version
    )
    analysis_cache = build_analysis_cache(
        normalized_deputados, normalized_alertas, legislatura=legislatura, version=version
    )
    categories_cache = build_categories_cache(
        normalized_fornecedores, legislatura=legislatura, version=version
    )

    # Generate detail caches
    for supplier in normalized_fornecedores:
        supplier_detail_cache = build_supplier_detail_cache(
            supplier, fornecedores_dataset_path, legislatura=legislatura, version=version
        )
        supplier_detail_path = cache_dir / f"supplier-{supplier.cnpj_cpf}.json"
        with supplier_detail_path.open("w", encoding="utf-8") as fh:
            json.dump(supplier_detail_cache, fh, ensure_ascii=False, indent=2)

    for deputy in normalized_deputados:
        deputy_detail_cache = build_deputy_detail_cache(
            deputy, deputados_dataset_path, legislatura=legislatura, version=version
        )
        deputy_detail_path = cache_dir / f"deputy-{deputy.id}.json"
        with deputy_detail_path.open("w", encoding="utf-8") as fh:
            json.dump(deputy_detail_cache, fh, ensure_ascii=False, indent=2)

    # Write caches to files
    caches = {
        "suppliers-cache.json": suppliers_cache,
        "deputies-cache.json": deputies_cache,
        "alerts-cache.json": alerts_cache,
        "premiacoes-cache.json": premiacoes_cache,
        "analysis-cache.json": analysis_cache,
        "categories-cache.json": categories_cache,
    }

    manifest = {}
    for filename, content in caches.items():
        path = cache_dir / filename
        with path.open("w", encoding="utf-8") as fh:
            json.dump(content, fh, ensure_ascii=False, indent=2)
        manifest[filename] = {
            "path": f"/cache/{filename}",
            "lastModified": datetime.now(timezone.utc).isoformat(),
        }

    manifest_path = cache_dir / "caches-manifest.json"
    with manifest_path.open("w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2)

    console.log(f"✅ Caches do frontend gerados em {cache_dir}")


def main():
    parser = argparse.ArgumentParser(description="Materialize fornecedores dataset.")
    parser.add_argument("--fornecedores-dataset", help="Caminho para o dataset de fornecedores JSON")
    parser.add_argument("--deputados-dataset", help="Caminho para o dataset de deputados JSON")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help="Caminho para o banco de dados SQLite de saída")
    parser.add_argument("--legislatura", type=int, required=True, help="Legislatura dos dados")
    parser.add_argument("--cache-version", required=True, help="Versão do cache a ser gerada")
    args = parser.parse_args()

    console.log(f"CWD: {Path.cwd()}")
    project_root = find_project_root(Path.cwd())
    console.log(f"Project Root: {project_root}")
    fornecedores_dataset_path = resolve_path(
        args.fornecedores_dataset, project_root, defaults=DEFAULT_DATASET_CANDIDATES
    )
    deputados_dataset_path = resolve_path(
        args.deputados_dataset, project_root, defaults=()
    )
    output_path = (project_root / args.output).resolve()
    output_path.parent.mkdir(exist_ok=True, parents=True)

    console.log(f"🗃️  Dataset de fornecedores: {fornecedores_dataset_path}")
    console.log(f"🗃️  Dataset de deputados: {deputados_dataset_path}")
    console.log(f"💾 Banco de dados de saída: {output_path}")

    raw_fornecedores = load_dataset(fornecedores_dataset_path)
    raw_deputados = load_dataset(deputados_dataset_path)

    normalized_fornecedores = normalize_fornecedores(raw_fornecedores)
    normalized_deputados = normalize_deputados(raw_deputados)

    conn = sqlite3.connect(output_path)
    create_schema(conn)

    insert_batch(conn, "fornecedores", [f.as_tuple() for f in normalized_fornecedores])
    insert_batch(conn, "deputados", [d.as_tuple() for d in normalized_deputados])

    normalized_alertas = generate_alertas(normalized_deputados, normalized_fornecedores)
    insert_batch(conn, "alertas", [a.as_tuple() for a in normalized_alertas])

    normalized_premiacoes = generate_premiacoes(normalized_deputados)
    insert_batch(conn, "premiacoes", [p.as_tuple() for p in normalized_premiacoes])

    conn.close()

    generate_frontend_caches(
        normalized_fornecedores,
        normalized_deputados,
        fornecedores_dataset_path,
        deputados_dataset_path,
        project_root,
        legislatura=args.legislatura,
        version=args.cache_version,
    )

    table = Table(title="Resumo da Materialização")
    table.add_column("Item", style="cyan")
    table.add_column("Total", style="magenta")
    table.add_row("Fornecedores", str(len(normalized_fornecedores)))
    table.add_row("Deputados", str(len(normalized_deputados)))
    table.add_row("Alertas", str(len(normalized_alertas)))
    table.add_row("Premiações", str(len(normalized_premiacoes)))
    console.print(table)


if __name__ == "__main__":
    main()

