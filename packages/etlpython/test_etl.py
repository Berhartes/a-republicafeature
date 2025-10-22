#!/usr/bin/env python3
"""Simple test script for ETL functionality using only standard library."""

import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional
from urllib.request import Request, urlopen
from urllib.parse import urlencode, urljoin

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Constants
CAMARA_API_BASE = "https://dadosabertos.camara.leg.br/api/v2"
WAIT_BETWEEN_REQUESTS_MS = 150
MAX_EXPENSES_PER_DEPUTADO = 1200


def get_month_name(mes: int) -> str:
    """Get month name in Portuguese."""
    months = {
        1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
        5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
        9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    }
    return months.get(mes, f'Mês {mes}')


def create_year_summary_deputado(despesas: List[dict], ano: int, deputado_info: dict) -> dict:
    """Create a comprehensive summary for a deputado in a specific year."""
    year_despesas = [d for d in despesas if d.get('ano') == ano]

    if not year_despesas:
        return None

    # Group by categories and suppliers
    categorias = defaultdict(list)
    fornecedores = defaultdict(list)
    meses_gastos = defaultdict(float)

    total_gasto = 0.0

    for despesa in year_despesas:
        valor = despesa.get('valorLiquido') or despesa.get('valorDocumento') or 0.0
        categoria = normalize_categoria_despesa(despesa.get('tipoDespesa'))
        fornecedor = despesa.get('nomeFornecedor', 'Sem fornecedor')
        mes = despesa.get('mes', 0)

        total_gasto += valor
        categorias[categoria].append(despesa)
        fornecedores[fornecedor].append(despesa)
        if mes > 0:
            meses_gastos[mes] += valor

    # Build categories summary
    categorias_resumo = []
    for categoria, despesas_cat in categorias.items():
        total_categoria = sum(d.get('valorLiquido', d.get('valorDocumento', 0)) for d in despesas_cat)
        categorias_resumo.append({
            'categoria': categoria,
            'total': round(total_categoria, 2),
            'quantidade_transacoes': len(despesas_cat),
            'porcentagem_do_total': round((total_categoria / total_gasto) * 100, 2) if total_gasto > 0 else 0
        })

    categorias_resumo.sort(key=lambda x: x['total'], reverse=True)

    # Build suppliers summary
    fornecedores_resumo = []
    for fornecedor, despesas_forn in fornecedores.items():
        total_fornecedor = sum(d.get('valorLiquido', d.get('valorDocumento', 0)) for d in despesas_forn)
        cnpj = despesas_forn[0].get('cnpjCpfFornecedor', '') if despesas_forn else ''
        fornecedores_resumo.append({
            'nome': fornecedor,
            'cnpj': cnpj,
            'total': round(total_fornecedor, 2),
            'quantidade_transacoes': len(despesas_forn),
            'porcentagem_do_total': round((total_fornecedor / total_gasto) * 100, 2) if total_gasto > 0 else 0
        })

    fornecedores_resumo.sort(key=lambda x: x['total'], reverse=True)

    # Monthly distribution
    meses_resumo = []
    for mes, total_mes in meses_gastos.items():
        meses_resumo.append({
            'mes': mes,
            'nome_mes': get_month_name(mes),
            'total': round(total_mes, 2),
            'porcentagem_do_total': round((total_mes / total_gasto) * 100, 2) if total_gasto > 0 else 0
        })

    meses_resumo.sort(key=lambda x: x['mes'])

    return {
        'metadata': {
            'deputado': deputado_info,
            'ano': ano,
            'total_despesas': round(total_gasto, 2),
            'quantidade_transacoes': len(year_despesas),
            'quantidade_categorias': len(categorias),
            'quantidade_fornecedores': len(fornecedores),
            'periodo_inicio': min(d.get('dataDocumento', '') for d in year_despesas if d.get('dataDocumento')),
            'periodo_fim': max(d.get('dataDocumento', '') for d in year_despesas if d.get('dataDocumento')),
            'generatedAt': datetime.now().isoformat()
        },
        'resumo_categorias': categorias_resumo,
        'resumo_fornecedores': fornecedores_resumo,
        'distribuicao_mensal': meses_resumo,
        'despesas_detalhadas': year_despesas
    }


