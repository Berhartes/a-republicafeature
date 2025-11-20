# 🎯 Plano Completo: ETL Incremental + Materialização + Frontend

> **Objetivo:** Implementar sistema completo de ETL incremental por ano, otimizar materialização e ajustar frontend

---

## 📊 Status Atual da Implementação

### ✅ JÁ IMPLEMENTADO

1. **ETL Incremental por Ano**
   - ✅ `core/incremental_by_year.py` - Criado
   - ✅ `shared/writer.py` - Modificado com `write_legislador_despesas_by_year()`
   - ✅ `cli.py` - Integrado com flags `--incremental` e `--force-year`
   - ✅ Estrutura de arquivos: `{id}-id{legislatura}-{ano}-dados_completos.json`

### ⚠️ PROBLEMA IDENTIFICADO

**Materialização está lendo arquivos antigos:**
- `materialize_unified_v2.py` linha 119: busca `dados_completos.json` (formato antigo)
- `materialize_paginated.py` linha 346: busca `dados_completos.json` (formato antigo)

**Precisa ler:**
- `{id}-id{legislatura}-2022-dados_completos.json`
- `{id}-id{legislatura}-2023-dados_completos.json`
- `{id}-id{legislatura}-2024-dados_completos.json`
- `{id}-id{legislatura}-2025-dados_completos.json`

---

## 🎯 Plano de Ação Completo

## FASE 1: Corrigir Materialização para Ler Arquivos por Ano (6 horas)

### Objetivo
Atualizar scripts de materialização para ler os novos arquivos separados por ano e combinar os dados.

### Tarefa 1.1: Criar Função Auxiliar de Leitura

**Arquivo:** `packages/etlpython/src/etlpython/cli/materialize_helpers.py` (NOVO)

