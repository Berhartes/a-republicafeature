"""File writer for persisting data to JSON files."""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from rich.console import Console

from ..models import DeputadoApi, DeputadoResumo, DespesaApi, FornecedorOutput

console = Console()


class DataLakeWriter:
    """Writer for persisting data to the project's data lake structure."""

    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.data_lake_dir = self.project_root / "bancoDados"
        self.monitor_dir = self.data_lake_dir / "monitordespesas"
        self.congresso_dir = self.monitor_dir / "congressoNacional"
        self.deputados_raw_dir = self.congresso_dir / "camaraDeputados" / "deputadosFederais" / "idDeputados"
        self.fornecedores_dir = self.congresso_dir / "fornecedores"
        self.deputados_resumo_dir = self.congresso_dir / "camaraDeputados" / "deputadosFederais"

    def ensure_directories(self) -> None:
        """Create necessary directories if they don't exist."""
        directories = [
            self.congresso_dir,
            self.deputados_raw_dir,
            self.fornecedores_dir,
            self.deputados_resumo_dir
        ]

        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            console.print(f"[dim]Ensured directory: {directory}[/dim]")

    def write_json(self, file_path: Path, data: Any) -> None:
        """Write data to JSON file with proper formatting."""
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        console.print(f"[green]Written: {file_path}[/green]")

    def write_deputado_despesas(
        self,
        deputado: DeputadoApi,
        despesas: List[DespesaApi],
        legislatura: int,
        anos: List[int]
    ) -> None:
        """Write deputado despesas to raw data directory."""
        deputado_dir = self.deputados_raw_dir / str(deputado.id)
        deputado_dir.mkdir(exist_ok=True)

        total_despesas = sum(
            (despesa.valorLiquido or despesa.valorDocumento or 0.0)
            for despesa in despesas
        )

        metadata = {
            "legislatura": legislatura,
            "deputado": deputado.dict(),
            "anos": anos,
            "generatedAt": datetime.now().isoformat(),
            "totalDespesas": round(total_despesas, 2),
            "quantidadeDespesas": len(despesas)
        }

        despesas_data = {
            "metadata": metadata,
            "despesas": [despesa.dict() for despesa in despesas]
        }

        despesas_path = deputado_dir / "despesas.json"
        self.write_json(despesas_path, despesas_data)

    def write_fornecedores(self, fornecedores: List[FornecedorOutput]) -> None:
        """Write consolidated fornecedores data."""
        fornecedores_path = self.fornecedores_dir / "fornecedores.json"
        fornecedores_data = [fornecedor.dict() for fornecedor in fornecedores]
        self.write_json(fornecedores_path, fornecedores_data)

    def write_deputados_resumo(self, deputados: List[DeputadoResumo]) -> None:
        """Write deputados summary data."""
        deputados_path = self.deputados_resumo_dir / "deputados.json"
        deputados_data = [deputado.dict() for deputado in deputados]
        self.write_json(deputados_path, deputados_data)

    def write_premiacoes(self, prem_data: Dict[str, Any]) -> None:
        """Persist the premiações cache alongside other consolidated files."""
        prem_path = self.congresso_dir / "premiacoes-cache.json"
        self.write_json(prem_path, prem_data)

    def write_manifest(
        self,
        legislatura: int,
        anos: List[int],
        stats: Dict[str, Any]
    ) -> None:
        """Write manifest file with processing metadata."""
        manifest = {
            "generatedAt": datetime.now().isoformat(),
            "legislatura": legislatura,
            "anos": anos,
            "totalDeputados": stats["total_deputados"],
            "totalFornecedores": stats["total_fornecedores"],
            "totalDespesas": stats["total_despesas"]
        }

        manifest_path = self.monitor_dir / "manifest.json"
        self.write_json(manifest_path, manifest)

    def write_sample_data(self, sample_path: str) -> None:
        """Write sample/fallback data when API is unavailable."""
        console.print("[yellow]Using sample dataset (API unavailable)[/yellow]")

        if not os.path.exists(sample_path):
            raise FileNotFoundError("Sample dataset not found")

        with open(sample_path, 'r', encoding='utf-8') as f:
            sample_data = json.load(f)

        self.ensure_directories()

        # Write sample fornecedores
        self.write_json(self.fornecedores_dir / "fornecedores.json", sample_data)

        # Write empty deputados
        self.write_json(self.deputados_resumo_dir / "deputados.json", [])

        # Write sample manifest
        total_despesas = 0
        if isinstance(sample_data, list):
            total_despesas = sum(
                item.get("total_recebido", 0) for item in sample_data
            )

        manifest = {
            "generatedAt": datetime.now().isoformat(),
            "legislatura": None,
            "anos": [],
            "totalDeputados": 0,
            "totalFornecedores": len(sample_data) if isinstance(sample_data, list) else 0,
            "totalDespesas": round(total_despesas, 2)
        }

        self.write_json(self.monitor_dir / "manifest.json", manifest)