def create_year_summary_fornecedor(all_despesas: List[dict], ano: int, fornecedor_info: dict) -> dict:
    """Create a comprehensive summary for a fornecedor in a specific year."""
    year_despesas = [d for d in all_despesas if d.get('ano') == ano]

    if not year_despesas:
        return None

    # Group by deputado, categories, and months
    deputados_do_ano = defaultdict(list)
    categorias_do_ano = defaultdict(float)
    meses_do_ano = defaultdict(float)

    total_ano = 0.0

    for despesa in year_despesas:
        dep_id = despesa.get('deputado_id')
        valor = despesa.get('valorLiquido') or despesa.get('valorDocumento') or 0.0
        categoria = normalize_categoria_despesa(despesa.get('tipoDespesa'))
        mes = despesa.get('mes', 0)

        deputados_do_ano[dep_id].append(despesa)
        categorias_do_ano[categoria] += valor
        if mes > 0:
            meses_do_ano[mes] += valor
        total_ano += valor

    # Build deputados summary for this year
    deputados_resumo = []
    for dep_id, despesas_dep in deputados_do_ano.items():
        total_deputado = sum(d.get('valorLiquido', d.get('valorDocumento', 0)) for d in despesas_dep)
        deputado_nome = despesas_dep[0].get('deputado_nome', '') if despesas_dep else ''
        deputados_resumo.append({
            'deputado_id': dep_id,
            'deputado_nome': deputado_nome,
            'total': round(total_deputado, 2),
            'quantidade_transacoes': len(despesas_dep),
            'porcentagem_do_total': round((total_deputado / total_ano) * 100, 2) if total_ano > 0 else 0
        })

    deputados_resumo.sort(key=lambda x: x['total'], reverse=True)

    # Build categories summary
    categorias_resumo = []
    for categoria, total_cat in categorias_do_ano.items():
        categorias_resumo.append({
            'categoria': categoria,
            'total': round(total_cat, 2),
            'porcentagem_do_total': round((total_cat / total_ano) * 100, 2) if total_ano > 0 else 0
        })

    categorias_resumo.sort(key=lambda x: x['total'], reverse=True)

    # Monthly distribution
    meses_resumo = []
    for mes, total_mes in meses_do_ano.items():
        meses_resumo.append({
            'mes': mes,
            'nome_mes': get_month_name(mes),
            'total': round(total_mes, 2),
            'porcentagem_do_total': round((total_mes / total_ano) * 100, 2) if total_ano > 0 else 0
        })

    meses_resumo.sort(key=lambda x: x['mes'])

    return {
        'metadata': {
            'fornecedor': fornecedor_info,
            'ano': ano,
            'total_recebido': round(total_ano, 2),
            'quantidade_transacoes': len(year_despesas),
            'quantidade_deputados': len(deputados_do_ano),
            'quantidade_categorias': len(categorias_do_ano),
            'periodo_inicio': min(d.get('dataDocumento', '') for d in year_despesas if d.get('dataDocumento')),
            'periodo_fim': max(d.get('dataDocumento', '') for d in year_despesas if d.get('dataDocumento')),
            'generatedAt': datetime.now().isoformat()
        },
        'resumo_deputados': deputados_resumo,
        'resumo_categorias': categorias_resumo,
        'distribuicao_mensal': meses_resumo,
        'despesas_detalhadas': year_despesas
    }


def print_info(message: str) -> None:
    """Print info message."""
    print(f"ℹ️  {message}")


def print_success(message: str) -> None:
    """Print success message."""
    print(f"✅ {message}")


def print_error(message: str) -> None:
    """Print error message."""
    print(f"❌ {message}")


def fetch_json(url: str) -> dict:
    """Fetch JSON data from URL."""
    print_info(f"Fetching: {url}")

    req = Request(url)
    req.add_header("Accept", "application/json")
    req.add_header("User-Agent", "a-republica-etl-python/0.1")

    try:
        with urlopen(req, timeout=30) as response:
            if response.status != 200:
                raise Exception(f"HTTP {response.status}")
            return json.loads(response.read().decode())
    except Exception as e:
        print_error(f"Failed to fetch {url}: {e}")
        raise


