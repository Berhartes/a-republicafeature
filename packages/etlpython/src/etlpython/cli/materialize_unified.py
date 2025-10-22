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
from typing import Any, Dict, Iterable, List, Optional, Sequence, Tuple

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


def _first_present(data: Dict[str, Any], *keys: str, default: Any = None) -> Any:
    for key in keys:
        if key in data and data[key] not in (None, ""):
            return data[key]
    return default


def normalize_fornecedores(raw_entries: Iterable[Dict[str, Any]]) -> List[NormalizedFornecedor]:
    normalized: List[NormalizedFornecedor] = []

    for index, entry in enumerate(raw_entries):
        try:
            fornecedor_id = str(_first_present(entry, "id", default=f"fornecedor_{index}"))
            nome = _first_present(entry, "nome")
            if not nome:
                raise ValueError("Campo 'nome' é obrigatório")

            cnpj_cpf = _first_present(entry, "cnpj_cpf", "cnpjCpf", "cnpj", default=None)
            if isinstance(cnpj_cpf, str):
                digits = "".join(char for char in cnpj_cpf if char.isdigit())
                cnpj_cpf = digits or None

            tipo_fornecedor = _first_present(entry, "tipo_fornecedor", "tipoFornecedor", default=None)
            tipo_despesa = _first_present(
                entry,
                "tipo_despesa_principal",
                "tipoDespesaPrincipal",
                default=None,
            )

            total_recebido = float(_first_present(entry, "total_recebido", "totalRecebido", default=0))
            numero_transacoes = int(_first_present(entry, "numero_transacoes", "numeroTransacoes", default=0))
            numero_deputados = int(_first_present(entry, "numero_deputados", "numeroDeputados", default=0))
            score_suspeicao = _first_present(entry, "score_suspeicao", "scoreSuspeicao", default=None)
            if score_suspeicao is not None:
                score_suspeicao = float(score_suspeicao)

            categorias_raw = _first_present(entry, "categorias", default=[])
            if isinstance(categorias_raw, dict):
                categorias_iter = (
                    {
                        "categoria": key,
                        "total": value,
                    }
                    for key, value in categorias_raw.items()
                )
            else:
                categorias_iter = categorias_raw or []

            categorias: List[Dict[str, Any]] = []
            for categoria in categorias_iter:
                categoria_nome = _first_present(categoria, "categoria", "nome", default="Indefinido")
                total_categoria = float(_first_present(categoria, "total", "valor", default=0))
                percentual = _first_present(categoria, "percentual", default=None)
                categorias.append(
                    {
                        "categoria": categoria_nome,
                        "total": round(total_categoria, 2),
                        "percentual": percentual,
                    }
                )

            anos_raw = _first_present(entry, "anos", default=[])
            anos_list: List[Dict[str, Any]] = []
            if isinstance(anos_raw, dict):
                for ano_str, value in anos_raw.items():
                    try:
                        ano = int(ano_str)
                    except ValueError:
                        continue
                    if isinstance(value, dict):
                        total = float(_first_present(value, "total", "valor", default=0))
                        transacoes = int(_first_present(value, "numeroTransacoes", "transacoes", default=0))
                        deputados = int(_first_present(value, "numeroDeputados", default=0))
                    else:
                        total = float(value)
                        transacoes = 0
                        deputados = 0
                    anos_list.append(
                        {
                            "ano": ano,
                            "total": round(total, 2),
                            "numeroTransacoes": transacoes,
                            "numeroDeputados": deputados,
                        }
                    )
            else:
                for item in anos_raw or []:
                    ano = int(_first_present(item, "ano", "year", default=datetime.now().year))
                    total = float(_first_present(item, "total", "valor", default=0))
                    transacoes = int(_first_present(item, "numeroTransacoes", "transacoes", default=0))
                    deputados = int(_first_present(item, "numeroDeputados", default=0))
                    anos_list.append(
                        {
                            "ano": ano,
                            "total": round(total, 2),
                            "numeroTransacoes": transacoes,
                            "numeroDeputados": deputados,
                        }
                    )

            ranking = _first_present(entry, "ranking", default=None)
            if ranking is not None:
                ranking = int(ranking)

            created_at = _first_present(entry, "created_at", "createdAt", default=datetime.now().isoformat())

            normalized.append(
                NormalizedFornecedor(
                    id=fornecedor_id,
                    nome=str(nome),
                    cnpj_cpf=cnpj_cpf,
                    tipo_fornecedor=str(tipo_fornecedor) if tipo_fornecedor else None,
                    tipo_despesa_principal=str(tipo_despesa) if tipo_despesa else None,
                    total_recebido=round(total_recebido, 2),
                    numero_transacoes=numero_transacoes,
                    numero_deputados=numero_deputados,
                    score_suspeicao=score_suspeicao,
                    categorias=json.dumps(categorias, ensure_ascii=False),
                    anos=json.dumps(anos_list, ensure_ascii=False),
                    ranking=ranking,
                    created_at=str(created_at),
                )
            )
        except Exception as exc:  # pragma: no cover - defensive logging
            raise ValueError(f"Falha ao normalizar registro na posição {index}: {exc}") from exc

    return normalized


