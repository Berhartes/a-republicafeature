"""Ferramentas CLI para versionar contratos da API da Câmara."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Iterable, Tuple, Type

import click
from pydantic import BaseModel, ValidationError
from rich.console import Console

from .sources.congresso_nacional.camara_deputados.client import CamaraApiClient
from .sources.congresso_nacional.camara_deputados.models import DeputadoApi, DespesaApi

console = Console()


def _package_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _contracts_dir() -> Path:
    return _package_root() / "contracts" / "camara_deputados"


def _contract_definitions() -> Iterable[Tuple[str, Type[BaseModel]]]:
    return (
        ("deputados", DeputadoApi),
        ("despesas", DespesaApi),
    )


def _build_schema_payload(model_cls: Type[BaseModel]) -> dict:
    schema = model_cls.model_json_schema()
    schema_hash = hashlib.sha256(
        json.dumps(schema, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return {
        "model": model_cls.__name__,
        "source": "camara_deputados",
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "schema_hash": schema_hash,
        "schema": schema,
    }


def _write_schema(slug: str, payload: dict) -> Path:
    contracts_dir = _contracts_dir()
    contracts_dir.mkdir(parents=True, exist_ok=True)
    target_path = contracts_dir / f"{slug}.schema.json"
    target_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return target_path


@click.group(help="Ferramentas para geração e validação de contratos da API Câmara")
def contracts_cli() -> None:
    """Grupo principal de comandos."""


@contracts_cli.command(name="export")
@click.option("--force", is_flag=True, help="Sobrescreve contratos mesmo sem mudanças.")
def export_contracts(force: bool) -> None:
    updated = 0
    skipped = 0

    for slug, model_cls in _contract_definitions():
        payload = _build_schema_payload(model_cls)
        target_path = _contracts_dir() / f"{slug}.schema.json"

        if target_path.exists() and not force:
            try:
                current = json.loads(target_path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                current = None
            if current and current.get("schema_hash") == payload["schema_hash"]:
                skipped += 1
                console.print(f"[dim]≡ {slug}: hash inalterado ({payload['schema_hash'][:8]})[/dim]")
                continue

        path = _write_schema(slug, payload)
        updated += 1
        console.print(f"[green]✓ {slug}: contrato salvo em {path}[/green]")

    console.print(f"[bold]{updated} contrato(s) atualizados, {skipped} mantidos[/bold]")


@contracts_cli.command(name="validate")
@click.option("--live", is_flag=True, help="Consulta a API real para validar payloads.")
@click.option("--legislatura", type=int, default=57, show_default=True)
def validate_contracts(live: bool, legislatura: int) -> None:
    contracts_dir = _contracts_dir()
    errors: list[str] = []

    for slug, model_cls in _contract_definitions():
        target_path = contracts_dir / f"{slug}.schema.json"
        if not target_path.exists():
            errors.append(f"Contrato {slug} não encontrado em {target_path}")
            continue

        try:
            stored_payload = json.loads(target_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"Contrato {slug} corrompido ({exc})")
            continue

        current_payload = _build_schema_payload(model_cls)
        if stored_payload.get("schema_hash") != current_payload["schema_hash"]:
            errors.append(
                f"Contrato {slug} desatualizado: {stored_payload.get('schema_hash')} ≠ {current_payload['schema_hash']}"
            )

    if live and not errors:
        client = CamaraApiClient()
        try:
            sample_deputados = client.fetch_legislators(legislatura, limit=1)
            if sample_deputados:
                DeputadoApi.model_validate(sample_deputados[0].model_dump())
        except ValidationError as exc:
            errors.append(f"Payload de deputados fora do contrato: {exc}")
        except Exception as exc:
            errors.append(f"Erro ao consultar deputados: {exc}")

        try:
            if sample_deputados:
                despesas = client.fetch_expenses(sample_deputados[0].id, anos=[datetime.utcnow().year])
                for despesa in despesas[:3]:
                    DespesaApi.model_validate(despesa.model_dump())
        except ValidationError as exc:
            errors.append(f"Payload de despesas fora do contrato: {exc}")
        except Exception as exc:
            errors.append(f"Erro ao consultar despesas: {exc}")

    if errors:
        for message in errors:
            console.print(f"[red]✗ {message}[/red]")
        raise SystemExit(1)

    console.print("[green]Todos os contratos estão alinhados.[/green]")


if __name__ == "__main__":  # pragma: no cover
    contracts_cli()