```python
"""
Funções auxiliares para materialização de caches.
"""

from pathlib import Path
from typing import Dict, List, Any, Optional
import json
from collections import defaultdict


def load_deputy_data_by_year(deputy_dir: Path, legislatura: int = 57) -> Dict[str, Any]:
    """
    Carrega dados de um deputado de arquivos separados por ano.
    
    Busca arquivos no formato: {id}-id{legislatura}-{ano}-dados_completos.json
    Combina todos os anos em uma estrutura unificada.
    
    Args:
        deputy_dir: Diretório do deputado
        legislatura: Número da legislatura (default: 57)
        
    Returns:
        Dicionário com dados combinados de todos os anos
    """
    if not deputy_dir.is_dir():
        return {}
    
    deputy_id = deputy_dir.name
    
    # Busca todos os arquivos de dados por ano
    year_files = list(deputy_dir.glob(f"{deputy_id}-id{legislatura}-*-dados_completos.json"))
    
    # Fallback: tenta formato antigo se não encontrar arquivos por ano
    if not year_files:
        # Tenta formatos antigos
        old_formats = [
            deputy_dir / f"{deputy_id}-id{legislatura}-dados_completos.json",
            deputy_dir / f"{deputy_id}-dados_completos.json",
            deputy_dir / "dados_completos.json"
        ]
        
        for old_file in old_formats:
            if old_file.exists():
                with open(old_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        
        return {}
    
    # Combina dados de todos os anos
    combined_data = {
        'id': None,
        'nome': None,
        'nomeEleitoral': None,
        'siglaPartido': None,
        'siglaUf': None,
        'urlFoto': None,
        'legislatura': legislatura,
        'despesas': [],
        'anos': []
    }
    
    anos_processados = set()
    
    for year_file in sorted(year_files):
        try:
            with open(year_file, 'r', encoding='utf-8') as f:
                year_data = json.load(f)
            
            # Extrai ano do nome do arquivo
            # Formato: {id}-id{legislatura}-{ano}-dados_completos.json
            filename = year_file.stem  # Remove .json
            parts = filename.split('-')
            ano = None
            for i, part in enumerate(parts):
                if part.startswith('id') and i + 1 < len(parts):
                    # Próxima parte é o ano
                    try:
                        ano = int(parts[i + 1])
                        break
                    except ValueError:
                        continue
            
            if not ano:
                # Tenta extrair do próprio arquivo
                ano = year_data.get('ano')
            
            if ano:
                anos_processados.add(ano)
            
            # Atualiza metadados (usa do primeiro arquivo ou sobrescreve)
            if not combined_data['id']:
                combined_data['id'] = year_data.get('id')
                combined_data['nome'] = year_data.get('nome')
                combined_data['nomeEleitoral'] = year_data.get('nomeEleitoral')
                combined_data['siglaPartido'] = year_data.get('siglaPartido')
                combined_data['siglaUf'] = year_data.get('siglaUf')
                combined_data['urlFoto'] = year_data.get('urlFoto')
            
            # Adiciona despesas do ano
            year_despesas = year_data.get('despesas', [])
            combined_data['despesas'].extend(year_despesas)
            
        except Exception as e:
            print(f"⚠️  Erro ao ler {year_file}: {e}")
            continue
    
    # Adiciona lista de anos
    combined_data['anos'] = sorted(list(anos_processados))
    
    # Cria estrutura de metadata compatível
    combined_data['metadata'] = {
        'legislador': {
            'id': combined_data['id'],
            'nome': combined_data['nome'],
            'nomeEleitoral': combined_data['nomeEleitoral'],
            'siglaPartido': combined_data['siglaPartido'],
            'siglaUf': combined_data['siglaUf'],
            'urlFoto': combined_data['urlFoto']
        }
    }
    
    return combined_data


def load_all_deputies_data(deputies_dir: Path, legislatura: int = 57) -> List[Dict[str, Any]]:
    """
    Carrega dados de todos os deputados.
    
    Args:
        deputies_dir: Diretório com todos os deputados
        legislatura: Número da legislatura
        
    Returns:
        Lista de dados de deputados
    """
    all_deputies = []
    
    for deputy_dir in sorted(deputies_dir.iterdir()):
        if not deputy_dir.is_dir():
            continue
        
        deputy_data = load_deputy_data_by_year(deputy_dir, legislatura)
        if deputy_data:
            all_deputies.append(deputy_data)
    
    return all_deputies


def get_available_years(deputies_dir: Path, legislatura: int = 57) -> List[int]:
    """
    Descobre quais anos estão disponíveis nos dados.
    
    Args:
        deputies_dir: Diretório com todos os deputados
        legislatura: Número da legislatura
        
    Returns:
        Lista de anos disponíveis (ordenada)
    """
    all_years = set()
    
    for deputy_dir in deputies_dir.iterdir():
        if not deputy_dir.is_dir():
            continue
        
        deputy_id = deputy_dir.name
        year_files = list(deputy_dir.glob(f"{deputy_id}-id{legislatura}-*-dados_completos.json"))
        
        for year_file in year_files:
            # Extrai ano do nome do arquivo
            filename = year_file.stem
            parts = filename.split('-')
            for i, part in enumerate(parts):
                if part.startswith('id') and i + 1 < len(parts):
                    try:
                        ano = int(parts[i + 1])
                        all_years.add(ano)
                        break
                    except ValueError:
                        continue
    
    return sorted(list(all_years))
```

### Tarefa 1.2: Atualizar `materialize_unified_v2.py`

**Arquivo:** `packages/etlpython/src/etlpython/cli/materialize_unified_v2.py`

**Modificar função `process_deputies_with_years`:**

```python
# No início do arquivo, adicionar import
from .materialize_helpers import load_deputy_data_by_year, get_available_years

def process_deputies_with_years(deputies_dir: Path, legislatura: int = 57) -> Dict[str, Any]:
    """Process deputies data adding year-based aggregations."""
    
    processed_deputies = []
    all_years = set()
    
    # ✅ NOVO: Descobre anos disponíveis
    available_years = get_available_years(deputies_dir, legislatura)
    print_info(f"Anos disponíveis: {available_years}")
    
    deputy_dirs = sorted(deputies_dir.iterdir())
    
    for deputy_dir in deputy_dirs:
        if not deputy_dir.is_dir():
            continue
        
        # ✅ MODIFICADO: Usa nova função de leitura
        deputy_data = load_deputy_data_by_year(deputy_dir, legislatura)
        
        if not deputy_data:
            print_info(f"Sem dados para {deputy_dir.name}")
            continue
        
        # Resto do código continua igual
        metadata = deputy_data.get('metadata', {})
        legislador = metadata.get('legislador', {})
        despesas = deputy_data.get('despesas', [])
        anos = deputy_data.get('anos', [])
        
        # ... resto da função continua igual
```

### Tarefa 1.3: Atualizar `materialize_paginated.py`

