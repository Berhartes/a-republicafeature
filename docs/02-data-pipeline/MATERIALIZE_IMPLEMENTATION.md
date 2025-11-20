# Implementação da Materialização (Item 4 do Roadmap)

**Data:** 7 de novembro de 2025  
**Status:** ✅ Concluído

## Resumo Executivo

Implementação completa do item 4 do roadmap de dados, centralizando a lógica de materialização, introduzindo geração automática de manifests e testes de snapshot para garantir builds reproduzíveis e consistentes.

## Mudanças Implementadas

### 1. Infra Helpers & Manifest (`materialize_helpers.py`)

**Já existente e aprimorado:**

- ✅ **`write_cache_json()`** - Função centralizada que:
  - Gera arquivo `.json` com formatação consistente
  - Cria versão comprimida `.json.gz`
  - Calcula hash SHA256 do conteúdo
  - Retorna metadados completos (path, hash, size, gzSize, lastModified)

- ✅ **`CacheManifestBuilder`** - Classe para gerenciar manifests:
  - Acumula entradas de cache com metadados
  - Persiste `caches-manifest.json` de forma atômica
  - Garante formato consistente entre pipelines

- ✅ **`_normalize_years()`** - Normalização de filtros de anos:
  - Converte diferentes formatos para `Set[int]`
  - Valida e filtra anos inválidos
  - Usado consistentemente em ambos os pipelines

### 2. Refatoração `materialize_unified_v2.py`

**Mudanças:**

- ✅ Substituição completa do código de escrita/compressão por `write_cache_json()`
- ✅ Integração de `CacheManifestBuilder` para todos os caches (suppliers, deputies, categories)
- ✅ Correção do bug no retorno da função (agora retorna `manifest_builder.manifest_path`)
- ✅ Uso consistente de `_normalize_years()` para filtros

**Resultado:**
- Eliminação de código duplicado
- Metadados padronizados para todos os arquivos cache
- Geração automática de `caches-manifest.json`

### 3. Refatoração `materialize_paginated.py`

**Mudanças:**

- ✅ Integração de `manifest_builder` em `create_deputy_transactions_cache()`
- ✅ Integração de `manifest_builder` em `create_supplier_transactions_cache()`
- ✅ Adição do parâmetro `public_prefix` para paths públicos consistentes
- ✅ Correção de string mal terminada que causava erro de sintaxe
- ✅ Passagem de `manifest_builder` para todas as funções de criação de cache

**Resultado:**
- Ambos os pipelines (unified e paginated) geram manifests no mesmo formato
- Metadados rastreáveis para todos os arquivos de transações paginadas
- Código consistente e manutenível

### 4. Fixtures e Testes de Snapshot

**Estrutura criada:**

```
packages/etlpython/tests/
├── fixtures/
│   └── materialize/
│       ├── fornecedores.json (2 fornecedores)
│       └── deputadosFederais/
│           └── idDeputados/
│               ├── 000001/ (Deputado 1 - 2023)
│               └── 000002/ (Deputado 2 - 2024)
├── snapshots/
│   ├── unified_manifest.json
│   └── paginated_manifest.json
└── test_materialize_snapshots.py
```

**Testes implementados:**

- ✅ **`test_materialize_unified_snapshot`** - Valida pipeline unified:
  - Roda materialização com fixtures reduzidas
  - Normaliza manifest (remove campos voláteis)
  - Compara com snapshot (ou cria na primeira execução)

- ✅ **`test_materialize_paginated_snapshot`** - Valida pipeline paginated:
  - Processa 2 deputados e 2 fornecedores
  - Valida geração de páginas e índices
  - Garante consistência do manifest

**Normalização de snapshots:**
- Remove campos voláteis (timestamps, hashes que dependem de timestamps)
- Foca em campos estáveis (tamanhos de arquivo, estrutura)
- Permite detecção de regressões estruturais

**Como rodar:**
```bash
# Via pnpm (Windows)
pnpm --filter @a-republica/etl-python run etl:materialize:test

# Diretamente
cd packages/etlpython
.\.venv\Scripts\python.exe -m pytest tests/test_materialize_snapshots.py -v
```

### 5. Documentação Atualizada

**README.md:**
- ✅ Seção expandida sobre materialização unified/paginated
- ✅ Explicação do `caches-manifest.json` e sua função
- ✅ Documentação completa dos testes de snapshot
- ✅ Instruções de como rodar e interpretar testes

**FLUXO-DADOS-ROADMAP.md:**
- ✅ Item 2.4 (Materialização) marcado como concluído
- ✅ Status detalhado das melhorias implementadas
- ✅ Tabela do roadmap atualizada com status visual

