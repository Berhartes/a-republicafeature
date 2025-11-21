# 🚀 Guia Rápido: Migração para React 19 + Next.js 15

**Para desenvolvedores que querem migrar páginas existentes**

---

## 📋 Checklist Rápida

Para cada página que você quer migrar:

- [ ] Criar/usar Server Action em `app/actions/data-actions.ts`
- [ ] Converter `page.tsx` para async Server Component
- [ ] Adicionar `export const revalidate = 3600`
- [ ] Passar dados via props para Client Component
- [ ] Remover `useEffect()` de busca de dados
- [ ] Adicionar `useTransition()` para transições suaves
- [ ] Testar em desenvolvimento
- [ ] Verificar que HTML contém dados (view source)

---

## ⚡ Exemplo Rápido: Antes e Depois

### ❌ ANTES (Antigo)

```tsx
// pages/minha-pagina.tsx
export default function MinhaPage() {
  return <MinhaPageClient />
}

// MinhaPageClient.tsx
'use client'
export function MinhaPageClient() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) return <Loading />
  return <List data={data} />
}
```

### ✅ DEPOIS (Moderno)

```tsx
// app/minha-pagina/page.tsx
import { getData } from '../actions/data-actions'

export default async function MinhaPage() {
  const data = await getData()
  return <MinhaPageClient data={data} />
}

export const revalidate = 3600

// MinhaPageClient.tsx
'use client'
interface Props { data: any[] }

export function MinhaPageClient({ data }: Props) {
  const [isPending, startTransition] = useTransition()
  const [filtro, setFiltro] = useState('')
  
  const handleFiltro = (value: string) => {
    startTransition(() => setFiltro(value))
  }
  
  return <List data={data} onFilter={handleFiltro} />
}
```

---

## 🔧 Snippets Úteis

### 1. Server Action Básica

```typescript
// app/actions/data-actions.ts
'use server'

export async function getMeusDados() {
  const cache = await readFile('bancoDados/.../cache.json')
  return JSON.parse(cache).dados
}
```

### 2. Server Component com Filtros

```tsx
export default async function Page({ 
  searchParams 
}: { 
  searchParams: { filtro?: string } 
}) {
  const dados = await getDados()
  
  // Filtrar no servidor se necessário
  const dadosFiltrados = searchParams.filtro
    ? dados.filter(d => d.categoria === searchParams.filtro)
    : dados
  
  return <PageClient dados={dadosFiltrados} />
}
```

### 3. useTransition para Filtros

```tsx
const [isPending, startTransition] = useTransition()

const handleChange = (value: string) => {
  startTransition(() => {
    setFiltro(value)
    setCurrentPage(1)
  })
}

return (
  <Select onValueChange={handleChange}>
    {isPending && <span>(atualizando...)</span>}
  </Select>
)
```

### 4. Hook Customizado para Server Action

```tsx
import { useServerAction } from '@/hooks/useServerAction'

const { execute, isPending, error } = useServerAction(minhaAction, {
  onSuccess: () => toast.success('Sucesso!'),
  onError: (err) => toast.error(err.message)
})

<button onClick={() => execute(data)} disabled={isPending}>
  {isPending ? 'Salvando...' : 'Salvar'}
</button>
```

### 5. Lazy Load de Gráfico

```tsx
import { LazyChartWrapper, LazyBarChart } from '@/components/examples/LazyChartExamples'

<LazyChartWrapper title="Meu Gráfico" height={300}>
  <LazyBarChart data={dados} />
</LazyChartWrapper>
```

---

## 🎯 Páginas Prioritárias para Migrar

### Alta Prioridade (Páginas Principais)

1. **Fornecedores** (`app/gastos/fornecedores/page.tsx`)
   - Server Action: ✅ `getFornecedores()`
   - Migração: 🔄 Pendente

2. **Perfil Fornecedor** (`app/gastos/fornecedor/[cnpj]/page.tsx`)
   - Server Action: ✅ `getFornecedorByCnpj(cnpj)`
   - Migração: 🔄 Pendente

