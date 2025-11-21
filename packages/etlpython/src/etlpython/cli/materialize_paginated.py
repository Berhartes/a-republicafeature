#!/usr/bin/env python3
"""
Materialização de dados paginados para frontend.
Gera arquivos JSON otimizados com paginação e filtros por ano.
"""

from __future__ import annotations

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Iterable, List, Any, Optional, Sequence, Set
from collections import defaultdict

from .materialize_helpers import (
    CacheManifestBuilder,
    get_years_to_rematerialize,
    load_all_deputies_data,
    should_rematerialize_deputy,
    write_cache_json,
)


def print_info(message: str) -> None:
    """Print info message."""
    print(f"ℹ️  {message}")


def print_success(message: str) -> None:
    """Print success message."""
    print(f"✅ {message}")


def print_error(message: str) -> None:
    """Print error message."""
    print(f"❌ {message}")


def _normalize_years(years: Optional[Iterable[int]]) -> Optional[Set[int]]:
    if not years:
        return None
    normalized = {int(str(year)) for year in years if str(year).isdigit()}
    return normalized or None


def paginate_list(items: List[Any], page_size: int = 50) -> Dict[str, Any]:
    """Paginate a list of items."""
    total_items = len(items)
    total_pages = (total_items + page_size - 1) // page_size
    
    pages = []
    if total_pages == 0:
        pages.append({
            "page": 1,
            "items": [],
            "startIndex": 0,
            "endIndex": 0
        })
        total_pages = 1
    else:
        for page_num in range(total_pages):
            start_idx = page_num * page_size
            end_idx = min(start_idx + page_size, total_items)
            pages.append({
                "page": page_num + 1,
                "items": items[start_idx:end_idx],
                "startIndex": start_idx,
                "endIndex": end_idx
            })
    
    return {
        "totalItems": total_items,
        "totalPages": total_pages,
        "pageSize": page_size,
        "pages": pages
    }


