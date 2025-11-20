"""CLI command for Câmara dos Deputados ETL pipeline."""

import os
import sys
import time
from datetime import datetime
from multiprocessing import Manager, get_context
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Set

import click
from rich.console import Console

from ....core.base_models import BaseManifest
from ....core.incremental_by_year import YearBasedIncrementalETL
from ....core.rate_limiter import configure_shared_rate_limiter
from ....core.run_manifest import EtlRunRecorder
from ....services.premiacoes_builder import build_premiacoes_cache
from ..shared.writer import CongressoDataWriter
from ....load.sqlite_writer import ExpenseRecord, SQLiteWriter
from ....transform.processors import normalize_cnpj
from .client import CamaraApiClient
from .models import DespesaApi
from .processor import CamaraDataProcessor

console = Console()


def _init_worker_rate_limiter(lock, shared_last_request_time, min_interval_seconds: float) -> None:
    """Initialize shared rate limiter in worker processes."""
    configure_shared_rate_limiter(
        lock,
        shared_last_request_time,
        min_interval_seconds=min_interval_seconds,
    )


def process_single_deputy_task(task: Dict[str, Any]) -> Dict[str, Any]:
    """Fetch despesas (and optional detalhes) for a single deputado."""
    deputado_id = task["deputado_id"]
    anos = task.get("anos", [])
    wait_ms = task.get("wait_ms", 150)
    deputado_nome = task.get("deputado_nome")
    incremental = task.get("incremental", False)

    client: CamaraApiClient | None = task.get("client")
    owns_client = False
    if client is None:
        client = CamaraApiClient(wait_ms=wait_ms)
        owns_client = True
    despesas_payload: List[Dict[str, Any]] = []
    detalhes_payload: Optional[Dict[str, Any]] = None
    detalhes_error: Optional[str] = None
    anos_fetched: List[int] = []

    try:
        despesas: List[DespesaApi] = []
        if anos:
            despesas = client.fetch_expenses(deputado_id, anos)
            anos_fetched = list(anos)

        despesas_payload = [despesa.model_dump(by_alias=True) for despesa in despesas]

        try:
            detalhes_payload = client.fetch_deputy_details(deputado_id)
        except Exception as details_exc:
            detalhes_error = str(details_exc)

        return {
            "status": "ok",
            "deputado_id": deputado_id,
            "deputado_nome": deputado_nome,
            "despesas": despesas_payload,
            "detalhes": detalhes_payload,
            "detalhes_error": detalhes_error,
            "incremental": incremental,
            "anos_fetched": anos_fetched,
        }
    except Exception as exc:
        return {
            "status": "error",
            "deputado_id": deputado_id,
            "deputado_nome": deputado_nome,
            "message": str(exc),
        }
    finally:
        if owns_client and client is not None:
            client.session.close()


def process_deputies_parallel(
    tasks: List[Dict[str, Any]],
    num_workers: int,
    lock,
    shared_last_request_time,
    min_interval_seconds: float,
) -> List[Dict[str, Any]]:
    """Execute deputy processing tasks in parallel."""
    ctx = get_context("spawn")
    with ctx.Pool(
        processes=num_workers,
        initializer=_init_worker_rate_limiter,
        initargs=(lock, shared_last_request_time, min_interval_seconds),
    ) as pool:
        return pool.map(process_single_deputy_task, tasks)


