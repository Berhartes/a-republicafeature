"""Shared writer for Congresso Nacional data."""

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from rich.console import Console

from ....core.base_models import BaseDespesa, BaseFornecedor, BaseLegislador, BaseLegisladorResumo
from ....core.base_writer import BaseDataWriter


console = Console()


def _extract_ultimo_status(details: Any) -> Dict[str, Any]:
    """Safely extract ultimoStatus block from detailed payload."""
    if not isinstance(details, dict):
        return {}

    payload = details.get("dados") if "dados" in details else details
    if isinstance(payload, dict):
        ultimo_status = payload.get("ultimoStatus")
        if isinstance(ultimo_status, dict):
            return ultimo_status

    return {}


class CongressoDataWriter(BaseDataWriter):
    """Data writer for Congresso Nacional platforms."""

    def __init__(self, output_root: str, source_name: str):
        super().__init__(output_root)
        self.source_name = source_name  # "camaraDeputados" or "senado"

    @property
    def congresso_dir(self) -> Path:
        """Return the root directory for Congresso Nacional data.

        Exposes a compat attribute used by CLI code when registering artifacts,
        aligning with paths like `monitor_dir / "congressoNacional"`.
        """
        return self.monitor_dir / "congressoNacional"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------
    def _despesa_to_dict(self, despesa: Any) -> Dict[str, Any]:
        """Coerce a despesa instance (model, dict or raw object) into a dict."""
        if isinstance(despesa, dict):
            data = dict(despesa)
        elif hasattr(despesa, "model_dump"):
            try:
                data = despesa.model_dump(by_alias=True, exclude_none=False)  # type: ignore[attr-defined]
            except Exception:
                data = {}
        else:
            data = {}

        field_map = {
            "ano": ("ano",),
            "mes": ("mes",),
            "valorDocumento": ("valorDocumento", "valor_documento"),
            "valorLiquido": ("valorLiquido", "valor_liquido"),
            "tipoDespesa": ("tipoDespesa", "tipo_despesa"),
            "nomeFornecedor": ("nomeFornecedor", "fornecedor"),
            "codDocumento": ("codDocumento", "documento_id"),
            "tipoDocumento": ("tipoDocumento", "tipo_documento"),
            "codTipoDocumento": ("codTipoDocumento", "cod_tipo_documento"),
            "dataDocumento": ("dataDocumento", "documento_data"),
            "numDocumento": ("numDocumento", "documento_numero"),
            "urlDocumento": ("urlDocumento", "documento_url"),
            "cnpjCpfFornecedor": ("cnpjCpfFornecedor", "fornecedor_documento"),
            "valorGlosa": ("valorGlosa", "valor_glosa"),
            "numRessarcimento": ("numRessarcimento", "num_ressarcimento"),
            "codLote": ("codLote", "cod_lote"),
            "parcela": ("parcela",),
        }

        for key, attr_names in field_map.items():
            if key in data and data[key] is not None:
                continue
            for attr_name in attr_names:
                if hasattr(despesa, attr_name):
                    value = getattr(despesa, attr_name)
                    if value is not None:
                        data[key] = value
                        break

        ano_value = data.get("ano")
        if ano_value is not None:
            try:
                data["ano"] = int(ano_value)
            except (TypeError, ValueError):
                pass

        return data

    def _calculate_total_from_dict(self, despesa_dict: Dict[str, Any]) -> float:
        valor_liquido = despesa_dict.get("valorLiquido")
        valor_documento = despesa_dict.get("valorDocumento")

        valor_para_total = valor_liquido if valor_liquido not in (None, 0) else valor_documento
        if valor_para_total is None:
            return 0.0

        try:
            return float(valor_para_total)
        except (TypeError, ValueError):
            return 0.0

    def _group_despesas_by_year(self, despesas: List[Dict[str, Any]]) -> Dict[int, List[Dict[str, Any]]]:
        grouped: Dict[int, List[Dict[str, Any]]] = {}
        for despesa in despesas:
            ano = despesa.get("ano")
            if ano is None:
                continue
            try:
                ano_int = int(ano)
            except (TypeError, ValueError):
                continue
            grouped.setdefault(ano_int, []).append(despesa)
        return grouped

    def write_legislador_despesas_by_year(
        self,
        legislador_dir: Path,
        legislador: BaseLegislador,
        legislatura: int,
        legislador_metadata: Dict[str, Any],
        despesas_by_year: Dict[int, List[Dict[str, Any]]],
        detalhes: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Persist expenses grouped by year into individual files."""
        if not despesas_by_year:
            return

        for ano in sorted(despesas_by_year.keys()):
            despesas_ano = despesas_by_year[ano]
            filename = f"{legislador.id}-id{legislatura}-{ano}-dados_completos.json"
            file_path = legislador_dir / filename

            total_ano = sum(self._calculate_total_from_dict(item) for item in despesas_ano)
            metadata_legislador = dict(legislador_metadata)
            metadata_legislador.update({
                "ano": ano,
                "totalDespesas": round(total_ano, 2),
                "numeroDespesas": len(despesas_ano),
            })

            payload: Dict[str, Any] = {
                "metadata": {
                    "legislador": metadata_legislador,
                    "generatedAt": datetime.now().isoformat(),
                },
                "ano": ano,
                "despesas": despesas_ano,
            }

            if detalhes is not None:
                payload["metadata"]["legisladorDetalhes"] = detalhes

            self.write_json(payload, file_path)
            console.print(
                f"  [dim]✅ Salvo: {filename} ({len(despesas_ano)} despesas | total R$ {total_ano:,.2f})[/dim]"
            )

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
        anos: List[int],
        save_by_year: bool = True,
        detalhes: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Write legislator's expenses data."""
        base_path = self.get_platform_base_path()

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

        despesas_data: List[Dict[str, Any]] = []
        despesas_total = 0.0

        for despesa in despesas:
            despesa_dict = self._despesa_to_dict(despesa)
            if not despesa_dict:
                continue
            despesas_data.append(despesa_dict)
            despesas_total += self._calculate_total_from_dict(despesa_dict)

        anos_from_data = sorted({item["ano"] for item in despesas_data if isinstance(item.get("ano"), int)})
        anos_payload = anos_from_data or list(anos)

        legislador_detalhes = detalhes or getattr(legislador, "detalhes_completos", None)

        nome_eleitoral = getattr(legislador, "nomeEleitoral", None)
        ultimo_status_data = _extract_ultimo_status(legislador_detalhes)
        if not nome_eleitoral and ultimo_status_data:
            nome_eleitoral = ultimo_status_data.get("nomeEleitoral") or nome_eleitoral

        if legislador_detalhes is None and self.source_name == "camaraDeputados":
            try:
                import requests

                base = "https://dadosabertos.camara.leg.br/api/v2"
                url = f"{base}/deputados/{legislador.id}"
                resp = requests.get(
                    url,
                    headers={"Accept": "application/json", "User-Agent": "a-republica-etl/0.1"},
                    timeout=20,
                )
                resp.raise_for_status()
                payload = resp.json()
                legislador_detalhes = payload
                dados = payload.get("dados") if isinstance(payload, dict) else None
                if isinstance(dados, dict):
                    ultimo_status_fallback = dados.get("ultimoStatus", {})
                    if isinstance(ultimo_status_fallback, dict):
                        nome_eleitoral = nome_eleitoral or ultimo_status_fallback.get("nomeEleitoral")
                    if not ultimo_status_data:
                        ultimo_status_data = ultimo_status_fallback
            except Exception:
                pass

        if not ultimo_status_data:
            ultimo_status_data = _extract_ultimo_status(legislador_detalhes)

        sigla_partido = (
            getattr(legislador, "siglaPartido", None)
            or getattr(legislador, "partido", None)
            or ultimo_status_data.get("siglaPartido")
            or ""
        )
        sigla_uf = (
            getattr(legislador, "siglaUf", None)
            or getattr(legislador, "uf", None)
            or ultimo_status_data.get("siglaUf")
            or ""
        )

        email_value = getattr(legislador, "email", None) or ultimo_status_data.get("email")
        if not email_value and isinstance(legislador_detalhes, dict):
            payload = legislador_detalhes.get("dados") if "dados" in legislador_detalhes else legislador_detalhes
            if isinstance(payload, dict):
                email_value = payload.get("email") or email_value

        foto_value = getattr(legislador, "url_foto", None) or ultimo_status_data.get("urlFoto")
        if not foto_value and isinstance(legislador_detalhes, dict):
            payload = legislador_detalhes.get("dados") if "dados" in legislador_detalhes else legislador_detalhes
            if isinstance(payload, dict):
                foto_value = payload.get("urlFoto") or payload.get("url_foto") or foto_value

        legislador_metadata = {
            "id": legislador.id,
            "nome": legislador.nome,
            "uri": getattr(legislador, "uri", None),
            "urlFoto": foto_value or getattr(legislador, "urlFoto", None),
            "email": email_value,
            "nomeEleitoral": nome_eleitoral,
            "siglaPartido": sigla_partido,
            "siglaUf": sigla_uf,
            "totalDespesas": round(despesas_total, 2),
            "numeroDespesas": len(despesas_data),
            "legislatura": legislatura,
        }

        legislador_data: Dict[str, Any] = {
            "metadata": {
                "legislador": dict(legislador_metadata),
                "generatedAt": datetime.now().isoformat(),
            },
            "anos": anos_payload,
            "despesas": despesas_data,
        }

        if legislador_detalhes is not None:
            legislador_data["metadata"]["legisladorDetalhes"] = legislador_detalhes

        file_with_id = legislador_dir / f"{legislador.id}-dados_completos.json"
        file_with_legislatura = legislador_dir / f"{legislador.id}-id{legislatura}-dados_completos.json"
        legacy_file = legislador_dir / "dados_completos.json"

        self.write_json(legislador_data, file_with_id)
        self.write_json(legislador_data, file_with_legislatura)
        self.write_json(legislador_data, legacy_file)

        if save_by_year:
            despesas_by_year = self._group_despesas_by_year(despesas_data)
            self.write_legislador_despesas_by_year(
                legislador_dir=legislador_dir,
                legislador=legislador,
                legislatura=legislatura,
                legislador_metadata=legislador_metadata,
                despesas_by_year=despesas_by_year,
                detalhes=legislador_detalhes,
            )

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
                            "nomeEleitoral": getattr(legislador, 'nomeEleitoral', None),  # Include nomeEleitoral
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
        legisladores_data = []
        for legislador in legisladores:
            base_data = legislador.model_dump()
            alias_data = legislador.model_dump(by_alias=True, exclude_none=True)

            combined = {**base_data, **alias_data}

            combined.setdefault(
                "nomeEleitoral",
                base_data.get("nome_eleitoral") or base_data.get("nome")
            )
            combined.setdefault(
                "siglaPartido",
                base_data.get("sigla_partido") or base_data.get("partido")
            )
            combined.setdefault(
                "siglaUf",
                base_data.get("sigla_uf") or base_data.get("uf")
            )
            combined.setdefault(
                "totalDespesas",
                base_data.get("total_despesas", 0.0)
            )
            combined.setdefault(
                "numeroDespesas",
                base_data.get("numero_despesas", 0)
            )
            combined.setdefault(
                "fornecedoresIdentificados",
                base_data.get("fornecedores_identificados", 0)
            )

            legisladores_data.append(combined)

        self.write_json(legisladores_data, legisladores_file)

        # Legacy compatibility: persist summary under deputadosFederais for downstream consumers
        if self.source_name == "camaraDeputados":
            legacy_summary = base_path / "deputadosFederais" / "deputados.json"
            self.write_json(legisladores_data, legacy_summary)

    def write_premiacoes(self, prem_data: Dict[str, Any]) -> None:
        """Persist the premiações cache at the Congresso root."""
        prem_path = self.monitor_dir / "congressoNacional" / "premiacoes-cache.json"
        self.write_json(prem_data, prem_path)