def create_deputy_transactions_cache(
    deputy_data: Dict[str, Any],
    output_dir: Path,
    deputy_id: str,
    years_filter: Optional[Set[int]] = None,
    *,
    manifest_builder: CacheManifestBuilder | None = None,
    public_prefix: str = "transactions",
) -> Dict[str, Any]:
    """Create paginated transaction caches for a deputy, organized by year."""
    
    despesas = deputy_data.get('despesas', [])
    anos_disponiveis = [
        int(str(ano))
        for ano in deputy_data.get('anos', [])
        if isinstance(ano, (int, str)) and str(ano).isdigit()
    ]

    print_info(f"Processing {len(despesas)} transactions for deputy {deputy_id}")
    
    # Group transactions by year
    transactions_by_year = defaultdict(list)
    for despesa in despesas:
        ano = despesa.get('ano')
        if ano is None:
            continue
        if isinstance(ano, str) and ano.isdigit():
            ano = int(ano)
        elif not isinstance(ano, int):
            continue
        transactions_by_year[ano].append(despesa)
    
    if years_filter is not None:
        for ano in years_filter:
            transactions_by_year.setdefault(ano, [])
    
    # Create cache files
    cache_files = {}
    
    # All years combined (for "todos" filter)
    all_transactions_paginated = paginate_list(despesas, page_size=100)
    for page_data in all_transactions_paginated['pages']:
        page_num = page_data['page']
        filename = f"deputy-{deputy_id}-transactions-all-page{page_num}.json"
        filepath = output_dir / filename
        
        cache_data = {
            "deputyId": deputy_id,
            "year": "all",
            "page": page_num,
            "totalPages": all_transactions_paginated['totalPages'],
            "totalItems": all_transactions_paginated['totalItems'],
            "items": page_data['items']
        }
        
        metadata = write_cache_json(
            filepath,
            cache_data,
            public_path=f"{public_prefix}/{filename}",
        )
        cache_files[filename] = metadata
        if manifest_builder:
            manifest_builder.add(filename, metadata)
    
    # Per year
    for ano in sorted(transactions_by_year.keys()):
        if years_filter is not None and ano not in years_filter:
            continue
        year_transactions = transactions_by_year[ano]
        year_paginated = paginate_list(year_transactions, page_size=100)
        
        for page_data in year_paginated['pages']:
            page_num = page_data['page']
            filename = f"deputy-{deputy_id}-transactions-{ano}-page{page_num}.json"
            filepath = output_dir / filename
            
            cache_data = {
                "deputyId": deputy_id,
                "year": ano,
                "page": page_num,
                "totalPages": year_paginated['totalPages'],
                "totalItems": year_paginated['totalItems'],
                "items": page_data['items']
            }
            
            metadata = write_cache_json(
                filepath,
                cache_data,
                public_path=f"{public_prefix}/{filename}",
            )
            cache_files[filename] = metadata
            if manifest_builder:
                manifest_builder.add(filename, metadata)
    
    # Create index file
    index_filename = f"deputy-{deputy_id}-transactions-index.json"
    index_filepath = output_dir / index_filename
    
    index_data = {
        "deputyId": deputy_id,
        "totalTransactions": len(despesas),
        "availableYears": sorted(anos_disponiveis),
        "yearSummary": {
            str(ano): {
                "count": len(transactions_by_year[ano]),
                "pages": max(1, (len(transactions_by_year[ano]) + 99) // 100)
            }
            for ano in sorted(transactions_by_year.keys())
        },
        "allYears": {
            "count": len(despesas),
            "pages": all_transactions_paginated['totalPages']
        }
    }
    
    index_metadata = write_cache_json(
        index_filepath,
        index_data,
        public_path=f"{public_prefix}/{index_filename}",
    )
    cache_files[index_filename] = index_metadata
    if manifest_builder:
        manifest_builder.add(index_filename, index_metadata)
    
    return cache_files


def create_supplier_transactions_cache(
    supplier_data: Dict[str, Any],
    all_deputies_data: Dict[str, Dict[str, Any]],
    output_dir: Path,
    supplier_id: str,
    *,
    manifest_builder: CacheManifestBuilder | None = None,
    public_prefix: str = 'transactions',
) -> Dict[str, Any]:
    """Create paginated transaction caches for a supplier, organized by year."""
    
    print_info(f"Processing transactions for supplier {supplier_id}")
    
    # Collect all transactions for this supplier from all deputies
    all_transactions = []
    transactions_by_year = defaultdict(list)
    
    for deputy_id, deputy_data in all_deputies_data.items():
        despesas = deputy_data.get('despesas', [])
        
        for despesa in despesas:
            # Match by supplier name or CNPJ
            fornecedor_nome = despesa.get('nomeFornecedor', '').strip()
            fornecedor_cnpj = despesa.get('cnpjCpfFornecedor', '').strip()
            
            supplier_nome = supplier_data.get('nome', '').strip()
            supplier_cnpj = supplier_data.get('documento') or supplier_data.get('cnpj', '')
            if supplier_cnpj:
                supplier_cnpj = supplier_cnpj.strip()
            
            is_match = False
            if supplier_cnpj and fornecedor_cnpj == supplier_cnpj:
                is_match = True
            elif fornecedor_nome == supplier_nome:
                is_match = True
            
            if is_match:
                # Enrich with deputy info
                enriched_despesa = {
                    **despesa,
                    "deputadoId": deputy_id,
                    "deputadoNome": deputy_data.get('metadata', {}).get('legislador', {}).get('nome'),
                    "deputadoPartido": deputy_data.get('metadata', {}).get('legislador', {}).get('siglaPartido'),
                    "deputadoUf": deputy_data.get('metadata', {}).get('legislador', {}).get('siglaUf')
                }
                
                all_transactions.append(enriched_despesa)
                
                ano = despesa.get('ano')
                if ano is None:
                    continue
                if isinstance(ano, str) and ano.isdigit():
                    ano = int(ano)
                elif not isinstance(ano, int):
                    continue
                transactions_by_year[ano].append(enriched_despesa)
    
    print_info(f"Found {len(all_transactions)} transactions for supplier {supplier_id}")
    
    # Create cache files
    cache_files = {}
    
    # All years combined
    all_transactions_paginated = paginate_list(all_transactions, page_size=100)
    for page_data in all_transactions_paginated['pages']:
        page_num = page_data['page']
        filename = f"supplier-{supplier_id}-transactions-all-page{page_num}.json"
        filepath = output_dir / filename
        
        cache_data = {
            "supplierId": supplier_id,
            "year": "all",
            "page": page_num,
            "totalPages": all_transactions_paginated['totalPages'],
            "totalItems": all_transactions_paginated['totalItems'],
            "items": page_data['items']
        }
        
        metadata = write_cache_json(
            filepath,
            cache_data,
            public_path=f"{public_prefix}/{filename}",
        )
        cache_files[filename] = metadata
        if manifest_builder:
            manifest_builder.add(filename, metadata)
    
    # Per year
    for ano in sorted(transactions_by_year.keys()):
        year_transactions = transactions_by_year[ano]
        year_paginated = paginate_list(year_transactions, page_size=100)
        
        for page_data in year_paginated['pages']:
            page_num = page_data['page']
            filename = f"supplier-{supplier_id}-transactions-{ano}-page{page_num}.json"
            filepath = output_dir / filename
            
            cache_data = {
                "supplierId": supplier_id,
                "year": ano,
                "page": page_num,
                "totalPages": year_paginated['totalPages'],
                "totalItems": year_paginated['totalItems'],
                "items": page_data['items']
            }
            
            metadata = write_cache_json(
            filepath,
            cache_data,
            public_path=f"{public_prefix}/{filename}",
        )
            cache_files[filename] = metadata
            if manifest_builder:
                manifest_builder.add(filename, metadata)
    
    # Create index file
    index_filename = f"supplier-{supplier_id}-transactions-index.json"
    index_filepath = output_dir / index_filename
    
    anos_disponiveis = sorted(transactions_by_year.keys())
    
    index_data = {
        "supplierId": supplier_id,
        "supplierName": supplier_data.get('nome'),
        "totalTransactions": len(all_transactions),
        "availableYears": anos_disponiveis,
        "yearSummary": {
            str(ano): {
                "count": len(transactions_by_year[ano]),
                "pages": max(1, (len(transactions_by_year[ano]) + 99) // 100)
            }
            for ano in anos_disponiveis
        },
        "allYears": {
            "count": len(all_transactions),
            "pages": all_transactions_paginated['totalPages']
        }
    }
    
    index_metadata = write_cache_json(
        index_filepath,
        index_data,
        public_path=f"{public_prefix}/{index_filename}",
    )
    cache_files[index_filename] = index_metadata
    if manifest_builder:
        manifest_builder.add(index_filename, index_metadata)
    
    return cache_files


def materialize_paginated(
    deputies_dir: Path | str = 'bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados',
    suppliers_file: Path | str = 'bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json',
    output_dir: Path | str = 'bancoDados/monitordespesas/congressoNacional/cache/transactions',
    *,
    limit_deputies: Optional[int] = None,
    limit_suppliers: Optional[int] = None,
    legislatura: int = 57,
    incremental: bool = False,
    force_year: Optional[int] = None,
    anos: Optional[Iterable[int]] = None,
) -> Path:
    """Materialize paginated caches and return manifest path."""

    deputies_path = Path(deputies_dir)
    suppliers_path = Path(suppliers_file)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    manifest_builder = CacheManifestBuilder(output_path / 'caches-manifest.json')

    allowed_years = _normalize_years(anos)
    force_year_value = int(force_year) if isinstance(force_year, int) else None
    incremental_mode = incremental or force_year_value is not None

    print_info("Starting paginated cache generation...")
    if incremental_mode:
        if incremental:
            print_info("🔄 Modo incremental ativado")
        if force_year_value is not None:
            print_info(f"📅 Ano forçado: {force_year_value}")

    all_deputies_data = load_all_deputies_data(
        deputies_path,
        legislatura=legislatura,
        limit=limit_deputies,
    )
    print_info(f"Loaded {len(all_deputies_data)} deputies")

    manifest_path = output_path / 'transactions-manifest.json'
    existing_manifest_files: Dict[str, Any] = {}
    if manifest_path.exists():
        try:
            with open(manifest_path, 'r', encoding='utf-8') as handle:
                existing_manifest = json.load(handle)
            existing_files = existing_manifest.get('files', {})
            if isinstance(existing_files, dict):
                existing_manifest_files = existing_files
        except Exception as exc:
            print_error(f"Erro ao ler manifest existente: {exc}")

    all_cache_files = dict(existing_manifest_files) if incremental_mode else {}

    for deputy_id in sorted(all_deputies_data.keys()):
        deputy_data = all_deputies_data[deputy_id]
        deputy_source_dir = deputies_path / deputy_id
        years_to_process: Optional[Set[int]] = None

        if incremental_mode:
            if allowed_years:
                years_to_process = set(allowed_years)
                if force_year_value is not None:
                    years_to_process.add(force_year_value)
            else:
                derived_years = get_years_to_rematerialize(
                    deputy_source_dir,
                    output_path,
                    deputy_id,
                    legislatura=legislatura,
                )
                normalized_years = {
                    int(str(year))
                    for year in derived_years
                    if isinstance(year, (int, str)) and str(year).isdigit()
                }
                if force_year_value is not None:
                    normalized_years.add(force_year_value)
                years_to_process = normalized_years or None

                if years_to_process is None:
                    if not should_rematerialize_deputy(
                        deputy_source_dir,
                        output_path,
                        deputy_id,
                        legislatura=legislatura,
                    ):
                        print_info(f"⏭️  Pulando {deputy_id} (cache atualizado)")
                        continue
            if years_to_process:
                sorted_years = sorted(years_to_process)
                print_info(f"📅 {deputy_id}: rematerializando anos {sorted_years}")
            else:
                print_info(f"♻️ {deputy_id}: rematerializando todos os anos")
        else:
            years_to_process = set(allowed_years) if allowed_years else None
            if years_to_process:
                print_info(f"Processing deputy {deputy_id} (anos {sorted(years_to_process)})...")
            else:
                print_info(f"Processing deputy {deputy_id}...")

        cache_files = create_deputy_transactions_cache(
            deputy_data,
            output_path,
            deputy_id,
            years_filter=years_to_process,
            manifest_builder=manifest_builder,
            public_prefix='transactions',
        )
        expected_filenames = set(cache_files.keys())

        keys_to_remove: List[str] = []
        deputy_prefix = f"deputy-{deputy_id}-transactions-"
        if not incremental_mode or years_to_process is None:
            keys_to_remove = [
                key for key in all_cache_files.keys()
                if key.startswith(deputy_prefix)
            ]
        else:
            keys_to_remove.extend(
                key for key in all_cache_files.keys()
                if key.startswith(f"{deputy_prefix}all-")
            )
            index_key = f"{deputy_prefix}index.json"
            if index_key in all_cache_files:
                keys_to_remove.append(index_key)
            for year in sorted(years_to_process):
                prefix = f"{deputy_prefix}{year}-"
                keys_to_remove.extend(
                    key for key in all_cache_files.keys()
                    if key.startswith(prefix)
                )

        for key in set(keys_to_remove):
            all_cache_files.pop(key, None)

        cleanup_patterns: List[str] = []
        if not incremental_mode or years_to_process is None:
            cleanup_patterns.append(f"deputy-{deputy_id}-transactions-*.json")
        else:
            cleanup_patterns.append(f"deputy-{deputy_id}-transactions-all-page*.json")
            cleanup_patterns.append(f"deputy-{deputy_id}-transactions-index.json")
            for year in sorted(years_to_process):
                cleanup_patterns.append(f"deputy-{deputy_id}-transactions-{year}-page*.json")

        for pattern in cleanup_patterns:
            for file_path in output_path.glob(pattern):
                if file_path.name in expected_filenames:
                    continue
                try:
                    file_path.unlink()
                except FileNotFoundError:
                    pass
                gz_path = file_path.with_suffix(file_path.suffix + '.gz')
                if gz_path.exists():
                    try:
                        gz_path.unlink()
                    except FileNotFoundError:
                        pass
                all_cache_files.pop(file_path.name, None)

        all_cache_files.update(cache_files)

    with open(suppliers_path, 'r', encoding='utf-8') as handle:
        suppliers = json.load(handle)

    if limit_suppliers:
        suppliers = suppliers[:limit_suppliers]

    print_info(f"Processing {len(suppliers)} suppliers...")

    for supplier in suppliers:
        supplier_id = supplier.get('id') or supplier.get('documento') or supplier.get('nome')
        if not supplier_id:
            continue
        supplier_id_clean = supplier_id.replace('/', '-').replace(' ', '-')
        print_info(f"Processing supplier {supplier_id_clean}...")
        cache_files = create_supplier_transactions_cache(
            supplier,
            all_deputies_data,
            output_path,
            supplier_id_clean,
            manifest_builder=manifest_builder,
            public_prefix='transactions',
        )
        all_cache_files.update(cache_files)

    manifest = {
        "generatedAt": datetime.now().isoformat(),
        "version": "1.0.0",
        "totalFiles": len(all_cache_files),
        "files": all_cache_files,
    }

    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    manifest_builder.write()

    print_success(f"✨ Generated {len(all_cache_files)} cache files")
    print_success(f"📦 Manifest: {manifest_path}")

    return manifest_path


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

    parser = argparse.ArgumentParser(description='Materialize paginated transaction data')
    parser.add_argument('--deputies-dir', type=str,
                       default='bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados',
                       help='Directory containing deputy data')
    parser.add_argument('--suppliers-file', type=str,
                       default='bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json',
                       help='Suppliers JSON file')
    parser.add_argument('--output-dir', type=str,
                       default='packages/monitor-despesas-next/public/cache/transactions',
                       help='Output directory for cache files')
    parser.add_argument('--limit-deputies', type=int, default=None,
                       help='Limit number of deputies to process (for testing)')
    parser.add_argument('--limit-suppliers', type=int, default=None,
                       help='Limit number of suppliers to process (for testing)')
    parser.add_argument('--legislatura', type=int, default=57,
                       help='Legislature identifier used in file naming')
    parser.add_argument('--incremental', action='store_true',
                       help='Only rematerialize deputies whose source data changed')
    parser.add_argument('--force-year', type=int, default=None,
                       help='Force rematerialization for a specific year')
    parser.add_argument('--anos', type=str,
                       help='Intervalo ou lista de anos (ex: 2019-2021,2023)')

    args = parser.parse_args(argv)

    years = _parse_years_option(args.anos)
    materialize_paginated(
        deputies_dir=args.deputies_dir,
        suppliers_file=args.suppliers_file,
        output_dir=args.output_dir,
        limit_deputies=args.limit_deputies,
        limit_suppliers=args.limit_suppliers,
        legislatura=args.legislatura,
        incremental=args.incremental,
        force_year=args.force_year,
        anos=years,
    )


if __name__ == '__main__':
    main()