**Arquivo:** `packages/etlpython/src/etlpython/cli/materialize_paginated.py`

**Modificar função `main`:**

```python
# No início do arquivo, adicionar import
from .materialize_helpers import load_deputy_data_by_year, load_all_deputies_data

def main():
    """Main function to materialize paginated caches."""
    
    # ... código existente até chegar no loop de deputados ...
    
    for deputy_dir in sorted(deputies_dir.iterdir()):
        if not deputy_dir.is_dir():
            continue
        
        deputy_id = deputy_dir.name
        
        # ✅ MODIFICADO: Usa nova função de leitura
        deputy_data = load_deputy_data_by_year(deputy_dir, legislatura)
        
        if not deputy_data:
            continue
        
        # Resto do código continua igual
        create_deputy_transactions_cache(deputy_data, transactions_dir, deputy_id)
        # ...
```

---

## FASE 2: Otimizar Materialização Incremental (4 horas)

### Objetivo
Fazer materialização processar apenas anos que mudaram (similar ao ETL).

### Tarefa 2.1: Adicionar Detecção de Mudanças

**Arquivo:** `packages/etlpython/src/etlpython/cli/materialize_helpers.py`

**Adicionar funções:**

```python
def get_file_modification_time(file_path: Path) -> float:
    """Retorna timestamp de modificação do arquivo."""
    if not file_path.exists():
        return 0
    return file_path.stat().st_mtime


def should_rematerialize_deputy(
    deputy_dir: Path,
    cache_dir: Path,
    deputy_id: str,
    legislatura: int = 57
) -> bool:
    """
    Verifica se um deputado precisa ser rematerializado.
    
    Compara timestamp dos arquivos fonte com os caches gerados.
    
    Args:
        deputy_dir: Diretório do deputado
        cache_dir: Diretório de cache
        deputy_id: ID do deputado
        legislatura: Número da legislatura
        
    Returns:
        True se precisa rematerializar
    """
    # Busca arquivos fonte (por ano)
    source_files = list(deputy_dir.glob(f"{deputy_id}-id{legislatura}-*-dados_completos.json"))
    
    if not source_files:
        return False
    
    # Pega timestamp mais recente dos arquivos fonte
    latest_source_time = max(get_file_modification_time(f) for f in source_files)
    
    # Busca arquivos de cache gerados
    cache_files = list(cache_dir.glob(f"deputy-{deputy_id}-*.json"))
    
    if not cache_files:
        # Não tem cache, precisa gerar
        return True
    
    # Pega timestamp mais antigo dos caches
    oldest_cache_time = min(get_file_modification_time(f) for f in cache_files)
    
    # Se fonte é mais recente que cache, precisa rematerializar
    return latest_source_time > oldest_cache_time


def get_years_to_rematerialize(
    deputy_dir: Path,
    cache_dir: Path,
    deputy_id: str,
    legislatura: int = 57
) -> List[int]:
    """
    Descobre quais anos de um deputado precisam ser rematerializados.
    
    Args:
        deputy_dir: Diretório do deputado
        cache_dir: Diretório de cache
        deputy_id: ID do deputado
        legislatura: Número da legislatura
        
    Returns:
        Lista de anos que precisam ser rematerializados
    """
    years_to_process = []
    
    # Busca todos os arquivos por ano
    year_files = list(deputy_dir.glob(f"{deputy_id}-id{legislatura}-*-dados_completos.json"))
    
    for year_file in year_files:
        # Extrai ano do arquivo
        filename = year_file.stem
        parts = filename.split('-')
        ano = None
        for i, part in enumerate(parts):
            if part.startswith('id') and i + 1 < len(parts):
                try:
                    ano = int(parts[i + 1])
                    break
                except ValueError:
                    continue
        
        if not ano:
            continue
        
        # Verifica se cache do ano existe e está atualizado
        source_time = get_file_modification_time(year_file)
        cache_file = cache_dir / f"deputy-{deputy_id}-transactions-{ano}-page1.json"
        
        if not cache_file.exists():
            years_to_process.append(ano)
        else:
            cache_time = get_file_modification_time(cache_file)
            if source_time > cache_time:
                years_to_process.append(ano)
    
    return years_to_process
```

### Tarefa 2.2: Adicionar Flag `--incremental` na Materialização

**Arquivo:** `packages/etlpython/src/etlpython/cli/materialize_paginated.py`

**Modificar main:**

