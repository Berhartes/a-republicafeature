# Correção de Arquitetura - Migração de Premiações

## Problema Identificado

A implementação inicial da Task 2 não seguia o padrão arquitetural do projeto. Criamos serviços client-side que tentavam buscar dados do CDN, mas o projeto usa **Server Actions** com **Next.js App Router**.

## Padrão Correto do Projeto

Analisando páginas existentes (deputados, fornecedores), identificamos o padrão:

### 1. Server Component (page.tsx)
```typescript
// packages/monitor-despesas-next/src/app/gastos/[feature]/page.tsx
export default async function FeaturePage({ searchParams }: PageProps) {
  const params = await resolveSearchParams(searchParams)
  const data = await getFeatureData(params) // Server Action
  return <FeaturePageClient data={data} searchParams={params} />
}
```

**Características:**
- Async function
- Recebe searchParams
- Chama Server Action para buscar dados
- Passa dados para Client Component
- Define metadata e revalidate

### 2. Client Component (*PageClient.tsx)
```typescript
// packages/monitor-despesas-next/src/app/gastos/[feature]/FeaturePageClient.tsx
'use client'

export function FeaturePageClient({ data, searchParams }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const updateURL = (updates: Record<string, string | null>) => {
    // Atualiza searchParams e navega
    startTransition(() => router.push(newUrl))
  }
  
  return (/* UI com filtros e dados */)
}
```

**Características:**
- Marcado com 'use client'
- Recebe dados como props (não busca dados)
- Gerencia estado local (UI, filtros)
- Usa useRouter/useSearchParams para navegação
- Usa useTransition para transições suaves

### 3. Server Actions (data-actions.ts)
```typescript
// packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts
'use server'

export async function getFeatureData(filters: Filters) {
  // Lê dados de public/cache/*.json
  const rawData = await readCacheFile('feature-cache')
  
  // Normaliza dados
  const normalized = rawData.map(normalizeItem)
  
  // Aplica filtros usando utilitários puros
  const filtered = applyFilters(normalized, filters)
  
  // Retorna dados processados
  return { items: filtered, total: filtered.length }
}
```

**Características:**
- Marcado com 'use server'
- Lê arquivos JSON de public/cache/
- Normaliza dados para tipos unificados
- Usa funções puras para processar dados
- Retorna dados processados

### 4. Utility Functions (puros, sem I/O)
```typescript
// packages/monitor-despesas-next/src/services/feature-utils.ts
export function applyFilters(items: Item[], filters: Filters): Item[] {
  // Lógica pura de filtragem
  return items.filter(/* ... */)
}

export function computeStats(items: Item[]): Stats {
  // Lógica pura de cálculo
  return { /* ... */ }
}
```

**Características:**
- Funções puras (sem side effects)
- Não fazem I/O (não leem arquivos, não fazem fetch)
- Recebem dados como parâmetros
- Retornam dados transformados
- Podem ser testadas facilmente

## Mudanças Realizadas

### 1. Atualização do Design Document
- ✅ Atualizada arquitetura high-level para refletir padrão Server/Client
- ✅ Removida referência a useEtlDeputadosData hook
- ✅ Atualizada seção de Service Layer para distinguir Server Actions vs Utilities
- ✅ Atualizado Data Flow para mostrar fluxo correto

### 2. Atualização das Tasks

#### Task 2: Refatorada completamente
**Antes:**
- 2.1: Create unified-ranking-service (com I/O)
- 2.2: Create premiacao-unificada service (com I/O)
- 2.3: Create premiacoes-processor utility
- 2.4: Create etl-cache service (client-side fetch)

**Depois:**
- 2.1: Refactor services to pure utility functions (sem I/O)
- 2.2: Update getPremiacoes Server Action in data-actions.ts
- 2.3: Write unit tests for utility functions

#### Task 3: Substituída
**Antes:**
- 3.1-3.4: Implement useEtlDeputadosData hook (não necessário)

**Depois:**
- 3.1: Create page.tsx Server Component
- 3.2: Add error boundary

#### Task 4: Refatorada
**Antes:**
- 4.1-4.3: Create ControlesFiltrosPremiacoes component (separado)

**Depois:**
- 4.1-4.3: Update PremiacoesPageClient to follow project pattern (integrado)

## Próximos Passos

### 1. Refatorar Serviços Existentes (Task 2.1)
Os serviços já criados precisam ser refatorados:

**unified-ranking-service.ts:**
- ✅ Já está puro (não faz I/O)
- ✅ Funções recebem dados como parâmetros
- ✅ Não precisa de mudanças

**premiacao-unificada.ts:**
- ⚠️ Precisa remover imports de premiacoes-processor
- ⚠️ Função getPremiacoes() deve ser renomeada para processarPremiacoes()
- ⚠️ Deve receber deputados e rankings como parâmetros

**premiacoes-processor.ts:**
- ✅ Já está puro
- ✅ Não precisa de mudanças

**etl-cache.service.ts:**
- ❌ Deve ser REMOVIDO (não segue padrão do projeto)
- ❌ Lógica de leitura de cache já existe em data-actions.ts

### 2. Atualizar getPremiacoes Server Action (Task 2.2)
Modificar `data-actions.ts` para:
- Ler dados de `public/cache/deputies-cache.json`
- Normalizar usando `normalizeDeputado()`
- Aplicar filtros usando `getRankingFiltrado()`
- Computar rankings usando funções de `unified-ranking-service`
- Computar premiações usando funções de `premiacao-unificada`
- Retornar estrutura completa para PremiacoesPageClient

### 3. Criar/Atualizar page.tsx (Task 3.1)
Seguir padrão de `deputados/page.tsx`:
- Async function
- Resolve searchParams
- Chama getPremiacoes()
- Passa dados para PremiacoesPageClient
- Wrap em Suspense

### 4. Atualizar PremiacoesPageClient (Task 4.1-4.3)
Seguir padrão de `DeputadosClient`:
- Receber premiacoesData como props
- Usar useRouter/useSearchParams
- Implementar updateURL() helper
- Gerenciar filtros via URL
- Usar useTransition para transições

## Benefícios da Correção

1. **Consistência**: Segue o mesmo padrão de outras páginas do projeto
2. **Performance**: Server Components renderizam no servidor, reduzindo bundle JS
3. **SEO**: Dados são renderizados no servidor, melhorando indexação
4. **Cache**: Aproveita cache do Next.js (revalidate)
5. **Simplicidade**: Menos código client-side, menos complexidade
6. **Testabilidade**: Funções puras são mais fáceis de testar

## Referências

- Página de Deputados: `packages/monitor-despesas-next/src/app/gastos/deputados/`
- Página de Fornecedores: `packages/monitor-despesas-next/src/app/gastos/fornecedores/`
- Data Actions: `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts`
