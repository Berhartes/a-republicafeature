# 🔄 Plano de Migração: Server Actions + Pipeline Materialize

**Data:** 05/11/2025  
**Status:** 📋 Planejamento  
**Objetivo:** Migrar camada de dados de IndexedDB (cliente) para Server Actions (servidor) usando pipeline `materialize`

---

## 📊 Situação Atual vs Desejada

### ❌ Arquitetura Atual (Problemática)

```
┌─────────────────────────────────────────────────────┐
│ Cliente (Browser)                                    │
├─────────────────────────────────────────────────────┤
│ 1. Componente monta                                  │
│ 2. Hook chama service                                │
│ 3. Service busca IndexedDB local                     │
│ 4. Se vazio, faz fetch de cache estático             │
│ 5. Armazena em IndexedDB                             │
│ 6. Retorna dados para hook                           │
│ 7. Hook atualiza estado                              │
│ 8. Componente renderiza                              │
└─────────────────────────────────────────────────────┘
         ↓ fetch (se necessário)
┌─────────────────────────────────────────────────────┐
│ Servidor                                             │
├─────────────────────────────────────────────────────┤
│ Arquivo estático: bancoDados/monitordespesas/       │
│   congressoNacional/cache/fornecedores-cache.json   │
└─────────────────────────────────────────────────────┘
```

**Problemas:**
- ❌ Dados carregados no cliente (bundle grande, lento)
- ❌ IndexedDB complexo de debugar e manter
- ❌ Não usa pipeline `materialize` oficial
- ❌ Cache local pode ficar desatualizado
- ❌ Renderização inicial lenta (espera dados)

### ✅ Arquitetura Desejada

```
┌─────────────────────────────────────────────────────┐
│ Servidor (Next.js)                                   │
├─────────────────────────────────────────────────────┤
│ 1. Server Component executa no build/request        │
│ 2. Chama Server Action                               │
│ 3. Server Action executa pipeline materialize       │
│ 4. Retorna dados serializados                        │
│ 5. Server Component renderiza com dados             │
│ 6. HTML hidratado enviado ao cliente                 │
└─────────────────────────────────────────────────────┘
         ↓ HTML + JSON (RSC payload)
┌─────────────────────────────────────────────────────┐
│ Cliente (Browser)                                    │
├─────────────────────────────────────────────────────┤
│ Client Component recebe props (dados pré-carregados) │
│ Apenas UI e interatividade                           │
└─────────────────────────────────────────────────────┘

         ↑ chamada
┌─────────────────────────────────────────────────────┐
│ ETL Python                                           │
├─────────────────────────────────────────────────────┤
│ Pipeline materialize:                                │
│ - materialize_unified_v2.py                          │
│ - materialize_paginated.py                           │
│ - Gera caches otimizados                             │
└─────────────────────────────────────────────────────┘
```

**Benefícios:**
- ✅ Dados carregados no servidor (SSR/SSG)
- ✅ Cliente recebe HTML já renderizado
- ✅ Usa pipeline oficial `materialize`
- ✅ Cache gerenciado pelo Next.js
- ✅ Renderização inicial rápida
- ✅ SEO melhor (conteúdo no HTML)

---

## 🎯 Estratégia de Migração

### Fase 1: Criar Server Actions Base

**Criar:** `packages/monitor-despesas-next/src/app/gastos/actions/`

```typescript
// app/gastos/actions/data-actions.ts
'use server'

import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Lê dados do cache materialize gerado pelo ETL Python
 */
async function readMaterializeCache<T>(cacheName: string): Promise<T> {
  const cacheDir = join(process.cwd(), '..', '..', '..', 'bancoDados', 'monitordespesas', 'congressoNacional', 'cache')
  const filePath = join(cacheDir, `${cacheName}.json`)
  
  const data = await readFile(filePath, 'utf-8')
  return JSON.parse(data)
}

/**
 * Busca todos os fornecedores do cache materialize
 */
export async function getFornecedores() {
  const cache = await readMaterializeCache<{
    fornecedores: Array<{
      cnpj: string
      nome: string
      totalGasto: number
      numTransacoes: number
      anos: Array<{ ano: number; total: number }>
    }>
  }>('suppliers-cache')
  
  return cache.fornecedores
}

/**
 * Busca fornecedor específico por CNPJ
 */
export async function getFornecedorByCnpj(cnpj: string) {
  const fornecedores = await getFornecedores()
  return fornecedores.find(f => f.cnpj === cnpj)
}

/**
 * Busca todos os deputados do cache materialize
 */
export async function getDeputados(ano?: string) {
  const cache = await readMaterializeCache<{
    deputados: Array<{
      id: string
      nome: string
      totalGasto: number
      anos: Array<{ ano: number; total: number }>
    }>
  }>('deputados-cache')
  
  let deputados = cache.deputados
  
  // Filtrar por ano se fornecido
  if (ano) {
    deputados = deputados.map(dep => ({
      ...dep,
      totalGasto: dep.anos.find(a => a.ano === parseInt(ano))?.total || 0
    }))
  }
  
  return deputados
}

/**
 * Busca análises suspeitas do cache materialize
 */
export async function getAnalisesSuspeitas() {
  const cache = await readMaterializeCache<{
    alertas: Array<any>
    fornecedoresSuspeitos: Array<any>
  }>('analise-cache')
  
  return {
    alertas: cache.alertas,
    fornecedoresSuspeitos: cache.fornecedoresSuspeitos
  }
}

/**
 * Busca premiações globais
 */
export async function getPremiacoesGlobais() {
  const cache = await readMaterializeCache<{
    premiacoes: {
      coroas: Array<any>
      trofeus: Array<any>
      medalhas: Array<any>
    }
  }>('premiacoes-cache')
  
  return cache.premiacoes
}
```