```python
import click

@click.command()
@click.option('--incremental', is_flag=True, help='Only rematerialize changed data')
@click.option('--force-year', type=int, help='Force rematerialization of specific year')
def main(incremental: bool = False, force_year: Optional[int] = None):
    """Materialize paginated caches."""
    
    # ... código existente ...
    
    if incremental:
        print_info("🔄 Modo incremental ativado")
    
    for deputy_dir in sorted(deputies_dir.iterdir()):
        if not deputy_dir.is_dir():
            continue
        
        deputy_id = deputy_dir.name
        
        if incremental:
            # Verifica se precisa rematerializar
            if not should_rematerialize_deputy(deputy_dir, transactions_dir, deputy_id, legislatura):
                print_info(f"⏭️  Pulando {deputy_id} (cache atualizado)")
                continue
            
            # Descobre quais anos processar
            years_to_process = get_years_to_rematerialize(
                deputy_dir, 
                transactions_dir, 
                deputy_id, 
                legislatura
            )
            
            if force_year and force_year not in years_to_process:
                years_to_process.append(force_year)
            
            print_info(f"📅 {deputy_id}: rematerializando anos {years_to_process}")
        
        # Carrega e processa dados
        deputy_data = load_deputy_data_by_year(deputy_dir, legislatura)
        
        if not deputy_data:
            continue
        
        create_deputy_transactions_cache(deputy_data, transactions_dir, deputy_id)
```

---

## FASE 3: Validar Frontend (2 horas)

### Objetivo
Verificar se o frontend está consumindo os caches corretamente.

### Tarefa 3.1: Verificar Estrutura de Caches Esperada

**Verificar arquivos:**
- `packages/monitor-despesas-next/src/services/global-cache.service.ts`
- `packages/monitor-despesas-next/src/hooks/useGlobalCache.ts`

**O que o frontend espera:**
```typescript
// Caches principais
/cache/suppliers-cache.json
/cache/deputies-cache.json
/cache/categories-cache.json

// Transações paginadas
/cache/transactions/deputy-{id}-transactions-{ano}-page{n}.json
/cache/transactions/supplier-{id}-transactions-{ano}-page{n}.json
```

### Tarefa 3.2: Validar Estrutura de Dados

**Verificar se os caches têm:**

```typescript
// deputies-cache.json
{
  "deputados": [
    {
      "id": 74646,
      "nome": "...",
      "gastosPorAno": {
        "2022": 100000,
        "2023": 120000,
        "2024": 150000,
        "2025": 50000
      },
      "transacoesPorAno": { ... },
      "anosDisponiveis": [2022, 2023, 2024, 2025]
    }
  ]
}

// suppliers-cache.json
{
  "fornecedores": [
    {
      "id": "TAM",
      "totalRecebidoPorAno": {
        "2022": 500000,
        "2023": 600000,
        "2024": 700000,
        "2025": 300000
      },
      "anosDisponiveis": [2022, 2023, 2024, 2025]
    }
  ]
}
```

---

## FASE 4: Testes End-to-End (4 horas)

### Teste 1: ETL Completo

```bash
# 1. Rodar ETL completo
cd packages/etlpython
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 10 --ano-inicio 2022 --ano-fim 2025 --workers 3 --wait-ms 150

# Verificar estrutura gerada
ls bancoDados/monitordespesas/deputadosFederais/74646/
# Deve ter: 74646-id57-2022-dados_completos.json
#          74646-id57-2023-dados_completos.json
#          74646-id57-2024-dados_completos.json
#          74646-id57-2025-dados_completos.json
```

### Teste 2: Materialização Completa

```bash
# 2. Rodar materialização
pnpm run etl:materialize:all

# Verificar caches gerados
ls packages/monitor-despesas-next/public/cache/
# Deve ter: suppliers-cache.json
#          deputies-cache.json
#          categories-cache.json
#          transactions/...
```

### Teste 3: ETL Incremental

```bash
# 3. Rodar ETL incremental (só 2025)
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 10 --ano-inicio 2022 --ano-fim 2025 --incremental --workers 3 --wait-ms 150

# Deve mostrar:
# "Do cache: [2022, 2023, 2024]"
# "Da API: [2025]"
```

### Teste 4: Materialização Incremental

```bash
# 4. Rodar materialização incremental
py -m etlpython.cli.materialize_paginated --incremental

# Deve mostrar:
# "⏭️  Pulando {id} (cache atualizado)" para deputados sem mudanças
# "📅 {id}: rematerializando anos [2025]" para deputados com mudanças
```