def fetch_deputados(legislatura: int, limit: Optional[int] = None) -> List[dict]:
    """Fetch deputados for a legislatura."""
    print_info(f"Fetching deputados for legislatura {legislatura}")

    deputados = []
    params = {
        "idLegislatura": legislatura,
        "ordem": "ASC",
        "ordenarPor": "nome",
        "itens": "100"
    }

    url = f"{CAMARA_API_BASE}/deputados?{urlencode(params)}"

    while url:
        data = fetch_json(url)
        deputados.extend(data.get("dados", []))

        if limit and len(deputados) >= limit:
            deputados = deputados[:limit]
            break

        # Find next URL
        next_url = None
        links = data.get("links", [])
        for link in links:
            if link.get("rel") == "next":
                next_url = link.get("href")
                break

        url = next_url

        if url:
            time.sleep(WAIT_BETWEEN_REQUESTS_MS / 1000.0)

    print_success(f"Found {len(deputados)} deputados")
    return deputados


def fetch_despesas(deputado_id: int, legislatura: int) -> List[dict]:
    """Fetch despesas for a deputado from a specific legislatura."""
    print_info(f"Fetching despesas for deputado {deputado_id}")

    all_despesas = []
    params = {
        "idLegislatura": legislatura,
        "itens": "100",
        "ordem": "ASC",
        "ordenarPor": "ano"
    }

    url = f"{CAMARA_API_BASE}/deputados/{deputado_id}/despesas?{urlencode(params)}"

    while url:
        data = fetch_json(url)
        despesas = data.get("dados", [])
        all_despesas.extend(despesas)

        if len(all_despesas) >= MAX_EXPENSES_PER_DEPUTADO:
            all_despesas = all_despesas[:MAX_EXPENSES_PER_DEPUTADO]
            break

        # Find next URL
        next_url = None
        links = data.get("links", [])
        for link in links:
            if link.get("rel") == "next":
                next_url = link.get("href")
                break

        url = next_url

        if url:
            time.sleep(WAIT_BETWEEN_REQUESTS_MS / 1000.0)

    return all_despesas


def normalize_cnpj(value: Optional[str]) -> Optional[str]:
    """Normalize CNPJ."""
    if not value:
        return None
    cleaned = ''.join(c for c in value if c.isdigit())
    return cleaned if cleaned else None


def normalize_categoria_despesa(categoria: Optional[str]) -> str:
    """Normalize expense category by removing trailing dots and extra spaces."""
    if not categoria:
        return "Despesa não especificada"

    # Remove trailing dots and strip whitespace
    normalized = categoria.strip()
    if normalized.endswith('.'):
        normalized = normalized[:-1].strip()

    return normalized if normalized else "Despesa não especificada"


