"""Partition existing datalake outputs by legislatura/ano/bruto/agregado."""

from __future__ import annotations

import json
import shutil
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import click


@dataclass
class DeputyYearFile:
    source: Path
    deputy_id: str
    legislatura: int
    ano: int


def _sha256(path: Path) -> str:
    import hashlib

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def discover_deputy_year_files(source_dir: Path, legislatura: int) -> List[DeputyYearFile]:
    pattern = f"*-id{legislatura}-*-dados_completos.json"
    files: List[DeputyYearFile] = []
    for path in source_dir.rglob(pattern):
        stem_parts = path.stem.split("-")
        try:
            deputy_id = stem_parts[0]
        except IndexError:
            continue
        ano = None
        for idx, part in enumerate(stem_parts):
            if part.startswith(f"id{legislatura}") and idx + 1 < len(stem_parts):
                candidate = stem_parts[idx + 1]
                if candidate.isdigit():
                    ano = int(candidate)
                    break
        if ano is None:
            continue
        files.append(DeputyYearFile(source=path, deputy_id=deputy_id, legislatura=legislatura, ano=ano))
    return files


def copy_bruto_files(files: Iterable[DeputyYearFile], target_root: Path) -> Dict[int, List[Path]]:
    year_file_paths: Dict[int, List[Path]] = defaultdict(list)
    for entry in files:
        dest = (
            target_root
            / f"legislatura-{entry.legislatura}"
            / f"ano-{entry.ano:04d}"
            / "bruto"
            / "deputados"
            / f"{entry.deputy_id}.json"
        )
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(entry.source, dest)
        year_file_paths[entry.ano].append(dest)
    return year_file_paths


def build_deputy_summaries(year_files: Dict[int, List[Path]]) -> Dict[int, List[dict]]:
    summaries: Dict[int, List[dict]] = defaultdict(list)
    for ano, paths in year_files.items():
        for path in paths:
            try:
                payload = _load_json(path)
            except Exception:
                continue
            legislador_meta = (
                payload.get("metadata", {}).get("legislador", {})
                if isinstance(payload.get("metadata"), dict)
                else {}
            )
            summaries[ano].append(
                {
                    "id": legislador_meta.get("id"),
                    "nome": legislador_meta.get("nome"),
                    "nomeEleitoral": legislador_meta.get("nomeEleitoral"),
                    "siglaPartido": legislador_meta.get("siglaPartido"),
                    "siglaUf": legislador_meta.get("siglaUf"),
                    "totalDespesas": legislador_meta.get("totalDespesas"),
                    "numeroDespesas": legislador_meta.get("numeroDespesas"),
                }
            )
    return summaries


def build_supplier_summaries(fornecedores_path: Path) -> Dict[int, List[dict]]:
    year_suppliers: Dict[int, List[dict]] = defaultdict(list)
    if not fornecedores_path.exists():
        return year_suppliers
    try:
        fornecedores = _load_json(fornecedores_path)
    except Exception:
        return year_suppliers
    for fornecedor in fornecedores:
        anos_info = fornecedor.get("anos", [])
        if not isinstance(anos_info, list):
            continue
        for ano_entry in anos_info:
            if not isinstance(ano_entry, dict):
                continue
            ano = ano_entry.get("ano")
            if not isinstance(ano, int):
                continue
            year_suppliers[ano].append(
                {
                    "id": fornecedor.get("id"),
                    "nome": fornecedor.get("nome"),
                    "documento": fornecedor.get("documento"),
                    "tipoDespesa": fornecedor.get("tipo_despesa_principal"),
                    "totalRecebido": ano_entry.get("total"),
                    "numeroTransacoes": ano_entry.get("numero_transacoes"),
                    "numeroLegisladores": ano_entry.get("numero_legisladores"),
                }
            )
    return year_suppliers