### Teste 5: Frontend

```bash
# 5. Rodar frontend
cd packages/monitor-despesas-next
pnpm dev

# Abrir http://localhost:3000
# Verificar:
# - Dados de deputados carregam
# - Filtros por ano funcionam
# - Transações paginadas funcionam
# - Gráficos mostram dados corretos
```

---

## 📋 Checklist Completo de Implementação

### Fase 1: Materialização ✅
- [ ] Criar `materialize_helpers.py`
- [ ] Implementar `load_deputy_data_by_year()`
- [ ] Implementar `load_all_deputies_data()`
- [ ] Implementar `get_available_years()`
- [ ] Atualizar `materialize_unified_v2.py`
- [ ] Atualizar `materialize_paginated.py`
- [ ] Testar leitura de arquivos por ano

### Fase 2: Otimização Incremental ✅
- [ ] Implementar `should_rematerialize_deputy()`
- [ ] Implementar `get_years_to_rematerialize()`
- [ ] Adicionar flag `--incremental` em materialize_paginated
- [ ] Adicionar flag `--force-year` em materialize_paginated
- [ ] Testar materialização incremental

### Fase 3: Validação Frontend ✅
- [ ] Verificar estrutura de caches esperada
- [ ] Validar formato de dados
- [ ] Verificar campos `*PorAno`
- [ ] Verificar `anosDisponiveis`

### Fase 4: Testes E2E ✅
- [ ] Teste 1: ETL completo
- [ ] Teste 2: Materialização completa
- [ ] Teste 3: ETL incremental
- [ ] Teste 4: Materialização incremental
- [ ] Teste 5: Frontend funcionando

---

## 🚀 Comandos Finais Otimizados

### Workflow Diário (Recomendado)

```bash
# 1. ETL incremental (só ano atual)
cd packages/etlpython
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 30 --ano-inicio 2022 --ano-fim 2025 --incremental --workers 3 --wait-ms 150

# 2. Materialização incremental (só o que mudou)
py -m etlpython.cli.materialize_paginated --incremental

# 3. Materialização de caches principais (rápido)
py -m etlpython.cli.materialize_unified_v2

# Tempo total: ~3 minutos (vs 20 minutos antes!)
```

### Primeira Vez ou Rebuild Completo

```bash
# 1. ETL completo
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 100 --ano-inicio 2022 --ano-fim 2025 --workers 3 --wait-ms 150

# 2. Materialização completa
pnpm run etl:materialize:all

# Tempo total: ~30 minutos
```

### Corrigir Ano Específico

```bash
# 1. Reprocessar 2024 no ETL
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 30 --ano-inicio 2022 --ano-fim 2025 --incremental --force-year 2024 --workers 3 --wait-ms 150

# 2. Rematerializar 2024
py -m etlpython.cli.materialize_paginated --incremental --force-year 2024
```

---

## 📊 Ganhos Esperados

### ETL
- **Antes:** 20 min (30 deputados, todos os anos)
- **Depois (incremental):** 2 min (30 deputados, só 2025)
- **Ganho:** 90% mais rápido

### Materialização
- **Antes:** 5 min (todos os deputados)
- **Depois (incremental):** 30 seg (só deputados com mudanças)
- **Ganho:** 90% mais rápido

### Total Workflow Diário
- **Antes:** 25 min
- **Depois:** 3 min
- **Ganho:** 88% mais rápido

---

## 🎯 Resumo Executivo

### O Que Foi Feito
1. ✅ ETL incremental por ano implementado
2. ✅ Arquivos salvos separadamente por ano
3. ⚠️ Materialização precisa ser atualizada

### O Que Precisa Ser Feito
1. 🔧 Atualizar materialização para ler arquivos por ano
2. 🔧 Adicionar modo incremental na materialização
3. ✅ Validar frontend (provavelmente já funciona)

### Impacto
- **Memória:** 97% menos
- **Tempo:** 88% mais rápido
- **Escalabilidade:** Pode processar 100+ deputados
- **Manutenção:** Mais fácil (dados separados por ano)

---

**Tempo Total Estimado:** 16 horas
**Prioridade:** Alta
**Status:** 60% concluído

---

**Próximo Passo:** Implementar Fase 1 (Corrigir Materialização) 🚀