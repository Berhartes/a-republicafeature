# 🔄 Guia de Migração: IndexedDB → Server Actions

**Data:** 05/11/2025  
**Objetivo:** Guia prático para migrar páginas do padrão antigo (IndexedDB no cliente) para o novo padrão (Server Actions)

---

## 📋 Padrão Antigo vs Novo

### ❌ Padrão Antigo (IndexedDB no Cliente)

```tsx
// pages/gastos/fornecedores.tsx (Pages Router)
export default function FornecedoresPage() {
  return <FornecedoresPageClient />
}

// FornecedoresPageClient.tsx
'use client'
export function FornecedoresPageClient() {
  const { fornecedores, loading } = useFornecedores() // ❌ Hook busca IndexedDB
  
  if (loading) return <Loading />
  
  return <div>{fornecedores.map(...)}</div>
}

// hooks/useFornecedores.ts
export function useFornecedores() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // ❌ Busca IndexedDB no cliente
    const cache = await indexedDB.open(...)
    const data = await cache.get('fornecedores')
    setData(data)
    setLoading(false)
  }, [])
  
  return { fornecedores: data, loading }
}
```

**Problemas:**
- ❌ Dados carregados no cliente (lento, bundle grande)
- ❌ Renderização inicial em branco (espera dados)
- ❌ SEO ruim (sem conteúdo no HTML)
- ❌ Cache local complexo de gerenciar
- ❌ Não usa pipeline `materialize`

### ✅ Padrão Novo (Server Actions)

```tsx
// app/gastos/fornecedores/page.tsx (Server Component)
import { getFornecedores } from '../actions/data-actions'
import { FornecedoresPageClient } from './FornecedoresPageClient'

export default async function FornecedoresPage() {
  // ✅ Busca dados no servidor via Server Action
  const fornecedores = await getFornecedores()
  
  // ✅ Passa dados via props para Client Component
  return <FornecedoresPageClient fornecedores={fornecedores} />
}

export const revalidate = 3600 // ISR: revalida a cada 1h

// FornecedoresPageClient.tsx
'use client'
interface Props {
  fornecedores: FornecedorSimples[] // ✅ Dados vêm via props
}

export function FornecedoresPageClient({ fornecedores }: Props) {
  // ✅ Apenas UI state (filtros, ordenação, etc)
  const [filtro, setFiltro] = useState('')
  
  // ✅ Dados já disponíveis imediatamente
  const fornecedoresFiltrados = fornecedores.filter(...)
  
  return <div>{fornecedoresFiltrados.map(...)}</div>
}

// actions/data-actions.ts (Server Action)
'use server'
export async function getFornecedores() {
  // ✅ Lê cache do pipeline materialize
  const cache = await readFile('.../suppliers-cache.json')
  return JSON.parse(cache).fornecedores
}
```

**Benefícios:**
- ✅ Dados carregados no servidor (rápido, SSR)
- ✅ HTML já renderizado com conteúdo
- ✅ SEO excelente (conteúdo no HTML)
- ✅ Usa pipeline `materialize` oficial
- ✅ Cache gerenciado pelo Next.js (ISR)

---

## 🔧 Passo a Passo da Migração

### Passo 1: Criar Server Action (Se Não Existir)

```typescript
// app/gastos/actions/data-actions.ts
'use server'

export async function getFornecedores() {
  const cache = await readMaterializeCache('suppliers-cache')
  return cache.fornecedores
}
```

✅ **Já feito:** `app/gastos/actions/data-actions.ts` criado com:
- `getFornecedores()`
- `getFornecedorByCnpj(cnpj)`
- `getDeputados(ano?)`
- `getDeputadoById(id)`

### Passo 2: Refatorar Server Component (page.tsx)

```diff
// app/gastos/fornecedores/page.tsx

- export default function FornecedoresPage() {
-   return <FornecedoresPageClient />
- }

+ import { getFornecedores } from '../actions/data-actions'
+ 
+ export default async function FornecedoresPage() {
+   const fornecedores = await getFornecedores()
+   return <FornecedoresPageClient fornecedores={fornecedores} />
+ }
+ 
+ export const revalidate = 3600
```

### Passo 3: Refatorar Client Component

```diff
// FornecedoresPageClient.tsx
'use client'

+ interface Props {
+   fornecedores: FornecedorSimples[]
+ }

- export function FornecedoresPageClient() {
-   const { fornecedores, loading } = useFornecedores()
-   
-   if (loading) return <Loading />

+ export function FornecedoresPageClient({ fornecedores }: Props) {
+   // Dados já disponíveis via props
    
    return <div>{fornecedores.map(...)}</div>
  }
```

### Passo 4: Remover Hook Antigo

```diff
// hooks/useFornecedores.ts
- export function useFornecedores() {
-   // ❌ Código antigo de busca IndexedDB
- }
```

---

## 📝 Checklist de Migração por Página

### Fornecedores

