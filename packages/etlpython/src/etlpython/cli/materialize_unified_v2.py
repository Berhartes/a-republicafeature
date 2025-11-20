#!/usr/bin/env python3
"""
Versão melhorada do materialize_unified com separação por ano.
Gera caches otimizados com dados agregados e separados temporalmente.
"""

from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Iterable, List, Any, Optional, Sequence, Set
from collections import defaultdict

from .materialize_helpers import (
    CacheManifestBuilder,
    load_deputy_data_by_year,
    get_available_years,
    write_cache_json,
)


def print_info(message: str) -> None:
    print(f"ℹ️  {message}")


def print_success(message: str) -> None:
    print(f"✅ {message}")


def print_error(message: str) -> None:
    print(f"❌ {message}")


def _normalize_years(years: Optional[Iterable[int]]) -> Optional[Set[int]]:
    if not years:
        return None
    normalized = {int(str(year)) for year in years if str(year).isdigit()}
    return normalized or None


def process_suppliers_with_years(
    suppliers_data: List[Dict],
    *,
    allowed_years: Optional[Iterable[int]] = None,
) -> Dict[str, Any]:
    """Process suppliers data adding year-based aggregations."""

    processed_suppliers = []
    all_years: Set[int] = set()
    allowed_years_set = _normalize_years(allowed_years)
    
    for supplier in suppliers_data:
        # Extract years from existing data
        anos_info = supplier.get('anos', [])
        
        # Build year-based aggregations
        total_por_ano = {}
        transacoes_por_ano = {}
        deputados_por_ano = {}
        anos_disponiveis = []
        
        for ano_data in anos_info:
            if isinstance(ano_data, dict):
                ano = ano_data.get('ano')
                if allowed_years_set is not None:
                    ano_int = int(str(ano)) if isinstance(ano, (int, str)) and str(ano).isdigit() else None
                    if ano_int is None or ano_int not in allowed_years_set:
                        continue
                if ano:
                    anos_disponiveis.append(ano)
                    all_years.add(ano)
                    total_por_ano[str(ano)] = ano_data.get('total', 0)
                    transacoes_por_ano[str(ano)] = ano_data.get('numero_transacoes', 0)
                    deputados_por_ano[str(ano)] = ano_data.get('numero_legisladores', 0)
        
        # Enhanced supplier object
        enhanced_supplier = {
            **supplier,
            'totalRecebidoPorAno': total_por_ano,
            'transacoesPorAno': transacoes_por_ano,
            'deputadosPorAno': deputados_por_ano,
            'anosDisponiveis': sorted(anos_disponiveis)
        }
        
        processed_suppliers.append(enhanced_supplier)
    
    return {
        'fornecedores': processed_suppliers,
        'metadata': {
            'totalFornecedores': len(processed_suppliers),
            'anosDisponiveis': sorted(list(all_years)),
            'generatedAt': datetime.now().isoformat()
        }
    }


