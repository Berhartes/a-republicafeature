# 📋 Plano Completo e Detalhado – Próximos Passos para Consolidação do Sistema

**Data:** 7 de novembro de 2025  
**Branch:** `frontend-page-cleanup`  
**Status Atual:** ~70% do roadmap concluído (5.5 de 8 etapas)

---

## 📊 Visão Executiva

### Etapas Concluídas ✅
1. **Fonte (Gate de Contratos)** - CI automatizado, validação live diária
2. **ETL Python** - Entry point único, logging estruturado, manifests por execução
3. **Datalake** - Particionamento por legislatura/ano, verificação de integridade
4. **Materialização** - Helpers centralizados, testes de snapshot, geração determinística
5. **Cache Layer** - Pipeline de publicação, validação de manifests, refresh automatizado

### Em Andamento 🔄
6. **Server Actions** - ~40% completo
   - ✅ Schemas Zod para suppliers/deputies (analytics.ts)
   - ✅ Validação em getFornecedores, getCacheMetadata
   - ⏳ Expansão para dashboards, transações, análises

### Pendentes 📋
7. **Frontend/UX** - Não iniciado
8. **Observabilidade** - Planejamento inicial

---

## 🎯 ETAPA 1: Consolidação das Server Actions

### Contexto e Justificativa

Atualmente, temos uma base sólida de validação em `services/analytics.ts` que protege os endpoints de fornecedores e deputados. No entanto, as 15 Server Actions restantes ainda consomem caches sem validação de schema, deixando o frontend vulnerável a:

1. **Dados corrompidos** - Arquivos JSON malformados não são detectados
2. **Inconsistências** - Schemas implícitos entre ETL e frontend podem divergir
3. **Erros em runtime** - TypeErrors não capturados até o usuário final

**Meta:** Estabelecer validação Zod em **todas** as Server Actions, garantindo fail-fast no servidor e logs estruturados para debugging.

---

### 1.1 Expansão de Schemas Zod

**Objetivo:** Criar schemas completos para todos os caches consumidos.

#### Entregáveis

| Cache | Schema | Helpers de Normalização | Prioridade |
|-------|--------|------------------------|------------|
| `categories-cache.json` | `categoriesCacheSchema` | `parseCategories()`, `normalizeCategoriaRecord()` | Alta |
| `rankings-cache.json` | `rankingsCacheSchema` | `parseRankings()`, `normalizeRankingEntry()` | Alta |
| `dashboard-cache.json` | `dashboardCacheSchema` | `parseDashboard()`, `buildResumoAnual()` | Alta |
| `analysis-cache.json` | `analysisCacheSchema` | `parseAnalysis()`, `normalizeAnalysisRecord()` | Média |
| `premiacoes-cache.json` | `premiacoesCacheSchema` | `parsePremiacoes()` | Média |
| `transactions/index` | `transactionsIndexSchema` | `parseTransactionIndex()` | Baixa |

#### Tarefas Detalhadas

**1.1.1 Schemas de Categorias** (4-6 horas)

```typescript
// packages/monitor-despesas-next/src/app/gastos/services/analytics.ts

export const CATEGORIES_CACHE_NAME = 'categories-cache'

const categoryYearDataSchema = z.object({
  total: z.number().nonnegative(),
  transacoes: z.number().int().nonnegative(),
  fornecedores: z.number().int().nonnegative(),
  deputados: z.number().int().nonnegative(),
})

const categoryRecordSchema = z.object({
  nome: z.string(),
  totalGeral: z.number().nonnegative(),
  porAno: z.record(z.string(), categoryYearDataSchema),
})

export const categoriesCacheSchema = z.object({
  categorias: z.record(z.string(), categoryRecordSchema),
  metadata: z.object({
    totalCategorias: z.number().int().nonnegative(),
    generatedAt: z.string().optional(),
  }).passthrough(),
}).passthrough()

export type CategoriesCacheData = z.infer<typeof categoriesCacheSchema>

export function parseCategoriesCache(payload: unknown): CategoriesCacheData {
  return categoriesCacheSchema.parse(payload)
}

export function normalizeCategoriaRecord(
  nome: string,
  record: z.infer<typeof categoryRecordSchema>
): NormalizedCategoria {
  const anos = Object.keys(record.porAno).map(Number).sort((a, b) => b - a)
  
  return {
    nome,
    totalGeral: record.totalGeral,
    anosDisponiveis: anos,
    dadosPorAno: record.porAno,
  }
}
```

**Critérios de Aceitação:**
- Schema valida estrutura completa de `categories-cache.json`
- Helpers retornam tipos TypeScript corretos
- Parse detecta campos faltantes ou inválidos
- 100% de cobertura de teste unitário

**1.1.2 Schemas de Dashboard** (3-4 horas)

```typescript
export const DASHBOARD_CACHE_NAME = 'dashboard-cache'

const partidoSummarySchema = z.object({
  partido: z.string(),
  totalGasto: z.number().nonnegative(),
  numDeputados: z.number().int().nonnegative(),
  mediaPorDeputado: z.number().nonnegative(),
})

const ufSummarySchema = z.object({
  uf: z.string().length(2),
  totalGasto: z.number().nonnegative(),
  numDeputados: z.number().int().nonnegative(),
  mediaPorDeputado: z.number().nonnegative(),
})

export const dashboardCacheSchema = z.object({
  resumoPartidos: z.array(partidoSummarySchema),
  resumoUFs: z.array(ufSummarySchema),
  topFornecedores: z.array(fornecedorRecordSchema).max(20),
  evolucaoAnual: z.array(z.object({
    ano: z.number().int().min(2019),
    total: z.number().nonnegative(),
  })),
  metadata: z.object({
    generatedAt: z.string().optional(),
    anosDisponiveis: z.array(z.number()).optional(),
  }).passthrough(),
}).passthrough()
```