- [x] Server Action criada (`getFornecedores`)
- [ ] `page.tsx` refatorada (async + Server Action)
- [ ] `FornecedoresPageClient.tsx` recebe props
- [ ] Hook `useFornecedores` removido ou depreciado
- [ ] Testado em desenvolvimento

### Fornecedor Individual

- [x] Server Action criada (`getFornecedorByCnpj`)
- [ ] `app/gastos/fornecedor/[cnpj]/page.tsx` refatorada
- [ ] `FornecedorPageClient.tsx` recebe props
- [ ] Hook `useFornecedorData` removido ou depreciado
- [ ] Testado em desenvolvimento

### Deputados

- [x] Server Action criada (`getDeputados`)
- [ ] `app/gastos/deputados/page.tsx` refatorada
- [ ] `DeputadosPageClient.tsx` recebe props
- [ ] Hook `useDeputados` removido ou depreciado
- [ ] Testado em desenvolvimento

### Perfil Deputado

- [x] Server Action criada (`getDeputadoById`)
- [ ] `app/gastos/perfil/[deputadoId]/page.tsx` refatorada
- [ ] `PerfilDeputadoPageClient.tsx` recebe props
- [ ] Hook `usePerfilDeputadoData` removido ou depreciado
- [ ] Testado em desenvolvimento

---

## 🎯 Padrões Comuns

### Pattern 1: Lista Simples

```tsx
// Server Component
export default async function ListaPage() {
  const items = await getItems()
  return <ListaPageClient items={items} />
}

// Client Component
'use client'
interface Props { items: Item[] }
export function ListaPageClient({ items }: Props) {
  const [filtro, setFiltro] = useState('')
  const itemsFiltrados = items.filter(i => i.nome.includes(filtro))
  return <div>...</div>
}
```

### Pattern 2: Detalhe com Parâmetro

```tsx
// Server Component
export default async function DetalhePage({ params }: { params: { id: string } }) {
  const item = await getItemById(params.id)
  
  if (!item) {
    notFound() // Next.js 404
  }
  
  return <DetalhePageClient item={item} />
}

// Client Component
'use client'
interface Props { item: Item }
export function DetalhePageClient({ item }: Props) {
  return <div>...</div>
}
```

### Pattern 3: Com Filtros de Query

```tsx
// Server Component
export default async function ListaComFiltrosPage({
  searchParams
}: {
  searchParams: { ano?: string }
}) {
  const items = await getItems(searchParams.ano)
  return <ListaPageClient items={items} anoSelecionado={searchParams.ano} />
}

// Client Component
'use client'
interface Props {
  items: Item[]
  anoSelecionado?: string
}
export function ListaPageClient({ items, anoSelecionado }: Props) {
  // Filtros adicionais no cliente (UI)
  return <div>...</div>
}
```

---

## 🧪 Como Testar

### 1. Verificar que dados são carregados

```bash
# Terminal 1: Ver logs do servidor
pnpm dev

# Terminal 2: Acessar página
curl http://localhost:3000/gastos/fornecedores

# Deve ver logs:
# [Server Action] getFornecedores() chamada
# [Server Action] 1234 fornecedores carregados
```

### 2. Verificar SSR (HTML contém dados)

```bash
curl http://localhost:3000/gastos/fornecedores | grep "fornecedor"
# Deve encontrar nomes de fornecedores no HTML
```

### 3. Verificar que Client Component recebe props

```tsx
// Adicionar console.log temporário
export function FornecedoresPageClient({ fornecedores }: Props) {
  console.log('Props recebidas:', fornecedores.length)
  // Deve logar quantidade de fornecedores
}
```

### 4. Verificar cache Next.js

```bash
# Build produção
pnpm build

# Deve ver:
# ○ /gastos/fornecedores (ISR: 3600s)
```

---

## ⚠️ Problemas Comuns

### Erro: "Cannot read from filesystem in Client Component"

```tsx
// ❌ ERRADO
'use client'
export function MyComponent() {
  const data = await readFile(...) // Erro!
}

// ✅ CORRETO
// page.tsx (Server Component)
export default async function Page() {
  const data = await readFile(...)
  return <MyComponent data={data} />
}
```

### Erro: "Functions cannot be passed to Client Component"

```tsx
// ❌ ERRADO
<ClientComponent onSave={serverAction} />

// ✅ CORRETO
// Criar wrapper no Client Component
<ClientComponent onSave={() => serverAction()} />
```

### Dados não atualizam após ETL

```bash
# Revalidar cache Next.js manualmente
curl http://localhost:3000/api/revalidate?path=/gastos/fornecedores

# Ou reiniciar dev server
pnpm dev
```

---

## 📚 Referências

- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Server Components](https://react.dev/reference/rsc/server-components)
- [Next.js ISR (Incremental Static Regeneration)](https://nextjs.org/docs/app/building-your-application/caching)
- [Plano de Server Actions](./07-server-actions-plan.md)
- [Estado da Stack Rígida](../../08-status/ESTADO-STACK-RIGIDA.md)

---

**Status:** 📋 Guia completo - pronto para uso  
**Próximo passo:** Começar migração das páginas seguindo este guia
