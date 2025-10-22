"""CLI command for Câmara dos Deputados ETL pipeline."""

import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

import click
from rich.console import Console

from ....core.base_models import BaseManifest
from ..shared.writer import CongressoDataWriter
from ....load.sqlite_writer import ExpenseRecord, SQLiteWriter
from ....transform.processors import normalize_cnpj
from .client import CamaraApiClient
from .models import DespesaApi
from .processor import CamaraDataProcessor

console = Console()


def get_project_root() -> Path:
    """Get the project root directory."""
    current = Path(__file__).resolve()
    while current.parent != current:
        if (current / "packages").exists() and (current / "bancoDados").exists():
            return current
        current = current.parent
    return Path(__file__).resolve().parents[6]


def get_years_range(ano_inicio: Optional[int], ano_fim: Optional[int]) -> List[int]:
    """Generate list of years for processing."""
    current_year = datetime.now().year
    inicio = ano_inicio or current_year
    fim = ano_fim or current_year

    if inicio <= fim:
        return list(range(inicio, fim + 1))
    else:
        return list(range(inicio, fim - 1, -1))


@click.command()
@click.argument('legislatura', type=int, default=57)
@click.argument('limit', type=int, required=False)
@click.option('--pc', is_flag=True, help='PC mode flag (for compatibility)')
@click.option('--ano-inicio', type=int, help='Start year for data extraction')
@click.option('--ano-fim', type=int, help='End year for data extraction')
def camara_deputados(
    legislatura: int,
    limit: Optional[int],
    pc: bool,
    ano_inicio: Optional[int],
    ano_fim: Optional[int]
) -> None:
    """
    Extract deputados despesas data from Câmara API.

    LEGISLATURA: Legislature number (default: 57)
    LIMIT: Maximum number of deputados to process (optional)
    """
    console.print(f"[bold cyan]🐍 ETL Python - Câmara dos Deputados[/bold cyan]")
    console.print(f"[cyan]Legislature: {legislatura}[/cyan]")

    if limit:
        console.print(f"[cyan]Limit: {limit} deputados[/cyan]")

    # Get years range
    anos = get_years_range(ano_inicio, ano_fim)
    console.print(f"[cyan]Years: {', '.join(map(str, anos))}[/cyan]")

    # Get project root
    project_root = get_project_root()
    console.print(f"[dim]Project root: {project_root}[/dim]")

    try:
        # Initialize components
        api_client = CamaraApiClient()
        processor = CamaraDataProcessor()
        writer = CongressoDataWriter(str(project_root), "camaraDeputados")
        deputado_despesas: Dict[int, List[DespesaApi]] = {}

        # Ensure directories exist
        writer.ensure_directories()

        # Extract deputados
        deputados = api_client.fetch_legislators(legislatura, limit)

        if not deputados:
            console.print("[yellow]No deputados found for the given parameters[/yellow]")
            return

        console.print(f"[green]Processing {len(deputados)} deputados...[/green]")

        # Process each deputado
        for i, deputado in enumerate(deputados, 1):
            console.print(f"[blue]({i}/{len(deputados)}) Processing {deputado.nome} (ID: {deputado.id})[/blue]")

            # Extract despesas
            despesas = api_client.fetch_expenses(deputado.id, anos)
            deputado_despesas[deputado.id] = despesas

            # Transform data
            processor.process_deputado_despesas(deputado, despesas)

            # Write raw deputado data
            writer.write_legislador_despesas(deputado, despesas, legislatura, anos)

        # Build consolidated data
        fornecedores = processor.build_fornecedores_output()
        deputados_resumo = processor.get_legisladores_resumo()
        stats = processor.get_stats()

        # Write consolidated data
        writer.write_fornecedores(fornecedores)
        writer.write_legisladores_resumo(deputados_resumo)

        # Create manifest
        manifest = CamaraManifest(
            generated_at=datetime.now().isoformat(),
            legislatura=legislatura,
            anos=anos,
            total_legisladores=stats['total_legisladores'],
            total_fornecedores=stats['total_fornecedores'],
            total_despesas=stats['total_despesas'],
            platform="congresso_nacional",
            source="camara_deputados"
        )
        writer.write_manifest(manifest)

        # Build SQLite payload
        fornecedor_index: Dict[str, str] = {}
        for fornecedor in fornecedores:
            if fornecedor.documento:
                fornecedor_index[fornecedor.documento] = fornecedor.id
            fornecedor_index[fornecedor.nome.strip().lower()] = fornecedor.id

        expense_records: List[ExpenseRecord] = []
        for deputado_id, despesas_lista in deputado_despesas.items():
            for despesa in despesas_lista:
                fornecedor_nome = (despesa.nomeFornecedor or '').strip()
                fornecedor_documento = normalize_cnpj(despesa.cnpjCpfFornecedor)
                fornecedor_id = None

                if fornecedor_documento and fornecedor_documento in fornecedor_index:
                    fornecedor_id = fornecedor_index[fornecedor_documento]
                elif fornecedor_nome:
                    fornecedor_id = fornecedor_index.get(fornecedor_nome.lower())

                expense_records.append(
                    ExpenseRecord(
                        deputado_id=deputado_id,
                        fornecedor_id=fornecedor_id,
                        fornecedor_nome=fornecedor_nome,
                        fornecedor_documento=fornecedor_documento,
                        ano=despesa.ano,
                        mes=despesa.mes,
                        tipo_despesa=despesa.tipoDespesa,
                        valor_documento=despesa.valorDocumento,
                        valor_liquido=despesa.valorLiquido,
                        cod_documento=despesa.codDocumento,
                        num_documento=despesa.numDocumento,
                        url_documento=despesa.urlDocumento,
                    )
                )

        manifest_payload = {
            'generated_at': datetime.now().isoformat(),
            'legislatura': legislatura,
            'anos': anos,
            'total_legisladores': stats['total_legisladores'],
            'total_deputados': stats['total_legisladores'],
            'total_fornecedores': stats['total_fornecedores'],
            'total_despesas': stats['total_despesas'],
            'platform': 'congresso_nacional',
            'source': 'camara_deputados',
        }

        sqlite_db_path = writer.monitor_dir / 'monitordespesas.db'
        sqlite_writer = SQLiteWriter(sqlite_db_path)
        sqlite_writer.save(
            deputados=deputados_resumo,
            fornecedores=fornecedores,
            despesas=expense_records,
            manifest=manifest_payload,
        )
        console.print(f"[green]💾 SQLite database: {sqlite_db_path}")

        # Print summary
        console.print(f"\n[bold green]✅ ETL completed successfully![/bold green]")
        console.print(f"[green]📊 Fornecedores consolidated: {stats['total_fornecedores']}[/green]")
        console.print(f"[green]🏛️  Deputados processed: {stats['total_legisladores']}[/green]")
        console.print(f"[green]💰 Total expenses: R$ {stats['total_despesas']:,.2f}[/green]")

    except Exception as e:
        console.print(f"[red]❌ ETL failed: {e}[/red]")

        # Try fallback to sample data
        try:
            sample_path = project_root / "packages" / "etl" / "sample-data" / "fornecedores.mock.json"
            if sample_path.exists():
                writer.write_sample_data(str(sample_path))
                console.print("[yellow]📂 Sample dataset generated in bancoDados/monitordespesas[/yellow]")
            else:
                console.print("[red]❌ Sample dataset not found[/red]")
                sys.exit(1)
        except Exception as fallback_error:
            console.print(f"[red]❌ Fallback failed: {fallback_error}[/red]")
            sys.exit(1)


class CamaraManifest(BaseManifest):
    """Manifest específico para Câmara dos Deputados."""
    pass


if __name__ == "__main__":
    camara_deputados()