**Critérios de Aceitação:**
- Valida limites razoáveis (UFs com 2 chars, anos >= 2019)
- Transformações aplicadas (anos em Number, não string)
- Normalização consistente com suppliers/deputies

**1.1.3 Schemas de Rankings** (2-3 horas)

```typescript
export const RANKINGS_CACHE_NAME = 'rankings-cache'

const rankingEntrySchema = z.object({
  rank: z.number().int().positive(),
  id: z.union([z.string(), z.number()]),
  nome: z.string(),
  valor: z.number().nonnegative(),
  tipo: z.enum(['deputado', 'fornecedor', 'categoria']),
})

export const rankingsCacheSchema = z.object({
  topDeputados: z.array(rankingEntrySchema).max(100),
  topFornecedores: z.array(rankingEntrySchema).max(100),
  topCategorias: z.array(rankingEntrySchema).max(50),
  metadata: z.object({
    generatedAt: z.string().optional(),
    ano: z.number().int().optional(),
  }).passthrough(),
}).passthrough()
```

**1.1.4 Schemas de Análises e Premiações** (3-4 horas)

_(Estrutura similar aos anteriores, adaptada aos shapes específicos)_

---

### 1.2 Migração das Server Actions

**Objetivo:** Converter todas as 15 Server Actions para usar schemas Zod.

#### Mapeamento de Dependências

| Server Action | Caches Consumidos | Schema Necessário | Complexidade |
|---------------|-------------------|-------------------|--------------|
| `getDashboardData` | dashboard, suppliers, deputies | dashboard, suppliers, deputies | Alta |
| `getTransacoesDeputado` | transactions/{id} | transactions, transactionIndex | Média |
| `getTransacoesFornecedor` | transactions/{id} | transactions, transactionIndex | Média |
| `getComparativoCategoriasDeputado` | categories, deputies | categories, deputies | Média |
| `getRedeRelacionamentosDeputado` | analysis | analysis | Média |
| `getPremiacoes` | premiacoes | premiacoes | Baixa |
| `getAnaliseAvancada` | analysis | analysis | Alta |
| `getRelatoriosData` | múltiplos | todos | Alta |

#### Tarefas Detalhadas

**1.2.1 getDashboardData** (4-5 horas)

```typescript
// packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts

import {
  parseDashboardCache,
  parseSuppliersCache,
  parseDeputiesCache,
  DASHBOARD_CACHE_NAME,
  SUPPLIERS_CACHE_NAME,
  DEPUTIES_CACHE_NAME,
} from '../services/analytics'

export async function getDashboardData(options: {
  ano?: number
  partido?: string
  uf?: string
}): Promise<ServerActionResponse<DashboardData>> {
  try {
    // 1. Carregar caches com validação
    const [dashboardRaw, suppliersRaw, deputiesRaw] = await Promise.all([
      readMaterializeCache(DASHBOARD_CACHE_NAME),
      readMaterializeCache(SUPPLIERS_CACHE_NAME),
      readMaterializeCache(DEPUTIES_CACHE_NAME),
    ])

    // 2. Parsear e validar
    const dashboard = parseDashboardCache(dashboardRaw)
    const suppliers = parseSuppliersCache(suppliersRaw)
    const deputies = parseDeputiesCache(deputiesRaw)

    // 3. Aplicar filtros de ano/partido/UF
    const dadosFiltrados = filtrarDashboardPorParametros(
      dashboard,
      suppliers,
      deputies,
      options
    )

    // 4. Retornar estrutura normalizada
    return {
      success: true,
      data: dadosFiltrados,
      metadata: {
        cacheGeneratedAt: dashboard.metadata.generatedAt,
        filtrosAplicados: options,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[getDashboardData] Validação Zod falhou:', error.errors)
      return {
        success: false,
        error: 'Dados de dashboard inválidos',
        errorCode: 'VALIDATION_ERROR',
      }
    }
    
    console.error('[getDashboardData] Erro inesperado:', error)
    return {
      success: false,
      error: 'Erro ao carregar dashboard',
      errorCode: 'UNKNOWN_ERROR',
    }
  }
}
```

**Critérios de Aceitação:**
- Parsing Zod detecta schemas inválidos
- Logs estruturados incluem contexto (cache, filtros)
- Erro retorna `success: false` + código de erro
- Testes unitários com fixtures corrompidas

**1.2.2 getTransacoesDeputado / getTransacoesFornecedor** (3-4 horas cada)

- Criar `transactionsIndexSchema` e `transactionPageSchema`
- Validar índice antes de carregar páginas
- Normalizar IDs de deputado/fornecedor (string vs number)
- Cache local de índices para evitar parsing repetido

**1.2.3 Actions Restantes** (10-12 horas total)

- Seguir padrão de `getDashboardData` para consistência
- Adicionar logs estruturados em todas as actions
- Documentar schemas e helpers em JSDoc

---

### 1.3 Testes Unitários de Schemas

**Objetivo:** Garantir cobertura de 100% dos schemas e helpers.

#### Estrutura de Testes

