
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

from .rankings_premiacoes import (
    gerar_rankings_deputados,
    gerar_premiacoes_deputados,
    gerar_rankings_fornecedores,
    gerar_premiacoes_fornecedores,
    load_detailed_deputados_data,
    process_detailed_data,
    gerar_premiacoes_completas
)

console = Console()

# Rota única canônica definida pela estrutura do ETL principal
DEFAULT_DATASET_CANDIDATES = (
    "bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json",
)

DEFAULT_OUTPUT = "bancoDados/monitordespesas/monitordespesas.db"
DEFAULT_CACHE_DIR = "bancoDados/monitordespesas/congressoNacional/cache"


def normalize_supplier_alias(value: Optional[str]) -> Optional[str]:
    """Normalize supplier identifier (CNPJ, ID, or name) for lookup."""
    if not value:
        return None
    
    # If it's a CNPJ/CPF, normalize by keeping only digits
    if any(c.isdigit() for c in value):
        normalized = ''.join(filter(str.isdigit, value))
        if normalized:
            return normalized
    
    # Otherwise, normalize as a string key (lowercase, stripped)
    normalized = value.strip().lower()
    return normalized if normalized else None


def _normalize_deputado_id(value: Any) -> Optional[str]:
    if value is None:
        return None
    key = str(value).strip()
    return key or None


def _lookup_deputado_info(
    deputados_info: Optional[Dict[str, Any]],
    deputado_id: Any
) -> Optional[Dict[str, Any]]:
    if not deputados_info:
        return None
    key = _normalize_deputado_id(deputado_id)
    if not key:
        return None
    return deputados_info.get(key)


def _enrich_deputado_summary(
    entry: Dict[str, Any],
    info: Optional[Dict[str, Any]],
    fallback_label: str
) -> Dict[str, Any]:
    enriched = dict(entry)

    dep_id = enriched.get('id') or enriched.get('deputadoId') or enriched.get('codigo')
    if info and info.get('id') is not None:
        dep_id = info.get('id')

    dep_id_str = _normalize_deputado_id(dep_id)
    if dep_id_str:
        enriched['id'] = dep_id_str

    nome_info = info.get('nomeEleitoral') or info.get('nome') if info else None
    nome_atual = enriched.get('nomeEleitoral') or enriched.get('nome')
    nome_final = nome_info or nome_atual or fallback_label
    enriched['nomeEleitoral'] = nome_final
    enriched['nome'] = nome_final

    if info:
        partido = info.get('siglaPartido') or info.get('partido')
        uf = info.get('siglaUf') or info.get('uf')
        if partido:
            enriched['siglaPartido'] = partido
        if uf:
            enriched['siglaUf'] = uf

    return enriched


def _enrich_transacao_record(
    record: Dict[str, Any],
    info: Optional[Dict[str, Any]],
    fallback_label: str
) -> Dict[str, Any]:
    enriched = dict(record)

    dep_id = (
        enriched.get('deputadoId')
        or enriched.get('idDeputado')
        or enriched.get('deputadoCodigo')
        or enriched.get('deputado_id')
    )

    if info and info.get('id') is not None:
        dep_id = info.get('id')

    dep_id_str = _normalize_deputado_id(dep_id)
    if dep_id_str:
        enriched['deputadoId'] = dep_id_str
        enriched['idDeputado'] = dep_id_str

    nome_info = info.get('nomeEleitoral') or info.get('nome') if info else None
    nome_atual = (
        enriched.get('deputadoNome')
        or enriched.get('nomeDeputado')
        or enriched.get('txNomeParlamentar')
        or enriched.get('nomeEleitoral')
    )
    nome_final = nome_info or nome_atual or fallback_label

    enriched['deputadoNome'] = nome_final
    enriched['nomeDeputado'] = nome_final
    enriched['txNomeParlamentar'] = nome_final
    if 'nomeEleitoral' in enriched and not enriched['nomeEleitoral']:
        enriched['nomeEleitoral'] = nome_final

    if info:
        partido = info.get('siglaPartido') or info.get('partido')
        uf = info.get('siglaUf') or info.get('uf')
        if partido:
            enriched['siglaPartido'] = partido
        if uf:
            enriched['siglaUf'] = uf

    return enriched