def process_data(deputados: List[dict], legislatura: int, data_lake_dir: Path) -> tuple:
    """Process deputados and build supplier data with hierarchical storage."""
    supplier_map = {}
    deputados_resumo = []

    # Create base directories
    congresso_dir = data_lake_dir / "monitordespesas" / "congressoNacional"
    deputados_federais_dir = congresso_dir / "deputadosFederais" / "idDeputados"
    fornecedores_dir = congresso_dir / "fornecedores" / "cnpj"

    for i, deputado in enumerate(deputados, 1):
        print_info(f"({i}/{len(deputados)}) Processing {deputado.get('nome', 'Unknown')} (ID: {deputado.get('id')})")

        deputado_id = deputado.get("id")
        if not deputado_id:
            continue

        # Fetch despesas
        despesas = fetch_despesas(deputado_id, legislatura)

        total_despesas = 0.0
        fornecedores_deputado = set()

        # Create deputado directory
        deputado_dir = deputados_federais_dir / str(deputado_id)
        deputado_dir.mkdir(parents=True, exist_ok=True)

        # Deputado data structure
        deputado_data = {
            "metadata": {
                "deputado": deputado,
                "legislatura": legislatura,
                "generatedAt": datetime.now().isoformat(),
                "totalDespesas": 0.0,
                "quantidadeDespesas": len(despesas)
            },
            "despesas": [],
            "fornecedores": {},
            "categorias": {},
            "anosSumario": {}
        }

        # Process each despesa
        for despesa in despesas:
            valor = despesa.get("valorLiquido") or despesa.get("valorDocumento") or 0.0
            if valor > 0:
                total_despesas += valor

            # Normalize category in the original despesa
            original_categoria = despesa.get("tipoDespesa")
            normalized_categoria = normalize_categoria_despesa(original_categoria)
            despesa["tipoDespesa"] = normalized_categoria

            # Add to deputado's despesas
            deputado_data["despesas"].append(despesa)

            # Process supplier
            cnpj = normalize_cnpj(despesa.get("cnpjCpfFornecedor"))
            nome_fornecedor = (despesa.get("nomeFornecedor") or "").strip()

            if nome_fornecedor:
                key = cnpj if cnpj else nome_fornecedor.lower()
                fornecedores_deputado.add(key)

                # Update deputado's fornecedores summary
                if key not in deputado_data["fornecedores"]:
                    deputado_data["fornecedores"][key] = {
                        "nome": nome_fornecedor,
                        "cnpj": cnpj,
                        "total": 0.0,
                        "transacoes": 0
                    }
                deputado_data["fornecedores"][key]["total"] += valor
                deputado_data["fornecedores"][key]["transacoes"] += 1

                # Update categories for deputado (already normalized)
                categoria = normalized_categoria
                deputado_data["categorias"][categoria] = deputado_data["categorias"].get(categoria, 0.0) + valor

                # Update years for deputado
                ano = despesa.get("ano")
                if ano not in deputado_data["anosSumario"]:
                    deputado_data["anosSumario"][ano] = {"total": 0.0, "transacoes": 0}
                deputado_data["anosSumario"][ano]["total"] += valor
                deputado_data["anosSumario"][ano]["transacoes"] += 1

                # Global supplier map
                if key not in supplier_map:
                    supplier_map[key] = {
                        "nome": nome_fornecedor,
                        "cnpj": cnpj,
                        "total": 0.0,
                        "transacoes": 0,
                        "deputados": set(),
                        "categorias": {},
                        "anos": {},
                        "despesas_por_deputado": {}
                    }

                supplier = supplier_map[key]
                supplier["total"] += valor
                supplier["transacoes"] += 1
                supplier["deputados"].add(deputado_id)

                # Track despesas by deputado for this supplier
                if deputado_id not in supplier["despesas_por_deputado"]:
                    supplier["despesas_por_deputado"][deputado_id] = {
                        "deputado": deputado,
                        "total": 0.0,
                        "transacoes": 0,
                        "despesas": []
                    }
                supplier["despesas_por_deputado"][deputado_id]["total"] += valor
                supplier["despesas_por_deputado"][deputado_id]["transacoes"] += 1
                supplier["despesas_por_deputado"][deputado_id]["despesas"].append(despesa)

                # Categories
                supplier["categorias"][categoria] = supplier["categorias"].get(categoria, 0.0) + valor

                # Years
                if ano not in supplier["anos"]:
                    supplier["anos"][ano] = {"total": 0.0, "transacoes": 0, "deputados": set()}
                supplier["anos"][ano]["total"] += valor
                supplier["anos"][ano]["transacoes"] += 1
                supplier["anos"][ano]["deputados"].add(deputado_id)

        # Update deputado totals
        deputado_data["metadata"]["totalDespesas"] = round(total_despesas, 2)

        # Save deputado data
        write_json(deputado_dir / "dados_completos.json", deputado_data)

        # Create year hierarchies for deputado
        years = set(d.get('ano') for d in despesas if d.get('ano'))
        for ano in sorted(years):
            print_info(f"Creating year summary for deputado {deputado_id}, year {ano}")
            year_summary = create_year_summary_deputado(despesas, ano, deputado)
            if year_summary:
                # Create year directory
                year_dir = deputado_dir / "anos" / str(ano)
                year_dir.mkdir(parents=True, exist_ok=True)

                # Write year summary
                write_json(year_dir / "resumo_anual.json", year_summary)

                # Write simplified summary
                simplified_summary = {
                    'deputado': deputado,
                    'ano': ano,
                    'total_gasto': year_summary['metadata']['total_despesas'],
                    'quantidade_transacoes': year_summary['metadata']['quantidade_transacoes'],
                    'principais_categorias': year_summary['resumo_categorias'][:5],
                    'principais_fornecedores': year_summary['resumo_fornecedores'][:10],
                    'distribuicao_mensal': year_summary['distribuicao_mensal']
                }
                write_json(year_dir / "resumo_simplificado.json", simplified_summary)

        # Add deputado summary
        deputados_resumo.append({
            "id": deputado_id,
            "nome": deputado.get("nome", ""),
            "siglaPartido": deputado.get("siglaPartido", ""),
            "siglaUf": deputado.get("siglaUf", ""),
            "totalDespesas": round(total_despesas, 2),
            "numeroDespesas": len(despesas),
            "fornecedoresIdentificados": len(fornecedores_deputado)
        })

    # Save supplier data hierarchically
    save_suppliers_hierarchically(supplier_map, fornecedores_dir)

    return supplier_map, deputados_resumo