```
packages/monitor-despesas-next/src/app/gastos/services/__tests__/
├── analytics.test.ts           # Schemas e helpers gerais
├── categories.test.ts          # Schemas de categorias
├── dashboard.test.ts           # Schemas de dashboard
└── transactions.test.ts        # Schemas de transações
```

#### Casos de Teste Críticos

**1.3.1 Validação de Schemas** (2-3 horas)

```typescript
// analytics.test.ts
import { describe, it, expect } from 'vitest'
import { parseSuppliersCache, suppliersCacheSchema } from '../analytics'

describe('suppliersCacheSchema', () => {
  it('deve aceitar payload válido completo', () => {
    const payload = {
      fornecedores: [{
        id: '123',
        nome: 'Empresa X',
        totalRecebidoPorAno: { '2024': 10000 },
        transacoesPorAno: { '2024': 50 },
      }],
      metadata: { totalFornecedores: 1, anosDisponiveis: [2024] },
    }
    
    expect(() => parseSuppliersCache(payload)).not.toThrow()
  })

  it('deve rejeitar fornecedor sem nome', () => {
    const payload = {
      fornecedores: [{ id: '123' }],
      metadata: {},
    }
    
    expect(() => parseSuppliersCache(payload)).toThrow()
  })

  it('deve transformar anos de string para number', () => {
    const payload = {
      fornecedores: [{
        id: '123',
        nome: 'Empresa X',
        totalRecebidoPorAno: { '2024': 10000 },
      }],
      metadata: { anosDisponiveis: ['2024'] },
    }
    
    const result = parseSuppliersCache(payload)
    expect(result.metadata.anosDisponiveis).toEqual([2024])
  })

  it('deve aplicar defaults para campos opcionais', () => {
    const payload = {
      fornecedores: [{ id: '123', nome: 'X' }],
    }
    
    const result = parseSuppliersCache(payload)
    expect(result.metadata.totalFornecedores).toBe(0)
    expect(result.metadata.anosDisponiveis).toEqual([])
  })
})
```

**1.3.2 Helpers de Normalização** (2-3 horas)

```typescript
describe('normalizeFornecedor', () => {
  it('deve consolidar anos de array e record', () => {
    const record = {
      id: '123',
      nome: 'X',
      anos: [{ ano: 2023, total: 5000 }],
      totalRecebidoPorAno: { '2024': 10000 },
    }
    
    const result = normalizeFornecedor(record)
    expect(result.anos).toHaveLength(2)
    expect(result.anos[0].ano).toBe(2024) // ordenado desc
  })

  it('deve usar documento como fallback de CNPJ', () => {
    const record = {
      id: '123',
      nome: 'X',
      documento: '12.345.678/0001-90',
    }
    
    const result = normalizeFornecedor(record)
    expect(result.cnpj).toBe('12.345.678/0001-90')
  })
})
```

**1.3.3 Testes de Integração com Fixtures** (3-4 horas)

- Criar fixtures reduzidas de caches reais
- Testar parsing + normalização end-to-end
- Validar performance (< 100ms para caches < 5MB)

---

### 1.4 Documentação e Padrões

**Objetivo:** Criar guia de referência para equipe.

#### Entregáveis

1. **Guia de Schemas** (`docs/02-data-pipeline/06-specifications/SCHEMAS_ZOD_REFERENCE.md`)
   - Mapeamento cache → schema → helpers
   - Exemplos de uso em Server Actions
   - Troubleshooting de erros comuns

2. **Checklist de Migração** (inline em `data-actions.ts`)
   ```typescript
   /**
    * ✅ Checklist de Validação Zod:
    * - [ ] Schema definido em analytics.ts
    * - [ ] Helper parse{Cache}() exportado
    * - [ ] Action usa parse em vez de cast direto
    * - [ ] Logs estruturados em catch de ZodError
    * - [ ] Testes unitários com fixtures válidas + inválidas
    * - [ ] JSDoc documenta shape esperado
    */
   ```

3. **Atualização do Roadmap** (`docs/01-architecture/FLUXO-DADOS-ROADMAP.md`)
   - Marcar 2.6 (Server Actions) como ✅
   - Adicionar métricas de cobertura Zod

---

### 1.5 Cronograma e Marcos

| Fase | Duração | Entregáveis | Responsável |
|------|---------|-------------|-------------|
| **1.1 Schemas** | 12-16 horas | 6 schemas + helpers | Dev Backend |
| **1.2 Migração Actions** | 16-20 horas | 15 actions atualizadas | Dev Backend |
| **1.3 Testes** | 8-10 horas | 100% coverage | Dev Backend + QA |
| **1.4 Docs** | 4-6 horas | Guia + checklist | Tech Writer |
| **Total** | **40-52 horas** | Etapa Server Actions concluída | - |

**Marco 1.1:** Schemas de alta prioridade (categories, dashboard, rankings) prontos  
**Marco 1.2:** 50% das actions migradas  
**Marco 1.3:** Testes passando em CI  
**Marco 1.4:** Documentação publicada

---

## 🎨 ETAPA 2: Frontend/UX Confiável

### Contexto e Justificativa

O frontend atual possui:
- ✅ React 19 + Next.js 15 com Server Components
- ✅ 95 deputados com dados reais processados
- ⚠️ **Duplicação de lógica** - Filtros URL + paginação repetidos em 5+ componentes
- ⚠️ **Error handling inconsistente** - Alguns componentes ignoram erros de Server Actions
- ❌ **Sem testes E2E** - Fluxos críticos não validados automaticamente