def write_aggregated_files(
    target_root: Path,
    legislatura: int,
    deputy_summaries: Dict[int, List[dict]],
    supplier_summaries: Dict[int, List[dict]],
) -> Dict[int, List[Path]]:
    year_files: Dict[int, List[Path]] = defaultdict(list)
    years = sorted(set(deputy_summaries.keys()) | set(supplier_summaries.keys()))
    for ano in years:
        base = target_root / f"legislatura-{legislatura}" / f"ano-{ano:04d}" / "agregado"
        base.mkdir(parents=True, exist_ok=True)
        deputados_payload = sorted(
            deputy_summaries.get(ano, []),
            key=lambda item: item.get("totalDespesas") or 0,
            reverse=True,
        )
        dep_path = base / "deputados.json"
        _write_json(dep_path, deputados_payload)
        year_files[ano].append(dep_path)

        fornecedores_payload = sorted(
            supplier_summaries.get(ano, []),
            key=lambda item: item.get("totalRecebido") or 0,
            reverse=True,
        )
        forn_path = base / "fornecedores.json"
        _write_json(forn_path, fornecedores_payload)
        year_files[ano].append(forn_path)
    return year_files


def build_datalake_manifest(
    partition_root: Path,
    legislatura: int,
    bruto_files: Dict[int, List[Path]],
    agregado_files: Dict[int, List[Path]],
) -> dict:
    entries: List[dict] = []
    years = sorted(set(bruto_files.keys()) | set(agregado_files.keys()))
    for ano in years:
        for category, files in (("bruto", bruto_files.get(ano, [])), ("agregado", agregado_files.get(ano, []))):
            if not files:
                continue
            file_entries = []
            for path in files:
                rel_path = path.relative_to(partition_root.parent)
                file_entries.append(
                    {
                        "path": str(rel_path).replace("\\", "/"),
                        "size": path.stat().st_size,
                        "sha256": _sha256(path),
                    }
                )
            entries.append(
                {
                    "ano": ano,
                    "category": category,
                    "files": file_entries,
                }
            )
    return {
        "version": 1,
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "legislatura": legislatura,
        "entries": entries,
    }


@click.command(help="Organiza o datalake em legislatura/ano/{bruto,agregado} e gera manifest")
@click.option(
    "--source-dir",
    type=click.Path(path_type=Path),
    default=Path("bancoDados/monitordespesas/congressoNacional/camaraDeputados"),
    show_default=True,
)
@click.option(
    "--target-dir",
    type=click.Path(path_type=Path),
    default=Path("bancoDados/monitordespesas/datalake"),
    show_default=True,
)
@click.option("--legislatura", type=int, default=57, show_default=True)
def main(source_dir: Path, target_dir: Path, legislatura: int) -> None:
    if not source_dir.exists():
        raise click.ClickException(f"Diretório fonte não encontrado: {source_dir}")

    deputy_dir = source_dir / "deputadosFederais" / "idDeputados"
    if not deputy_dir.exists():
        raise click.ClickException(f"Diretório de deputados não encontrado: {deputy_dir}")

    click.echo("🔍 Descobrindo arquivos por ano...")
    deputy_year_files = discover_deputy_year_files(deputy_dir, legislatura)
    if not deputy_year_files:
        raise click.ClickException("Nenhum arquivo anual encontrado (execute o ETL primeiro)")

    partition_root = target_dir
    click.echo(f"📁 Copiando dados brutos para {partition_root} ...")
    bruto_files = copy_bruto_files(deputy_year_files, partition_root)

    click.echo("📊 Gerando agregados por ano...")
    deputy_summaries = build_deputy_summaries(bruto_files)
    fornecedores_path = source_dir / "fornecedores.json"
    supplier_summaries = build_supplier_summaries(fornecedores_path)
    agregado_files = write_aggregated_files(partition_root, legislatura, deputy_summaries, supplier_summaries)

    click.echo("📝 Gerando manifest do datalake...")
    legislatura_root = partition_root / f"legislatura-{legislatura}"
    manifest = build_datalake_manifest(legislatura_root, legislatura, bruto_files, agregado_files)
    manifest_path = legislatura_root / "_datalake-manifest.json"
    _write_json(manifest_path, manifest)

    click.echo(f"✅ Manifest salvo em {manifest_path}")


if __name__ == "__main__":  # pragma: no cover
    main()