def save_suppliers_hierarchically(supplier_map: Dict, fornecedores_dir: Path) -> None:
    """Save suppliers data hierarchically by CNPJ."""
    for key, supplier in supplier_map.items():
        cnpj = supplier.get("cnpj")
        if cnpj:
            # Use CNPJ as directory name
            supplier_dir = fornecedores_dir / cnpj
        else:
            # Use sanitized name for suppliers without CNPJ
            safe_name = supplier.get("nome", "unknown").replace("/", "_").replace("\\", "_")[:50]
            supplier_dir = fornecedores_dir / "sem_cnpj" / safe_name

        supplier_dir.mkdir(parents=True, exist_ok=True)

        # Build supplier data structure
        supplier_data = {
            "metadata": {
                "fornecedor": {
                    "nome": supplier["nome"],
                    "cnpj": supplier["cnpj"],
                    "total_recebido": round(supplier["total"], 2),
                    "numero_transacoes": supplier["transacoes"],
                    "numero_deputados": len(supplier["deputados"])
                },
                "generatedAt": datetime.now().isoformat()
            },
            "categorias": {
                cat: round(total, 2)
                for cat, total in sorted(supplier["categorias"].items(), key=lambda x: x[1], reverse=True)
            },
            "anos": {
                str(ano): {
                    "total": round(info["total"], 2),
                    "transacoes": info["transacoes"],
                    "deputados": len(info["deputados"])
                }
                for ano, info in sorted(supplier["anos"].items())
            },
            "deputados": {}
        }

        # Add deputados data for this supplier
        for deputado_id, dep_data in supplier["despesas_por_deputado"].items():
            supplier_data["deputados"][str(deputado_id)] = {
                "deputado": dep_data["deputado"],
                "total": round(dep_data["total"], 2),
                "transacoes": dep_data["transacoes"],
                "despesas": dep_data["despesas"]
            }

        # Save supplier data
        write_json(supplier_dir / "dados_completos.json", supplier_data)

        # Create year hierarchies for fornecedor
        # Collect all despesas from all deputados for this supplier
        all_despesas = []
        for dep_id, dep_data in supplier["despesas_por_deputado"].items():
            despesas = dep_data["despesas"]
            for despesa in despesas:
                despesa_copy = despesa.copy()
                despesa_copy['deputado_id'] = dep_id
                despesa_copy['deputado_nome'] = dep_data["deputado"].get('nome', '')
                all_despesas.append(despesa_copy)

        # Group by year
        years = set(d.get('ano') for d in all_despesas if d.get('ano'))

        for ano in sorted(years):
            print_info(f"Creating year summary for fornecedor {supplier['nome']}, year {ano}")
            year_summary = create_year_summary_fornecedor(all_despesas, ano, {
                "nome": supplier["nome"],
                "cnpj": supplier["cnpj"],
                "total_recebido": supplier["total"],
                "numero_transacoes": supplier["transacoes"],
                "numero_deputados": len(supplier["deputados"])
            })

            if year_summary:
                # Create year directory
                year_dir = supplier_dir / "anos" / str(ano)
                year_dir.mkdir(parents=True, exist_ok=True)

                # Write year summary
                write_json(year_dir / "resumo_anual.json", year_summary)

                # Simplified summary
                simplified_summary = {
                    'fornecedor': {
                        "nome": supplier["nome"],
                        "cnpj": supplier["cnpj"],
                        "total_recebido": supplier["total"],
                        "numero_transacoes": supplier["transacoes"],
                        "numero_deputados": len(supplier["deputados"])
                    },
                    'ano': ano,
                    'total_recebido': year_summary['metadata']['total_recebido'],
                    'quantidade_transacoes': year_summary['metadata']['quantidade_transacoes'],
                    'principais_deputados': year_summary['resumo_deputados'][:5],
                    'principais_categorias': year_summary['resumo_categorias'][:5],
                    'distribuicao_mensal': year_summary['distribuicao_mensal']
                }
                write_json(year_dir / "resumo_simplificado.json", simplified_summary)