**package.json:**
- ✅ Script `etl:materialize:test` para executar testes de snapshot
- ✅ Scripts genéricos `test` e `test:watch` para desenvolvimento

## Scripts Disponíveis

```bash
# Materialização
pnpm run etl:materialize:unified        # Gera caches unificados
pnpm run etl:materialize:paginated      # Gera caches paginados
pnpm run etl:materialize:all            # Gera ambos

# Testes
pnpm run etl:materialize:test           # Testa snapshots de materialização
pnpm run test                           # Todos os testes
```

## Exemplos de Uso

### Materialização Unified com filtro de anos

```bash
python -m etlpython materialize \
  --tipo unified \
  --suppliers-file bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json \
  --deputies-dir bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados \
  --output-dir packages/monitor-despesas-next/public/cache \
  --anos 2023-2024
```

**Resultado:**
- `suppliers-cache.json` + `.json.gz`
- `deputies-cache.json` + `.json.gz`
- `categories-cache.json` + `.json.gz`
- `caches-manifest.json` (com metadados de todos os arquivos)

### Materialização Paginated Incremental

```bash
python -m etlpython materialize \
  --tipo paginated \
  --deputies-dir bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados \
  --suppliers-file bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json \
  --output-dir packages/monitor-despesas-next/public/cache/transactions \
  --incremental \
  --anos 2024
```

**Resultado:**
- Múltiplos `deputy-{id}-transactions-{ano}-page{n}.json`
- Múltiplos `supplier-{id}-transactions-{ano}-page{n}.json`
- Arquivos de índice `*-index.json`
- `caches-manifest.json` consolidado
- Modo incremental: apenas anos especificados são rematerializados

## Estrutura do Manifest

### Unified (`public/cache/caches-manifest.json`)

```json
{
  "suppliers-cache.json": {
    "path": "/cache/suppliers-cache.json",
    "hash": "a1b2c3...",
    "size": 1507,
    "compressed": true,
    "gzSize": 456,
    "lastModified": "2025-11-07T10:30:00"
  },
  "deputies-cache.json": { /* ... */ },
  "categories-cache.json": { /* ... */ }
}
```

### Paginated (`public/cache/transactions/caches-manifest.json`)

```json
{
  "deputy-123-transactions-2023-page1.json": {
    "path": "transactions/deputy-123-transactions-2023-page1.json",
    "hash": "d4e5f6...",
    "size": 572,
    "compressed": true,
    "gzSize": 234,
    "lastModified": "2025-11-07T10:35:00"
  },
  /* ... centenas de entradas ... */
}
```

## Benefícios Obtidos

### 1. Consistência
- ✅ Código único para escrita/compressão em todos os pipelines
- ✅ Formato de manifest padronizado
- ✅ Normalização de filtros consistente

### 2. Rastreabilidade
- ✅ Hash SHA256 de cada arquivo cache
- ✅ Timestamps de geração
- ✅ Metadados completos (tamanhos original e comprimido)
- ✅ Paths públicos para consumo no frontend

### 3. Reprodutibilidade
- ✅ Testes de snapshot garantem builds determinísticos
- ✅ Fixtures reduzidas permitem testes rápidos
- ✅ Validação automática de regressões

### 4. Manutenibilidade
- ✅ Helpers centralizados evitam duplicação
- ✅ Testes documentam comportamento esperado
- ✅ Documentação clara e atualizada

## Próximos Passos (Fora do Escopo Atual)

1. **Cache Layer (Item 2.5 do roadmap):**
   - Pipeline de publicação automática
   - Verificador de referências antes do deploy
   - Integração com CDN/invalidation

2. **Integração CI/CD:**
   - Rodar testes de snapshot em PRs
   - Validar manifests antes do merge
   - Automatizar build e deploy de caches

3. **Monitoramento:**
   - Alertas para mudanças inesperadas nos tamanhos dos caches
   - Métricas de tempo de materialização
   - Dashboards de integridade dos manifests

## Validação

Todos os testes passando:

```
tests/test_materialize_snapshots.py::test_materialize_unified_snapshot PASSED
tests/test_materialize_snapshots.py::test_materialize_paginated_snapshot PASSED

============== 2 passed in 0.19s ==============
```

## Conclusão

✅ Item 4 do roadmap (Materialização) **100% concluído** com:
- Helpers centralizados e reutilizáveis
- Ambos os pipelines refatorados e usando código compartilhado
- Geração automática de `caches-manifest.json`
- Testes de snapshot implementados e passando
- Documentação completa e atualizada

A materialização agora é **determinística**, **rastreável** e **testável**, estabelecendo uma base sólida para os próximos itens do roadmap.