**Meta:** Padronizar hooks, adicionar error boundaries robustos e cobrir fluxos principais com Playwright.

---

### 2.1 Hooks Reutilizáveis

**Objetivo:** Eliminar duplicação de lógica de sincronização URL + estado.

#### 2.1.1 useUrlSyncedFilters

**Problema Atual:**
```typescript
// Repetido em FornecedoresPage, DeputadosPage, DashboardPage
const searchParams = useSearchParams()
const router = useRouter()
const pathname = usePathname()

const [filtros, setFiltros] = useState({
  ano: searchParams.get('ano') ? Number(searchParams.get('ano')) : null,
  partido: searchParams.get('partido') || null,
  uf: searchParams.get('uf') || null,
})

useEffect(() => {
  const params = new URLSearchParams()
  if (filtros.ano) params.set('ano', filtros.ano.toString())
  if (filtros.partido) params.set('partido', filtros.partido)
  if (filtros.uf) params.set('uf', filtros.uf)
  
  startTransition(() => {
    router.push(`${pathname}?${params.toString()}`)
  })
}, [filtros])
```

**Solução Proposta:**

```typescript
// packages/monitor-despesas-next/src/hooks/useUrlSyncedFilters.ts

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useState, useEffect, useCallback, useTransition } from 'react'

export type FilterValue = string | number | boolean | null

export interface UseUrlSyncedFiltersOptions<T extends Record<string, FilterValue>> {
  /** Estado inicial dos filtros */
  initialFilters: T
  /** Parsers customizados para tipos específicos */
  parsers?: Partial<Record<keyof T, (value: string) => T[keyof T]>>
  /** Validadores para prevenir valores inválidos */
  validators?: Partial<Record<keyof T, (value: T[keyof T]) => boolean>>
  /** Debounce em ms para reduzir pushes de URL */
  debounceMs?: number
}

export function useUrlSyncedFilters<T extends Record<string, FilterValue>>(
  options: UseUrlSyncedFiltersOptions<T>
) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // 1. Inicializar estado com valores da URL (se presentes)
  const [filters, setFiltersInternal] = useState<T>(() => {
    const fromUrl = { ...options.initialFilters }
    
    Object.keys(options.initialFilters).forEach((key) => {
      const urlValue = searchParams.get(key)
      if (!urlValue) return

      const parser = options.parsers?.[key] || defaultParser
      const parsedValue = parser(urlValue)
      
      const validator = options.validators?.[key]
      if (validator && !validator(parsedValue)) return

      fromUrl[key] = parsedValue
    })

    return fromUrl
  })

  // 2. Sincronizar URL quando filtros mudam
  useEffect(() => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    })
  }, [filters, pathname, router])

  // 3. API pública
  const setFilters = useCallback((updates: Partial<T>) => {
    setFiltersInternal((prev) => ({ ...prev, ...updates }))
  }, [])

  const resetFilters = useCallback(() => {
    setFiltersInternal(options.initialFilters)
  }, [options.initialFilters])

  return {
    filters,
    setFilters,
    resetFilters,
    isTransitioning: isPending,
  }
}

// Helpers
function defaultParser(value: string): FilterValue {
  if (value === 'true') return true
  if (value === 'false') return false
  if (/^\d+$/.test(value)) return Number(value)
  return value
}
```

**Uso:**

```typescript
// FornecedoresPage.tsx
import { useUrlSyncedFilters } from '@/hooks/useUrlSyncedFilters'

function FornecedoresPage() {
  const { filters, setFilters, resetFilters, isTransitioning } = useUrlSyncedFilters({
    initialFilters: {
      ano: null as number | null,
      cnpj: null as string | null,
      page: 1,
    },
    parsers: {
      ano: (v) => Number(v),
      page: (v) => Number(v),
    },
    validators: {
      ano: (v) => v >= 2019 && v <= new Date().getFullYear(),
      page: (v) => v > 0,
    },
  })

  return (
    <div>
      <FiltroAno
        value={filters.ano}
        onChange={(ano) => setFilters({ ano, page: 1 })} // reseta página ao trocar filtro
      />
      {isTransitioning && <LoadingSpinner />}
      <FornecedoresLista filtros={filters} />
    </div>
  )
}
```

**Critérios de Aceitação:**
- Sincronização bidirecional URL ↔ estado
- Validação previne valores inválidos (ex.: ano negativo)
- Debounce evita pushes excessivos em inputs de texto
- TypeScript infere tipos dos filtros automaticamente

---

#### 2.1.2 useAsyncTabData

**Problema:** Tabs carregam dados de forma inconsistente (alguns usam Suspense, outros `useEffect`).

**Solução:**

```typescript
// src/hooks/useAsyncTabData.ts

export function useAsyncTabData<T>(
  fetcher: () => Promise<T>,
  options: {
    cacheKey: string
    staleTime?: number // ms
  }
) {
  const [isPending, startTransition] = useTransition()
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Pré-carregar dados ao montar
  useEffect(() => {
    const cached = sessionStorage.getItem(options.cacheKey)
    if (cached) {
      try {
        setData(JSON.parse(cached))
        return
      } catch {}
    }

    startTransition(async () => {
      try {
        const result = await fetcher()
        setData(result)
        sessionStorage.setItem(options.cacheKey, JSON.stringify(result))
      } catch (err) {
        setError(err as Error)
      }
    })
  }, [options.cacheKey])

  return { data, error, isPending }
}
```