3. **Deputados** (`app/gastos/deputados/page.tsx`)
   - Server Action: ✅ `getDeputados(ano?)`
   - Migração: ✅ **Completa** (use como referência!)

4. **Perfil Deputado** (`app/gastos/perfil/[deputadoId]/page.tsx`)
   - Server Action: ✅ `getDeputadoById(id)`
   - Migração: 🔄 Pendente

### Média Prioridade

5. **Premiações** (`app/gastos/premiacoes/page.tsx`)
   - Server Action: ✅ `getPremiacoes()`
   - Migração: 🔄 Pendente

6. **Análise Avançada** (`app/gastos/analise-avancada/page.tsx`)
   - Server Action: ✅ `getAnaliseAvancada()`
   - Migração: 🔄 Pendente

### Baixa Prioridade

7. **Dashboard** (`app/gastos/dashboards/page.tsx`)
8. **Relatórios** (`app/gastos/relatorios/page.tsx`)
9. **Comparar** (`app/gastos/comparar/page.tsx`)

---

## 🧪 Como Testar

### 1. Verificar que dados são carregados no servidor

```bash
# Terminal: ver logs do servidor
pnpm dev

# Acessar página no navegador
# Deve ver logs no terminal:
# [Server Action] getMeusDados() chamada
# [Server Action] 123 itens carregados
```

### 2. Verificar SSR (HTML contém dados)

```bash
# No navegador: View Source (Ctrl+U)
# Buscar por conteúdo da página
# Deve encontrar dados no HTML inicial
```

### 3. Verificar useTransition

```tsx
// No componente, adicionar temporariamente:
console.log('isPending:', isPending)

// Mudar filtro e verificar que:
// 1. isPending vira true
// 2. UI não trava
// 3. isPending volta para false
```

---

## ⚠️ Problemas Comuns

### "Cannot use hook in Server Component"

```tsx
// ❌ ERRADO
export default async function Page() {
  const [state, setState] = useState() // Erro!
  return <div />
}

// ✅ CORRETO
export default async function Page() {
  const data = await getData() // OK!
  return <PageClient data={data} /> // Hooks no Client Component
}
```

### "Props are not serializable"

```tsx
// ❌ ERRADO - Funções não podem ser passadas
<ClientComponent onClick={serverFunction} />

// ✅ CORRETO - Criar wrapper
<ClientComponent onClick={() => serverFunction()} />
```

### Dados não atualizam após mudança

```tsx
// Adicionar revalidate na página:
export const revalidate = 3600 // 1 hora

// Ou revalidar manualmente:
// app/api/revalidate/route.ts
export async function GET(request: Request) {
  revalidatePath('/gastos/deputados')
  return Response.json({ revalidated: true })
}
```

---

## 📚 Recursos

- **Exemplo Completo**: `app/gastos/deputados/` (página já migrada)
- **Server Actions**: `app/gastos/actions/data-actions.ts`
- **Hooks**: `hooks/useServerAction.ts`
- **Documentação**: `docs/08-status/MELHORIAS-STACK-REACT19-NEXTJS15.md`

---

## 💡 Dicas

1. **Comece simples**: Migre uma página de lista primeiro
2. **Use Deputados como referência**: É o exemplo mais completo
3. **Teste incrementalmente**: Não migre tudo de uma vez
4. **Mantenha o padrão**: Siga a estrutura estabelecida
5. **Documente mudanças**: Atualize este guia se encontrar novos padrões

---

## 🎯 Meta

**Objetivo**: Migrar todas as páginas principais até fim da semana

**Progresso atual**:
- ✅ 1/4 páginas principais migradas (Deputados)
- 🔄 3/4 páginas pendentes

**Tempo estimado por página**: ~30-60 minutos

---

**Precisa de ajuda?** Consulte o exemplo completo em `app/gastos/deputados/`
