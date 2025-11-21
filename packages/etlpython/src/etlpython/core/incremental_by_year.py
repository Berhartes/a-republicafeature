"""Incremental ETL helpers for managing data on a per-year basis."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Dict, Iterable, List, Optional
import json


class YearBasedIncrementalETL:
    """Manage caching and detection logic for year-based incremental ETL runs."""

    def __init__(self, legislators_dir: Path | str):
        """Create a new incremental manager.

        Args:
            legislators_dir: Directory that contains one sub-directory per legislator ID.
        """
        self.legislators_dir = Path(legislators_dir)
        self.current_year = datetime.now().year

    # ------------------------------------------------------------------
    # File helpers
    # ------------------------------------------------------------------
    def _get_legislator_dir(self, legislator_id: int) -> Path:
        return self.legislators_dir / str(legislator_id)

    def get_year_file_path(self, legislator_id: int, legislatura: int, year: int) -> Path:
        """Return the path to the cached file for a specific year."""
        filename = f"{legislator_id}-id{legislatura}-{year}-dados_completos.json"
        return self._get_legislator_dir(legislator_id) / filename

    def get_combined_file_path(self, legislator_id: int, legislatura: int) -> Path:
        """Path to the legacy combined file that stores all years together."""
        filename = f"{legislator_id}-id{legislatura}-dados_completos.json"
        return self._get_legislator_dir(legislator_id) / filename

    # ------------------------------------------------------------------
    # Detection helpers
    # ------------------------------------------------------------------
    def year_file_exists(self, legislator_id: int, legislatura: int, year: int) -> bool:
        """Return True when the cache file for ``year`` already exists."""
        return self.get_year_file_path(legislator_id, legislatura, year).exists()

    def get_years_to_process(
        self,
        legislator_id: int,
        legislatura: int,
        requested_years: Iterable[int],
        force_year: Optional[int] = None,
    ) -> List[int]:
        """Select which years must be fetched from the API.

        Rules:
        * Ignore years in the future.
        * Always process the current year.
        * When ``force_year`` is provided, process that year regardless of cache.
        * Process past years only when the cache is missing.
        """
        years_to_process: List[int] = []

        for year in requested_years:
            if year > self.current_year:
                continue

            if force_year is not None and year == force_year:
                years_to_process.append(year)
                continue

            if year == self.current_year:
                years_to_process.append(year)
                continue

            if not self.year_file_exists(legislator_id, legislatura, year):
                years_to_process.append(year)

        unique_years: List[int] = []
        seen: set[int] = set()
        for year in years_to_process:
            if year in seen:
                continue
            seen.add(year)
            unique_years.append(year)

        return unique_years

    # ------------------------------------------------------------------
    # Loading helpers
    # ------------------------------------------------------------------
    def load_year_data(self, legislator_id: int, legislatura: int, year: int) -> Optional[Dict]:
        """Load cached payload for ``year``.

        Falls back to the legacy combined file when the per-year asset is not available.
        """
        year_path = self.get_year_file_path(legislator_id, legislatura, year)
        if year_path.exists():
            return self._read_json(year_path)

        combined_path = self.get_combined_file_path(legislator_id, legislatura)
        if combined_path.exists():
            combined = self._read_json(combined_path)
            despesas = self.get_despesas_from_year_data(combined)
            filtered = [item for item in despesas if item.get("ano") == year]
            if filtered:
                return {
                    "legislador": self._extract_legislator_metadata(combined),
                    "ano": year,
                    "despesas": filtered,
                }

        return None

    def get_despesas_from_year_data(self, year_data: Dict | List) -> List[Dict]:
        """Return the list of despesas stored inside ``year_data``."""
        if not year_data:
            return []

        if isinstance(year_data, list):
            return [item for item in year_data if isinstance(item, dict)]

        if isinstance(year_data, dict):
            if "despesas" in year_data and isinstance(year_data["despesas"], list):
                return [item for item in year_data["despesas"] if isinstance(item, dict)]
            if "dados" in year_data and isinstance(year_data["dados"], dict):
                despesas = year_data["dados"].get("despesas")
                if isinstance(despesas, list):
                    return [item for item in despesas if isinstance(item, dict)]

        return []

    def load_all_years_despesas(
        self,
        legislator_id: int,
        legislatura: int,
        years: Iterable[int],
    ) -> List[Dict]:
        """Load despesas from cache for every requested year."""
        cached: List[Dict] = []
        for year in years:
            payload = self.load_year_data(legislator_id, legislatura, year)
            despesas = self.get_despesas_from_year_data(payload)
            if despesas:
                cached.extend(despesas)
        return cached

    # ------------------------------------------------------------------
    # Metadata helpers
    # ------------------------------------------------------------------
    def mark_year_as_final(self, legislator_id: int, legislatura: int, year: int) -> None:
        """Persist a metadata file that marks a year's dataset as immutable."""
        year_path = self.get_year_file_path(legislator_id, legislatura, year)
        if not year_path.exists():
            return

        despesas = self.get_despesas_from_year_data(self._read_json(year_path))
        metadata_path = year_path.parent / f"{legislator_id}-id{legislatura}-{year}-metadata.json"
        metadata = {
            "legisladorId": legislator_id,
            "legislatura": legislatura,
            "year": year,
            "total_despesas": len(despesas),
            "finalized_at": datetime.now().isoformat(),
            "is_final": True,
        }
        self._write_json(metadata_path, metadata)

    def auto_finalize_past_years(self, legislator_id: int, legislatura: int, years: Iterable[int]) -> None:
        """Ensure past years have a metadata flag marking them as finalised."""
        for year in years:
            if year >= self.current_year:
                continue

            year_path = self.get_year_file_path(legislator_id, legislatura, year)
            metadata_path = year_path.parent / f"{legislator_id}-id{legislatura}-{year}-metadata.json"
            if year_path.exists() and not metadata_path.exists():
                self.mark_year_as_final(legislator_id, legislatura, year)

    # ------------------------------------------------------------------
    # Internal utilities
    # ------------------------------------------------------------------
    def _read_json(self, path: Path) -> Dict:
        try:
            with open(path, "r", encoding="utf-8") as handle:
                return json.load(handle)
        except Exception:
            return {}

    def _write_json(self, path: Path, payload: Dict) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2, ensure_ascii=False)

    def _extract_legislator_metadata(self, payload: Dict) -> Dict:
        if not isinstance(payload, dict):
            return {}

        metadata = payload.get("metadata")
        if isinstance(metadata, dict):
            legislador = metadata.get("legislador")
            if isinstance(legislador, dict):
                return legislador
        return {}