def process_deputies_with_years(
    deputies_dir: Path,
    legislatura: int = 57,
    *,
    allowed_years: Optional[Iterable[int]] = None,
) -> Dict[str, Any]:
    """Process deputies data adding year-based aggregations."""

    processed_deputies = []
    all_years: Set[int] = set()
    allowed_years_set = _normalize_years(allowed_years)

    available_years = get_available_years(deputies_dir, legislatura)
    if allowed_years_set is not None:
        available_years = [ano for ano in available_years if ano in allowed_years_set]
    if available_years:
        print_info(f"Anos disponíveis: {available_years}")
        all_years.update(available_years)
    
    deputy_dirs = sorted(deputies_dir.iterdir())
    
    for deputy_dir in deputy_dirs:
        if not deputy_dir.is_dir():
            continue
        
        deputy_data = load_deputy_data_by_year(deputy_dir, legislatura)
        
        if not deputy_data:
            print_info(f"Sem dados para {deputy_dir.name}")
            continue
        
        metadata = deputy_data.get('metadata', {})
        legislador = metadata.get('legislador', {}) if isinstance(metadata, dict) else {}
        if not legislador:
            legislador = {
                'id': deputy_data.get('id'),
                'nome': deputy_data.get('nome'),
                'nomeEleitoral': deputy_data.get('nomeEleitoral'),
                'siglaPartido': deputy_data.get('siglaPartido'),
                'siglaUf': deputy_data.get('siglaUf'),
                'urlFoto': deputy_data.get('urlFoto'),
                'email': deputy_data.get('email'),
                'totalDespesas': deputy_data.get('totalGastos'),
                'numeroDespesas': deputy_data.get('totalTransacoes'),
            }
            metadata = metadata if isinstance(metadata, dict) else {}
            metadata['legislador'] = legislador
            deputy_data['metadata'] = metadata
        despesas = deputy_data.get('despesas', [])
        anos = deputy_data.get('anos', [])
        for ano in anos:
            if isinstance(ano, (int, str)) and str(ano).isdigit():
                all_years.add(int(ano))
        
        # Aggregate by year
        gastos_por_ano = defaultdict(float)
        transacoes_por_ano = defaultdict(int)
        categorias_por_ano = defaultdict(lambda: defaultdict(float))
        fornecedores_por_ano = defaultdict(set)
        
        for despesa in despesas:
            ano = despesa.get('ano')
            if ano is None:
                continue
            if isinstance(ano, str) and ano.isdigit():
                ano = int(ano)
            elif not isinstance(ano, int):
                continue
            if allowed_years_set is not None and ano not in allowed_years_set:
                continue

            all_years.add(ano)
            valor = despesa.get('valorLiquido') or despesa.get('valorDocumento') or 0
            categoria = despesa.get('tipoDespesa', 'Sem categoria')
            fornecedor = despesa.get('nomeFornecedor', 'Sem fornecedor')
            
            gastos_por_ano[ano] += valor
            transacoes_por_ano[ano] += 1
            categorias_por_ano[ano][categoria] += valor
            fornecedores_por_ano[ano].add(fornecedor)
        
        # Build enhanced deputy object
        cleaned_anos = sorted(
            {
                int(str(ano))
                for ano in anos
                if isinstance(ano, (int, str))
                and str(ano).isdigit()
                and (allowed_years_set is None or int(str(ano)) in allowed_years_set)
            }
        )
        total_gastos = legislador.get('totalDespesas')
        if total_gastos is None:
            total_gastos = round(sum(gastos_por_ano.values()), 2)
        total_transacoes = legislador.get('numeroDespesas')
        if total_transacoes is None:
            total_transacoes = sum(transacoes_por_ano.values())

        enhanced_deputy = {
            'id': legislador.get('id'),
            'nome': legislador.get('nome'),
            'nomeEleitoral': legislador.get('nomeEleitoral'),
            'siglaPartido': legislador.get('siglaPartido'),
            'siglaUf': legislador.get('siglaUf'),
            'urlFoto': legislador.get('urlFoto'),
            'email': legislador.get('email'),
            'totalGastos': total_gastos,
            'totalTransacoes': total_transacoes,
            'gastosPorAno': {str(k): round(v, 2) for k, v in gastos_por_ano.items()},
            'transacoesPorAno': {str(k): v for k, v in transacoes_por_ano.items()},
            'categoriasPorAno': {
                str(ano): {
                    cat: round(val, 2) 
                    for cat, val in cats.items()
                }
                for ano, cats in categorias_por_ano.items()
            },
            'fornecedoresPorAno': {
                str(ano): len(fornecedores)
                for ano, fornecedores in fornecedores_por_ano.items()
            },
            'anosDisponiveis': cleaned_anos if cleaned_anos else sorted(gastos_por_ano.keys()),
            'scoreSuspeicao': 0,  # TODO: Calculate
            'alertas': []  # TODO: Calculate
        }
        
        processed_deputies.append(enhanced_deputy)
    
    return {
        'deputados': processed_deputies,
        'metadata': {
            'totalDeputados': len(processed_deputies),
            'anosDisponiveis': sorted(list(all_years)),
            'generatedAt': datetime.now().isoformat()
        }
    }


def create_categories_cache(suppliers_data: List[Dict], deputies_data: List[Dict]) -> Dict[str, Any]:
    """Create categories cache with year-based data."""
    
    categorias = defaultdict(lambda: {
        'totalGeral': 0,
        'porAno': defaultdict(lambda: {
            'total': 0,
            'transacoes': 0,
            'fornecedores': set(),
            'deputados': set()
        }),
        'topFornecedores': [],
        'topDeputados': []
    })
    
    # Process suppliers
    for supplier in suppliers_data:
        categoria = supplier.get('tipo_despesa_principal') or supplier.get('categoria', 'Sem categoria')
        total_recebido_por_ano = supplier.get('totalRecebidoPorAno', {})
        transacoes_por_ano = supplier.get('transacoesPorAno', {})
        
        for ano_str, total in total_recebido_por_ano.items():
            ano = int(ano_str) if ano_str.isdigit() else None
            if not ano:
                continue
            
            categorias[categoria]['totalGeral'] += total
            categorias[categoria]['porAno'][ano]['total'] += total
            categorias[categoria]['porAno'][ano]['transacoes'] += transacoes_por_ano.get(ano_str, 0)
            categorias[categoria]['porAno'][ano]['fornecedores'].add(supplier.get('id') or supplier.get('nome'))
    
    # Process deputies
    for deputy in deputies_data:
        categorias_por_ano = deputy.get('categoriasPorAno', {})
        
        for ano_str, cats in categorias_por_ano.items():
            ano = int(ano_str) if ano_str.isdigit() else None
            if not ano:
                continue
            
            for categoria, valor in cats.items():
                categorias[categoria]['porAno'][ano]['deputados'].add(deputy.get('id'))
    
    # Convert sets to counts and format
    formatted_categorias = {}
    for categoria, data in categorias.items():
        formatted_categorias[categoria] = {
            'totalGeral': round(data['totalGeral'], 2),
            'porAno': {
                str(ano): {
                    'total': round(ano_data['total'], 2),
                    'transacoes': ano_data['transacoes'],
                    'fornecedores': len(ano_data['fornecedores']),
                    'deputados': len(ano_data['deputados'])
                }
                for ano, ano_data in sorted(data['porAno'].items())
            }
        }
    
    return {
        'categorias': formatted_categorias,
        'metadata': {
            'totalCategorias': len(formatted_categorias),
            'generatedAt': datetime.now().isoformat()
        }
    }