def _enrich_deputados_collection(
    deputados: Optional[Iterable[Any]],
    deputados_info: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    if not deputados:
        return []

    enriched_list: List[Dict[str, Any]] = []
    for index, item in enumerate(deputados, start=1):
        fallback_label = f'Deputado {index}'
        if isinstance(item, dict):
            dep_id = item.get('id') or item.get('deputadoId') or item.get('codigo')
            info = _lookup_deputado_info(deputados_info, dep_id)
            enriched_list.append(_enrich_deputado_summary(item, info, fallback_label))
        else:
            info = _lookup_deputado_info(deputados_info, item)
            base: Dict[str, Any] = {}
            dep_id_str = _normalize_deputado_id(item)
            if dep_id_str:
                base['id'] = dep_id_str
            enriched_list.append(_enrich_deputado_summary(base, info, fallback_label))
    return enriched_list


def _enrich_transacoes_collection(
    colecao: Optional[Iterable[Any]],
    deputados_info: Optional[Dict[str, Any]]
) -> List[Any]:
    if not colecao:
        return []

    enriched_list: List[Any] = []
    for index, item in enumerate(colecao, start=1):
        if isinstance(item, dict):
            dep_id = (
                item.get('deputadoId')
                or item.get('idDeputado')
                or item.get('deputadoCodigo')
                or item.get('deputado_id')
            )
            info = _lookup_deputado_info(deputados_info, dep_id)
            enriched_list.append(_enrich_transacao_record(item, info, f'Deputado {index}'))
        else:
            enriched_list.append(item)
    return enriched_list


def _hydrate_existing_relationships(
    cache_dir: Path,
    deputados_info: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    file_path = cache_dir / "supplier-deputy-relations-cache.json"
    if not file_path.exists() or not deputados_info:
        return None

    try:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
    except Exception:
        return None

    dados = payload.get('data')
    if not isinstance(dados, list):
        return None

    for item in dados:
        if not isinstance(item, dict):
            continue
        item['deputados'] = _enrich_deputados_collection(item.get('deputados', []), deputados_info)
        item['topTransacoes'] = _enrich_transacoes_collection(item.get('topTransacoes', []), deputados_info)

    return payload


def _locate_repo_root(start: Path) -> Optional[Path]:
    current = start.resolve()
    while True:
        if (current / "pnpm-workspace.yaml").exists() or (current / ".git").exists():
            return current
        if current.parent == current:
            return None
        current = current.parent


def find_project_root(start: Path) -> Path:
    """Ascend directories until a repo root is found."""
    start_resolved = start.resolve()
    located = _locate_repo_root(start_resolved)
    if located:
        return located

    module_root = Path(__file__).resolve().parent
    located = _locate_repo_root(module_root)
    if located:
        return located

    return start_resolved


def _clamp_relative_to_project(project_root: Path, relative: Path) -> Path:
    """Resolve ``relative`` against ``project_root`` without escaping the repo."""
    result = project_root.resolve()
    root_boundary = result
    for part in relative.parts:
        if not part or part == ".":
            continue
        if part == "..":
            # Prevent ``..`` from escaping the repository root.
            if result == root_boundary:
                continue
            result = result.parent
            continue
        result = (result / part).resolve()
    return result


def resolve_path(candidate: Optional[str], project_root: Path, *, defaults: Sequence[str]) -> Path:
    if candidate:
        candidate_path = Path(candidate)
        attempts: List[Path] = []

        if candidate_path.is_absolute():
            attempts.append(candidate_path.resolve())
        else:
            attempts.append(_clamp_relative_to_project(project_root, candidate_path))
            attempts.append((project_root / candidate_path).resolve())
            attempts.append((Path.cwd() / candidate_path).resolve())
            attempts.append(candidate_path.resolve())

        # Remove duplicatas preservando ordem
        unique_attempts: List[Path] = []
        for path in attempts:
            if path not in unique_attempts:
                unique_attempts.append(path)

        for resolved in unique_attempts:
            if resolved.exists():
                return resolved

        console.log(f"Tentando resolver: {candidate}")
        console.log("Caminhos verificados:")
        for resolved in unique_attempts:
            console.log(f"  • {resolved}")
        raise FileNotFoundError(
            "Dataset informado não encontrado nos caminhos verificados. "
            "Confirme o diretório atual ou utilize um caminho absoluto."
        )

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
    nome_eleitoral: Optional[str]
    nome_civil: Optional[str]
    partido: Optional[str]
    sigla_partido: Optional[str]
    uf: Optional[str]
    sigla_uf: Optional[str]
    foto_url: Optional[str]
    total_despesas: float
    numero_despesas: int
    fornecedores_identificados: int
    created_at: str

    def as_tuple(self) -> tuple:
        return (
            self.id,
            self.nome,
            self.nome_eleitoral,
            self.partido,
            self.sigla_partido,
            self.uf,
            self.sigla_uf,
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

    for forn in normalized_fornecedores:
        score = forn.score_suspeicao
        if score is None:
            continue

        if score >= 80:
            gravidade = "ALTA"
        elif score >= 60:
            gravidade = "MEDIA"
        elif score >= 40:
            gravidade = "BAIXA"
        else:
            continue

        alertas.append(
            NormalizedAlerta(
                id=f"ALERTA-SCORE-SUSPEICAO-{forn.id}",
                tipo="SCORE_SUSPEICAO_FORNECEDOR",
                gravidade=gravidade,
                deputado="MÚLTIPLOS",
                deputadoId="",
                descricao=f"Fornecedor {forn.nome} registrou score de suspeição {score:,.2f}",
                valor=forn.total_recebido,
                dataDeteccao=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
                detalhes={
                    "fornecedor_nome": forn.nome,
                    "cnpj_cpf": forn.cnpj_cpf,
                    "score_suspeicao": score,
                    "total_recebido": forn.total_recebido,
                    "numero_transacoes": forn.numero_transacoes,
                },
            )
        )

    return alertas

def normalize_deputados(raw_entries: Iterable[Dict[str, Any]]) -> List[NormalizedDeputado]:
    normalized_map: Dict[str, NormalizedDeputado] = {}

    for index, entry in enumerate(raw_entries):
        try:
            deputado_id = str(_first_present(entry, "id"))
            nome = _first_present(entry, "nome")
            if not nome:
                raise ValueError("Campo 'nome' é obrigatório")

            nome_eleitoral = _first_present(entry, "nomeEleitoral", "nome_eleitoral", default=None)
            nome_civil = _first_present(entry, "nomeCivil", default=None)
            sigla_partido = _first_present(entry, "siglaPartido", "partido", default=None)
            sigla_uf = _first_present(entry, "siglaUf", "uf", default=None)
            foto_url = _first_present(entry, "urlFoto", "fotoUrl", "foto", default=None)
            total_despesas = float(_first_present(entry, "total_despesas", default=0))
            numero_despesas = int(_first_present(entry, "numero_despesas", default=0))
            fornecedores_identificados = int(_first_present(entry, "fornecedores_identificados", default=0))
            created_at = _first_present(entry, "created_at", default=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"))

            normalized_map[deputado_id] = NormalizedDeputado(
                id=deputado_id,
                nome=nome,
                nome_eleitoral=nome_eleitoral or nome,
                nome_civil=nome_civil,
                partido=sigla_partido,
                sigla_partido=sigla_partido,
                uf=sigla_uf,
                sigla_uf=sigla_uf,
                foto_url=foto_url,
                total_despesas=total_despesas,
                numero_despesas=numero_despesas,
                fornecedores_identificados=fornecedores_identificados,
                created_at=created_at,
            )
        except (ValueError, TypeError) as exc:
            console.log(f"Erro ao normalizar deputado no índice {index}: {exc}")
            console.log(entry)

    return list(normalized_map.values())

def normalize_fornecedores(raw_entries: Iterable[Dict[str, Any]]) -> List[NormalizedFornecedor]:
    normalized: List[NormalizedFornecedor] = []
    current_time = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    for index, entry in enumerate(raw_entries):
        try:
            nome = _first_present(entry, "nome", "fornecedor_nome")
            if not nome:
                raise ValueError("Campo 'nome' é obrigatório")

            # Legacy compat: some entries have `fornecedor` prefix or use `documento`
            # Some suppliers like "TAM" may not have a documento
            cnpj_cpf = _first_present(entry, "documento", "cnpj_cpf", "fornecedor_cnpj_cpf")
            
            # Legacy compat: some entries have `id` as number
            # Use nome as fallback ID if no documento or id is available
            fornecedor_id = str(_first_present(entry, "id", default=cnpj_cpf or nome))

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
                        _first_present(entry, "numero_legisladores", "numero_deputados", default=0)
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
            nome_eleitoral TEXT,
            partido TEXT,
            sigla_partido TEXT,
            uf TEXT,
            sigla_uf TEXT,
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


def _fallback_deputados_atendidos(
    existentes: Optional[List[Dict[str, Any]]],
    *colecoes: Optional[Iterable[Dict[str, Any]]],
    deputados_info: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """Garante que sempre retornemos uma lista de deputados atendidos."""

    if existentes:
        resultado: List[Dict[str, Any]] = []
        for index, item in enumerate(existentes, start=1):
            if not isinstance(item, dict):
                continue
            dep_id = item.get('id') or item.get('deputadoId') or item.get('codigo')
            info = _lookup_deputado_info(deputados_info, dep_id)
            resultado.append(_enrich_deputado_summary(item, info, f'Deputado {index}'))
        if resultado:
            return resultado

    acumulado: Dict[str, Dict[str, Any]] = {}
    fallback_index = 1

    for colecao in colecoes:
        if not colecao:
            continue
        for transacao in colecao:
            if not isinstance(transacao, dict):
                continue

            dep_id_raw = transacao.get('deputadoId') or transacao.get('idDeputado')
            nome = (
                transacao.get('nomeEleitoral')
                or transacao.get('nomeDeputado')
                or transacao.get('deputadoNome')
                or transacao.get('txNomeParlamentar')
            )

            if dep_id_raw is None and not nome:
                continue

            chave = str(dep_id_raw).strip() if dep_id_raw is not None else (nome or '').strip()
            if not chave:
                continue

            registro = acumulado.get(chave)
            if not registro:
                info = _lookup_deputado_info(deputados_info, dep_id_raw)
                base_nome = nome or (info.get('nomeEleitoral') if info else None)
                registro = {
                    'id': _normalize_deputado_id(dep_id_raw) or f"dep_fallback_{fallback_index}",
                    'nomeEleitoral': base_nome or f"Deputado {fallback_index}",
                    'nome': base_nome or f"Deputado {fallback_index}",
                    'siglaPartido': transacao.get('siglaPartido'),
                    'siglaUf': transacao.get('siglaUf'),
                    'totalGasto': 0.0,
                    'transacoes': 0
                }
                if info:
                    registro = _enrich_deputado_summary(registro, info, registro['nomeEleitoral'])
                acumulado[chave] = registro
                fallback_index += 1

            valor = transacao.get('valorLiquido') or transacao.get('valor') or transacao.get('valorDocumento')
            try:
                registro['totalGasto'] += float(valor or 0)
            except (TypeError, ValueError):
                pass
            registro['transacoes'] += 1

    if not acumulado:
        return []

    resultado_final: List[Dict[str, Any]] = []
    for index, item in enumerate(acumulado.values(), start=1):
        info = _lookup_deputado_info(deputados_info, item.get('id'))
        resumo = {
            'id': item.get('id'),
            'nome': item.get('nome'),
            'nomeEleitoral': item.get('nomeEleitoral'),
            'siglaPartido': item.get('siglaPartido'),
            'siglaUf': item.get('siglaUf'),
            'totalGasto': round(item.get('totalGasto', 0), 2),
            'transacoes': item.get('transacoes')
        }
        resultado_final.append(_enrich_deputado_summary(resumo, info, f'Deputado {index}'))

    return resultado_final


def _resolve_supplier_enrichment(
    supplier: NormalizedFornecedor,
    enrichments: Optional[Dict[str, Any]],
    alias_map: Optional[Dict[str, str]]
) -> Optional[Dict[str, Any]]:
    if not enrichments:
        return None

    candidates: List[Optional[str]] = []
    if supplier.cnpj_cpf:
        candidates.append(supplier.cnpj_cpf)
    candidates.extend([supplier.id, supplier.nome])

    for candidate in candidates:
        alias = normalize_supplier_alias(candidate)
        if not alias:
            continue
        canonical = alias_map.get(alias) if alias_map else alias
        if canonical in enrichments:
            return enrichments[canonical]

    return None


def build_deputy_detail_cache(
    deputy: NormalizedDeputado,
    dataset_path: Path,
    *,
    legislatura: int,
    version: str,
    deputy_info: Optional[Dict[str, Any]] = None,
    deputy_relations: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    info = deputy_info or {}
    relations = deputy_relations or {}

    gastos_por_ano = relations.get('gastosPorAno', {})
    transacoes_por_ano = {
        ano: dados.get('transacoes', 0)
        for ano, dados in gastos_por_ano.items()
    }

    transacoes_detalhadas = relations.get('transacoes', [])

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
            "nomeEleitoral": info.get('nomeEleitoral') or deputy.nome_eleitoral or deputy.nome,
            "nomeCivil": info.get('nomeCivil') or deputy.nome_civil,
            "partido": info.get('siglaPartido') or deputy.partido,
            "siglaPartido": info.get('siglaPartido') or deputy.sigla_partido or deputy.partido,
            "uf": info.get('siglaUf') or deputy.uf,
            "siglaUf": info.get('siglaUf') or deputy.sigla_uf or deputy.uf,
            "urlFoto": info.get('urlFoto') or deputy.foto_url,
            "totalDespesas": deputy.total_despesas,
            "numeroDespesas": deputy.numero_despesas,
            "fornecedoresIdentificados": deputy.fornecedores_identificados,
            "createdAt": deputy.created_at,
            "gastosPorAno": gastos_por_ano,
            "transacoesPorAno": transacoes_por_ano,
            "topCategorias": relations.get('categorias', []),
            "topFornecedores": relations.get('fornecedores', []),
            "topTransacoes": relations.get('topTransacoes', []),
            "transacoesDetalhadas": transacoes_detalhadas,
            "totalTransacoesDetalhadas": len(transacoes_detalhadas),
            "temDetalhes": bool(relations),
        }
    }
    return payload

def build_deputies_cache(
    rows: Sequence[NormalizedDeputado],
    dataset_path: Path,
    *,
    legislatura: int,
    version: str,
    deputados_info: Optional[Dict[str, Any]] = None,
    deputados_relacoes: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    info_map = deputados_info or {}
    rel_map = deputados_relacoes or {}

    deputies_payload: List[Dict[str, Any]] = []

    for row in rows:
        info = info_map.get(str(row.id), {})
        rel = rel_map.get(str(row.id), {})
        gastos_por_ano = rel.get('gastosPorAno', {})
        transacoes_por_ano = {
            ano: dados.get('transacoes', 0)
            for ano, dados in gastos_por_ano.items()
        }
        total_transacoes_detalhadas = len(rel.get('transacoes', [])) if rel else 0

        deputies_payload.append(
            {
                "id": row.id,
                "nome": row.nome,
                "nomeEleitoral": info.get('nomeEleitoral') or row.nome_eleitoral or row.nome,
                "nomeCivil": info.get('nomeCivil') or row.nome_civil,
                "partido": info.get('siglaPartido') or row.partido,
                "siglaPartido": info.get('siglaPartido') or row.sigla_partido or row.partido,
                "uf": info.get('siglaUf') or row.uf,
                "siglaUf": info.get('siglaUf') or row.sigla_uf or row.uf,
                "foto": info.get('urlFoto') or row.foto_url or "",
                "totalDespesas": row.total_despesas,
                "numeroDespesas": row.numero_despesas,
                "fornecedoresIdentificados": row.fornecedores_identificados,
                "gastosPorAno": gastos_por_ano,
                "transacoesPorAno": transacoes_por_ano,
                "topCategorias": rel.get('categorias', [])[:10],
                "topFornecedores": rel.get('fornecedores', [])[:10],
                "topTransacoes": rel.get('topTransacoes', [])[:10],
                "totalTransacoesDetalhadas": total_transacoes_detalhadas,
                "dadosCompletos": bool(rel),
                "createdAt": row.created_at,
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
    version: str,
    enrichment: Optional[Dict[str, Any]] = None,
    deputados_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    categorias_raw = _load_categories(supplier)
    anos_raw = _load_years(supplier)

    enriched_deputados = (enrichment or {}).get('deputados', [])
    enriched_categorias = (enrichment or {}).get('categorias') or []
    enriched_anos = (enrichment or {}).get('anos') or {}
    top_transacoes = _enrich_transacoes_collection((enrichment or {}).get('topTransacoes', []), deputados_info)
    transacoes_detalhadas = _enrich_transacoes_collection((enrichment or {}).get('transacoes', []), deputados_info)
    enriched_deputados = _fallback_deputados_atendidos(
        _enrich_deputados_collection(enriched_deputados, deputados_info),
        transacoes_detalhadas,
        top_transacoes,
        deputados_info=deputados_info
    )

    if enriched_categorias:
        categoria_principal = enriched_categorias[0].get('categoria', 'NÃO CLASSIFICADO')
        distribuicao_tipos = {
            item.get('categoria', 'NÃO CLASSIFICADO'): {
                'valor': round(float(item.get('valor', 0)), 2),
                'quantidade': int(item.get('transacoes', 0)),
            }
            for item in enriched_categorias
        }
        categoria_names = [item.get('categoria', 'NÃO CLASSIFICADO') for item in enriched_categorias]
    else:
        categoria_names = [
            str(cat.get("categoria") or cat.get("nome") or "NÃO CLASSIFICADO")
            for cat in categorias_raw
            if isinstance(cat, dict)
        ]
        categoria_principal = categoria_names[0] if categoria_names else "NÃO CLASSIFICADO"
        distribuicao_tipos = {
            nome: {
                "valor": round(float(cat.get("total", 0)), 2),
                "quantidade": supplier.numero_transacoes,
            }
            for nome, cat in zip(categoria_names, categorias_raw)
        }

    if enriched_anos:
        evolucao_anual = {
            ano: {
                'valor': round(float(dados.get('valor', 0)), 2),
                'transacoes': dados.get('transacoes', 0),
                'deputados': dados.get('deputados', 0)
            }
            for ano, dados in enriched_anos.items()
        }
    else:
        evolucao_anual = {
            str(item.get("ano")): {
                "valor": round(float(item.get("total", 0)), 2),
                "transacoes": int(item.get("numeroTransacoes", 0)),
                "deputados": int(item.get("numeroDeputados", 0)),
            }
            for item in anos_raw
            if isinstance(item, dict) and item.get("ano") is not None
        }

    categorias_info = {
        "principal": categoria_principal,
        "normalizadas": categoria_names,
        "principalOriginal": categoria_principal,
        "originais": categoria_names,
    }

    total_valor = (enrichment or {}).get('totalGasto', supplier.total_recebido)
    total_transacoes = (enrichment or {}).get('totalTransacoes', supplier.numero_transacoes)
    numero_deputados = len(enriched_deputados) if enriched_deputados else supplier.numero_deputados

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
            "totalTransacionado": round(total_valor, 2),
            "totalRecebido": round(total_valor, 2),
            "totalRecebidoTodos": round(total_valor, 2),
            "transacoes": total_transacoes,
            "numeroTransacoes": total_transacoes,
            "numeroDeputadosAtendidos": numero_deputados,
            "deputadosAtendidos": enriched_deputados,
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
            "topTransacoes": top_transacoes,
            "transacoesDetalhadas": transacoes_detalhadas,
            "totalTransacoesDetalhadas": len(transacoes_detalhadas),
            "aliases": (enrichment or {}).get('aliases', []),
            "temDetalhes": bool(
                enriched_deputados or top_transacoes or transacoes_detalhadas or evolucao_anual
            ),
        }
    }
    return payload

def build_suppliers_cache(
    rows: Sequence[NormalizedFornecedor],
    dataset_path: Path,
    *,
    legislatura: int,
    version: str,
    enrichments: Optional[Dict[str, Any]] = None,
    alias_map: Optional[Dict[str, str]] = None,
    deputados_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    total_volume = sum(row.total_recebido for row in rows)
    unique_years: set[int] = set()

    suppliers_payload: List[Dict[str, Any]] = []

    for row in rows:
        enrichment = _resolve_supplier_enrichment(row, enrichments, alias_map)
        categorias = _load_categories(row) if not enrichment else []
        anos = _load_years(row) if not enrichment else []

        if anos:
            for ano in anos:
                if isinstance(ano, dict) and isinstance(ano.get("ano"), int):
                    unique_years.add(ano["ano"])

        if enrichment and enrichment.get('categorias'):
            categoria_names = [item.get('categoria', 'NÃO CLASSIFICADO') for item in enrichment['categorias']]
            categoria_principal = categoria_names[0] if categoria_names else "NÃO CLASSIFICADO"
            distribuicao_tipos = {
                item.get('categoria', 'NÃO CLASSIFICADO'): {
                    'valor': round(float(item.get('valor', 0)), 2),
                    'quantidade': int(item.get('transacoes', 0)),
                }
                for item in enrichment['categorias']
            }
        else:
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

        if enrichment and enrichment.get('anos'):
            evolucao_anual = {
                ano: {
                    'valor': round(float(dados.get('valor', 0)), 2),
                    'transacoes': dados.get('transacoes', 0),
                    'deputados': dados.get('deputados', 0)
                }
                for ano, dados in enrichment['anos'].items()
            }
        else:
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

        enriched_deputados = _enrich_deputados_collection(
            enrichment.get('deputados', []) if enrichment else [],
            deputados_info
        )
        top_transacoes = _enrich_transacoes_collection(
            enrichment.get('topTransacoes', []) if enrichment else [],
            deputados_info
        )
        transacoes_detalhadas = _enrich_transacoes_collection(
            enrichment.get('transacoes', []) if enrichment else [],
            deputados_info
        )
        enriched_deputados = _fallback_deputados_atendidos(
            enriched_deputados,
            transacoes_detalhadas,
            top_transacoes,
            deputados_info=deputados_info
        )
        total_valor = enrichment.get('totalGasto', row.total_recebido) if enrichment else row.total_recebido
        total_transacoes = enrichment.get('totalTransacoes', row.numero_transacoes) if enrichment else row.numero_transacoes
        numero_deputados = len(enriched_deputados) if enriched_deputados else row.numero_deputados
        total_transacoes_detalhadas = len(transacoes_detalhadas) if transacoes_detalhadas else total_transacoes

        suppliers_payload.append(
            {
                "cnpj": row.cnpj_cpf or "",
                "nome": row.nome,
                "nomeFornecedor": row.nome,
                "totalTransacionado": round(total_valor, 2),
                "totalRecebido": round(total_valor, 2),
                "totalRecebidoTodos": round(total_valor, 2),
                "transacoes": total_transacoes,
                "numeroTransacoes": total_transacoes,
                "totalTransacoesDetalhadas": total_transacoes_detalhadas,
                "numeroDeputadosAtendidos": numero_deputados,
                "deputadosAtendidos": enriched_deputados if enriched_deputados else [],
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
                "topTransacoes": top_transacoes,
                "aliases": (enrichment or {}).get('aliases', []) if enrichment else [],
                "temDetalhes": bool(enrichment or evolucao_anual),
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


def build_category_transactions_cache(
    categorias_resumo: Dict[str, Any],
    *,
    legislatura: int,
    version: str
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    categorias_payload: List[Dict[str, Any]] = []
    for categoria, dados in categorias_resumo.items():
        categorias_payload.append({
            "categoria": categoria,
            "totalGasto": round(dados.get('totalGasto', 0), 2),
            "totalTransacoes": dados.get('totalTransacoes', 0),
            "anos": dados.get('anos', {}),
            "topDeputados": dados.get('deputados', [])[:50],
        })

    categorias_payload.sort(key=lambda item: item['totalGasto'], reverse=True)

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "version": version,
        "legislatura": legislatura,
        "totalCategorias": len(categorias_payload),
    }

    return {"metadata": metadata, "data": {"categorias": categorias_payload}}


def build_supplier_relationships_cache(
    fornecedores_enrichment: Dict[str, Any],
    *,
    legislatura: int,
    version: str,
    deputados_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    fornecedores_payload: List[Dict[str, Any]] = []
    for chave, dados in fornecedores_enrichment.items():
        deputados_enriquecidos = _enrich_deputados_collection(dados.get('deputados', []), deputados_info)[:100]
        top_transacoes = _enrich_transacoes_collection(dados.get('topTransacoes', []), deputados_info)[:50]
        fornecedores_payload.append({
            "id": chave,
            "cnpj": dados.get('cnpj'),
            "nome": dados.get('nome'),
            "totalGasto": round(dados.get('totalGasto', 0), 2),
            "totalTransacoes": dados.get('totalTransacoes', 0),
            "deputados": deputados_enriquecidos,
            "categorias": dados.get('categorias', [])[:50],
            "anos": dados.get('anos', {}),
            "topTransacoes": top_transacoes,
            "aliases": dados.get('aliases', []),
        })

    fornecedores_payload.sort(key=lambda item: item['totalGasto'], reverse=True)

    metadata = {
        "generatedAt": processed_at,
        "source": "etlpython-materialize",
        "version": version,
        "legislatura": legislatura,
        "totalFornecedores": len(fornecedores_payload),
    }

    return {"metadata": metadata, "data": fornecedores_payload}

def generate_frontend_caches(
    normalized_fornecedores: Sequence[NormalizedFornecedor],
    normalized_deputados: Sequence[NormalizedDeputado],
    fornecedores_dataset_path: Path,
    deputados_dataset_path: Path,
    project_root: Path,
    *,
    legislatura: int,
    version: str,
    dados_processados: Optional[Dict[str, Any]] = None,
    deputados_index: Optional[Dict[int, Any]] = None,
) -> None:
    cache_dir = project_root / DEFAULT_CACHE_DIR
    cache_dir.mkdir(exist_ok=True, parents=True)

    fornecedores_enrichment = (dados_processados or {}).get('fornecedores_relacoes', {})
    fornecedores_alias_map = (dados_processados or {}).get('fornecedores_alias_map', {})
    deputados_relations = (dados_processados or {}).get('deputados_relacoes', {})
    deputados_info = (dados_processados or {}).get('deputados_info', {})
    categorias_resumo = (dados_processados or {}).get('categorias_resumo', {})

    deputados_lookup: Dict[str, Any] = {}
    for key, value in (deputados_info or {}).items():
        deputados_lookup[str(key)] = dict(value)

    for dep in normalized_deputados:
        dep_key = str(dep.id)
        entry = deputados_lookup.setdefault(dep_key, {})
        entry.setdefault('id', dep.id)
        entry.setdefault('nome', dep.nome)
        entry.setdefault('nomeEleitoral', dep.nome_eleitoral or dep.nome)
        entry.setdefault('siglaPartido', dep.sigla_partido or dep.partido)
        entry.setdefault('siglaUf', dep.sigla_uf or dep.uf)

    if fornecedores_enrichment and deputados_lookup:
        for dados in fornecedores_enrichment.values():
            dados['deputados'] = _enrich_deputados_collection(dados.get('deputados', []), deputados_lookup)
            dados['transacoes'] = _enrich_transacoes_collection(dados.get('transacoes', []), deputados_lookup)
            dados['topTransacoes'] = _enrich_transacoes_collection(dados.get('topTransacoes', []), deputados_lookup)

    # Generate caches
    suppliers_cache = build_suppliers_cache(
        normalized_fornecedores,
        fornecedores_dataset_path,
        legislatura=legislatura,
        version=version,
        enrichments=fornecedores_enrichment,
        alias_map=fornecedores_alias_map,
        deputados_info=deputados_lookup
    )
    deputies_cache = build_deputies_cache(
        normalized_deputados,
        deputados_dataset_path,
        legislatura=legislatura,
        version=version,
        deputados_info=deputados_lookup,
        deputados_relacoes=deputados_relations
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

    category_transactions_cache = None
    if categorias_resumo:
        category_transactions_cache = build_category_transactions_cache(
            categorias_resumo,
            legislatura=legislatura,
            version=version
        )

    supplier_relationships_cache = None
    if fornecedores_enrichment:
        supplier_relationships_cache = build_supplier_relationships_cache(
            fornecedores_enrichment,
            legislatura=legislatura,
            version=version,
            deputados_info=deputados_lookup
        )

    if supplier_relationships_cache is None:
        supplier_relationships_cache = _hydrate_existing_relationships(cache_dir, deputados_lookup)
    
    # Generate rankings and awards
    rankings_deputados = gerar_rankings_deputados(normalized_deputados, dados_processados)
    
    # Usar gerar_premiacoes_completas se dados processados estiverem disponíveis
    if dados_processados and deputados_index:
        console.log("✨ Usando dados detalhados para gerar premiações completas")
        premiacoes_deputados = gerar_premiacoes_completas(
            normalized_deputados,
            dados_processados,
            deputados_index
        )
    else:
        console.log("⚠️  Usando premiações básicas (sem dados detalhados)")
        premiacoes_deputados = gerar_premiacoes_deputados(normalized_deputados, rankings_deputados)
    
    rankings_fornecedores = gerar_rankings_fornecedores(normalized_fornecedores)
    premiacoes_fornecedores = gerar_premiacoes_fornecedores(normalized_fornecedores, rankings_fornecedores)
    
    # Build rankings cache
    processed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    rankings_cache = {
        "metadata": {
            "generatedAt": processed_at,
            "source": "etlpython-materialize",
            "version": version,
            "legislatura": legislatura
        },
        "data": {
            "deputados": {
                "rankings": rankings_deputados,
                "premiacoes": premiacoes_deputados
            },
            "fornecedores": {
                "rankings": rankings_fornecedores,
                "premiacoes": premiacoes_fornecedores
            }
        }
    }

    # Generate detail caches
    for supplier in normalized_fornecedores:
        supplier_enrichment = _resolve_supplier_enrichment(
            supplier,
            fornecedores_enrichment,
            fornecedores_alias_map
        )
        supplier_detail_cache = build_supplier_detail_cache(
            supplier,
            fornecedores_dataset_path,
            legislatura=legislatura,
            version=version,
            enrichment=supplier_enrichment,
            deputados_info=deputados_lookup
        )
        supplier_identifier = supplier.cnpj_cpf or supplier.id
        # Sanitizar identificador para nome de arquivo válido
        sanitized_identifier = supplier_identifier.replace("/", "-").replace(".", "-") if supplier_identifier else supplier.id
        supplier_detail_path = cache_dir / f"supplier-{sanitized_identifier}.json"
        with supplier_detail_path.open("w", encoding="utf-8") as fh:
            json.dump(supplier_detail_cache, fh, ensure_ascii=False, indent=2)

    for deputy in normalized_deputados:
        deputy_detail_cache = build_deputy_detail_cache(
            deputy,
            deputados_dataset_path,
            legislatura=legislatura,
            version=version,
            deputy_info=deputados_info.get(str(deputy.id)),
            deputy_relations=deputados_relations.get(str(deputy.id))
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
        "rankings-cache.json": rankings_cache,
        "analysis-cache.json": analysis_cache,
        "categories-cache.json": categories_cache,
    }

    if category_transactions_cache:
        caches["category-transactions-cache.json"] = category_transactions_cache

    if supplier_relationships_cache:
        caches["supplier-deputy-relations-cache.json"] = supplier_relationships_cache

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
    
    # Carregar dados detalhados de todos os deputados
    console.log("📂 Carregando dados detalhados dos deputados...")
    fornecedores_root = fornecedores_dataset_path.parent
    # Usar apenas a estrutura canônica do ETL principal
    deputados_dir_candidates = [
        fornecedores_root / "deputadosFederais" / "idDeputados",  # Estrutura canônica: camaraDeputados/deputadosFederais/idDeputados
    ]

    deputados_dir = next((candidate for candidate in deputados_dir_candidates if candidate.exists()), None)
    if not deputados_dir:
        raise FileNotFoundError("Diretório de dados detalhados dos deputados não encontrado")


    normalized_deputados_ids: set[int] = set()
    for deputado in normalized_deputados:
        try:
            normalized_deputados_ids.add(int(deputado.id))
        except (TypeError, ValueError):
            continue
    detailed_dir_ids: set[int] = set()
    for child in deputados_dir.iterdir():
        if not child.is_dir():
            continue
        try:
            detailed_dir_ids.add(int(child.name))
        except ValueError:
            continue

    combined_deputados_ids = sorted(normalized_deputados_ids | detailed_dir_ids)


    missing_in_dataset = detailed_dir_ids - normalized_deputados_ids
    if missing_in_dataset:
        sample_missing = sorted(missing_in_dataset)[:10]
        console.log(
            "⚠️  Deputados encontrados apenas nos dados detalhados: "
            f"{len(missing_in_dataset)} (exemplo: {sample_missing})"
        )

    detailed_data = load_detailed_deputados_data(deputados_dir, combined_deputados_ids)
    dados_processados = process_detailed_data(detailed_data)

    # Atualizar deputados normalizados com dados reais processados
    deputados_info = dados_processados.get('deputados_info', {})
    gastos_totais_por_deputado = {}
    transacoes_totais_por_deputado = {}
    fornecedores_por_deputado = {}

    # Calcular totais reais por deputado
    for ano, gastos_deps in dados_processados.get('gastos_por_ano', {}).items():
        for dep_id, valor in gastos_deps.items():
            gastos_totais_por_deputado[dep_id] = gastos_totais_por_deputado.get(dep_id, 0) + valor

    for ano, transacoes_deps in dados_processados.get('transacoes_por_ano', {}).items():
        for dep_id, transacoes in transacoes_deps.items():
            transacoes_totais_por_deputado[dep_id] = transacoes_totais_por_deputado.get(dep_id, 0) + transacoes

    for ano, fornecedores_deps in dados_processados.get('fornecedores_por_ano', {}).items():
        for dep_id, num_fornecedores in fornecedores_deps.items():
            fornecedores_por_deputado[dep_id] = max(fornecedores_por_deputado.get(dep_id, 0), num_fornecedores)

    # Atualizar normalized_deputados com dados reais
    normalized_deputados_map: Dict[int, NormalizedDeputado] = {}
    for deputado in normalized_deputados:
        try:
            normalized_deputados_map[int(deputado.id)] = deputado
        except (TypeError, ValueError):
            continue
    for deputado in normalized_deputados:
        dep_id = int(deputado.id)
        dep_info = deputados_info.get(str(dep_id), {})

        # Atualizar com dados reais processados
        deputado.total_despesas = gastos_totais_por_deputado.get(dep_id, 0.0)
        deputado.numero_despesas = transacoes_totais_por_deputado.get(dep_id, 0)
        deputado.fornecedores_identificados = fornecedores_por_deputado.get(dep_id, 0)

        # Atualizar também com metadados enriquecidos se disponíveis
        if dep_info:
            deputado.nome_eleitoral = dep_info.get('nomeEleitoral') or deputado.nome_eleitoral
            deputado.sigla_partido = dep_info.get('siglaPartido') or deputado.sigla_partido
            deputado.sigla_uf = dep_info.get('siglaUf') or deputado.sigla_uf
            deputado.foto_url = dep_info.get('urlFoto') or deputado.foto_url

    processed_deputados_ids = set(gastos_totais_por_deputado)
    processed_deputados_ids.update(transacoes_totais_por_deputado)
    processed_deputados_ids.update(fornecedores_por_deputado)
    for dep_id in deputados_info:
        try:
            processed_deputados_ids.add(int(dep_id))
        except (TypeError, ValueError):
            continue

    novos_deputados = sorted(processed_deputados_ids - set(normalized_deputados_map))
    if novos_deputados:
        console.log(f"➕ Adicionando {len(novos_deputados)} deputados a partir dos dados detalhados")

    for dep_id in novos_deputados:
        dep_info = deputados_info.get(str(dep_id), {})
        nome = dep_info.get('nome') or dep_info.get('nomeEleitoral') or f"Deputado {dep_id}"
        nome_eleitoral = dep_info.get('nomeEleitoral') or nome
        sigla_partido = dep_info.get('siglaPartido')
        sigla_uf = dep_info.get('siglaUf')
        foto_url = dep_info.get('urlFoto')
        created_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

        novo_deputado = NormalizedDeputado(
            id=str(dep_id),
            nome=nome,
            nome_eleitoral=nome_eleitoral,
            nome_civil=None,
            partido=sigla_partido,
            sigla_partido=sigla_partido,
            uf=sigla_uf,
            sigla_uf=sigla_uf,
            foto_url=foto_url,
            total_despesas=gastos_totais_por_deputado.get(dep_id, 0.0),
            numero_despesas=transacoes_totais_por_deputado.get(dep_id, 0),
            fornecedores_identificados=fornecedores_por_deputado.get(dep_id, 0),
            created_at=created_at,
        )

        normalized_deputados.append(novo_deputado)
        normalized_deputados_map[dep_id] = novo_deputado

    console.log(f"✅ Deputados atualizados com dados reais processados:")
    console.log(f"   Total de gastos calculados: {sum(gastos_totais_por_deputado.values()):,.2f}")
    console.log(f"   Deputados com gastos > 0: {len([v for v in gastos_totais_por_deputado.values() if v > 0])}")

    # Criar índice de deputados para lookup rápido
    deputados_index = {
        int(d.id): {
            'id': int(d.id),
            'nome': d.nome,
            'partido': d.partido,
            'uf': d.uf,
            'total_despesas': d.total_despesas
        }
        for d in normalized_deputados
    }

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
        dados_processados=dados_processados,
        deputados_index=deputados_index,
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