**Uso em TabView:**

```typescript
function TransacoesTab({ deputadoId }: { deputadoId: string }) {
  const { data, error, isPending } = useAsyncTabData(
    () => getTransacoesDeputado({ deputadoId, page: 1 }),
    { cacheKey: `transacoes-${deputadoId}`, staleTime: 5 * 60 * 1000 }
  )

  if (isPending) return <Skeleton count={10} />
  if (error) return <ErrorMessage error={error} />
  if (!data) return null

  return <TransacoesTable data={data} />
}
```

---

### 2.2 Error Boundaries e Fallbacks

**Objetivo:** Capturar erros de dados/rede e exibir UI amigável.

#### 2.2.1 DataErrorBoundary

```typescript
// src/components/DataErrorBoundary.tsx

'use client'

import { Component, ReactNode } from 'react'
import { getCacheMetadata } from '@/app/gastos/actions/data-actions'

interface Props {
  children: ReactNode
  cacheType: 'suppliers' | 'deputies' | 'dashboard' | 'categories'
}

interface State {
  hasError: boolean
  error: Error | null
  cacheMetadata: Awaited<ReturnType<typeof getCacheMetadata>> | null
}

export class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, cacheMetadata: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  async componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('[DataErrorBoundary]', {
      cacheType: this.props.cacheType,
      error,
      errorInfo,
    })

    // Carregar metadados do cache para debug
    try {
      const metadata = await getCacheMetadata()
      this.setState({ cacheMetadata: metadata })
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      const { cacheType } = this.props
      const { cacheMetadata } = this.state

      return (
        <div className="error-container">
          <h2>Erro ao carregar dados</h2>
          <p>
            Não foi possível carregar os dados de <strong>{cacheType}</strong>.
          </p>
          {cacheMetadata?.data && (
            <p className="text-sm text-gray-600">
              Última atualização:{' '}
              {new Date(cacheMetadata.data.generatedAt).toLocaleString('pt-BR')}
            </p>
          )}
          <button onClick={() => window.location.reload()}>
            Recarregar página
          </button>
          <details>
            <summary>Detalhes técnicos</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Uso:**

```typescript
// FornecedoresPage.tsx
<DataErrorBoundary cacheType="suppliers">
  <FornecedoresLista filtros={filters} />
</DataErrorBoundary>
```

---

### 2.3 Testes E2E com Playwright

**Objetivo:** Validar fluxos críticos de ponta a ponta.

#### 2.3.1 Setup Playwright

```bash
cd packages/monitor-despesas-next
pnpm add -D @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
})
```

#### 2.3.2 Testes de Fornecedores

```typescript
// e2e/fornecedores.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Página de Fornecedores', () => {
  test('deve filtrar por ano', async ({ page }) => {
    await page.goto('/gastos/fornecedores')
    
    // Selecionar ano 2024
    await page.selectOption('[data-testid="filtro-ano"]', '2024')
    
    // Aguardar transição
    await page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden' })
    
    // Validar URL
    expect(page.url()).toContain('ano=2024')
    
    // Validar que fornecedores foram atualizados
    const primeiroFornecedor = await page.textContent('[data-testid="fornecedor-0"]')
    expect(primeiroFornecedor).toBeTruthy()
  })

  test('deve paginar resultados', async ({ page }) => {
    await page.goto('/gastos/fornecedores')
    
    // Clicar em próxima página
    await page.click('[data-testid="btn-next-page"]')
    
    // Validar URL mudou
    expect(page.url()).toContain('page=2')
    
    // Validar scroll para topo
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBe(0)
  })

  test('deve exibir erro quando CNPJ inválido', async ({ page }) => {
    await page.goto('/gastos/fornecedores')
    
    // Buscar CNPJ inexistente
    await page.fill('[data-testid="input-cnpj"]', '00.000.000/0001-00')
    await page.click('[data-testid="btn-buscar"]')
    
    // Validar mensagem de erro
    await expect(page.locator('[role="alert"]')).toContainText('CNPJ não encontrado')
  })
})
```

#### 2.3.3 Testes de Deputados

```typescript
// e2e/deputados.spec.ts
test('deve abrir perfil de deputado e trocar tabs', async ({ page }) => {
  await page.goto('/gastos/deputados')
  
  // Clicar no primeiro deputado
  await page.click('[data-testid="deputado-card-0"]')
  
  // Validar URL
  expect(page.url()).toContain('/gastos/deputado/')
  
  // Trocar para tab Transações
  await page.click('[role="tab"][data-tab="transacoes"]')
  
  // Validar skeleton aparece e some
  await expect(page.locator('[data-testid="skeleton"]')).toBeVisible()
  await expect(page.locator('[data-testid="skeleton"]')).toBeHidden({ timeout: 5000 })
  
  // Validar conteúdo carregado
  await expect(page.locator('[data-testid="transacoes-table"]')).toBeVisible()
})
```

#### 2.3.4 Testes de Dashboard

```typescript
// e2e/dashboard.spec.ts
test('deve filtrar dashboard por partido e UF', async ({ page }) => {
  await page.goto('/gastos/dashboard')
  
  // Selecionar PT + SP
  await page.selectOption('[data-testid="filtro-partido"]', 'PT')
  await page.selectOption('[data-testid="filtro-uf"]', 'SP')
  
  // Validar URL
  expect(page.url()).toContain('partido=PT')
  expect(page.url()).toContain('uf=SP')
  
  // Validar que ranking foi atualizado
  const ranking = await page.textContent('[data-testid="ranking-deputados"]')
  expect(ranking).not.toContain('Deputados de outros estados')
})
```

---

### 2.4 Cronograma Frontend

| Fase | Duração | Entregáveis | Responsável |
|------|---------|-------------|-------------|
| **2.1 Hooks** | 8-10 horas | useUrlSyncedFilters, useAsyncTabData | Dev Frontend |
| **2.2 Error Boundaries** | 4-6 horas | DataErrorBoundary | Dev Frontend |
| **2.3 Testes E2E** | 12-16 horas | 15+ testes Playwright | QA + Dev Frontend |
| **Total** | **24-32 horas** | Etapa Frontend concluída | - |

---

## 🔭 ETAPA 3: Observabilidade e Operação Unificada

### Contexto e Justificativa

Atualmente, cada etapa do pipeline (contratos, ETL, materialização, cache) gera logs e manifests independentes, sem visão consolidada. Isso dificulta:

1. **Diagnóstico rápido** - "Qual etapa falhou na última execução?"
2. **SLA tracking** - "Estamos demorando mais que o usual?"
3. **Alertas proativos** - "Cache está desatualizado há 48h"

**Meta:** Painel único (Grafana/Planilha) + alertas + checklist de release automatizado.

---

### 3.1 Eventos Mínimos e Coleta

**Objetivo:** Definir eventos estruturados para rastreamento.

#### 3.1.1 Eventos do Pipeline

| Evento | Origem | Campos Obrigatórios | Frequência |
|--------|--------|---------------------|------------|
| `contracts_gate_status` | CI (GitHub Actions) | `status`, `timestamp`, `commit` | Diário + PR |
| `etl_run_manifest` | `python -m etlpython camara` | `duration`, `recordsProcessed`, `commit` | Manual |
| `datalake_verify` | `pnpm run datalake:verify` | `status`, `filesChecked`, `hashMismatches` | Antes de materializar |
| `cache_publish` | `pnpm cache:publish` | `status`, `filesPublished`, `targetPath` | Manual |
| `server_action_error` | Server Actions | `actionName`, `errorCode`, `stackTrace` | Runtime |

#### 3.1.2 Coletor de Eventos

```typescript
// packages/monitor-despesas-next/scripts/collect-events.ts