def materialize_unified(
    suppliers_file: Path | str = 'bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json',
    deputies_dir: Path | str = 'bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados',
    output_dir: Path | str = 'bancoDados/monitordespesas/congressoNacional/cache',
    *,
    anos: Optional[Iterable[int]] = None,
) -> Path:
    """Materialize unified caches and return generated manifest path."""

    suppliers_path = Path(suppliers_file)
    deputies_path = Path(deputies_dir)
    output_path = Path(output_dir)

    output_path.mkdir(parents=True, exist_ok=True)

    allowed_years = _normalize_years(anos)
    manifest_builder = CacheManifestBuilder(output_path / 'caches-manifest.json')

    print_info("Starting unified cache generation with year separation...")

    print_info(f"Loading suppliers from {suppliers_path}...")
    with open(suppliers_path, 'r', encoding='utf-8') as f:
        suppliers_raw = json.load(f)

    print_info("Processing suppliers with year aggregations...")
    suppliers_processed = process_suppliers_with_years(
        suppliers_raw,
        allowed_years=allowed_years,
    )

    suppliers_cache_path = output_path / 'suppliers-cache.json'
    suppliers_metadata = write_cache_json(
        suppliers_cache_path,
        suppliers_processed,
        public_path=f'/cache/{suppliers_cache_path.name}'
    )

    print_info("Processing deputies with year aggregations...")
    deputies_processed = process_deputies_with_years(
        deputies_path,
        allowed_years=allowed_years,
    )

    deputies_cache_path = output_path / 'deputies-cache.json'
    deputies_metadata = write_cache_json(
        deputies_cache_path,
        deputies_processed,
        public_path=f'/cache/{deputies_cache_path.name}'
    )

    print_info("Creating categories cache...")
    categories_data = create_categories_cache(
        suppliers_processed['fornecedores'],
        deputies_processed['deputados']
    )

    categories_cache_path = output_path / 'categories-cache.json'
    categories_metadata = write_cache_json(
        categories_cache_path,
        categories_data,
        public_path=f'/cache/{categories_cache_path.name}'
    )

    manifest_builder.add('suppliers-cache.json', suppliers_metadata)
    manifest_builder.add('deputies-cache.json', deputies_metadata)
    manifest_builder.add('categories-cache.json', categories_metadata)
    manifest_builder.write()

    print_success(f"✨ Generated {len(manifest_builder.entries)} cache files")
    print_success(f"📦 Manifest: {manifest_builder.manifest_path}")

    print_info("\n📊 Summary:")
    print_info(f"  Suppliers: {suppliers_processed['metadata']['totalFornecedores']}")
    print_info(f"  Deputies: {deputies_processed['metadata']['totalDeputados']}")
    print_info(f"  Categories: {categories_data['metadata']['totalCategorias']}")
    print_info(f"  Years: {suppliers_processed['metadata']['anosDisponiveis']}")

    return manifest_builder.manifest_path


def _parse_years_option(raw: Optional[str]) -> Optional[List[int]]:
    if not raw:
        return None
    values: Set[int] = set()
    parts = [part.strip() for part in raw.split(',') if part.strip()]
    for part in parts:
        if '-' in part:
            start_str, end_str = part.split('-', 1)
            if start_str.isdigit() and end_str.isdigit():
                start = int(start_str)
                end = int(end_str)
                step = 1 if start <= end else -1
                for year in range(start, end + step, step):
                    values.add(year)
            continue
        if part.isdigit():
            values.add(int(part))
    return sorted(values) or None


def main(argv: Optional[Sequence[str]] = None) -> None:
    """Main execution."""
    import argparse

    parser = argparse.ArgumentParser(description='Materialize unified caches with year separation')
    parser.add_argument('--suppliers-file', type=str,
                       default='bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json',
                       help='Suppliers JSON file')
    parser.add_argument('--deputies-dir', type=str,
                       default='bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados',
                       help='Deputies directory')
    parser.add_argument('--output-dir', type=str,
                       default='packages/monitor-despesas-next/public/cache',
                       help='Output directory')
    parser.add_argument('--anos', type=str,
                       help='Intervalo ou lista de anos (ex: 2019-2021,2023)')

    args = parser.parse_args(argv)

    years = _parse_years_option(args.anos)
    materialize_unified(
        suppliers_file=args.suppliers_file,
        deputies_dir=args.deputies_dir,
        output_dir=args.output_dir,
        anos=years,
    )


if __name__ == '__main__':
    main()
