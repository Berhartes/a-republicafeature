"""Helper functions for materialization scripts."""

from __future__ import annotations

import gzip
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


def get_file_modification_time(file_path: Path) -> float:
    """Return file modification timestamp or 0 if missing."""
    if not file_path.exists():
        return 0.0
    return file_path.stat().st_mtime


def should_rematerialize_deputy(
    deputy_dir: Path,
    cache_dir: Path,
    deputy_id: str,
    legislatura: int = 57,
) -> bool:
    """Check if deputy caches are outdated compared to source files."""
    pattern = f"{deputy_id}-id{legislatura}-*-dados_completos.json"
    source_files = list(deputy_dir.glob(pattern))

    if not source_files:
        fallback_paths = [
            deputy_dir / f"{deputy_id}-id{legislatura}-dados_completos.json",
            deputy_dir / f"{deputy_id}-dados_completos.json",
            deputy_dir / "dados_completos.json",
        ]
        source_files = [path for path in fallback_paths if path.exists()]

    if not source_files:
        return False

    latest_source_time = max(get_file_modification_time(path) for path in source_files)

    cache_pattern = f"deputy-{deputy_id}-transactions-*.json"
    cache_files = list(cache_dir.glob(cache_pattern))

    if not cache_files:
        return True

    oldest_cache_time = min(get_file_modification_time(path) for path in cache_files)
    return latest_source_time > oldest_cache_time


def get_years_to_rematerialize(
    deputy_dir: Path,
    cache_dir: Path,
    deputy_id: str,
    legislatura: int = 57,
) -> List[int]:
    """Return list of years whose caches need regeneration."""
    years_to_process: List[int] = []

    pattern = f"{deputy_id}-id{legislatura}-*-dados_completos.json"
    year_files = sorted(deputy_dir.glob(pattern))

    if not year_files:
        fallback = deputy_dir / "dados_completos.json"
        if fallback.exists():
            try:
                with open(fallback, "r", encoding="utf-8") as handle:
                    data = json.load(handle)
                anos = data.get("anos")
                if isinstance(anos, list):
                    return sorted({int(str(ano)) for ano in anos if str(ano).isdigit()})
                return _collect_years_from_expenses(data.get("despesas", []))
            except Exception:
                return years_to_process
        return years_to_process

    for year_file in year_files:
        ano = _extract_year_from_filename(year_file, legislatura)
        if ano is None:
            continue

        cache_file = cache_dir / f"deputy-{deputy_id}-transactions-{ano}-page1.json"
        source_time = get_file_modification_time(year_file)
        cache_time = get_file_modification_time(cache_file)

        if cache_time == 0.0 or source_time > cache_time:
            years_to_process.append(ano)

    return sorted(set(years_to_process))


def _extract_year_from_filename(file_path: Path, legislatura: int) -> Optional[int]:
    """Extract year component from a deputy data filename."""
    stem_parts = file_path.stem.split('-')
    for idx, part in enumerate(stem_parts):
        if part.startswith(f"id{legislatura}") and idx + 1 < len(stem_parts):
            try:
                return int(stem_parts[idx + 1])
            except ValueError:
                continue
    for part in stem_parts:
        if part.isdigit() and len(part) == 4:
            try:
                return int(part)
            except ValueError:
                continue
    return None


def _collect_years_from_expenses(expenses: List[Dict[str, Any]]) -> List[int]:
    """Collect available years from expense records."""
    years = {
        int(expense["ano"])
        for expense in expenses
        if isinstance(expense, dict) and isinstance(expense.get("ano"), (int, str)) and str(expense["ano"]).isdigit()
    }
    return sorted(years)


