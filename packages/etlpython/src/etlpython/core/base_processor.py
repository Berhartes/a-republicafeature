"""Abstract base processor for ETL data transformation."""

from abc import ABC, abstractmethod
from collections import defaultdict
from typing import Dict, List

from .base_models import (
    BaseDespesa,
    BaseFornecedor,
    BaseLegislador,
    BaseLegisladorResumo,
    FornecedorAccumulator,
    normalize_categoria_despesa,
    normalize_cnpj_cpf,
)


class BaseDataProcessor(ABC):
    """Abstract base class for data processors."""

    def __init__(self):
        self.fornecedores_data: Dict[str, FornecedorAccumulator] = {}

        def _stats_factory():
            return {
                "total_despesas": 0.0,
                "numero_despesas": 0,
                "fornecedores": set(),
                "gastos_por_ano": defaultdict(float),
                "gastos_por_categoria": defaultdict(float),
                "gastos_por_ano_categoria": defaultdict(lambda: defaultdict(float)),
            }

        self.legisladores_stats: Dict[int, Dict] = defaultdict(_stats_factory)

    def process_legislador_despesas(self, legislador: BaseLegislador, despesas: List[BaseDespesa]) -> None:
        """Process expenses for a single legislator."""
        for despesa in despesas:
            self._process_single_despesa(legislador, despesa)

    def _process_single_despesa(self, legislador: BaseLegislador, despesa: BaseDespesa) -> None:
        """Process a single expense record."""
        # Normalize despesa data (get normalized values but don't modify object)
        tipo_despesa_norm = normalize_categoria_despesa(despesa.tipo_despesa)
        fornecedor_documento_norm = normalize_cnpj_cpf(despesa.fornecedor_documento)

        # Skip invalid expenses
        valor = despesa.valor_efetivo
        if not valor or valor <= 0:
            return

        # Update legislador stats
        stats = self.legisladores_stats[legislador.id]
        stats["total_despesas"] += valor
        stats["numero_despesas"] += 1
        stats["gastos_por_ano"][despesa.ano] += valor
        stats["gastos_por_categoria"][tipo_despesa_norm] += valor
        stats["gastos_por_ano_categoria"][despesa.ano][tipo_despesa_norm] += valor

        # Process supplier (use normalized values)
        supplier_key = self._get_supplier_key_from_values(despesa.fornecedor, fornecedor_documento_norm)
        if supplier_key not in self.fornecedores_data:
            self.fornecedores_data[supplier_key] = FornecedorAccumulator(
                nome=despesa.fornecedor,
                documento=fornecedor_documento_norm
            )

        # Create a normalized version of despesa for accumulator
        self.fornecedores_data[supplier_key].add_despesa_with_normalized_values(
            despesa, legislador.id, tipo_despesa_norm
        )
        stats["fornecedores"].add(supplier_key)

    def _get_supplier_key(self, despesa: BaseDespesa) -> str:
        """Generate a unique key for supplier identification."""
        if despesa.fornecedor_documento:
            return despesa.fornecedor_documento
        return despesa.fornecedor.strip().lower()
    
    def _get_supplier_key_from_values(self, nome: str, documento: str = None) -> str:
        """Generate a unique key for supplier identification from values."""
        if documento:
            return documento
        return nome.strip().lower()

    def build_fornecedores_output(self) -> List[BaseFornecedor]:
        """Build final list of suppliers sorted by total received."""
        # Sort by total received (descending)
        sorted_suppliers = sorted(
            self.fornecedores_data.values(),
            key=lambda x: x.total,
            reverse=True
        )

        # Convert to output format with rankings
        return [
            supplier.to_output(ranking=i + 1)
            for i, supplier in enumerate(sorted_suppliers)
        ]

    @abstractmethod
    def get_legisladores_resumo(self) -> List[BaseLegisladorResumo]:
        """Get summary of all processed legislators."""
        pass

    def get_stats(self) -> Dict[str, float]:
        """Get processing statistics."""
        total_legisladores = len(self.legisladores_stats)
        total_fornecedores = len(self.fornecedores_data)
        total_despesas = sum(
            stats["total_despesas"]
            for stats in self.legisladores_stats.values()
        )

        return {
            "total_legisladores": total_legisladores,
            "total_fornecedores": total_fornecedores,
            "total_despesas": round(total_despesas, 2)
        }
