# 🤖 Manual do Agente IA - A República

> **Bem-vindo, Agente IA!** Este documento foi criado especificamente para você entender rapidamente o projeto e começar a contribuir de forma efetiva.

---

## 🎯 O Que É Este Projeto?

**A República** é um sistema de transparência que:
1. **Extrai** dados de gastos parlamentares da API da Câmara dos Deputados
2. **Processa** milhões de transações usando Python
3. **Materializa** em caches otimizados
4. **Visualiza** em um frontend React moderno

**Objetivo:** Tornar gastos públicos acessíveis e compreensíveis para qualquer cidadão.

---

## 📊 Arquitetura em 30 Segundos

```
API Câmara → ETL Python → Datalake → Materialização → Cache JSON → Server Actions → Server Components → Client UI → Usuário
```

**Fluxo de Dados:**
1. Python busca dados da API oficial
2. Valida e normaliza com Pydantic
3. Salva em `bancoDados/monitordespesas/`
4. Scripts materializam em caches otimizados em `public/cache`
5. Server Actions (`app/gastos/actions/data-actions.ts`) leem os caches usando `React.cache()`
6. Server Components montam a página e passam props para Client Components
7. Usuário navega com dados pré-carregados e cacheados via ISR

---

## 🗂️ Estrutura do Projeto

```
a-republica/
├── packages/
│   ├── etlpython/              # Pipeline ETL (Python)
│   │   ├── src/etlpython/
│   │   │   ├── cli/            # Scripts executáveis
│   │   │   ├── extract/        # Busca dados da API
│   │   │   ├── transform/      # Normalização
│   │   │   ├── load/           # Persistência
│   │   │   └── models.py       # Validação Pydantic
│   │   └── package.json
│   │
│   └── monitor-despesas-next/  # Frontend (React/Next.js 16 - App Router)
│       ├── src/
│       │   ├── app/gastos/actions/  # Server Actions (acesso aos caches)
│       │   ├── app/gastos/**/page.tsx  # Server Components
│       │   ├── app/gastos/**/*Client.tsx  # Client Components (UI)
│       │   ├── hooks/          # Hooks de UI (sem fetch)
│       │   ├── contexts/       # Estado leve (UIState)
│       │   └── components/     # UI components reutilizáveis
│       └── public/cache/       # Caches estáticos materializados
│
├── bancoDados/                 # Datalake (gerado)
│   └── monitordespesas/
│
└── docs/                       # Documentação
    ├── 01-architecture/ARQUITETURA.md
    └── 01-architecture/GUIA_COMPLETO_CACHES.md
```

---

## 🚀 Quick Start para Agentes IA

### Passo 1: Entender o Contexto

**Leia PRIMEIRO (ordem de prioridade):**

1. `README.md` - Visão geral e quick start
2. `docs/01-architecture/ARQUITETURA.md` - Arquitetura detalhada
3. `.ai-guidelines.md` - Padrões de código
4. Este arquivo - Manual do agente

### Passo 2: Identificar Sua Tarefa

**Tipos de tarefas comuns:**

| Tarefa | Onde Trabalhar | Arquivos Chave |
|--------|----------------|----------------|
| Adicionar feature no ETL | `packages/etlpython/` | `cli/*.py`, `models.py` |
| Criar nova página | `packages/monitor-despesas-next/src/app/gastos/**` | `page.tsx` / `*Client.tsx` |
| Ajustar fluxo de dados | `packages/monitor-despesas-next/src/app/gastos/actions/` | `data-actions.ts` |
| Adicionar hook | `packages/monitor-despesas-next/src/hooks/` | `use*.ts` |
| Corrigir bug | Depende do erro | Veja stack trace |

### Passo 3: Verificar Dependências

**Python (ETL):**
- Pydantic para validação
- Requests para HTTP
- JSON para persistência

**TypeScript (Frontend):**
- React 19
- Next.js
- Tailwind CSS v4
- shadcn/ui

### Passo 4: Executar Localmente

```bash
# Frontend
cd packages/monitor-despesas-next
pnpm dev

# ETL (se necessário)
cd packages/etlpython
pnpm run etl:despesasdeputados:pc 57 10
```

---

## 🧠 Conceitos-Chave que Você DEVE Entender

### 1. Server Actions + React cache (⭐ CRÍTICO)

**O Que É:**
Camada de acesso aos caches JSON materializados, implementada em `app/gastos/actions/data-actions.ts` e memoizada com `React.cache()`.

**Por Que Existe:**
Permite deduplicar leituras, tipar dados no servidor e entregar HTML pré-carregado ao usuário via Server Components + ISR.