def load_deputy_data_by_year(deputy_dir: Path, legislatura: int = 57) -> Dict[str, Any]:
    """Load deputy data combining per-year files when available."""
    if not deputy_dir.is_dir():
        return {}

    deputy_id = deputy_dir.name
    pattern = f"{deputy_id}-id{legislatura}-*-dados_completos.json"
    year_files = sorted(deputy_dir.glob(pattern))

    if not year_files:
        fallback_paths = [
            deputy_dir / f"{deputy_id}-id{legislatura}-dados_completos.json",
            deputy_dir / f"{deputy_id}-dados_completos.json",
            deputy_dir / "dados_completos.json",
        ]
        for fallback in fallback_paths:
            if fallback.exists():
                with open(fallback, "r", encoding="utf-8") as handle:
                    fallback_data = json.load(handle)
                if "anos" not in fallback_data and "despesas" in fallback_data:
                    fallback_data["anos"] = _collect_years_from_expenses(fallback_data.get("despesas", []))
                return fallback_data
        return {}

    combined_data: Dict[str, Any] = {
        "despesas": [],
        "anos": [],
    }
    anos_processados = set()

    for year_file in year_files:
        try:
            with open(year_file, "r", encoding="utf-8") as handle:
                year_data = json.load(handle)
        except Exception:
            continue

        ano = _extract_year_from_filename(year_file, legislatura)
        if ano is None:
            ano_val = year_data.get("ano")
            if isinstance(ano_val, (int, str)) and str(ano_val).isdigit():
                ano = int(ano_val)
        if ano is not None:
            anos_processados.add(ano)

        if "metadata" not in combined_data and "metadata" in year_data:
            combined_data["metadata"] = year_data["metadata"]

        for field in [
            "id",
            "nome",
            "nomeEleitoral",
            "siglaPartido",
            "siglaUf",
            "urlFoto",
            "email",
            "legislatura",
        ]:
            if field not in combined_data and field in year_data:
                combined_data[field] = year_data[field]

        despesas_ano = year_data.get("despesas", []) or []
        if isinstance(despesas_ano, list):
            combined_data["despesas"].extend(despesas_ano)

        metadata_legislador = (
            year_data.get("metadata", {}).get("legislador")
            if isinstance(year_data.get("metadata"), dict)
            else None
        )
        if metadata_legislador and "metadata" in combined_data:
            combined_data.setdefault("metadata", {})
            combined_data["metadata"].setdefault("legislador", metadata_legislador)

    combined_data["anos"] = sorted(anos_processados)

    combined_data.setdefault("metadata", {})
    legislador_info = combined_data["metadata"].get("legislador", {})
    if not legislador_info:
        combined_data["metadata"].setdefault("legislador", {})
        legislador_info = combined_data["metadata"]["legislador"]

    for field in [
        "id",
        "nome",
        "nomeEleitoral",
        "siglaPartido",
        "siglaUf",
        "urlFoto",
        "email",
    ]:
        if field not in legislador_info and field in combined_data:
            legislador_info[field] = combined_data[field]

    if "legislatura" not in combined_data:
        combined_data["legislatura"] = legislador_info.get("legislatura", legislatura)
    if "legislatura" not in legislador_info:
        legislador_info["legislatura"] = combined_data.get("legislatura", legislatura)

    if "anos" not in combined_data or not combined_data["anos"]:
        combined_data["anos"] = _collect_years_from_expenses(combined_data.get("despesas", []))

    return combined_data


def load_all_deputies_data(
    deputies_dir: Path,
    legislatura: int = 57,
    limit: Optional[int] = None,
) -> Dict[str, Dict[str, Any]]:
    """Load data for all deputies inside a directory."""
    if not deputies_dir.exists():
        return {}

    all_deputies: Dict[str, Dict[str, Any]] = {}

    for deputy_dir in sorted(deputies_dir.iterdir()):
        if limit is not None and len(all_deputies) >= limit:
            break
        if not deputy_dir.is_dir():
            continue
        deputy_id = deputy_dir.name
        deputy_data = load_deputy_data_by_year(deputy_dir, legislatura=legislatura)
        if deputy_data:
            all_deputies[deputy_id] = deputy_data

    return all_deputies


def get_available_years(deputies_dir: Path, legislatura: int = 57) -> List[int]:
    """Return sorted list of all available years across deputies."""
    if not deputies_dir.exists():
        return []

    years: set[int] = set()

    for deputy_dir in deputies_dir.iterdir():
        if not deputy_dir.is_dir():
            continue
        deputy_id = deputy_dir.name
        pattern = f"{deputy_id}-id{legislatura}-*-dados_completos.json"
        for year_file in deputy_dir.glob(pattern):
            ano = _extract_year_from_filename(year_file, legislatura)
            if ano is not None:
                years.add(ano)

    return sorted(years)



# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------


def write_cache_json(
    file_path: Path,
    data: Any,
    *,
    compress: bool = True,
    public_path: Optional[str] = None,
) -> Dict[str, Any]:
    file_path.parent.mkdir(parents=True, exist_ok=True)
    json_payload = json.dumps(data, ensure_ascii=False, indent=2, default=str)
    file_content = json_payload + '\n'
    file_path.write_text(file_content, encoding='utf-8')

    gz_size = None
    if compress:
        gz_path = file_path.with_suffix(file_path.suffix + '.gz')
        with gzip.open(gz_path, 'wt', encoding='utf-8') as handle:
            handle.write(json_payload)
        gz_size = gz_path.stat().st_size

    payload_bytes = file_content.encode('utf-8')

    metadata = {
        'path': public_path or file_path.name,
        'hash': hashlib.sha256(payload_bytes).hexdigest(),
        'size': file_path.stat().st_size,
        'compressed': compress,
        'lastModified': datetime.now().isoformat(),
    }
    if gz_size is not None:
        metadata['gzSize'] = gz_size
    return metadata


class CacheManifestBuilder:
    """Collects cache metadata and writes manifest."""

    def __init__(self, manifest_path: Path) -> None:
        self.manifest_path = manifest_path
        self.entries: Dict[str, Dict[str, Any]] = {}

    def add(self, filename: str, metadata: Dict[str, Any]) -> None:
        self.entries[filename] = metadata

    def write(self) -> None:
        self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
        self.manifest_path.write_text(
            json.dumps(self.entries, ensure_ascii=False, indent=2) + '\n',
            encoding='utf-8',
        )
