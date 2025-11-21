"""Integrity checker for partitioned datalake manifests."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

import click


def _sha256(path: Path) -> str:
    import hashlib

    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _load_manifest(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise click.ClickException(f"Manifest corrompido ({path}): {exc}")


@click.command(help="Verifica integridade do datalake particionado usando _datalake-manifest.json")
@click.option(
    "--manifest",
    "manifest_path",
    type=click.Path(path_type=Path),
    default=Path("bancoDados/monitordespesas/datalake/legislatura-57/_datalake-manifest.json"),
    show_default=True,
)
def main(manifest_path: Path) -> None:
    if not manifest_path.exists():
        raise click.ClickException(f"Manifest não encontrado: {manifest_path}")

    manifest = _load_manifest(manifest_path)
    entries = manifest.get("entries") or []
    if not isinstance(entries, list):
        raise click.ClickException("Manifest inválido: campo 'entries' ausente")

    base_dir = manifest_path.parent.parent
    errors: List[str] = []

    for entry in entries:
        ano = entry.get("ano")
        category = entry.get("category")
        files = entry.get("files") or []
        click.echo(f"🔎 Verificando ano {ano} ({category})")
        for file_info in files:
            rel_path = Path(file_info.get("path"))
            file_path = base_dir / rel_path
            if not file_path.exists():
                errors.append(f"Arquivo ausente: {file_path}")
                continue
            expected_hash = file_info.get("sha256")
            current_hash = _sha256(file_path)
            if current_hash != expected_hash:
                errors.append(
                    f"Hash divergente ({file_path}): esperava {expected_hash}, atual {current_hash}"
                )

    if errors:
        for message in errors:
            click.echo(f"❌ {message}")
        raise SystemExit(1)

    click.echo("✅ Datalake íntegro segundo o manifest.")


if __name__ == "__main__":  # pragma: no cover
    main()