import fs from 'fs/promises'
import path from 'path'

interface PipelineEvent {
  type: string
  timestamp: string
  status: 'success' | 'failure' | 'warning'
  metadata: Record<string, unknown>
}

async function collectEvents(): Promise<PipelineEvent[]> {
  const events: PipelineEvent[] = []

  // 1. ETL Run Manifest
  const etlManifestPath = path.join(
    process.cwd(),
    '../../bancoDados/monitordespesas/_etl-run-manifest.json'
  )
  try {
    const etlManifest = JSON.parse(await fs.readFile(etlManifestPath, 'utf-8'))
    events.push({
      type: 'etl_run_manifest',
      timestamp: etlManifest.endTime,
      status: etlManifest.success ? 'success' : 'failure',
      metadata: {
        duration: etlManifest.duration,
        recordsProcessed: etlManifest.summary.totalRecords,
        commit: etlManifest.gitCommit,
      },
    })
  } catch (error) {
    console.warn('[collect-events] ETL manifest não encontrado')
  }

  // 2. Datalake Manifest
  const datalakeManifestPath = path.join(
    process.cwd(),
    '../../bancoDados/monitordespesas/_datalake-manifest.json'
  )
  try {
    const datalakeManifest = JSON.parse(await fs.readFile(datalakeManifestPath, 'utf-8'))
    events.push({
      type: 'datalake_verify',
      timestamp: datalakeManifest.generatedAt,
      status: 'success', // assume sucesso se manifest existe
      metadata: {
        filesChecked: Object.keys(datalakeManifest.files || {}).length,
        totalSize: datalakeManifest.totalSize,
      },
    })
  } catch (error) {
    console.warn('[collect-events] Datalake manifest não encontrado')
  }

  // 3. Cache Manifest
  const cacheManifestPath = path.join(process.cwd(), 'public/cache/caches-manifest.json')
  try {
    const cacheManifest = JSON.parse(await fs.readFile(cacheManifestPath, 'utf-8'))
    events.push({
      type: 'cache_publish',
      timestamp: cacheManifest.generatedAt,
      status: 'success',
      metadata: {
        filesPublished: cacheManifest.entries.length,
        totalSize: cacheManifest.entries.reduce((sum, e) => sum + e.size, 0),
      },
    })
  } catch (error) {
    console.warn('[collect-events] Cache manifest não encontrado')
  }

  return events
}

// Exportar para Google Sheets ou Grafana
async function pushToObservability(events: PipelineEvent[]) {
  // Opção 1: Google Sheets via API
  const SHEET_ID = process.env.OBSERVABILITY_SHEET_ID
  if (SHEET_ID) {
    // ... implementação sheets API
  }

  // Opção 2: Grafana/Loki via HTTP
  const LOKI_URL = process.env.LOKI_URL
  if (LOKI_URL) {
    // ... implementação loki push
  }

  // Fallback: JSON local
  await fs.writeFile(
    'observability-events.json',
    JSON.stringify(events, null, 2),
    'utf-8'
  )
}