def compute_rankings(rows: List[NormalizedFornecedor]) -> None:
    ordered = sorted(rows, key=lambda item: item.total_recebido, reverse=True)
    for index, row in enumerate(ordered, start=1):
        if row.ranking is None:
            row.ranking = index


def ensure_directory(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def create_schema(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS fornecedores (
            id TEXT PRIMARY KEY,
            nome TEXT NOT NULL,
            cnpj_cpf TEXT,
            tipo_fornecedor TEXT,
            tipo_despesa_principal TEXT,
            total_recebido REAL NOT NULL,
            numero_transacoes INTEGER NOT NULL,
            numero_deputados INTEGER NOT NULL,
            score_suspeicao REAL,
            categorias TEXT,
            anos TEXT,
            ranking INTEGER,
            created_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_fornecedores_total_recebido ON fornecedores(total_recebido DESC);
        CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
        CREATE INDEX IF NOT EXISTS idx_fornecedores_tipo ON fornecedores(tipo_despesa_principal);
        """
    )


def insert_rows(connection: sqlite3.Connection, rows: Sequence[NormalizedFornecedor]) -> None:
    with connection:
        connection.executemany(
            """
            INSERT INTO fornecedores (
                id,
                nome,
                cnpj_cpf,
                tipo_fornecedor,
                tipo_despesa_principal,
                total_recebido,
                numero_transacoes,
                numero_deputados,
                score_suspeicao,
                categorias,
                anos,
                ranking,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [row.as_tuple() for row in rows],
        )


def build_summary(rows: Sequence[NormalizedFornecedor]) -> Dict[str, Any]:
    total_volume = round(sum(row.total_recebido for row in rows), 2)
    total_fornecedores = len(rows)
    media_ranking = round(sum(row.ranking or 0 for row in rows if row.ranking) / max(1, total_fornecedores), 2)

    return {
        "total_fornecedores": total_fornecedores,
        "total_volume": total_volume,
        "media_ranking": media_ranking,
    }


def render_summary_table(dataset_path: Path, output_path: Optional[Path], summary: Dict[str, Any]) -> None:
    table = Table(title="Materialização concluída")
    table.add_column("Dataset", style="cyan")
    table.add_column("Saída", style="green")
    table.add_column("Fornecedores", justify="right")
    table.add_column("Volume Total", justify="right")

    table.add_row(
        str(dataset_path),
        str(output_path) if output_path else "(dry run)",
        str(summary["total_fornecedores"]),
        f"R$ {summary['total_volume']:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
    )

    console.print(table)


def materialize(
    dataset_path: Path,
    output_path: Optional[Path],
    *,
    dry_run: bool
) -> Tuple[Dict[str, Any], List[NormalizedFornecedor]]:
    raw_dataset = load_dataset(dataset_path)
    normalized = normalize_fornecedores(raw_dataset)
    compute_rankings(normalized)
    summary = build_summary(normalized)

    if dry_run:
        console.print("[yellow]Execução em modo dry-run. Nenhum arquivo será criado.[/yellow]")
    else:
        if output_path is None:
            raise ValueError("Caminho de saída não pode ser None quando não for dry-run")
        ensure_directory(output_path)
        with sqlite3.connect(output_path) as connection:
            create_schema(connection)
            insert_rows(connection, normalized)

    return summary, normalized


def _load_categories(row: NormalizedFornecedor) -> List[Dict[str, Any]]:
    try:
        return json.loads(row.categorias) if row.categorias else []
    except json.JSONDecodeError:
        return []


def _load_years(row: NormalizedFornecedor) -> List[Dict[str, Any]]:
    try:
        return json.loads(row.anos) if row.anos else []
    except json.JSONDecodeError:
        return []


def _alertas_por_score(score: Optional[float]) -> List[str]:
    if score is None:
        return []
    if score >= 80:
        return ["Score crítico de suspeição"]
    if score >= 60:
        return ["Score alto de suspeição"]
    if score >= 40:
        return ["Score médio de suspeição"]
    return []


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


def write_json_file(path: Path, payload: Dict[str, Any]) -> Dict[str, Any]:
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    ensure_directory(path)
    path.write_text(text, encoding="utf-8")
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    size = path.stat().st_size
    return {"filename": path.name, "hash": digest, "size": size}


def update_manifest(
    cache_dir: Path,
    *,
    generated_at: str,
    version: str,
    legislatura: int,
    new_entries: List[Dict[str, Any]],
) -> None:
    manifest_path = cache_dir / "caches-manifest.json"

    if manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {
            "generatedAt": generated_at,
            "version": version,
            "legislatura": legislatura,
            "entries": [],
        }

    entries_map = {
        entry["filename"]: entry
        for entry in manifest.get("entries", [])
        if isinstance(entry, dict) and "filename" in entry
    }

    for entry in new_entries:
        entries_map[entry["filename"]] = entry

    manifest["generatedAt"] = generated_at
    manifest["version"] = version
    manifest["legislatura"] = legislatura
    manifest["entries"] = sorted(entries_map.values(), key=lambda item: item["filename"])

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def generate_frontend_caches(
    rows: Sequence[NormalizedFornecedor],
    dataset_path: Path,
    cache_dir: Path,
    *,
    legislatura: int,
    version: str,
) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)

    suppliers_payload = build_suppliers_cache(rows, dataset_path, legislatura=legislatura, version=version)
    suppliers_entry = write_json_file(cache_dir / "suppliers-cache.json", suppliers_payload)

    generated_at = suppliers_payload["metadata"]["generatedAt"]
    update_manifest(
        cache_dir,
        generated_at=generated_at,
        version=version,
        legislatura=legislatura,
        new_entries=[suppliers_entry],
    )

    console.print(
        f"[cyan]📦 Cache suppliers-cache.json atualizado em {cache_dir} ({suppliers_entry['size']} bytes).[/cyan]"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Materializa fornecedores em um SQLite unificado.")
    parser.add_argument("--dataset", help="Caminho para o dataset JSON de fornecedores.")
    parser.add_argument("--output", help="Caminho do arquivo SQLite de saída.")
    parser.add_argument("--cache-output", help="Diretório onde os caches do frontend serão gravados.")
    parser.add_argument("--legislatura", type=int, default=57, help="Número da legislatura analisada (default: 57).")
    parser.add_argument("--cache-version", default="1.0.0", help="Versão dos caches gerados (default: 1.0.0).")
    parser.add_argument("--no-cache", action="store_true", help="Não gerar caches para o frontend.")
    parser.add_argument("--dry-run", action="store_true", help="Somente valida o dataset sem gerar arquivo.")
    return parser.parse_args()


def main() -> None:
    console.print("[bold cyan]🐍 ETL Python - materialize:unified[/bold cyan]")
    args = parse_args()

    project_root = find_project_root(Path.cwd())

    try:
        dataset_path = resolve_path(args.dataset, project_root, defaults=DEFAULT_DATASET_CANDIDATES)
        output_path = None if args.dry_run else (project_root / (args.output or DEFAULT_OUTPUT)).resolve()

        summary, normalized = materialize(dataset_path, output_path, dry_run=args.dry_run)
        render_summary_table(dataset_path, output_path, summary)

        if not args.dry_run and not args.no_cache:
            cache_dir = (project_root / (args.cache_output or DEFAULT_CACHE_DIR)).resolve()
            generate_frontend_caches(
                normalized,
                dataset_path,
                cache_dir,
                legislatura=args.legislatura,
                version=args.cache_version,
            )

        console.print("[green]✅ Processo concluído com sucesso![/green]")
    except Exception as exc:
        console.print(f"[red]❌ Falha na materialização: {exc}[/red]")
        raise


if __name__ == "__main__":  # pragma: no cover
    main()
