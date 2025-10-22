#!/usr/bin/env python3
"""
Script para organizar hierarquicamente as despesas por ano
para deputados e fornecedores.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
from collections import defaultdict


def print_info(message: str) -> None:
    """Print info message."""
    print(f"ℹ️  {message}")


def print_success(message: str) -> None:
    """Print success message."""
    print(f"✅ {message}")


def print_error(message: str) -> None:
    """Print error message."""
    print(f"❌ {message}")


def write_json(file_path: Path, data: Any) -> None:
    """Write data to JSON file."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)
    print_success(f"Written: {file_path}")


def create_year_summary(despesas: List[Dict], ano: int) -> Dict:
    """Create a comprehensive summary for a specific year."""
    year_despesas = [d for d in despesas if d.get('ano') == ano]

    if not year_despesas:
        return None

    # Group by categories
    categorias = defaultdict(list)
    fornecedores = defaultdict(list)
    meses_gastos = defaultdict(float)

    total_gasto = 0.0

    for despesa in year_despesas:
        valor = despesa.get('valorLiquido') or despesa.get('valorDocumento') or 0.0
        categoria = despesa.get('tipoDespesa', 'Sem categoria')
        fornecedor = despesa.get('nomeFornecedor', 'Sem fornecedor')
        mes = despesa.get('mes', 0)

        total_gasto += valor
        categorias[categoria].append(despesa)
        fornecedores[fornecedor].append(despesa)
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
        if mes > 0:  # Valid month
            meses_resumo.append({
                'mes': mes,
                'nome_mes': get_month_name(mes),
                'total': round(total_mes, 2),
                'porcentagem_do_total': round((total_mes / total_gasto) * 100, 2) if total_gasto > 0 else 0
            })

    meses_resumo.sort(key=lambda x: x['mes'])

    return {
        'metadata': {
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


def get_month_name(mes: int) -> str:
    """Get month name in Portuguese."""
    months = {
        1: 'Janeiro', 2: 'Fevereiro', 3: 'Março', 4: 'Abril',
        5: 'Maio', 6: 'Junho', 7: 'Julho', 8: 'Agosto',
        9: 'Setembro', 10: 'Outubro', 11: 'Novembro', 12: 'Dezembro'
    }
    return months.get(mes, f'Mês {mes}')


def organize_deputado_by_year(deputado_dir: Path) -> None:
    """Organize deputado data by year."""
    dados_completos_path = deputado_dir / "dados_completos.json"

    if not dados_completos_path.exists():
        print_error(f"File not found: {dados_completos_path}")
        return

    with open(dados_completos_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    deputado_info = data.get('metadata', {}).get('deputado', {})
    despesas = data.get('despesas', [])

    print_info(f"Organizing {deputado_info.get('nome', 'Unknown')} (ID: {deputado_info.get('id')})")

    # Group despesas by year
    years = set(d.get('ano') for d in despesas if d.get('ano'))

    for ano in sorted(years):
        print_info(f"Processing year {ano}")

        year_summary = create_year_summary(despesas, ano)
        if year_summary:
            # Create year directory
            year_dir = deputado_dir / "anos" / str(ano)
            year_dir.mkdir(parents=True, exist_ok=True)

            # Write year summary
            write_json(year_dir / "resumo_anual.json", year_summary)

            # Write simplified summary
            simplified_summary = {
                'deputado': deputado_info,
                'ano': ano,
                'total_gasto': year_summary['metadata']['total_despesas'],
                'quantidade_transacoes': year_summary['metadata']['quantidade_transacoes'],
                'principais_categorias': year_summary['resumo_categorias'][:5],
                'principais_fornecedores': year_summary['resumo_fornecedores'][:10],
                'distribuicao_mensal': year_summary['distribuicao_mensal']
            }
            write_json(year_dir / "resumo_simplificado.json", simplified_summary)


def organize_fornecedor_by_year(fornecedor_dir: Path) -> None:
    """Organize fornecedor data by year."""
    dados_completos_path = fornecedor_dir / "dados_completos.json"

    if not dados_completos_path.exists():
        print_error(f"File not found: {dados_completos_path}")
        return

    with open(dados_completos_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    fornecedor_info = data.get('metadata', {}).get('fornecedor', {})
    deputados_data = data.get('deputados', {})

    print_info(f"Organizing {fornecedor_info.get('nome', 'Unknown')} (CNPJ: {fornecedor_info.get('cnpj')})")

    # Collect all despesas from all deputados
    all_despesas = []
    for dep_id, dep_data in deputados_data.items():
        despesas = dep_data.get('despesas', [])
        for despesa in despesas:
            despesa['deputado_id'] = dep_id
            despesa['deputado_nome'] = dep_data.get('deputado', {}).get('nome', '')
            all_despesas.append(despesa)

    # Group by year
    years = set(d.get('ano') for d in all_despesas if d.get('ano'))

    for ano in sorted(years):
        print_info(f"Processing year {ano} for fornecedor")

        year_despesas = [d for d in all_despesas if d.get('ano') == ano]

        if year_despesas:
            # Create year directory
            year_dir = fornecedor_dir / "anos" / str(ano)
            year_dir.mkdir(parents=True, exist_ok=True)

            # Group by deputado for this year
            deputados_do_ano = defaultdict(list)
            categorias_do_ano = defaultdict(float)
            meses_do_ano = defaultdict(float)

            total_ano = 0.0

            for despesa in year_despesas:
                dep_id = despesa.get('deputado_id')
                valor = despesa.get('valorLiquido') or despesa.get('valorDocumento') or 0.0
                categoria = despesa.get('tipoDespesa', 'Sem categoria')
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

            year_summary = {
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

            write_json(year_dir / "resumo_anual.json", year_summary)

            # Simplified summary
            simplified_summary = {
                'fornecedor': fornecedor_info,
                'ano': ano,
                'total_recebido': year_summary['metadata']['total_recebido'],
                'quantidade_transacoes': year_summary['metadata']['quantidade_transacoes'],
                'principais_deputados': year_summary['resumo_deputados'][:5],
                'principais_categorias': year_summary['resumo_categorias'][:5],
                'distribuicao_mensal': year_summary['distribuicao_mensal']
            }
            write_json(year_dir / "resumo_simplificado.json", simplified_summary)


def main():
    """Main function to organize data hierarchically by year."""
    print("🗂️  Organizador Hierárquico por Ano - Deputados e Fornecedores")

    base_dir = Path("/mnt/c/Users/Kast Berhartes/projetos-web-berhartes/a-republica/bancoDados/monitordespesas/congressoNacional")

    # Process specific deputado
    deputado_dir = base_dir / "deputadosFederais" / "idDeputados" / "220593"
    if deputado_dir.exists():
        print_info("Processing deputado 220593...")
        organize_deputado_by_year(deputado_dir)
    else:
        print_error(f"Deputado directory not found: {deputado_dir}")

    # Process specific fornecedor
    fornecedor_dir = base_dir / "fornecedores" / "cnpj" / "00306597005085"
    if fornecedor_dir.exists():
        print_info("Processing fornecedor 00306597005085...")
        organize_fornecedor_by_year(fornecedor_dir)
    else:
        print_error(f"Fornecedor directory not found: {fornecedor_dir}")

    print_success("Hierarchical organization completed!")


if __name__ == "__main__":
    main()