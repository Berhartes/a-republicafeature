"""Shared writer for Congresso Nacional data."""

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from ....core.base_models import BaseDespesa, BaseFornecedor, BaseLegislador, BaseLegisladorResumo
from ....core.base_writer import BaseDataWriter


class CongressoDataWriter(BaseDataWriter):
    """Data writer for Congresso Nacional platforms."""

    def __init__(self, output_root: str, source_name: str):
        super().__init__(output_root)
        self.source_name = source_name  # "camaraDeputados" or "senado"

    def _ensure_platform_directories(self) -> None:
        """Ensure Congresso Nacional directories exist."""
        base_path = self.get_platform_base_path()

        # Create main directories
        (base_path / "fornecedores" / "cnpj").mkdir(parents=True, exist_ok=True)

        # Source-specific directories
        if self.source_name == "camaraDeputados":
            (base_path / "deputadosFederais" / "idDeputados").mkdir(parents=True, exist_ok=True)
        elif self.source_name == "senado":
            (base_path / "senadoresFederais" / "idSenadores").mkdir(parents=True, exist_ok=True)

    def get_platform_base_path(self) -> Path:
        """Get the base path for Congresso Nacional data."""
        return self.monitor_dir / "congressoNacional" / self.source_name

    def write_legislador_despesas(
        self,
        legislador: BaseLegislador,
        despesas: List[BaseDespesa],
        legislatura: int,
        anos: List[int]
    ) -> None:
        """Write legislator's expenses data."""
        base_path = self.get_platform_base_path()

        # Determine subdirectory based on source
        if self.source_name == "camaraDeputados":
            subdir = "deputadosFederais"
            id_prefix = "idDeputados"
        elif self.source_name == "senado":
            subdir = "senadoresFederais"
            id_prefix = "idSenadores"
        else:
            raise ValueError(f"Unknown source name: {self.source_name}")

        legislador_dir = base_path / subdir / id_prefix / str(legislador.id)
        legislador_dir.mkdir(parents=True, exist_ok=True)

        # Convert despesas to dict format
        despesas_data = []
        for despesa in despesas:
            # Manually build dict to avoid property serialization issues
            despesa_dict = {
                "ano": despesa.ano,
                "mes": despesa.mes,
                "valorDocumento": despesa.valorDocumento,
                "valorLiquido": despesa.valorLiquido,
                "tipoDespesa": despesa.tipoDespesa,
                "nomeFornecedor": despesa.nomeFornecedor,
                "codDocumento": despesa.codDocumento,
                "tipoDocumento": despesa.tipoDocumento,
                "codTipoDocumento": despesa.codTipoDocumento,
                "dataDocumento": despesa.dataDocumento,
                "numDocumento": despesa.numDocumento,
                "urlDocumento": despesa.urlDocumento,
                "cnpjCpfFornecedor": despesa.cnpjCpfFornecedor,
                "valorGlosa": despesa.valorGlosa,
                "numRessarcimento": despesa.numRessarcimento,
                "codLote": despesa.codLote,
                "parcela": despesa.parcela,
            }
            despesas_data.append(despesa_dict)

        # Build legislador data
        legislador_data = {
            "metadata": {
                "legislador": {
                    "id": legislador.id,
                    "nome": legislador.nome,
                    "siglaPartido": legislador.siglaPartido,
                    "siglaUf": legislador.siglaUf,
                    "totalDespesas": sum(d["valorLiquido"] or d["valorDocumento"] or 0 for d in despesas_data),
                    "numeroDespesas": len(despesas_data),
                    "legislatura": legislatura
                },
                "generatedAt": datetime.now().isoformat()
            },
            "anos": anos,
            "despesas": despesas_data
        }

        # Write to file
        output_file = legislador_dir / "dados_completos.json"
        self.write_json(legislador_data, output_file)

        # Group expenses by supplier
        self._write_supplier_files(despesas, legislador, base_path)

    def _write_supplier_files(self, despesas: List[BaseDespesa], legislador: BaseLegislador, base_path: Path) -> None:
        """Write individual supplier files with legislator's expenses."""
        fornecedores_group = {}

        for despesa in despesas:
            fornecedor_doc = despesa.fornecedor_documento
            if not fornecedor_doc:
                continue

            if fornecedor_doc not in fornecedores_group:
                fornecedores_group[fornecedor_doc] = []
            fornecedores_group[fornecedor_doc].append(despesa)

        for cnpj, supplier_despesas in fornecedores_group.items():
            supplier_dir = base_path / "fornecedores" / "cnpj" / cnpj
            supplier_dir.mkdir(parents=True, exist_ok=True)

            # Convert despesas for this supplier
            supplier_despesas_data = []
            categorias = {}
            anos_data = {}

            for despesa in supplier_despesas:
                valor = despesa.valor_liquido or despesa.valor_documento or 0

                # Categories
                categoria = despesa.tipo_despesa
                categorias[categoria] = categorias.get(categoria, 0.0) + valor

                # Years
                if despesa.ano not in anos_data:
                    anos_data[despesa.ano] = {"total": 0.0, "transacoes": 0, "deputados": 1}
                anos_data[despesa.ano]["total"] += valor
                anos_data[despesa.ano]["transacoes"] += 1

                # Despesa data
                despesa_dict = {
                    "ano": despesa.ano,
                    "mes": despesa.mes,
                    "tipoDespesa": despesa.tipo_despesa,
                    "codDocumento": despesa.documento_id,
                    "tipoDocumento": getattr(despesa, 'tipo_documento', 'Nota Fiscal'),
                    "codTipoDocumento": getattr(despesa, 'cod_tipo_documento', 0),
                    "dataDocumento": despesa.documento_data,
                    "numDocumento": despesa.documento_numero,
                    "valorDocumento": despesa.valor_documento,
                    "urlDocumento": despesa.documento_url,
                    "nomeFornecedor": despesa.fornecedor,
                    "cnpjCpfFornecedor": despesa.fornecedor_documento,
                    "valorLiquido": despesa.valor_liquido or despesa.valor_documento,
                    "valorGlosa": getattr(despesa, 'valor_glosa', 0.0),
                    "numRessarcimento": getattr(despesa, 'num_ressarcimento', ""),
                    "codLote": getattr(despesa, 'cod_lote', None),
                    "parcela": getattr(despesa, 'parcela', 0)
                }
                supplier_despesas_data.append(despesa_dict)

            total_recebido = sum(categorias.values())

            supplier_data = {
                "metadata": {
                    "fornecedor": {
                        "nome": supplier_despesas[0].fornecedor,
                        "cnpj": cnpj,
                        "total_recebido": total_recebido,
                        "numero_transacoes": len(supplier_despesas_data),
                        "numero_deputados": 1
                    },
                    "generatedAt": datetime.now().isoformat()
                },
                "categorias": categorias,
                "anos": anos_data,
                "deputados": {
                    str(legislador.id): {
                        "deputado": {
                            "id": legislador.id,
                            "uri": getattr(legislador, 'uri', ''),
                            "nome": legislador.nome,
                            "siglaPartido": getattr(legislador, 'siglaPartido', None) or getattr(legislador, 'partido', ''),
                            "uriPartido": "",
                            "siglaUf": getattr(legislador, 'siglaUf', None) or getattr(legislador, 'uf', ''),
                            "idLegislatura": getattr(legislador, 'id_legislatura', 57),
                            "urlFoto": getattr(legislador, 'url_foto', ''),
                            "email": getattr(legislador, 'email', None)
                        },
                        "total": total_recebido,
                        "transacoes": len(supplier_despesas_data),
                        "despesas": supplier_despesas_data
                    }
                }
            }

            output_file = supplier_dir / "dados_completos.json"
            self.write_json(supplier_data, output_file)

    def write_fornecedores(self, fornecedores: List[BaseFornecedor]) -> None:
        """Write consolidated suppliers data."""
        base_path = self.get_platform_base_path()
        fornecedores_file = base_path / "fornecedores.json"

        fornecedores_data = [f.model_dump() for f in fornecedores]
        self.write_json(fornecedores_data, fornecedores_file)

    def write_legisladores_resumo(self, legisladores: List[BaseLegisladorResumo]) -> None:
        """Write legislators summary data."""
        base_path = self.get_platform_base_path()

        # Determine filename based on source
        if self.source_name == "camaraDeputados":
            filename = "deputados.json"
        elif self.source_name == "senado":
            filename = "senadores.json"
        else:
            filename = "legisladores.json"

        legisladores_file = base_path / filename
        legisladores_data = [l.model_dump() for l in legisladores]
        self.write_json(legisladores_data, legisladores_file)