def build_fornecedores_output(supplier_map: Dict) -> List[dict]:
    """Build final fornecedores output."""
    fornecedores = []

    # Sort by total amount
    sorted_suppliers = sorted(supplier_map.values(), key=lambda x: x["total"], reverse=True)

    for i, supplier in enumerate(sorted_suppliers, 1):
        # Build categories
        categorias = [
            {"categoria": cat, "total": round(total, 2)}
            for cat, total in sorted(supplier["categorias"].items(), key=lambda x: x[1], reverse=True)
        ]

        principal_categoria = categorias[0]["categoria"] if categorias else None

        # Build years
        anos = [
            {
                "ano": ano,
                "total": round(info["total"], 2),
                "numeroTransacoes": info["transacoes"],
                "numeroDeputados": len(info["deputados"])
            }
            for ano, info in sorted(supplier["anos"].items())
        ]

        fornecedor = {
            "id": supplier["cnpj"] or supplier["nome"],
            "nome": supplier["nome"],
            "cnpj_cpf": supplier["cnpj"],
            "tipo_fornecedor": None,
            "tipo_despesa_principal": principal_categoria,
            "total_recebido": round(supplier["total"], 2),
            "numero_transacoes": supplier["transacoes"],
            "numero_deputados": len(supplier["deputados"]),
            "score_suspeicao": None,
            "categorias": categorias,
            "anos": anos,
            "ranking": i,
            "created_at": datetime.now().isoformat()
        }

        fornecedores.append(fornecedor)

    return fornecedores


def write_json(file_path: Path, data) -> None:
    """Write data to JSON file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    print_success(f"Written: {file_path}")


def main():
    """Main ETL function."""
    import sys

    # Parse arguments
    legislatura = int(sys.argv[1]) if len(sys.argv) > 1 else 57
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None

    print(f"🐍 ETL Python - Despesas dos Deputados")
    print(f"Legislature: {legislatura}")
    if limit:
        print(f"Limit: {limit} deputados")

    print(f"Processing all years for legislatura {legislatura}")

    try:
        # Get project root (4 levels up from this file)
        project_root = Path(__file__).resolve().parents[2]
        data_lake_dir = project_root / "bancoDados"
        monitor_dir = data_lake_dir / "monitordespesas"

        print_info(f"Project root: {project_root}")

        # Extract deputados
        deputados = fetch_deputados(legislatura, limit)

        if not deputados:
            print_error("No deputados found")
            return

        # Process data
        supplier_map, deputados_resumo = process_data(deputados, legislatura, data_lake_dir)

        # Build output
        fornecedores = build_fornecedores_output(supplier_map)

        # Calculate stats
        total_despesas = sum(f["total_recebido"] for f in fornecedores)

        # Write consolidated files in congressoNacional structure
        congresso_dir = data_lake_dir / "monitordespesas" / "congressoNacional"
        write_json(congresso_dir / "fornecedores" / "fornecedores.json", fornecedores)
        write_json(congresso_dir / "deputadosFederais" / "deputados.json", deputados_resumo)

        # Get unique years from processed data
        anos_processados = sorted(set(
            ano for fornecedor in supplier_map.values()
            for ano in fornecedor.get("anos", {}).keys()
        ))

        # Write manifest
        manifest = {
            "generatedAt": datetime.now().isoformat(),
            "legislatura": legislatura,
            "anos": anos_processados,
            "totalDeputados": len(deputados_resumo),
            "totalFornecedores": len(fornecedores),
            "totalDespesas": round(total_despesas, 2)
        }
        write_json(monitor_dir / "manifest.json", manifest)

        # Print summary
        print()
        print_success("ETL completed successfully!")
        print_success(f"📊 Fornecedores consolidated: {len(fornecedores)}")
        print_success(f"🏛️  Deputados processed: {len(deputados_resumo)}")
        print_success(f"💰 Total expenses: R$ {total_despesas:,.2f}")

    except Exception as e:
        print_error(f"ETL failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()