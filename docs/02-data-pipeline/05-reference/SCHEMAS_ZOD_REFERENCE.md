# Referência Completa: Schemas Zod para Validação de Caches

**Versão:** 1.0.0  
**Data:** 2025-01-XX  
**Status:** ✅ Implementado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Schemas Implementados](#schemas-implementados)
3. [Parse Helpers](#parse-helpers)
4. [Normalize Helpers](#normalize-helpers)
5. [Padrões de Uso](#padrões-de-uso)
6. [Tratamento de Erros](#tratamento-de-erros)

---

## Visão Geral

Este documento cataloga todos os schemas Zod utilizados para validar caches gerados pelo ETL Python (pipeline `materialize`). A validação Zod garante:

- **Fail-fast:** Erros de schema são detectados no momento da leitura do cache
- **Type safety:** TypeScript infere tipos corretos a partir dos schemas
- **Runtime validation:** Proteção contra caches corrompidos ou mal formados
- **Defaults inteligentes:** Valores padrão para campos opcionais

---

## Schemas Implementados

### 1. `suppliersCacheSchema`

**Cache:** `suppliers-cache.json`  
**Const:** `SUPPLIERS_CACHE_NAME = 'suppliers-cache'`  
**Parse Helper:** `parseSuppliersCache(payload: unknown): SuppliersCacheData`  
**Normalize Helper:** `normalizeFornecedor(fornecedor: any): FornecedorNormalizado`

**Estrutura:**
```typescript
{
  fornecedores: Array<{
    nome: string
    cnpj?: string
    totalGasto: number
    numTransacoes: number
    anos?: Array<{
      ano: number
      total: number
    }>
    // ... outros campos via .passthrough()
  }>
  metadata?: {
    lastUpdate?: string
    totalFornecedores?: number
    // ... outros campos via .passthrough()
  }
}
```

**Validações:**
- `fornecedores` (array, obrigatório)
- `totalGasto` (coerce string → number)
- `numTransacoes` (coerce string → number, default 0)
- `metadata` (opcional, default `{}`)

**Uso em Server Actions:**
- ✅ `getFornecedoresDataset` (via `readMaterializeCache`)
- ✅ `getDashboardData` (via `getFornecedoresDataset`)
- ✅ `getFornecedoresComAnalise`

---

### 2. `deputiesCacheSchema`

**Cache:** `deputies-cache.json`  
**Const:** `DEPUTIES_CACHE_NAME = 'deputies-cache'`  
**Parse Helper:** `parseDeputiesCache(payload: unknown): DeputiesCacheData`  
**Normalize Helper:** `normalizeDeputado(deputado: any): DeputadoNormalizado`

**Estrutura:**
```typescript
{
  deputados: Array<{
    id: string | number
    nome: string
    partido?: string
    uf?: string
    totalGasto: number
    anos: Array<{
      ano: number
      total: number
    }>
    urlFoto?: string
    // ... outros campos via .passthrough()
  }>
  metadata?: {
    lastUpdate?: string
    totalDeputados?: number
    anosDisponiveis?: number[]
    // ... outros campos via .passthrough()
  }
}
```

**Validações:**
- `deputados` (array, obrigatório)
- `id` (union: string | number)
- `totalGasto` (coerce string → number)
- `anos` (array, obrigatório, pelo menos 1 registro)
- `metadata.anosDisponiveis` (array de números, opcional)

**Uso em Server Actions:**
- ✅ `getDeputadosDataset` (via `readMaterializeCache`)
- ✅ `getDashboardData` (via `getDeputadosDataset`)
- ✅ `getDeputados`, `getDeputadoById`, `getDeputadosByIds`

---

### 3. `categoriesCacheSchema`

**Cache:** `categories-cache.json` ou `category-transactions-cache.json`  
**Const:** `CATEGORIES_CACHE_NAME = 'categories-cache'`  
**Parse Helper:** `parseCategoriesCache(payload: unknown): CategoriesCacheData`  
**Normalize Helper:** `normalizeCategoriaRecord(categoria: any): CategoriaNormalizada`

**Estrutura:**
```typescript
{
  data: {
    categorias: Array<{
      categoria: string
      totalGasto: number
      topDeputados?: Array<{
        id: string | number
        nome?: string
        totalGasto: number
        porAno?: Record<string, number>
      }>
      // ... outros campos via .passthrough()
    }>
  }
  metadata?: {
    generatedAt?: string
    // ... outros campos via .passthrough()
  }
}
```

**Validações:**
- `data.categorias` (array, obrigatório)
- `totalGasto` (coerce string → number)
- `topDeputados.porAno` (record de string → number)

**Uso em Server Actions:**
- ✅ `getComparativoCategoriasDeputado`

---

### 4. `rankingsCacheSchema`

**Cache:** `rankings-cache.json`  
**Const:** `RANKINGS_CACHE_NAME = 'rankings-cache'`  
**Parse Helper:** `parseRankingsCache(payload: unknown): RankingsCacheData`

**Estrutura:**
```typescript
{
  data: {
    deputados: {
      rankings: {
        geral?: Array<{
          id: string | number
          nome: string
          totalDespesas: number
          // ... até 100 deputados
        }>
        porAno?: Record<string, Array<Deputy>>
        porCategoria?: Record<string, Array<Deputy>>
      }
    }
  }
  metadata?: {
    generatedAt?: string
    totalDeputados?: number
  }
}
```

**Validações:**
- `geral`, `porAno`, `porCategoria` (todos opcionais)
- Arrays limitados a 100 itens (`.max(100)`)
- `totalDespesas` (coerce string → number)

**Uso em Server Actions:**
- ✅ `getPremiacoes`

---

### 5. `dashboardCacheSchema`

**Cache:** `dashboard-cache.json`  
**Const:** `DASHBOARD_CACHE_NAME = 'dashboard-cache'`  
**Parse Helper:** `parseDashboardCache(payload: unknown): DashboardCacheData`

**Estrutura:**
```typescript
{
  data: {
    resumoPartidos?: Array<{
      partido: string
      totalGasto: number
      numeroDeputados: number
    }>
    resumoUFs?: Array<{
      uf: string
      totalGasto: number
      numeroDeputados: number
    }>
    evolucaoAnual?: Array<{
      ano: number
      total: number
    }>
  }
  metadata?: {
    generatedAt?: string
  }
}
```

**Validações:**
- Todos os campos de `data` são opcionais
- `totalGasto` (coerce string → number)
- `numeroDeputados` (coerce string → number, default 0)

**Uso em Server Actions:**
- 🔄 Planejado para `getDashboardData` (atualmente usa agregação manual)

---

### 6. `analysisCacheSchema`

**Cache:** `analysis-cache.json`  
**Const:** `ANALYSIS_CACHE_NAME = 'analysis-cache'`  
**Parse Helper:** `parseAnalysisCache(payload: unknown): AnalysisCacheData`

**Estrutura:**
```typescript
{
  data: {
    analises: Array<{
      id: string | number
      tipo: string
      score: number
      alertas?: string[]
      // ... outros campos via .passthrough()
    }>
  }
  metadata?: {
    generatedAt?: string
  }
}
```

**Validações:**
- `score` (coerce string → number, clamped 0-100)
- `alertas` (array de strings, opcional, default `[]`)

**Uso em Server Actions:**
- 🔄 Planejado para `getAnaliseAvancada`

---

### 7. `premiacoesCacheSchema`

**Cache:** `premiacoes-cache.json`  
**Const:** `PREMIACOES_CACHE_NAME = 'premiacoes-cache'`  
**Parse Helper:** `parsePremiacoesCache(payload: unknown): PremiacoesCacheData`

**Estrutura:**
```typescript
{
  data: {
    premiacoes: {
      ouro?: Array<{
        id: string | number
        nome: string
        totalDespesas: number
        categoria?: string
      }>
      prata?: Array<Deputy>
      bronze?: Array<Deputy>
    }
  }
  metadata?: {
    generatedAt?: string
  }
}
```

**Validações:**
- Arrays `ouro`, `prata`, `bronze` limitados a 10 itens cada
- `totalDespesas` (coerce string → number)

**Uso em Server Actions:**
- 🔄 Planejado para expansão de `getPremiacoes`

---

### 8. `transactionsIndexSchema`

**Cache:** `deputy-{id}-transactions-index.json` ou `supplier-{id}-transactions-index.json`  
**Const:** `TRANSACTIONS_INDEX_CACHE_NAME = 'transactions-index'`  
**Parse Helper:** `parseTransactionsIndex(payload: unknown): TransactionsIndexData`

**Estrutura:**
```typescript
{
  totalCount: number
  availableYears?: number[]
  allYears?: {
    pages: number
    totalCount: number
  }
  yearSummary?: Record<string, {
    pages: number
    totalCount: number
  }>
  // ... outros campos via .passthrough()
}
```

**Validações:**
- `totalCount` (coerce string → number)
- `availableYears` (array de números, opcional, default `[]`)
- `yearSummary` (record de string → objeto com pages/totalCount)

**Uso em Server Actions:**
- ✅ `getTransacoesDeputado`
- ✅ `getTransacoesFornecedor`

---

### 9. `transactionPageSchema`

**Cache:** `deputy-{id}-transactions-{year}-page{N}.json` ou `supplier-{id}-transactions-{year}-page{N}.json`  
**Parse Helper:** `parseTransactionPage(payload: unknown): TransactionPageData`

**Estrutura:**
```typescript
{
  items: Array<{
    id?: string | number
    data?: string
    fornecedor?: string
    valor?: number
    tipoDespesa?: string
    // ... outros campos via .passthrough()
  }>
  // ... outros campos via .passthrough()
}
```

**Validações:**
- `items` (array, obrigatório, default `[]`)
- `valor` (coerce string → number, opcional)
- Todos os campos individuais são opcionais (schema permissivo)

**Uso em Server Actions:**
- ✅ `getTransacoesDeputado` (loop de leitura de páginas)
- ✅ `getTransacoesFornecedor` (leitura de página única)

---

## Parse Helpers

Todos os parse helpers seguem o mesmo padrão:

```typescript
export function parse{SchemaName}(payload: unknown): {SchemaType} {
  return {schemaName}Schema.parse(payload)
}
```

**Comportamento:**
- ✅ **Sucesso:** Retorna objeto validado com tipos inferidos
- ❌ **Falha:** Lança `ZodError` com detalhes do problema

**Exemplo de uso:**
```typescript
const cacheRaw = await readMaterializeCache<unknown>(SUPPLIERS_CACHE_NAME)
const cacheData = parseSuppliersCache(cacheRaw) // Lança ZodError se inválido
```

---

## Normalize Helpers

Helpers de normalização transformam dados validados em formatos padronizados:

### `normalizeFornecedor(fornecedor: any): FornecedorNormalizado`

**Transformações:**
- `cnpj` → Remove caracteres não-numéricos
- `totalGasto` → Garante número válido (fallback 0)
- `numTransacoes` → Garante número válido (fallback 0)
- `anos` → Array ordenado por ano (desc)

**Uso:**
```typescript
const fornecedores = cacheData.fornecedores.map(normalizeFornecedor)
```

### `normalizeDeputado(deputado: any): DeputadoNormalizado`

**Transformações:**
- `id` → Converte para string
- `totalGasto` → Soma de todos os anos se não presente
- `partido` → Uppercase, fallback 'S/PARTIDO'
- `uf` → Uppercase, fallback 'S/UF'
- `anos` → Array ordenado por ano (desc)

**Uso:**
```typescript
const deputados = cacheData.deputados.map(normalizeDeputado)
```

### `normalizeCategoriaRecord(categoria: any): CategoriaNormalizada`

**Transformações:**
- `totalGasto` → Garante número válido
- `topDeputados` → Filtra registros inválidos, limita a 100

**Uso:**
```typescript
const categorias = cacheData.data.categorias.map(normalizeCategoriaRecord)
```

---

## Padrões de Uso

### Pattern 1: Validação de Cache Único

```typescript
export async function getMyData() {
  try {
    const cacheRaw = await readMaterializeCache<unknown>(MY_CACHE_NAME)
    const cacheData = parseMyCache(cacheRaw) // Validação Zod
    
    // Processamento seguro com tipos inferidos
    const normalized = cacheData.items.map(normalizeMyItem)
    
    return { data: normalized }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Zod Validation Error]', error.errors)
      // Log estruturado, alertar observabilidade
    }
    console.error('[Server Action Error]', error)
    return { data: [] }
  }
}
```

### Pattern 2: Validação de Transações Paginadas

```typescript
export async function getTransacoesDeputado(deputadoId: string, ano?: string) {
  try {
    // 1. Validar índice
    const indexRaw = JSON.parse(await readFile(indexPath, 'utf-8'))
    const indexData = parseTransactionsIndex(indexRaw)
    
    // 2. Loop de páginas com validação individual
    const todasTransacoes = []
    for (let page = 1; page <= indexData.allYears.pages; page++) {
      const pageRaw = JSON.parse(await readFile(pagePath, 'utf-8'))
      const pageData = parseTransactionPage(pageRaw)
      todasTransacoes.push(...pageData.items)
    }
    
    return { transacoes: todasTransacoes }
  } catch (error) {
    // Tratamento de erro
  }
}
```

### Pattern 3: Validação com Datasets Cached

```typescript
const getMyDataset = cache(async () => {
  const cacheRaw = await readMaterializeCache<unknown>(MY_CACHE_NAME)
  const cacheData = parseMyCache(cacheRaw) // Validação acontece 1x por request
  
  return {
    items: cacheData.items.map(normalizeMyItem),
    metadata: cacheData.metadata,
  }
})

export async function getMyServerAction() {
  const dataset = await getMyDataset() // Reutiliza cache validado
  return dataset.items.filter(/* ... */)
}
```

---

## Tratamento de Erros

### Erro Típico: Cache Corrompido

```json
// ZodError example
{
  "issues": [
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["fornecedores", 0, "totalGasto"],
      "message": "Expected number, received string"
    }
  ]
}
```

**Ação recomendada:**
1. Log estruturado do erro Zod
2. Enviar alerta para observabilidade (Sentry, Datadog, etc.)
3. Retornar resposta vazia/default ao frontend
4. Investigar ETL Python (por que gerou schema inválido?)

### Erro Típico: Campo Obrigatório Ausente

```json
{
  "issues": [
    {
      "code": "invalid_type",
      "expected": "array",
      "received": "undefined",
      "path": ["deputados"],
      "message": "Required"
    }
  ]
}
```

**Ação recomendada:**
1. Verificar se cache existe e foi gerado corretamente
2. Verificar se ETL completou com sucesso
3. Revalidar cache (forçar regeneração pelo ETL)

---

## Checklist de Implementação

Ao adicionar um novo schema Zod:

- [ ] Criar schema em `analytics.ts` com padrão consistente (`.passthrough()`, defaults, coerce)
- [ ] Exportar constante `{NAME}_CACHE_NAME`
- [ ] Criar parse helper `parse{Name}Cache(payload: unknown)`
- [ ] (Opcional) Criar normalize helper `normalize{Name}(item: any)`
- [ ] Atualizar imports em `data-actions.ts`
- [ ] Migrar Server Actions relevantes para usar parse helper
- [ ] Adicionar try/catch para `ZodError` com logging estruturado
- [ ] Criar testes unitários para schema (payload válido + inválido)
- [ ] Documentar neste arquivo (SCHEMAS_ZOD_REFERENCE.md)
- [ ] Atualizar FLUXO-DADOS-ROADMAP.md

---

## Próximos Passos

1. **Schemas Faltantes:**
   - `supplier-deputy-relations-cache` (usado por `getRedeRelacionamentosDeputado`)
   - Outros caches gerados pelo ETL não mapeados

2. **Testes:**
   - Criar `analytics.test.ts` com cobertura completa de schemas
   - Testar transformações (coerce, defaults, .max())
   - Testar normalize helpers

3. **Observabilidade:**
   - Integrar ZodError logging com Sentry/Datadog
   - Criar dashboard de erros de validação
   - Alertas automáticos para falhas de schema

4. **Performance:**
   - Profiling de validação Zod em caches grandes (10k+ items)
   - Considerar lazy parsing se necessário

---

**Manutenção:**  
Este documento deve ser atualizado sempre que um novo schema for adicionado ou um existente for modificado.
