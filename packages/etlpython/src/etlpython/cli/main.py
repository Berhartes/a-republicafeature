"""Entry point CLI that agrega subcomandos do pipeline de dados."""

from __future__ import annotations

from pathlib import Path
import os
from typing import List, Optional, Set

import click

from ..contracts_cli import contracts_cli
from ..sources.congresso_nacional.camara_deputados.cli import camara_deputados
from .materialize_paginated import materialize_paginated
from .materialize_unified_v2 import materialize_unified

def _repo_root() -> Path:
    """Resolve o diretório raiz do repositório a partir deste arquivo."""
    # Estrutura esperada: <repo>/packages/etlpython/src/etlpython/cli/main.py
    # Sobe 5 níveis até a raiz do monorepo (a-republica)
    return Path(__file__).resolve().parents[5]


def _prefer_path(candidates: list[Path]) -> Path:
    """Escolhe o primeiro caminho existente; senão retorna o primeiro candidato."""
    for p in candidates:
        if p.exists():
            return p
    return candidates[0]


def _default_cache_dir() -> Path:
    # Permite sobrepor via variável de ambiente
    env_dir = os.getenv("ETL_OUTPUT_DIR")
    if env_dir:
        return Path(env_dir)
    repo = _repo_root()
    return repo / "bancoDados/monitordespesas/congressoNacional/cache"


def _default_transactions_dir(base: Path) -> Path:
    return base / "transactions"


def _default_suppliers_file() -> Path:
    repo = _repo_root()
    pkg_root = Path(__file__).resolve().parents[4]
    # Primeiro tenta no data lake do repositório; depois no pacote (test data)
    return _prefer_path([
        repo / "bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json",
        pkg_root / "bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json",
    ])


def _default_deputies_dir() -> Path:
    repo = _repo_root()
    pkg_root = Path(__file__).resolve().parents[4]
    return _prefer_path([
        repo
        / "bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados",
        pkg_root
        / "bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados",
    ])


DEFAULT_SUPPLIERS_FILE = _default_suppliers_file()
DEFAULT_DEPUTIES_DIR = _default_deputies_dir()
DEFAULT_CACHE_DIR = _default_cache_dir()
DEFAULT_TRANSACTIONS_DIR = _default_transactions_dir(DEFAULT_CACHE_DIR)


def _parse_years(value: Optional[str]) -> Optional[List[int]]:
    if not value:
        return None
    values: Set[int] = set()
    parts = [segment.strip() for segment in value.split(",") if segment.strip()]
    for part in parts:
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            if start_str.isdigit() and end_str.isdigit():
                start = int(start_str)
                end = int(end_str)
                step = 1 if start <= end else -1
                for year in range(start, end + step, step):
                    values.add(year)
            continue
        if part.isdigit():
            values.add(int(part))
    return sorted(values) or None


@click.group(help="Ferramentas unificadas do etlpython")
def etlpython_cli() -> None:
    """CLI principal."""


# Re-exporta CLIs já existentes
etlpython_cli.add_command(contracts_cli, name="contracts")
etlpython_cli.add_command(camara_deputados, name="camara")


@etlpython_cli.command(name="materialize", help="Materializa caches unificados e/ou paginados.")
@click.option(
    "--tipo",
    "tipos",
    type=click.Choice(["unified", "paginated"], case_sensitive=False),
    multiple=True,
    default=("unified",),
    show_default=True,
    help="Define quais pipelines de materialização serão executados.",
)
@click.option(
    "--suppliers-file",
    type=click.Path(path_type=Path, exists=False),
    default=DEFAULT_SUPPLIERS_FILE,
    show_default=True,
    help="Arquivo de fornecedores agregado.",
)
@click.option(
    "--deputies-dir",
    type=click.Path(path_type=Path, exists=False, file_okay=False),
    default=DEFAULT_DEPUTIES_DIR,
    show_default=True,
    help="Diretório com dados dos deputados.",
)
@click.option(
    "--output-dir",
    type=click.Path(path_type=Path, file_okay=False),
    default=DEFAULT_CACHE_DIR,
    show_default=True,
    help="Diretório base para caches unificados.",
)
@click.option(
    "--transactions-dir",
    type=click.Path(path_type=Path, file_okay=False),
    default=DEFAULT_TRANSACTIONS_DIR,
    show_default=True,
    help="Diretório para caches paginados (transactions).",
)
@click.option(
    "--legislatura",
    type=int,
    default=57,
    show_default=True,
    help="Legislatura usada nos metadados.",
)
@click.option(
    "--anos",
    type=str,
    help="Intervalo ou lista de anos (ex: '2019-2021,2023').",
)
@click.option(
    "--incremental/--full",
    default=False,
    show_default=True,
    help="Ativa modo incremental (paginated).",
)
@click.option(
    "--force-year",
    type=int,
    help="Força rematerialização de um ano específico no modo paginado.",
)
@click.option("--limit-deputies", type=int, help="Limita número de deputados (debug).")
@click.option("--limit-suppliers", type=int, help="Limita número de fornecedores (debug).")
def materialize_command(
    tipos: List[str],
    suppliers_file: Path,
    deputies_dir: Path,
    output_dir: Path,
    transactions_dir: Path,
    legislatura: int,
    anos: Optional[str],
    incremental: bool,
    force_year: Optional[int],
    limit_deputies: Optional[int],
    limit_suppliers: Optional[int],
) -> None:
    """Executa pipelines de materialização configuráveis."""

    years = _parse_years(anos)
    normalized_tipos = {tipo.lower() for tipo in (tipos or ["unified"])}

    if "unified" in normalized_tipos:
        click.echo("▶️  Materializando caches unificados...")
        materialize_unified(
            suppliers_file=suppliers_file,
            deputies_dir=deputies_dir,
            output_dir=output_dir,
            anos=years,
        )
    if "paginated" in normalized_tipos:
        click.echo("▶️  Materializando caches paginados...")
        materialize_paginated(
            deputies_dir=deputies_dir,
            suppliers_file=suppliers_file,
            output_dir=transactions_dir,
            limit_deputies=limit_deputies,
            limit_suppliers=limit_suppliers,
            legislatura=legislatura,
            incremental=incremental,
            force_year=force_year,
            anos=years,
        )
    if normalized_tipos.isdisjoint({"unified", "paginated"}):
        raise click.ClickException("Nenhum tipo válido informado (use unified e/ou paginated).")