### Fase 2: Refatorar Server Components

**Exemplo:** `app/gastos/fornecedores/page.tsx`

```typescript
// ❌ ANTES (não há Server Component, dados vêm do cliente)
// src/pages/gastos/fornecedores.tsx (Pages Router)
export default function FornecedoresPage() {
  const { fornecedores, loading } = useFornecedores()
  
  if (loading) return <Loading />
  return <FornecedoresPageClient fornecedores={fornecedores} />
}
```

```typescript
// ✅ DEPOIS (Server Component busca dados)
// app/gastos/fornecedores/page.tsx
import { getFornecedores } from '../actions/data-actions'
import FornecedoresPageClient from './FornecedoresPageClient'

export default async function FornecedoresPage() {
  const fornecedores = await getFornecedores()
  
  return <FornecedoresPageClient fornecedores={fornecedores} />
}

// Opcional: Revalidação ISR
export const revalidate = 3600 // Revalida a cada 1 hora
```

### Fase 3: Refatorar Client Components

**Exemplo:** `app/gastos/fornecedores/FornecedoresPageClient.tsx`

```typescript
// ❌ ANTES (Client busca dados)
'use client'
export default function FornecedoresPageClient() {
  const { fornecedores, loading, error } = useFornecedores() // ❌ Hook busca IndexedDB
  
  if (loading) return <Loading />
  if (error) return <Error />
  
  return (
    <div>
      {fornecedores.map(f => <Card key={f.cnpj} {...f} />)}
    </div>
  )
}
```

```typescript
// ✅ DEPOIS (Client recebe props)
'use client'
interface FornecedoresPageClientProps {
  fornecedores: Array<{
    cnpj: string
    nome: string
    totalGasto: number
  }>
}

export default function FornecedoresPageClient({ fornecedores }: FornecedoresPageClientProps) {
  // Estado local apenas para UI
  const [filtro, setFiltro] = useState('')
  const [ordenacao, setOrdenacao] = useState<'nome' | 'total'>('total')
  
  // Dados vêm de props (já carregados no servidor)
  const fornecedoresFiltrados = useMemo(() => {
    return fornecedores
      .filter(f => f.nome.toLowerCase().includes(filtro.toLowerCase()))
      .sort((a, b) => ordenacao === 'nome' 
        ? a.nome.localeCompare(b.nome)
        : b.totalGasto - a.totalGasto
      )
  }, [fornecedores, filtro, ordenacao])
  
  return (
    <div>
      <input 
        value={filtro} 
        onChange={(e) => setFiltro(e.target.value)} 
        placeholder="Filtrar..."
      />
      <select value={ordenacao} onChange={(e) => setOrdenacao(e.target.value)}>
        <option value="nome">Nome</option>
        <option value="total">Total Gasto</option>
      </select>
      
      {fornecedoresFiltrados.map(f => (
        <Card key={f.cnpj} {...f} />
      ))}
    </div>
  )
}
```

### Fase 4: Limpar Código Antigo

**Remover/Depreciar:**
```
src/services/
├── fornecedores-data.service.ts       ❌ Remover
├── data-access/monitordespesas.ts     ❌ Remover
├── etl-cache.service.ts               ❌ Remover
└── fornecedores-etl.service.ts        ❌ Remover

src/lib/cache/
└── unified-cache-manager.ts           ❌ Remover

src/contexts/
└── GlobalDataContext.tsx              ⚠️ Simplificar (só UI state)
```

---

## 📋 Checklist de Migração

### Server Actions

- [ ] Criar `app/gastos/actions/data-actions.ts`
- [ ] Implementar `getFornecedores()`
- [ ] Implementar `getFornecedorByCnpj(cnpj)`
- [ ] Implementar `getDeputados(ano?)`
- [ ] Implementar `getDeputadoById(id)`
- [ ] Implementar `getAnalisesSuspeitas()`
- [ ] Implementar `getPremiacoesGlobais()`
- [ ] Adicionar cache Next.js (`revalidate`)
- [ ] Adicionar tratamento de erros
- [ ] Adicionar logs para debug

