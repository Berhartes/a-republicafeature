# 🏗️ Arquitetura do Sistema - A República

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Camadas do Sistema](#camadas-do-sistema)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Componentes Principais](#componentes-principais)
5. [Decisões de Design](#decisões-de-design)
6. [Performance](#performance)

---

## 🎯 Visão Geral

O sistema **A República** é uma aplicação JAMstack moderna que processa e visualiza dados de gastos parlamentares através de uma arquitetura em 7 camadas:

```
API → ETL → Datalake → Materialização → Cache → Server Actions/ISR → Frontend → Usuário
```

### Princípios Arquiteturais

1. **Separação de Responsabilidades**: Cada camada tem uma função específica
2. **Processamento Offline**: Dados pesados processados antes do runtime
3. **Cache em Camadas**: Múltiplos níveis de cache para performance
4. **Deduplicação**: Evita requisições e processamentos duplicados
5. **Escalabilidade**: Suporta milhões de transações

---

## 🏛️ Camadas do Sistema

### Camada 1: Fonte de Dados

**API da Câmara dos Deputados**

```
https://dadosabertos.camara.leg.br/api/v2
├─ /deputados
├─ /deputados/{id}/despesas
└─ /legislaturas
```

**Características:**
- API REST pública
- Rate limiting: ~150ms entre requisições
- Formato: JSON
- Dados atualizados diariamente

---

### Camada 2: ETL (Python)

**Localização:** `packages/etlpython/`

**Responsabilidades:**
1. **Extract**: Buscar dados da API
2. **Transform**: Normalizar e validar
3. **Load**: Salvar no datalake
4. **Contracts**: Versionar o schema oficial das respostas públicas

> **Novidade:** o comando `PYTHONPATH=src venv/bin/python -m etlpython.contracts_cli export`
> (executado em `packages/etlpython`) gera/atualiza os snapshots JSON Schema dos modelos
> `DeputadoApi` e `DespesaApi`. Use `validate --live` para consultar a API e detectar
> mudanças antes de iniciar um ETL longo.

**Componentes:**

```python
etlpython/
├── extract/
│   └── camara_api.py          # Cliente HTTP
├── transform/
│   └── processors.py          # Normalização
├── load/
│   └── file_writer.py         # Persistência
└── models.py                  # Validação Pydantic
```

**Exemplo de Uso:**

```bash
# Extrair 10 deputados da legislatura 57
python -m etlpython.cli.despesas 57 10
```

**Output:**
- Tempo: ~5 minutos
- Arquivos: ~10 JSONs (1 por deputado)
- Tamanho: ~50MB total

---

### Camada 3: Datalake

**Localização:** `bancoDados/monitordespesas/`

**Estrutura:**

```
bancoDados/monitordespesas/
├── congressoNacional/camaraDeputados/
│   ├── deputados.json                    # Agregado
│   ├── fornecedores.json                 # Agregado
│   └── deputadosFederais/
│       └── idDeputados/
│           └── {id}/
│               └── dados_completos.json  # Detalhado
└── manifest.json                         # Metadados
```

**Características:**
- Formato: JSON hierárquico
- Dados brutos + agregados
- Versionado por legislatura
- ~500MB para legislatura completa

---

### Camada 4: Materialização

**Scripts Python:**

#### 4.1 materialize_unified_v2.py

**Função:** Gerar caches otimizados com separação por ano

```python
# Input: bancoDados/monitordespesas/
# Output: public/cache/*.json

python -m etlpython.cli.materialize_unified_v2
```

**Processamento:**
1. Lê dados brutos do datalake
2. Agrega por ano (gastosPorAno, totalRecebidoPorAno)
3. Calcula rankings e estatísticas
4. Gera caches comprimidos (.json + .json.gz)

**Caches Gerados:**
- `suppliers-cache.json` (fornecedores)
- `deputies-cache.json` (deputados)
- `categories-cache.json` (categorias)

#### 4.2 materialize_paginated.py

**Função:** Paginar transações por ano

```python
# Input: bancoDados/monitordespesas/
# Output: public/cache/transactions/

python -m etlpython.cli.materialize_paginated
```

**Processamento:**
1. Agrupa transações por deputado/fornecedor
2. Separa por ano
3. Pagina em blocos de 100 itens
4. Gera índices de navegação

**Caches Gerados:**
- `deputy-{id}-transactions-{ano}-page{n}.json`
- `supplier-{id}-transactions-{ano}-page{n}.json`
- `*-transactions-index.json`

---

### Camada 5: Cache Layer

**Localização:** `packages/monitor-despesas-next/public/cache/`

**Estrutura:**

```
public/cache/
├── caches-manifest.json
├── suppliers-cache.json (+ .gz)
├── deputies-cache.json (+ .gz)
├── categories-cache.json (+ .gz)
├── rankings-cache.json
├── premiacoes-cache.json
└── transactions/
    ├── transactions-manifest.json
    ├── deputy-*.json
    └── supplier-*.json
```

**Características:**
- Servido estaticamente (CDN-ready)
- Compressão gzip (~70% redução)
- Versionamento por hash
- Cache HTTP headers

---

### Camada 6: Server Actions (Next.js 16)

**Localização:** `src/app/gastos/actions/data-actions.ts`

**Função:** Server Actions para buscar dados do cache materialize

**Arquitetura:**

```typescript
// Server Actions - Executam no servidor
'use server'

// Cache com React cache() - deduplica automaticamente
const readMaterializeCache = cache(async <T>(cacheName: string): Promise<T> => {
  const data = await readFile(`bancoDados/.../${cacheName}.json`)
  return JSON.parse(data)
})

export async function getDeputados(options: FilterOptions) {
  const cache = await readMaterializeCache('deputados')
  // Filtragem, ordenação e paginação no servidor
  return { deputados, total }
}
```

**Server Actions Principais:**

```typescript
// Deputados
getDeputados(options)        // Lista filtrada e paginada
getDeputadoById(id)          // Deputado específico
getDeputadosByIds(ids)       // Múltiplos deputados

// Fornecedores
getFornecedores(options)     // Lista filtrada e paginada
getFornecedorByCnpj(cnpj)    // Fornecedor específico
getFornecedoresComAnalise()  // Com score de suspeição

// Dashboard
getDashboardData()           // Dados agregados
getPremiacoes(filters)       // Rankings
getTransacoesDeputado()      // Transações paginadas
```

**Benefícios:**
- ✅ Executa no servidor durante build ou request
- ✅ Cache automático com React cache()
- ✅ ISR: Revalidação automática (configurável por página)
- ✅ Type-safe com TypeScript
- ✅ Reduz JavaScript no cliente
- ✅ SEO otimizado (dados no HTML inicial)

**ISR Configuration:**
```typescript
// page.tsx
export const revalidate = 3600 // Revalida a cada 1 hora
```

---

### Camada 7: Frontend (React)

**Localização:** `packages/monitor-despesas-next/`

**Stack:**
- React 19.2
- Next.js 16.0.1
- TypeScript 5.9
- Tailwind CSS v4.1
- shadcn/ui (Radix UI)

**Padrão de Arquitetura:**

```
app/
├── gastos/
│   ├── actions/
│   │   └── data-actions.ts      # Server Actions
│   ├── deputados/
│   │   ├── page.tsx             # Server Component (RSC)
│   │   └── DeputadosPageClient.tsx  # Client Component
│   └── fornecedores/
│       ├── page.tsx             # Server Component (RSC)
│       └── FornecedoresPageClient.tsx  # Client Component
```

**Server Components (page.tsx):**
- Executam no servidor durante build/request
- Buscam dados via Server Actions
- Renderizam HTML inicial com dados
- Passam dados via props para Client Components

**Client Components (*Client.tsx):**
- Marcados com `'use client'`
- Recebem dados via props
- Gerenciam estado local apenas para UI (filtros, paginação)
- Usam React 19 hooks (useTransition)

**Hooks React 19:**

```typescript
// useTransition - Transições suaves
const [isPending, startTransition] = useTransition()

startTransition(() => {
  setFilter(newValue)  // Não bloqueia UI
})
```

**Diretórios e páginas principais (App Router):**

```
src/app/
├── gastos/
│   ├── deputados/               # Lista e perfil resumido de deputados
│   ├── fornecedores/            # Ranking de fornecedores com análise
│   ├── comparar/                # Comparação entre deputados
│   ├── dashboards/              # Painéis agregados
│   ├── premiacoes/              # Rankings e premiações
│   └── perfil/                  # Perfis detalhados
├── layout.tsx                   # Layout raiz (Server Component)
├── providers.tsx                # Shell client-side com contextos
└── page.tsx                     # Landing do monitor
```

**Contextos e hooks de UI atualmente utilizados:**

- `contexts/UIStateContext.tsx` → estado leve de UI (filtros, tema, sidebar)
- `hooks/useServerAction.ts` → wrapper com `useTransition()` e estados de pending
- `hooks/useOptimizedFilters.ts` → filtragem memoizada para listas grandes
- `hooks/useAccessibility.ts` → integrações de acessibilidade no shell

---

### Camada 8: Usuário

**Navegador Web**

**Tecnologias Client-Side:**
- Streaming SSR (Next.js 16)
- Suspense boundaries
- Compression (gzip/brotli)

---

## 🔄 Fluxo de Dados Completo

### Fluxo de Extração (ETL)

```
┌──────────────┐
│ API Câmara   │
└──────┬───────┘
       │ HTTP GET
       ↓
┌──────────────┐
│ ETL Python   │
│ - Rate limit │
│ - Validação  │
└──────┬───────┘
       │ JSON
       ↓
┌──────────────┐
│ Datalake     │
│ - Bruto      │
│ - Agregado   │
└──────────────┘
```

### Fluxo de Materialização

```
┌──────────────┐
│ Datalake     │
└──────┬───────┘
       │ Read JSON
       ↓
┌──────────────┐
│ Materialize  │
│ - Agregar    │
│ - Paginar    │
│ - Comprimir  │
└──────┬───────┘
       │ Write JSON
       ↓
┌──────────────┐
│ Cache Layer  │
│ public/cache │
└──────────────┘
```

### Fluxo de Consumo (Frontend)

```
┌──────────────┐
│ User Request │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Next.js 16   │ ← Roteamento
│ App Router   │
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Server       │ ← Server Component
│ Component    │   (page.tsx)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Server       │ ← getDeputados()
│ Action       │   readMaterializeCache()
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ React cache()│ ← Deduplica requisições
│ + File Read  │   mesmo request
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ ISR Cache    │ ← Cache de 1h
│ Next.js      │   (revalidate: 3600)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Client       │ ← Hydrate + Interatividade
│ Component    │   (*Client.tsx)
└──────┬───────┘
       │
       ↓
┌──────────────┐
│ Browser      │ ← Renderiza
│ Render       │
└──────────────┘
```

---

## 🧩 Componentes Principais

### 1. Server Actions (data-actions.ts)

**Responsabilidade:** Buscar e processar dados no servidor

**Métodos Principais:**

```typescript
// Server Actions com React cache() para deduplicação
'use server'

// Deputados
async function getDeputados(options: FilterOptions)
async function getDeputadoById(id: string)
async function getDeputadosByIds(ids: string[])

// Fornecedores
async function getFornecedores(options: FilterOptions)
async function getFornecedorByCnpj(cnpj: string)
async function getFornecedoresComAnalise(options: AnalysisOptions)

// Dashboard & Analytics
async function getDashboardData()
async function getPremiacoes(filters: PremiacoesFilters)
async function getTransacoesDeputado(options: TransactionOptions)
async function getCacheMetadata()
```

**Exemplo de Uso:**

```typescript
// page.tsx (Server Component)
export default async function DeputadosPage({ searchParams }) {
  const { deputados, total } = await getDeputados({
    ano: searchParams.ano,
    partido: searchParams.partido,
    page: parseInt(searchParams.page || '1'),
    pageSize: 12
  })
  
  return <DeputadosPageClient deputados={deputados} total={total} />
}

export const revalidate = 3600 // ISR: revalida a cada 1h
```

### 2. Page Components (Server Components)

**Responsabilidade:** Orquestrar renderização no servidor

**Padrão:**

```typescript
// app/gastos/deputados/page.tsx
import type { Metadata } from 'next'
import { getDeputados } from '../actions/data-actions'
import { DeputadosPageClient } from './DeputadosPageClient'

export const metadata: Metadata = {
  title: 'Deputados • Monitor de Gastos',
  description: '...'
}

export const revalidate = 3600 // ISR

export default async function DeputadosPage({ searchParams }) {
  const params = await searchParams // Next.js 15+
  
  // Server Actions executam no servidor
  const { deputados, total } = await getDeputados({
    ano: params.ano,
    partido: params.partido,
    page: parseInt(params.page || '1')
  })
  
  // Server-side processing
  const stats = calculateStats(deputados)
  const partidos = extractPartidos(deputados)
  
  // Pass to Client Component
  return (
    <DeputadosPageClient 
      deputados={deputados}
      stats={stats}
      partidosDisponiveis={partidos}
    />
  )
}
```

### 3. Client Components

**Responsabilidade:** Gerenciar UI interativa e estado local

**Interface:**

```typescript
// DeputadosPageClient.tsx
'use client'

import { useState, useTransition, useMemo } from 'react'

interface Props {
  deputados: Deputado[]        // Props do Server Component
  stats: Stats                 // Calculado no servidor
  partidosDisponiveis: string[] // Extraído no servidor
}

export function DeputadosPageClient({ 
  deputados, 
  stats, 
  partidosDisponiveis 
}: Props) {
  // React 19: useTransition para transições suaves
  const [isPending, startTransition] = useTransition()
  
  // Estado local apenas para UI
  const [searchTerm, setSearchTerm] = useState('')
  const [partidoFilter, setPartidoFilter] = useState('TODOS')
  const [currentPage, setCurrentPage] = useState(1)
  
  // useMemo para otimizar computação
  const deputadosFiltrados = useMemo(() => {
    return deputados
      .filter(d => d.nome.includes(searchTerm))
      .filter(d => partidoFilter === 'TODOS' || d.partido === partidoFilter)
  }, [deputados, searchTerm, partidoFilter])
  
  // Transições não bloqueantes
  const handleFilterChange = (setter, value) => {
    startTransition(() => {
      setter(value)
      setCurrentPage(1)
    })
  }
  
  return (
    <div>
      <Input 
        value={searchTerm}
        onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)}
      />
      {isPending && <LoadingSpinner />}
      {deputadosFiltrados.map(d => <DeputadoCard key={d.id} {...d} />)}
    </div>
  )
}
```

---

## 🎨 Decisões de Design

### Por que Python para ETL?

✅ **Pandas** para manipulação de dados
✅ **Pydantic** para validação
✅ **Requests** para HTTP
✅ **Performance** em processamento batch
✅ **Ecossistema** rico para data science

### Por que Next.js 16?

✅ **Turbopack** - Build 10x mais rápido
✅ **React 19.2** - Features mais recentes
✅ **TypeScript 5.9** - Melhor inferência
✅ **ISR** - Cache com revalidação automática
✅ **Streaming SSR** - Progressive rendering

### Por que Server Actions + ISR?

✅ **SSR Nativo**: Dados renderizados no servidor
✅ **SEO Otimizado**: HTML completo no primeiro load
✅ **ISR**: Cache inteligente com revalidação automática (1h)
✅ **Type-Safe**: TypeScript end-to-end
✅ **Performance**: Dados no HTML inicial, sem waterfalls

### Por que Separação por Ano?

✅ **Filtros**: Usuários filtram por ano frequentemente
✅ **Performance**: Menos dados por request
✅ **Análise**: Comparação temporal
✅ **Escalabilidade**: Dados crescem com o tempo

---

## ⚡ Performance

### Métricas de Carregamento

| Métrica | Valor Atual | Meta | Status |
|---------|-------------|------|--------|
| Primeira carga (SSR) | 0.8s | < 1s | ✅ |
| Time to Interactive | 1.2s | < 1.5s | ✅ |
| Filtro local (client) | 0.05s | < 0.1s | ✅ |
| Navegação entre páginas | 0.4s | < 0.5s | ✅ |

### Otimizações Implementadas

1. **Server Actions com ISR**
   - Dados renderizados no servidor
   - Cache de 1 hora com revalidação automática
   - Eliminação de waterfalls de requisições

2. **React 19.2 Features**
   - useTransition() para UI não bloqueante
   - React cache() para deduplicação
   - Suspense boundaries para streaming

3. **Paginação e Filtros**
   - Filtros client-side instantâneos
   - Paginação server-side quando necessário
   - useMemo para otimizar re-renders

4. **Compressão**
   - Gzip para todos os JSONs
   - ~70% redução de tamanho
   - Headers HTTP corretos

5. **Separação Temporal**
   - Dados por ano
   - Filtros instantâneos
   - Menos processamento client-side

---

## 🔮 Próximas Melhorias

### Curto Prazo
- [ ] Streaming SSR completo com Suspense
- [ ] Compressão Brotli além de gzip
- [ ] Virtual scrolling para listas longas
- [ ] Parallel data fetching otimizado

### Médio Prazo
- [ ] Real-time updates com WebSockets
- [ ] Machine Learning para alertas preditivos
- [ ] Export avançado (Excel/PDF/CSV)
- [ ] PWA com Service Worker

### Longo Prazo
- [ ] Mobile app nativo (React Native)
- [ ] API GraphQL pública
- [ ] Integração com outros órgãos
- [ ] Análise preditiva com IA

---

**Última atualização:** 06/11/2025
**Versão:** 3.0.0 (Next.js 16 + React 19.2 + Server Actions)
