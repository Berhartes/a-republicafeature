from __future__ import annotations

import json
from pathlib import Path

import pytest

from etlpython.cli.materialize_unified_v2 import materialize_unified
from etlpython.cli.materialize_paginated import materialize_paginated

FIXTURES = Path(__file__).parent / "fixtures" / "materialize"
SNAPSHOTS = Path(__file__).parent / "snapshots"


def _normalize_manifest(manifest_path: Path) -> dict:
    """Normalize manifest for snapshot comparison, excluding volatile fields."""
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    # Only keep stable fields (exclude hash which depends on timestamps)
    normalized = {
        key: {"size": value.get("size")}
        for key, value in sorted(data.items())
    }
    return normalized


def _assert_snapshot(payload: dict, snapshot_name: str) -> None:
    snapshot_path = SNAPSHOTS / snapshot_name
    if not snapshot_path.exists():
        snapshot_path.parent.mkdir(parents=True, exist_ok=True)
        snapshot_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        pytest.skip(f"Snapshot {snapshot_name} criado. Execute novamente para validar.")
    expected = json.loads(snapshot_path.read_text(encoding="utf-8"))
    assert payload == expected


def test_materialize_unified_snapshot(tmp_path):
    suppliers_file = FIXTURES / "fornecedores.json"
    deputies_dir = FIXTURES / "deputadosFederais" / "idDeputados"
    output_dir = tmp_path / "cache"

    materialize_unified(
        suppliers_file=suppliers_file,
        deputies_dir=deputies_dir,
        output_dir=output_dir,
        anos=[2023, 2024],
    )

    manifest = _normalize_manifest(output_dir / "caches-manifest.json")
    _assert_snapshot(manifest, "unified_manifest.json")


def test_materialize_paginated_snapshot(tmp_path):
    suppliers_file = FIXTURES / "fornecedores.json"
    deputies_dir = FIXTURES / "deputadosFederais" / "idDeputados"
    output_dir = tmp_path / "cache" / "transactions"

    materialize_paginated(
        deputies_dir=deputies_dir,
        suppliers_file=suppliers_file,
        output_dir=output_dir,
        limit_deputies=2,
        limit_suppliers=2,
        legislatura=57,
        anos=[2023, 2024],
    )

    manifest = _normalize_manifest(output_dir / "caches-manifest.json")
    _assert_snapshot(manifest, "paginated_manifest.json")