**Como Funciona:**
```typescript
// data-actions.ts
const readMaterializeCache = cache(async <T>(cacheName: string): Promise<T> => {
  const baseDir = join(process.cwd(), '..', '..', 'bancoDados', 'monitordespesas', 'camaraDeputados')
  const data = await readFile(join(baseDir, `${cacheName}.json`), 'utf-8')
  return JSON.parse(data)
})

export async function getDeputados(options) {
  const cache = await readMaterializeCache<DeputadosCache>('deputados')
  // ... filtragem/ordenação/paginação aqui
  return { deputados, total }
}
```

**Onde Está:**
- Server Actions: `src/app/gastos/actions/data-actions.ts`
- Server Components: `src/app/gastos/**/page.tsx`
- Client Components: `src/app/gastos/**/*Client.tsx`

**Quando Usar:**
- ✅ Sempre que precisar acessar dados materializados
- ❌ Nunca faça `fetch()` direto para caches a partir do cliente

### 2. Separação por Ano

**O Que É:**
Todos os dados são agregados por ano (`gastosPorAno`, `totalRecebidoPorAno`).

**Por Que Existe:**
Usuários filtram por ano frequentemente. Dados separados = filtros instantâneos.

**Estrutura:**
```json
{
  "id": 204379,
  "totalGastos": 1555127.55,
  "gastosPorAno": {
    "2023": 500000,
    "2024": 600000,
    "2025": 155127.55
  }
}
```

**Como Usar:**
```typescript
// Filtrar por ano
const gastos2024 = deputado.gastosPorAno['2024']

// Anos disponíveis
const anos = deputado.anosDisponiveis // [2023, 2024, 2025]
```

### 3. Paginação de Transações

**O Que É:**
Transações são paginadas em arquivos de 100 itens cada.

**Por Que Existe:**
Um deputado pode ter 1000+ transações. Carregar tudo de uma vez trava o navegador.

**Estrutura:**
```
public/cache/transactions/
├── deputy-204379-transactions-index.json      # Índice
├── deputy-204379-transactions-2024-page1.json # Página 1 de 2024
└── deputy-204379-transactions-2024-page2.json # Página 2 de 2024
```

**Como Usar:**
```typescript
const {
  transactions,    // Transações da página atual
  currentPage,     // Página atual
  totalPages,      // Total de páginas
  goToPage,        // Navegar
  nextPage,        // Próxima
  prevPage         // Anterior
} = useTransactionsPaginated({
  entityId: '204379',
  entityType: 'deputy',
  year: 2024
})
```

### 4. Materialização

**O Que É:**
Scripts Python que transformam dados brutos em caches otimizados.

**Scripts Principais:**
```bash
# Caches principais (suppliers, deputies, categories)
python -m etlpython.cli.materialize_unified_v2

# Transações paginadas
python -m etlpython.cli.materialize_paginated

# Todos de uma vez
pnpm run etl:materialize:all
```

**Input:** `bancoDados/monitordespesas/`
**Output:** `public/cache/*.json`

---

## 📋 Checklist para Cada Tarefa

### Antes de Começar

- [ ] Li a issue/task description completamente
- [ ] Entendi o problema e a solução esperada
- [ ] Identifiquei os arquivos que preciso modificar
- [ ] Verifiquei se há código similar que posso reutilizar

### Durante o Desenvolvimento

- [ ] Segui os padrões em `.ai-guidelines.md`
- [ ] Usei tipos TypeScript explícitos (sem `any`)
- [ ] Funções têm < 50 linhas
- [ ] Componentes têm < 200 linhas
- [ ] Adicionei comentários explicando "porquê", não "o quê"
- [ ] Reutilizei código existente quando possível

### Antes de Submeter

- [ ] Código compila sem erros (`pnpm type-check`)
- [ ] Lint passa (`pnpm lint`)
- [ ] Testes passam (`pnpm test`)
- [ ] Testei manualmente a funcionalidade
- [ ] Atualizei documentação se necessário

---

## 🎨 Padrões de Código (Resumo)

### TypeScript

```typescript
// ✅ BOM
interface User {
  id: number
  name: string
}

async function getUser(id: number): Promise<User | null> {
  const data = await globalCacheService.getDeputies()
  return data?.find(u => u.id === id) ?? null
}

// ❌ RUIM
function getUser(id: any): Promise<any> {
  // ...
}
```

### React

```typescript
// ✅ BOM
interface ButtonProps {
  label: string
  onClick: () => void
}

export function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>
}

// ❌ RUIM
export function Button(props: any) {
  return <button onClick={props.onClick}>{props.label}</button>
}
```