def process_deputies_sequential(
    api_client: CamaraApiClient,
    tasks: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Sequentially execute deputy processing tasks using a shared client."""
    results: List[Dict[str, Any]] = []

    for task in tasks:
        task_with_client = dict(task)
        task_with_client["client"] = api_client
        results.append(process_single_deputy_task(task_with_client))

    return results


def _walk_up(path: Path) -> Iterable[Path]:
    """Yield ``path`` and every ancestor directory up to the filesystem root."""
    current = path if path.is_dir() else path.parent
    while True:
        yield current
        if current.parent == current:
            break
        current = current.parent


def _looks_like_repo_root(path: Path) -> bool:
    """Heuristic that recognises the monorepo root structure."""
    if not path.exists():
        return False
    has_package_json = (path / "package.json").exists()
    has_packages_dir = (path / "packages").exists()
    has_workspace_marker = (path / "pnpm-workspace.yaml").exists()
    return has_package_json and (has_packages_dir or has_workspace_marker)


def get_project_root() -> Path:
    """Resolve the monorepo root regardless of where the module is imported from."""
    env_override = os.environ.get("ETLPYTHON_PROJECT_ROOT") or os.environ.get("MONITOR_DESPESAS_PROJECT_ROOT")
    if env_override:
        env_path = Path(env_override).expanduser().resolve()
        if _looks_like_repo_root(env_path) or env_path.exists():
            return env_path

    checked: Set[Path] = set()
    best_candidate: Optional[Path] = None
    search_starts = [Path.cwd(), Path(__file__).resolve(), Path(__file__).resolve().parent]

    for start in search_starts:
        for candidate in _walk_up(start):
            if candidate in checked:
                continue
            checked.add(candidate)
            if _looks_like_repo_root(candidate):
                if best_candidate is None or len(candidate.parts) < len(best_candidate.parts):
                    best_candidate = candidate

    if best_candidate is not None:
        return best_candidate

    # Fallback: legacy structure from earlier packages (6 níveis acima)
    fallback = Path(__file__).resolve()
    if len(fallback.parents) >= 7:
        return fallback.parents[6]

    raise RuntimeError(
        "Não foi possível localizar o diretório raiz do projeto. Defina ETLPYTHON_PROJECT_ROOT ou execute o ETL a partir do monorepo."
    )


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
@click.option('--workers', type=int, default=1, show_default=True, help='Número de workers paralelos (ideal: 2-4)')
@click.option('--wait-ms', type=int, default=150, show_default=True, help='Intervalo mínimo entre requisições em milissegundos')
@click.option('--incremental', is_flag=True, help='Ativa modo incremental (somente anos necessários)')
@click.option('--force-year', type=int, help='Força reprocessamento de um ano específico')
@click.option('--skip-contract-validation', is_flag=True, help='Pula a validação dos contratos antes da extração')
def camara_deputados(
    legislatura: int,
    limit: Optional[int],
    pc: bool,
    ano_inicio: Optional[int],
    ano_fim: Optional[int],
    workers: int,
    wait_ms: int,
    incremental: bool,
    force_year: Optional[int],
    skip_contract_validation: bool
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
    if force_year is not None and force_year not in anos:
        anos = list(dict.fromkeys(anos + [force_year]))
        console.print(
            f"[yellow]⚠️  Ano {force_year} adicionado à lista de processamento devido à flag --force-year[/yellow]"
        )
    console.print(f"[cyan]Years: {', '.join(map(str, anos))}[/cyan]")

    # Get project root
    project_root = get_project_root()
    console.print(f"[dim]Project root: {project_root}[/dim]")

    run_recorder: Optional[EtlRunRecorder] = None
    total_deputados = 0
    successful_results = 0
    processor: Optional[CamaraDataProcessor] = None
    writer: Optional[CongressoDataWriter] = None
    start_perf = time.perf_counter()

    try:
        min_interval_seconds = max(wait_ms, 0) / 1000.0
        num_workers = max(1, workers)

        console.print(f"[cyan]Workers configurados: {num_workers}[/cyan]")
        console.print(f"[cyan]Intervalo mínimo entre requisições: {wait_ms}ms[/cyan]")

        with Manager() as manager:
            shared_lock = manager.Lock()
            shared_last_request_time = manager.Value('d', 0.0)

            configure_shared_rate_limiter(
                shared_lock,
                shared_last_request_time,
                min_interval_seconds=min_interval_seconds,
            )

            api_client = CamaraApiClient(wait_ms=wait_ms)
            try:
                writer = CongressoDataWriter(str(project_root), "camaraDeputados")
                deputado_despesas: Dict[int, List[DespesaApi]] = {}

                writer.ensure_directories()
                platform_base_path = writer.get_platform_base_path()

                run_parameters = {
                    "legislatura": legislatura,
                    "limit": limit,
                    "anos": anos,
                    "workers": workers,
                    "wait_ms": wait_ms,
                    "incremental": incremental,
                    "force_year": force_year,
                    "pc": pc,
                    "skip_contract_validation": skip_contract_validation,
                }
                run_recorder = EtlRunRecorder(
                    monitor_dir=writer.monitor_dir,
                    pipeline="camara_deputados",
                    parameters=run_parameters,
                    command=[sys.executable or "python", *sys.argv],
                    project_root=project_root,
                )

                processor = CamaraDataProcessor(
                    client=api_client,
                    event_logger=run_recorder.log_event if run_recorder else None,
                )

                incremental_etl: Optional[YearBasedIncrementalETL] = None
                if incremental:
                    if writer.source_name == "camaraDeputados":
                        legislators_dir = platform_base_path / "deputadosFederais" / "idDeputados"
                    elif writer.source_name == "senado":
                        legislators_dir = platform_base_path / "senadoresFederais" / "idSenadores"
                    else:
                        legislators_dir = platform_base_path

                    incremental_etl = YearBasedIncrementalETL(legislators_dir)
                    console.print("[yellow]🔄 Modo incremental ativado[/yellow]")
                    console.print(f"[yellow]📅 Ano atual: {incremental_etl.current_year}[/yellow]")
                    if force_year is not None:
                        console.print(f"[yellow]⚠️  Reprocessamento forçado do ano {force_year}[/yellow]")

                deputados = api_client.fetch_legislators(legislatura, limit)

                if not deputados:
                    console.print("[yellow]No deputados found for the given parameters[/yellow]")
                    return

                total_deputados = len(deputados)
                console.print(f"[green]Processing {total_deputados} deputados...[/green]")

                effective_workers = max(1, min(num_workers, total_deputados))
                deputado_states: Dict[int, Dict[str, Any]] = {}
                tasks: List[Dict[str, Any]] = []

                for deputado in deputados:
                    if incremental and incremental_etl is not None:
                        years_to_process = incremental_etl.get_years_to_process(
                            deputado.id,
                            legislatura,
                            anos,
                            force_year,
                        )
                        years_to_process_set = set(years_to_process)
                        years_from_cache = [
                            year for year in anos
                            if year not in years_to_process_set and year <= incremental_etl.current_year
                        ]
                    else:
                        years_to_process = list(anos)
                        years_from_cache = []

                    deputado_states[deputado.id] = {
                        "years_to_process": list(years_to_process),
                        "years_from_cache": list(years_from_cache),
                        "requested_years": list(anos),
                    }

                    tasks.append(
                        {
                            "deputado_id": deputado.id,
                            "deputado_nome": deputado.nome,
                            "anos": list(years_to_process),
                            "wait_ms": wait_ms,
                            "incremental": incremental,
                        }
                    )

                if effective_workers > 1:
                    console.print(f"[dim]Executando em paralelo com {effective_workers} workers[/dim]")
                    results_list = process_deputies_parallel(
                        tasks,
                        effective_workers,
                        shared_lock,
                        shared_last_request_time,
                        min_interval_seconds,
                    )
                else:
                    console.print("[dim]Executando em modo sequencial[/dim]")
                    results_list = process_deputies_sequential(api_client, tasks)

                results_by_id: Dict[int, Dict[str, Any]] = {
                    result["deputado_id"]: result for result in results_list
                }

                successful_results = 0

                for index, deputado in enumerate(deputados, 1):
                    console.print(
                        f"[blue]({index}/{total_deputados}) Processing {deputado.nome} (ID: {deputado.id})[/blue]"
                    )

                    result = results_by_id.get(deputado.id)
                    if not result:
                        console.print(
                            f"[yellow]Dados não retornados para deputado {deputado.id}. Pulando.[/yellow]"
                        )
                        continue

                    if result.get("status") != "ok":
                        console.print(
                            f"[red]❌ Erro ao processar deputado {deputado.id} ({result.get('deputado_nome')}): {result.get('message')}[/red]"
                        )
                        continue

                    state = deputado_states.get(
                        deputado.id,
                        {
                            "years_to_process": list(anos),
                            "years_from_cache": [],
                            "requested_years": list(anos),
                        },
                    )
                    years_from_api: List[int] = list(state.get("years_to_process", []))
                    years_from_cache: List[int] = list(state.get("years_from_cache", []))
                    requested_years: List[int] = list(state.get("requested_years", anos))

                    if incremental:
                        console.print(f"  [dim]🔄 Da API: {years_from_api}[/dim]")
                        console.print(f"  [dim]📥 Do cache: {years_from_cache}[/dim]")
                    else:
                        console.print(
                            f"  [dim]🔄 Modo completo: processando anos {', '.join(map(str, requested_years))}[/dim]"
                        )

                    despesas_payload = result.get("despesas") or []
                    despesas_from_api: List[DespesaApi] = []
                    api_parse_errors = 0
                    for payload in despesas_payload:
                        try:
                            despesas_from_api.append(DespesaApi(**payload))
                        except Exception:
                            api_parse_errors += 1

                    if api_parse_errors:
                        console.print(
                            f"[yellow]Aviso: {api_parse_errors} despesas retornadas pela API não puderam ser convertidas para deputado {deputado.id}[/yellow]"
                        )

                    despesas_from_cache_objs: List[DespesaApi] = []
                    cache_parse_errors = 0
                    if incremental and incremental_etl is not None and years_from_cache:
                        cached_payloads = incremental_etl.load_all_years_despesas(
                            deputado.id,
                            legislatura,
                            years_from_cache,
                        )
                        for payload in cached_payloads:
                            try:
                                despesas_from_cache_objs.append(DespesaApi(**payload))
                            except Exception:
                                cache_parse_errors += 1

                    if cache_parse_errors:
                        console.print(
                            f"[yellow]Aviso: {cache_parse_errors} despesas em cache ignoradas para deputado {deputado.id}[/yellow]"
                        )

                    if incremental:
                        console.print(f"  [green]✅ API: {len(despesas_from_api)} despesas[/green]")
                        console.print(f"  [dim]📦 Cache: {len(despesas_from_cache_objs)} despesas[/dim]")

                    despesas: List[DespesaApi] = despesas_from_api + despesas_from_cache_objs
                    if despesas:
                        despesas.sort(key=lambda d: (d.ano, d.mes or 0, getattr(d, "codDocumento", 0)))
                    deputado_despesas[deputado.id] = despesas

                    console.print(f"  [cyan]📊 Total: {len(despesas)} despesas[/cyan]")

                    detalhes_payload = result.get("detalhes")
                    if detalhes_payload:
                        try:
                            deputado.detalhes_completos = detalhes_payload
                        except Exception:
                            pass

                    anos_para_writer = list(dict.fromkeys(years_from_cache + years_from_api))
                    if not anos_para_writer:
                        anos_para_writer = requested_years

                    deputado_enriquecido = processor.process_deputado_despesas(deputado, despesas)
                    writer.write_legislador_despesas(
                        deputado_enriquecido,
                        despesas,
                        legislatura,
                        anos_para_writer,
                        save_by_year=True,
                    )

                    if incremental and incremental_etl is not None:
                        incremental_etl.auto_finalize_past_years(
                            deputado.id,
                            legislatura,
                            anos_para_writer,
                        )
                    successful_results += 1

                    detalhes_error = result.get("detalhes_error")
                    if detalhes_error:
                        console.print(
                            f"[yellow]Aviso: não foi possível obter detalhes adicionais para deputado {deputado.id}: {detalhes_error}[/yellow]"
                        )

                console.print(f"[green]✅ Processados: {successful_results}/{total_deputados}[/green]")

                fornecedores = processor.build_fornecedores_output()
                deputados_resumo = processor.get_legisladores_resumo()
                stats = processor.get_stats()

                writer.write_fornecedores(fornecedores)
                writer.write_legisladores_resumo(deputados_resumo)

                premiacoes_cache = build_premiacoes_cache(
                    deputados_resumo,
                    processor.legisladores_stats,
                )
                writer.write_premiacoes(premiacoes_cache)

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

                console.print(f"\n[bold green]✅ ETL completed successfully![/bold green]")
                console.print(f"[green]📊 Fornecedores consolidated: {stats['total_fornecedores']}[/green]")
                console.print(f"[green]🏛️  Deputados processed: {stats['total_legisladores']}[/green]")
                console.print(f"[green]💰 Total expenses: R$ {stats['total_despesas']:,.2f}[/green]")

                duration = time.perf_counter() - start_perf
                if run_recorder and writer is not None:
                    manifest_stats = dict(stats)
                    manifest_stats.update(
                        {
                            "deputados_processados": successful_results,
                            "deputados_solicitados": total_deputados,
                        }
                    )
                    artifact_paths = [
                        writer.monitor_dir / "manifest.json",
                        platform_base_path / "fornecedores.json",
                        platform_base_path / "deputados.json",
                        writer.monitor_dir / "monitordespesas.db",
                        platform_base_path / "deputadosFederais" / "deputados.json",
                        writer.congresso_dir / "premiacoes-cache.json",
                    ]
                    for artifact_path in artifact_paths:
                        run_recorder.add_artifact(artifact_path)
                    run_recorder.finalize(
                        stats=manifest_stats,
                        duration_seconds=duration,
                        status="success",
                    )
            finally:
                api_client.session.close()
                configure_shared_rate_limiter(
                    None,
                    None,
                    min_interval_seconds=min_interval_seconds,
                )

    except Exception as e:
        duration = time.perf_counter() - start_perf
        if run_recorder:
            failure_stats = {}
            if processor is not None:
                try:
                    failure_stats = processor.get_stats()
                except Exception:
                    failure_stats = {}
            failure_stats.update(
                {
                    "deputados_processados": successful_results,
                    "deputados_solicitados": total_deputados,
                }
            )
            run_recorder.finalize(
                stats=failure_stats,
                duration_seconds=duration,
                status="failure",
                error=str(e),
            )
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
