"""Data transformation and processing functions."""

import re
from typing import Dict, List, Optional

from ..models import DeputadoApi, DeputadoResumo, DespesaApi, FornecedorOutput, SupplierAccumulator


def normalize_cnpj(value: Optional[str]) -> Optional[str]:
    """Normalize CNPJ by removing non-digit characters."""
    if not value:
        return None
    cleaned = re.sub(r"\D", "", value)
    return cleaned if cleaned else None


def supplier_key(nome: str, cnpj: Optional[str]) -> str:
    """Generate unique key for supplier identification."""
    return cnpj if cnpj else nome.lower()


class DataProcessor:
    """Main data processing class for ETL transformations."""

    def __init__(self):
        self.supplier_map: Dict[str, SupplierAccumulator] = {}
        self.deputados_resumo: List[DeputadoResumo] = []

    def process_deputado_despesas(self, deputado: DeputadoApi, despesas: List[DespesaApi]) -> DeputadoResumo:
        """Process despesas for a single deputado and update supplier accumulations."""
        total_despesas = 0.0
        fornecedores_deputado = set()

        for despesa in despesas:
            # Calculate totals
            valor = despesa.valorLiquido or despesa.valorDocumento or 0.0
            if valor > 0:
                total_despesas += valor

            # Process supplier
            cnpj = normalize_cnpj(despesa.cnpjCpfFornecedor)
            nome_fornecedor = despesa.fornecedor.strip() if despesa.fornecedor else ""

            if nome_fornecedor:
                key = supplier_key(nome_fornecedor, cnpj)
                fornecedores_deputado.add(key)

                # Get or create supplier accumulator
                if key not in self.supplier_map:
                    self.supplier_map[key] = SupplierAccumulator(nome_fornecedor, cnpj)

                # Add despesa to supplier
                self.supplier_map[key].add_despesa(despesa, deputado.id)

        # Create deputado summary
        deputado_resumo = DeputadoResumo(
            id=deputado.id,
            nome=deputado.nome,
            siglaPartido=deputado.siglaPartido,
            siglaUf=deputado.siglaUf,
            totalDespesas=round(total_despesas, 2),
            numeroDespesas=len(despesas),
            fornecedoresIdentificados=len(fornecedores_deputado)
        )

        self.deputados_resumo.append(deputado_resumo)
        return deputado_resumo

    def build_fornecedores_output(self) -> List[FornecedorOutput]:
        """Build final fornecedores output with rankings."""
        # Sort suppliers by total amount (descending)
        sorted_suppliers = sorted(
            self.supplier_map.values(),
            key=lambda x: x.total,
            reverse=True
        )

        # Convert to output format with rankings
        fornecedores = []
        for index, supplier in enumerate(sorted_suppliers):
            ranking = index + 1
            fornecedor_output = supplier.to_output(ranking)
            fornecedores.append(fornecedor_output)

        return fornecedores

    def get_deputados_resumo(self) -> List[DeputadoResumo]:
        """Get the list of processed deputados summary."""
        return self.deputados_resumo

    def get_stats(self) -> Dict[str, any]:
        """Get processing statistics."""
        total_despesas = sum(supplier.total for supplier in self.supplier_map.values())

        return {
            "total_deputados": len(self.deputados_resumo),
            "total_fornecedores": len(self.supplier_map),
            "total_despesas": round(total_despesas, 2)
        }