### Python

```python
# ✅ BOM
def process_data(items: List[Dict]) -> ProcessedData:
    """Process raw data items."""
    validated = [validate_item(item) for item in items]
    return ProcessedData(items=validated)

# ❌ RUIM
def process_data(items):
    # ...
```

---

## 🔍 Como Debugar Problemas

### Problema: Dados não aparecem no frontend

**Checklist:**
1. Cache foi gerado? → Verifique `public/cache/`
2. Server Action foi executada? → Observe logs `[Server Action]` no terminal
3. Server Component está passando props? → Verifique `page.tsx`
4. Client Component consome as props certas? → Veja destruturação/renderização

**Debug:**
```typescript
// Logue dados dentro da Server Action
console.log('[Server Action] getDeputados opções', options)

// Confirme no Server Component
console.log('Deputados carregados', deputadosPaginados.length)

// Inspecione props no Client Component (React DevTools)
```

### Problema: Filtro por ano não funciona

**Checklist:**
1. Dados têm campo `*PorAno`? → Verifique JSON
2. Materialização rodou? → Verifique timestamp dos arquivos
3. Componente usa campo correto? → Verifique código

**Exemplo de Fix:**
```typescript
// ❌ RUIM: Usa campo errado
const total = fornecedor.total_recebido

// ✅ BOM: Usa campo por ano
const total = fornecedor.totalRecebidoPorAno?.[anoSelecionado] || 0
```

### Problema: Performance ruim

**Checklist:**
1. Server Action está filtrando/paginando no servidor? → Evite mover lógica para o cliente
2. Está paginando transações? → Use `useTransactionsPaginated`
3. Está renderizando muitos itens? → Use virtualização
4. Está fazendo cálculos pesados? → Use `useMemo`

---

## 📚 Recursos Importantes

### Documentação Essencial

| Documento | Quando Ler |
|-----------|------------|
| `README.md` | Sempre primeiro |
| `docs/01-architecture/ARQUITETURA.md` | Entender sistema |
| `docs/01-architecture/GUIA_COMPLETO_CACHES.md` | Trabalhar com caches |
| `.ai-guidelines.md` | Antes de codificar |
| `CONTRIBUTING.md` | Antes de PR |

### Arquivos-Chave

| Arquivo | Propósito |
|---------|-----------|
| `src/app/gastos/actions/data-actions.ts` | Server Actions + acesso aos caches |
| `src/app/gastos/deputados/page.tsx` | Server Component (lista de deputados) |
| `src/app/gastos/deputados/DeputadosPageClient.tsx` | Client Component (filtros/UI) |
| `src/hooks/useOptimizedFilters.ts` | Otimizações de filtragem no cliente |
| `packages/etlpython/src/etlpython/cli/materialize_unified_v2.py` | Materialização dos caches |

### Comandos Úteis

```bash
# Frontend
pnpm dev              # Desenvolvimento
pnpm build            # Build produção
pnpm lint             # Linting
pnpm type-check       # Type checking
pnpm test             # Testes

# ETL
pnpm run etl:despesasdeputados:pc 57 10  # Extrair 10 deputados
pnpm run etl:materialize:all             # Gerar todos os caches

# Git
git checkout -b feature/minha-feature    # Nova branch
git commit -m "feat: minha feature"      # Commit semântico
```

---

## 🚨 Erros Comuns e Como Evitar

### 1. Usar `any` em TypeScript

```typescript
// ❌ RUIM
function process(data: any): any {
  return data.map((item: any) => item.value)
}

// ✅ BOM
function process(data: Item[]): number[] {
  return data.map(item => item.value)
}
```

### 2. Fazer fetch direto de caches

```typescript
// ❌ RUIM
const response = await fetch('/cache/suppliers-cache.json')
const data = await response.json()

// ✅ BOM
const { data } = useSuppliers()
```

### 3. Não usar separação por ano

```typescript
// ❌ RUIM: Ignora filtro de ano
const total = fornecedor.total_recebido

// ✅ BOM: Usa dados do ano selecionado
const total = anoSelecionado === 'todos'
  ? fornecedor.total_recebido
  : fornecedor.totalRecebidoPorAno?.[anoSelecionado] || 0
```

### 4. Componentes gigantes

```typescript
// ❌ RUIM: Componente de 500 linhas
export function GiantComponent() {
  // 500 linhas...
}

// ✅ BOM: Componentes pequenos
export function ParentComponent() {
  return (
    <>
      <Header />
      <Content />
      <Footer />
    </>
  )
}
```