// CLI
collectEvents().then(pushToObservability)
```

---

### 3.2 Checklist de Release

**Objetivo:** Validar todas as etapas antes de deploy.

#### 3.2.1 Script de Checklist

```typescript
// packages/monitor-despesas-next/scripts/release-checklist.ts

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface CheckResult {
  step: string
  status: 'pass' | 'fail' | 'skip'
  output?: string
  duration?: number
}

async function runChecklist(): Promise<CheckResult[]> {
  const results: CheckResult[] = []

  // 1. Contracts Validation
  try {
    const start = Date.now()
    await execAsync('pnpm contracts:validate', { cwd: '../..' })
    results.push({
      step: 'Contracts Validation',
      status: 'pass',
      duration: Date.now() - start,
    })
  } catch (error) {
    results.push({
      step: 'Contracts Validation',
      status: 'fail',
      output: (error as Error).message,
    })
  }

  // 2. Datalake Verify
  try {
    const start = Date.now()
    const { stdout } = await execAsync('pnpm --filter @a-republica/etl-python run datalake:verify')
    results.push({
      step: 'Datalake Integrity',
      status: 'pass',
      output: stdout,
      duration: Date.now() - start,
    })
  } catch (error) {
    results.push({
      step: 'Datalake Integrity',
      status: 'fail',
      output: (error as Error).message,
    })
  }

  // 3. Cache Manifests Refresh
  try {
    const start = Date.now()
    await execAsync('pnpm --filter @a-republica/monitor-despesas-next cache:manifests:refresh')
    results.push({
      step: 'Cache Manifests Refresh',
      status: 'pass',
      duration: Date.now() - start,
    })
  } catch (error) {
    results.push({
      step: 'Cache Manifests Refresh',
      status: 'fail',
      output: (error as Error).message,
    })
  }

  // 4. Cache Publish Dry-run
  try {
    const start = Date.now()
    await execAsync('pnpm --filter @a-republica/monitor-despesas-next cache:publish:dry-run')
    results.push({
      step: 'Cache Publish (Dry-run)',
      status: 'pass',
      duration: Date.now() - start,
    })
  } catch (error) {
    results.push({
      step: 'Cache Publish (Dry-run)',
      status: 'fail',
      output: (error as Error).message,
    })
  }

  // 5. Frontend Type-check
  try {
    const start = Date.now()
    await execAsync('pnpm --filter @a-republica/monitor-despesas-next type-check')
    results.push({
      step: 'Frontend Type-check',
      status: 'pass',
      duration: Date.now() - start,
    })
  } catch (error) {
    results.push({
      step: 'Frontend Type-check',
      status: 'fail',
      output: (error as Error).message,
    })
  }

  // 6. E2E Tests (opcional)
  if (process.env.RUN_E2E === 'true') {
    try {
      const start = Date.now()
      await execAsync('pnpm --filter @a-republica/monitor-despesas-next test:e2e')
      results.push({
        step: 'E2E Tests',
        status: 'pass',
        duration: Date.now() - start,
      })
    } catch (error) {
      results.push({
        step: 'E2E Tests',
        status: 'fail',
        output: (error as Error).message,
      })
    }
  }

  return results
}

async function main() {
  console.log('🚀 Release Checklist Iniciado\n')
  const results = await runChecklist()

  // Exibir resultados
  results.forEach((result) => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️'
    console.log(`${icon} ${result.step} (${result.duration || 0}ms)`)
    if (result.output) {
      console.log(`   ${result.output.slice(0, 100)}...`)
    }
  })

  // Status final
  const failures = results.filter((r) => r.status === 'fail')
  if (failures.length > 0) {
    console.error('\n❌ Checklist FALHOU - Corrija os erros antes de prosseguir')
    process.exit(1)
  } else {
    console.log('\n✅ Checklist PASSOU - Pronto para deploy')
  }
}

main()
```

**Uso:**

```bash
pnpm --filter @a-republica/monitor-despesas-next release:checklist
```

---

### 3.3 Alertas e Runbook

**Objetivo:** Notificar equipe em caso de falhas.

#### 3.3.1 Alertas Slack/Email

```typescript
// scripts/alert.ts