### Páginas a Migrar

#### 🔴 Alta Prioridade
- [ ] `app/gastos/fornecedores/page.tsx`
- [ ] `app/gastos/fornecedor/[cnpj]/page.tsx`
- [ ] `app/gastos/deputados/page.tsx`
- [ ] `app/gastos/perfil/[deputadoId]/page.tsx`

#### 🟡 Média Prioridade
- [ ] `app/gastos/dashboards/page.tsx`
- [ ] `app/gastos/analise-avancada/page.tsx`
- [ ] `app/gastos/premiacoes/page.tsx`

#### 🟢 Baixa Prioridade
- [ ] `app/gastos/relatorios/page.tsx`
- [ ] `app/gastos/comparar/page.tsx`

### Limpeza

- [ ] Remover `fornecedores-data.service.ts`
- [ ] Remover `data-access/monitordespesas.ts`
- [ ] Remover `etl-cache.service.ts`
- [ ] Remover `unified-cache-manager.ts`
- [ ] Simplificar `GlobalDataContext` (só UI)
- [ ] Atualizar testes (mockar Server Actions)

---

## 🔧 Integração com Pipeline Materialize

### Como o ETL funciona

```bash
# 1. Executar ETL (gera dados no banco)
pnpm etl:despesasdeputados:pc

# 2. Executar materialize (gera caches otimizados)
pnpm etl:materialize:unified  # Gera suppliers-cache.json, deputados-cache.json, etc.

# 3. Next.js lê os caches via Server Actions
# getFornecedores() → lê bancoDados/.../suppliers-cache.json
```

### Caches Disponíveis

```
bancoDados/monitordespesas/congressoNacional/cache/
├── suppliers-cache.json           # Fornecedores agregados
├── suppliers-cache.json.gz        # Comprimido
├── deputados-cache.json           # Deputados agregados
├── deputados-cache.json.gz
├── analise-cache.json             # Análises suspeitas
├── premiacoes-cache.json          # Premiações globais
└── manifest.json                  # Metadados dos caches
```

### Server Action Lê Cache

```typescript
// Server Action (roda no servidor Node.js)
export async function getFornecedores() {
  const path = '../../../bancoDados/.../suppliers-cache.json'
  const data = await fs.readFile(path, 'utf-8')
  return JSON.parse(data)
}

// Ou com Next.js cache
export async function getFornecedores() {
  return await fetch('file:///.../suppliers-cache.json')
    .then(r => r.json())
}
```

---

## 🚀 Plano de Execução

### Semana 1: Setup + Alta Prioridade

**Dia 1-2:**
- [ ] Criar estrutura `app/gastos/actions/`
- [ ] Implementar Server Actions base
- [ ] Adicionar testes unitários para Server Actions

**Dia 3-4:**
- [ ] Migrar `app/gastos/fornecedores/`
- [ ] Migrar `app/gastos/fornecedor/[cnpj]/`
- [ ] Testar em desenvolvimento

**Dia 5:**
- [ ] Migrar `app/gastos/deputados/`
- [ ] Migrar `app/gastos/perfil/[deputadoId]/`
- [ ] Code review

### Semana 2: Média Prioridade + Limpeza

**Dia 1-2:**
- [ ] Migrar dashboards
- [ ] Migrar análise avançada
- [ ] Migrar premiações

**Dia 3:**
- [ ] Remover services antigos
- [ ] Simplificar GlobalDataContext
- [ ] Atualizar testes

**Dia 4:**
- [ ] Migrar baixa prioridade (relatórios, comparar)
- [ ] Testes de integração

**Dia 5:**
- [ ] Documentação final
- [ ] Deploy e validação

---

## 🎯 Métricas de Sucesso

### Performance
- [ ] Tempo de First Contentful Paint (FCP) < 1s
- [ ] Tempo de carregamento inicial < 2s
- [ ] Bundle JS reduzido em ~30% (sem IndexedDB libs)

### Arquitetura
- [ ] 100% das páginas usando Server Actions
- [ ] 0 referências a IndexedDB no código cliente
- [ ] 0 hooks de fetch de dados no cliente

### Manutenibilidade
- [ ] Código mais simples (menos 500 linhas)
- [ ] Menos dependências (fake-indexeddb pode ser removido)
- [ ] Pipeline `materialize` como única fonte de dados

---

## 📚 Referências

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js Caching](https://nextjs.org/docs/app/building-your-application/caching)
- [Documentação ETL Materialize](../02-data-pipeline/00-overview/ETL_OVERVIEW.md)

---

**Autor:** GitHub Copilot  
**Última atualização:** 05/11/2025  
**Status:** 📋 Planejamento completo - pronto para execução