### 5. Não documentar código complexo

```typescript
// ❌ RUIM: Sem contexto
if (this.loading[key] && this.promises.has(key)) {
  return this.promises.get(key)
}

// ✅ BOM: Com contexto
// Deduplica requisições simultâneas retornando a mesma promise
// Evita múltiplos fetches do mesmo recurso
if (this.loading[key] && this.promises.has(key)) {
  return this.promises.get(key)
}
```

---

## 🎯 Exemplos de Tarefas Comuns

### Tarefa 1: Adicionar Nova Página

```typescript
// 1. Criar componente
// packages/monitor-despesas-next/src/client/pages/MinhaPage.tsx

import { useGlobalCache } from '@/hooks/useGlobalCache'

export function MinhaPage() {
  const { getSuppliers, isLoadingSuppliers } = useGlobalCache()
  const [data, setData] = useState(null)
  
  useEffect(() => {
    getSuppliers().then(setData)
  }, [getSuppliers])
  
  if (isLoadingSuppliers) return <Loading />
  
  return <div>{/* UI */}</div>
}

// 2. Adicionar rota (se necessário)
// 3. Testar
```

### Tarefa 2: Adicionar Campo ao Cache

```python
# 1. Atualizar modelo Pydantic
# packages/etlpython/src/etlpython/models.py

class DeputadoResumo(BaseModel):
    id: int
    nome: str
    novo_campo: Optional[str] = None  # ← Adicionar aqui

# 2. Atualizar materialização
# packages/etlpython/src/etlpython/cli/materialize_unified_v2.py

enhanced_deputy = {
    **deputy,
    'novo_campo': calcular_novo_campo(deputy)  # ← Adicionar aqui
}

# 3. Atualizar tipos TypeScript
# packages/monitor-despesas-next/src/types/...

interface Deputy {
  id: number
  nome: string
  novoCampo?: string  // ← Adicionar aqui
}

# 4. Regenerar caches
pnpm run etl:materialize:all
```

### Tarefa 3: Otimizar Performance

```typescript
// 1. Identificar gargalo (use React DevTools Profiler)

// 2. Aplicar otimização apropriada

// Opção A: Memoização
const expensiveCalculation = useMemo(() => {
  return data.reduce((sum, item) => sum + item.value, 0)
}, [data])

// Opção B: Callback
const handleClick = useCallback(() => {
  doSomething()
}, [dependencies])

// Opção C: Componente memo
export const MyComponent = memo(function MyComponent(props) {
  // ...
})

// 3. Medir novamente e comparar
```

---

## 🤝 Trabalhando com Outros Agentes

### Convenções de Comunicação

**Em commits:**
```bash
feat: add supplier details page
# Corpo do commit (se necessário):
# - Added new page at /fornecedores/:id
# - Integra dados via Server Actions
# - Added tests for data loading
```

**Em comentários de código:**
```typescript
// TODO: Optimize this query for large datasets
// Context: Currently loads all items in memory
// Suggested: Implement virtual scrolling
// Priority: Medium
// Estimated: 3 hours
```

**Em PRs:**
- Descreva o problema claramente
- Explique a solução escolhida
- Liste alternativas consideradas
- Adicione screenshots se UI mudou

---

## ✅ Checklist Final

Antes de considerar sua tarefa completa:

- [ ] Código funciona localmente
- [ ] Segue padrões do projeto
- [ ] Tipos TypeScript corretos
- [ ] Sem `any` ou `@ts-ignore`
- [ ] Documentação atualizada
- [ ] Testes passam
- [ ] Lint passa
- [ ] Commit é semântico
- [ ] PR tem descrição clara

---

## 🆘 Precisa de Ajuda?

1. **Consulte a documentação** em `docs/`
2. **Procure código similar** no projeto
3. **Verifique issues** existentes
4. **Abra uma issue** com tag `question`

---

## 🎓 Resumo para Agentes IA

**Você é um agente IA trabalhando em A República. Lembre-se:**

1. ✅ **Use Server Actions + React cache** para todos os dados materializados
2. ✅ **Use separação por ano** (`*PorAno` fields)
3. ✅ **Use paginação** para transações
4. ✅ **Tipos explícitos** sempre (sem `any`)
5. ✅ **Funções pequenas** (< 50 linhas)
6. ✅ **Componentes pequenos** (< 200 linhas)
7. ✅ **Documente** código complexo
8. ✅ **Reutilize** código existente
9. ✅ **Teste** antes de submeter
10. ✅ **Commits semânticos** sempre

**Boa sorte e bom código! 🚀**

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0
**Mantenedores:** A República Team
