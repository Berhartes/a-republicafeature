"""Abstract base writer for ETL data persistence."""

import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Dict, List

from .base_models import BaseDespesa, BaseFornecedor, BaseLegislador, BaseLegisladorResumo, BaseManifest


class BaseDataWriter(ABC):
    """Abstract base class for data writers."""

    def __init__(self, output_root: str):
        self.output_root = Path(output_root)
        self.monitor_dir = self.output_root / "bancoDados" / "monitordespesas"

    def ensure_directories(self) -> None:
        """Ensure all necessary directories exist."""
        self.monitor_dir.mkdir(parents=True, exist_ok=True)
        self._ensure_platform_directories()

    @abstractmethod
    def _ensure_platform_directories(self) -> None:
        """Ensure platform-specific directories exist."""
        pass

    @abstractmethod
    def get_platform_base_path(self) -> Path:
        """Get the base path for this platform's data."""
        pass

    def write_json(self, data: any, file_path: Path) -> None:
        """Write data as JSON to file."""
        file_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_json_serializable(data, path=str(file_path))
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def _ensure_json_serializable(self, value: any, path: str = 'root') -> None:
        """Recursively validate that ``value`` can be JSON dumped."""
        try:
            json.dumps(value, ensure_ascii=False)
            return
        except TypeError:
            pass

        if isinstance(value, dict):
            for key, item in value.items():
                self._ensure_json_serializable(item, f"{path}.{key}")
            return

        if isinstance(value, (list, tuple, set)):
            for idx, item in enumerate(value):
                self._ensure_json_serializable(item, f"{path}[{idx}]")
            return

        raise TypeError(f"Failed to serialize {path}: {type(value).__name__}")

    @abstractmethod
    def write_legislador_despesas(
        self,
        legislador: BaseLegislador,
        despesas: List[BaseDespesa],
        legislatura: int,
        anos: List[int],
        save_by_year: bool = True,
        detalhes: Dict | None = None
    ) -> None:
        """Write legislator's expenses data."""
        pass

    @abstractmethod
    def write_fornecedores(self, fornecedores: List[BaseFornecedor]) -> None:
        """Write consolidated suppliers data."""
        pass

    @abstractmethod
    def write_legisladores_resumo(self, legisladores: List[BaseLegisladorResumo]) -> None:
        """Write legislators summary data."""
        pass

    def write_manifest(self, manifest: BaseManifest) -> None:
        """Write ETL manifest."""
        manifest_path = self.monitor_dir / "manifest.json"
        manifest_data = manifest.model_dump()
        self.write_json(manifest_data, manifest_path)

    def write_sample_data(self, sample_path: str) -> None:
        """Write sample data for testing."""
        try:
            with open(sample_path, 'r', encoding='utf-8') as f:
                sample_data = json.load(f)

            # Write sample data to expected locations
            platform_path = self.get_platform_base_path()
            sample_file = platform_path / "fornecedores" / "sample_data.json"
            self.write_json(sample_data, sample_file)

        except Exception as e:
            raise Exception(f"Failed to write sample data: {e}")