async function sendAlert(event: PipelineEvent) {
  if (event.status !== 'failure') return

  const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL
  if (SLACK_WEBHOOK) {
    await fetch(SLACK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Pipeline Falhou: ${event.type}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Etapa:* ${event.type}\n*Timestamp:* ${event.timestamp}\n*Metadata:* ${JSON.stringify(event.metadata, null, 2)}`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Ver Runbook' },
                url: 'https://docs.example.com/runbook-pipeline',
              },
            ],
          },
        ],
      }),
    })
  }
}
```

#### 3.3.2 Runbook

```markdown
# Runbook: Pipeline de Dados

## 1. Contracts Gate Falhou

**Sintoma:** Workflow "Contracts Gate" falha no CI

**Causa Provável:** API Dados Abertos mudou schema

**Resolução:**
1. Abrir logs do workflow: `.github/workflows/contracts-gate.yml`
2. Identificar endpoint que falhou (ex: `/deputados`)
3. Atualizar schema em `packages/etlpython/contracts/schemas/`
4. Rodar `pnpm contracts:validate --live` localmente
5. Commitar fix e rerun workflow

**SLA:** 24h (não bloqueia deploy se API está estável)

---

## 2. Datalake Verify Falhou

**Sintoma:** `pnpm run datalake:verify` retorna erros de hash

**Causa Provável:** Arquivo corrompido ou alterado manualmente

**Resolução:**
1. Identificar arquivos com hash divergente no output
2. Re-executar ETL apenas para os anos afetados:
   ```bash
   pnpm --filter @a-republica/etl-python run etl:camara -- --anos 2024
   ```
3. Rodar `datalake:partition` para reparticionar
4. Verificar novamente com `datalake:verify`

**SLA:** 2h (bloqueia materialização)

---

## 3. Cache Publish Falhou

**Sintoma:** `cache:publish:dry-run` exibe entradas inválidas

**Causa Provável:** Materialização gerou caches sem hash

**Resolução:**
1. Rodar `cache:manifests:refresh` para recalcular hashes
2. Se persiste, re-executar materialização:
   ```bash
   pnpm --filter @a-republica/etl-python run etl:materialize:all
   ```
3. Verificar `caches-manifest.json` e `transactions-manifest.json`
4. Dry-run novamente

**SLA:** 1h (bloqueia deploy frontend)
```

---

### 3.4 Cronograma Observabilidade

| Fase | Duração | Entregáveis | Responsável |
|------|---------|-------------|-------------|
| **3.1 Eventos** | 6-8 horas | Coletor + dashboard inicial | Dev Backend |
| **3.2 Checklist** | 4-6 horas | Script automatizado | DevOps |
| **3.3 Alertas** | 4-6 horas | Slack webhook + runbook | DevOps |
| **Total** | **14-20 horas** | Etapa Observabilidade concluída | - |

---

## 📅 Roadmap Executivo Consolidado

### Resumo de Esforço

| Etapa | Horas (Min-Max) | Prioridade | Bloqueadores |
|-------|-----------------|------------|--------------|
| **1. Server Actions** | 40-52 | 🔴 Alta | Nenhum |
| **2. Frontend/UX** | 24-32 | 🟡 Média | Etapa 1 concluída |
| **3. Observabilidade** | 14-20 | 🟢 Baixa | Nenhum (pode ser paralelo) |
| **Total** | **78-104 horas** | - | - |

### Estimativa de Calendário

**Assumindo:** 1 dev full-time (40h/semana)

- **Semana 1-2:** Server Actions (Etapa 1)
- **Semana 3:** Frontend/UX (Etapa 2)
- **Semana 4:** Observabilidade (Etapa 3) + Documentação final

**Entrega:** ~1 mês (4 semanas)

---

### Marcos e Critérios de Sucesso

#### Marco 1: Server Actions Consolidadas (Semana 2)
- ✅ 6+ schemas Zod implementados
- ✅ 15 Server Actions migradas
- ✅ Testes unitários com 100% coverage
- ✅ Documentação de schemas publicada

#### Marco 2: Frontend Padronizado (Semana 3)
- ✅ Hooks `useUrlSyncedFilters` + `useAsyncTabData` em uso
- ✅ Error boundaries em páginas críticas
- ✅ 15+ testes Playwright passando em CI

#### Marco 3: Observabilidade Ativa (Semana 4)
- ✅ Painel de eventos (Grafana ou Sheets) funcional
- ✅ Checklist de release rodando antes de cada deploy
- ✅ Alertas Slack configurados para pipeline
- ✅ Runbook documentado e validado com time

#### Marco Final: Sistema 100% Otimizado
- ✅ Zero erros de validação Zod em produção (7 dias)
- ✅ Tempo médio de resposta de Server Actions < 500ms (P95)
- ✅ 100% de fluxos críticos cobertos por E2E
- ✅ SLA de pipeline < 2h (contracts → cache publicado)

---

## 🔧 Dependências Técnicas Gerais

### 1. Reinstalação de Dependências
**Quando:** Antes de iniciar qualquer etapa  
**Comando:**
```bash
pnpm install
```
**Motivo:** Substituir stub de `@types/node` em `scripts/types/node` por versão oficial

### 2. CI Pipelines
**Quando:** Etapa 1 (Server Actions) concluída  
**Ação:**
- Adicionar job no GitHub Actions para rodar `cache:manifests:refresh` + `cache:publish:dry-run` em cada PR
- Bloquear merge se validação falhar

### 3. Documentação
**Quando:** Após cada marco  
**Ação:**
- Atualizar `FLUXO-DADOS-ROADMAP.md` com status ✅
- Criar/atualizar guias em `docs/02-data-pipeline` e `docs/03-frontend`

---

## 🎯 Próximas Ações Imediatas (Esta Semana)

1. **Reinstalar dependências** → `pnpm install` na raiz
2. **Iniciar Etapa 1.1** → Criar schemas de categorias e dashboard
3. **Setup Playwright** → `pnpm add -D @playwright/test` no frontend
4. **Documentar progresso** → Atualizar FLUXO-DADOS-ROADMAP.md

---

## 📚 Referências

- [FLUXO-DADOS-ROADMAP.md](../01-architecture/FLUXO-DADOS-ROADMAP.md)
- [GUIA_COMPLETO_CACHES.md](../01-architecture/GUIA_COMPLETO_CACHES.md)
- [ESTADO-ATUAL-PROJETO.md](../08-status/ESTADO-ATUAL-PROJETO.md)
- [Zod Documentation](https://zod.dev)
- [Playwright Testing](https://playwright.dev)

---

**Conclusão:** Com foco disciplinado e execução sequencial dos 3 planos detalhados acima, o sistema alcançará 100% de otimização em aproximadamente 4 semanas, com robustez, observabilidade e experiência do usuário de nível production-grade. 🚀
