# 📚 Guia Completo: Sistema de Caches

## 🎯 Visão Geral

O sistema de caches foi completamente refatorado para:
1. ✅ **Eliminar requisições duplicadas**
2. ✅ **Adicionar separação por ano**
3. ✅ **Melhorar performance**
4. ✅ **Simplificar código**

---

## 📦 Estrutura de Caches

### Caches Principais

```
public/cache/
├── caches-manifest.json          # Índice de todos os caches
├── suppliers-cache.json          # Fornecedores (com anos)
├── suppliers-cache.json.gz       # Versão comprimida
├── deputies-cache.json           # Deputados (com anos)
├── deputies-cache.json.gz        # Versão comprimida
├── categories-cache.json         # Categorias (NOVO)
├── categories-cache.json.gz      # Versão comprimida
├── rankings-cache.json           # Rankings
├── premiacoes-cache.json         # Premiações
├── analysis-cache.json           # Análises
├── dashboard-cache.json          # Dashboard
└── transactions/                 # Transações paginadas
    ├── transactions-manifest.json
    ├── deputy-{id}-transactions-index.json
    ├── deputy-{id}-transactions-{ano}-page{n}.json
    ├── supplier-{id}-transactions-index.json
    └── supplier-{id}-transactions-{ano}-page{n}.json
```

---

## 🔧 Geração de Caches

### Comando Completo (Recomendado)

```bash
# Gera TODOS os caches otimizados
cd packages/etlpython
pnpm run etl:materialize:all

# Ou com Python direto
python -m etlpython.cli.materialize_unified_v2
python -m etlpython.cli.materialize_paginated
```

### Comandos Individuais

```bash
# 1. Caches principais (suppliers, deputies, categories)
pnpm run etl:materialize:unified:v2

# 2. Transações paginadas
pnpm run etl:materialize:paginated

# 3. Versão antiga (sem separação por ano)
pnpm run etl:materialize:unified
```

## 🚀 Publicação e Validação dos caches

1. **Validação (dry-run)**
   ```bash
   pnpm --filter @a-republica/monitor-despesas-next cache:publish:dry-run -- --skip-hash-check
   ```
   - Verifica `caches-manifest.json` e `transactions/transactions-manifest.json` (existência, hashes opcionais, arquivos `.gz`).
   - Use `--skip-transactions` para acelerar auditorias pontuais e `--skip-hash-check` quando o manifest ainda não foi atualizado.

2. **Regeneração dos manifests (quando houver novos caches)**
   ```bash
   pnpm --filter @a-republica/monitor-despesas-next cache:manifests:refresh
   ```
   - Recalcula hashes e tamanhos diretamente dos arquivos `.json` e atualiza `transactions-manifest.json` (8139 entradas).
   - Aceita `--skip-transactions` para cenários onde apenas os caches principais mudaram.

3. **Publicação**
   ```bash
   pnpm --filter @a-republica/monitor-despesas-next cache:publish -- --target ../a-republica-brasileira/a-republica-brasileira-caches/latest --force
   ```
   - Copia todo `public/cache` já validado para o destino informado.
   - `--force` limpa o diretório antes do copy; sem ele, a publicação falha se o destino não estiver vazio.

4. **Arquivos gerados**
   - `packages/monitor-despesas-next/scripts/publish_cache.ts`: script TypeScript com validação e cópia.
   - `scripts/tsconfig.publish.json`: compila o script para `scripts/dist/publish_cache.js` sempre que o comando roda.

> Dica: mantenha `transactions-manifest.json` atualizado para evitar custos ao recalcular 8k+ hashes.

---

## 📊 Estrutura de Dados

### 1. Suppliers Cache (suppliers-cache.json)

```json
{
  "fornecedores": [
    {
      "id": "TAM",
      "nome": "TAM",
      "documento": null,
      "tipo_despesa_principal": "PASSAGEM AÉREA - SIGEPA",
      
      // ✅ NOVO: Agregações por ano
      "totalRecebidoPorAno": {
        "2023": 1036004.15,
        "2024": 1164175.55,
        "2025": 526681.98
      },
      "transacoesPorAno": {
        "2023": 939,
        "2024": 1071,
        "2025": 489
      },
      "deputadosPorAno": {
        "2023": 22,
        "2024": 22,
        "2025": 14
      },
      "anosDisponiveis": [2023, 2024, 2025],
      
      // Dados originais mantidos
      "total_recebido": 2726861.68,
      "numero_transacoes": 2499,
      "numero_legisladores": 22,
      "categorias": [...],
      "anos": [...]
    }
  ],
  "metadata": {
    "totalFornecedores": 2422,
    "anosDisponiveis": [2022, 2023, 2024, 2025],
    "generatedAt": "2025-01-XX..."
  }
}
```

### 2. Deputies Cache (deputies-cache.json)

```json
{
  "deputados": [
    {
      "id": 204379,
      "nome": "Acácio Favacho",
      "nomeEleitoral": "Acácio Favacho",
      "siglaPartido": "MDB",
      "siglaUf": "AP",
      "urlFoto": "https://...",
      "totalGastos": 1555127.55,
      "totalTransacoes": 951,
      
      // ✅ NOVO: Agregações por ano
      "gastosPorAno": {
        "2022": 300000.00,
        "2023": 500000.00,
        "2024": 600000.00,
        "2025": 155127.55
      },
      "transacoesPorAno": {
        "2022": 200,
        "2023": 312,
        "2024": 428,
        "2025": 211
      },
      "categoriasPorAno": {
        "2024": {
          "PASSAGEM AÉREA": 300000.00,
          "TELEFONIA": 50000.00,
          "COMBUSTÍVEIS": 100000.00
        }
      },
      "fornecedoresPorAno": {
        "2024": 45
      },
      "anosDisponiveis": [2022, 2023, 2024, 2025],
      
      "scoreSuspeicao": 45.2,
      "alertas": [...]
    }
  ],
  "metadata": {
    "totalDeputados": 23,
    "anosDisponiveis": [2022, 2023, 2024, 2025],
    "generatedAt": "2025-01-XX..."
  }
}
```

### 3. Categories Cache (categories-cache.json) - NOVO

```json
{
  "categorias": {
    "PASSAGEM AÉREA - SIGEPA": {
      "totalGeral": 5000000.00,
      "porAno": {
        "2023": {
          "total": 2000000.00,
          "transacoes": 5000,
          "fornecedores": 50,
          "deputados": 400
        },
        "2024": {
          "total": 2500000.00,
          "transacoes": 6000,
          "fornecedores": 55,
          "deputados": 420
        }
      }
    },
    "TELEFONIA": {
      "totalGeral": 800000.00,
      "porAno": {
        "2023": { ... },
        "2024": { ... }
      }
    }
  },
  "metadata": {
    "totalCategorias": 45,
    "generatedAt": "2025-01-XX..."
  }
}
```

### 4. Transactions Index (deputy-{id}-transactions-index.json)

```json
{
  "deputyId": "204379",
  "totalTransactions": 951,
  "availableYears": [2022, 2023, 2024, 2025],
  "yearSummary": {
    "2023": {
      "count": 312,
      "pages": 4
    },
    "2024": {
      "count": 428,
      "pages": 5
    }
  },
  "allYears": {
    "count": 951,
    "pages": 10
  }
}
```

---

## 💻 Uso no Frontend

### Setup Inicial (App Root)

```tsx
// App.tsx ou _app.tsx
import { GlobalCacheProvider } from '@/components/GlobalCacheProvider'
import { GlobalCacheContext } from '@/contexts/GlobalCacheContext'

function App() {
  return (
    <GlobalCacheProvider preload="essential">
      <GlobalCacheContext>
        {/* Resto da aplicação */}
      </GlobalCacheContext>
    </GlobalCacheProvider>
  )
}
```

### Exemplo 1: Lista de Fornecedores com Filtro por Ano

```tsx
import { useSuppliers } from '@/hooks/useGlobalCache'
import { useState, useMemo } from 'react'

function FornecedoresPage() {
  const { data, loading, error } = useSuppliers()
  const [anoSelecionado, setAnoSelecionado] = useState<number | 'todos'>('todos')

  const fornecedoresFiltrados = useMemo(() => {
    if (!data?.data) return []
    
    if (anoSelecionado === 'todos') {
      return data.data
    }

    // Filtrar por ano usando os novos campos
    return data.data.filter(f => 
      f.anosDisponiveis?.includes(anoSelecionado)
    ).map(f => ({
      ...f,
      // Usar dados específicos do ano
      totalRecebido: f.totalRecebidoPorAno?.[anoSelecionado] || 0,
      numeroTransacoes: f.transacoesPorAno?.[anoSelecionado] || 0,
      numeroDeputados: f.deputadosPorAno?.[anoSelecionado] || 0
    }))
  }, [data, anoSelecionado])

  const anosDisponiveis = data?.metadata?.anosDisponiveis || []

  return (
    <div>
      {/* Filtro de ano */}
      <select value={anoSelecionado} onChange={e => setAnoSelecionado(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}>
        <option value="todos">Todos os anos</option>
        {anosDisponiveis.map(ano => (
          <option key={ano} value={ano}>{ano}</option>
        ))}
      </select>

      {/* Lista */}
      {fornecedoresFiltrados.map(fornecedor => (
        <FornecedorCard key={fornecedor.id} {...fornecedor} />
      ))}
    </div>
  )
}
```

### Exemplo 2: Comparar Deputados com Evolução Temporal

```tsx
import { useDeputies } from '@/hooks/useGlobalCache'

function CompararDeputados() {
  const { data } = useDeputies()
  const [deputadosSelecionados, setDeputadosSelecionados] = useState([])

  const dadosEvolucao = useMemo(() => {
    if (!deputadosSelecionados.length) return []

    const anos = data?.metadata?.anosDisponiveis || []
    
    return anos.map(ano => {
      const dataPoint: any = { ano }
      
      deputadosSelecionados.forEach((dep, idx) => {
        // Usar gastosPorAno para evolução temporal
        dataPoint[`deputado${idx}`] = dep.gastosPorAno?.[ano] || 0
      })
      
      return dataPoint
    })
  }, [deputadosSelecionados, data])

  return (
    <div>
      {/* Seleção de deputados */}
      <DeputadoSearch onSelect={setDeputadosSelecionados} />

      {/* Gráfico de evolução */}
      <LineChart data={dadosEvolucao}>
        <XAxis dataKey="ano" />
        <YAxis />
        {deputadosSelecionados.map((_, idx) => (
          <Line key={idx} dataKey={`deputado${idx}`} />
        ))}
      </LineChart>
    </div>
  )
}
```

### Exemplo 3: Página de Categoria

```tsx
import { useGlobalCache } from '@/hooks/useGlobalCache'

function CategoriaPage({ categoriaSlug }: { categoriaSlug: string }) {
  const { getCategories, getSuppliers } = useGlobalCache()
  const [categoriaData, setCategoriaData] = useState(null)
  const [anoSelecionado, setAnoSelecionado] = useState('todos')

  useEffect(() => {
    async function load() {
      const categories = await getCategories()
      const categoriaNome = slugToName(categoriaSlug)
      
      if (categories?.data?.categorias?.[categoriaNome]) {
        setCategoriaData(categories.data.categorias[categoriaNome])
      }
    }
    load()
  }, [categoriaSlug, getCategories])

  const dadosAno = anoSelecionado === 'todos' 
    ? categoriaData 
    : categoriaData?.porAno?.[anoSelecionado]

  return (
    <div>
      <h1>{slugToName(categoriaSlug)}</h1>
      
      {/* Filtro de ano */}
      <select value={anoSelecionado} onChange={e => setAnoSelecionado(e.target.value)}>
        <option value="todos">Todos os anos</option>
        {Object.keys(categoriaData?.porAno || {}).map(ano => (
          <option key={ano} value={ano}>{ano}</option>
        ))}
      </select>

      {/* Estatísticas */}
      <div>
        <div>Total: R$ {dadosAno?.total?.toLocaleString('pt-BR')}</div>
        <div>Transações: {dadosAno?.transacoes}</div>
        <div>Fornecedores: {dadosAno?.fornecedores}</div>
        <div>Deputados: {dadosAno?.deputados}</div>
      </div>
    </div>
  )
}
```

### Exemplo 4: Transações Paginadas

```tsx
import { TransactionsPaginatedTable } from '@/components/TransactionsPaginatedTable'

function PerfilDeputado({ deputadoId }: { deputadoId: string }) {
  return (
    <div>
      <h1>Perfil do Deputado</h1>
      
      {/* Transações com paginação e filtro por ano */}
      <TransactionsPaginatedTable
        entityId={deputadoId}
        entityType="deputy"
        title="Todas as Transações"
      />
    </div>
  )
}
```

---

## 🔄 Fluxo de Dados Completo

```
┌─────────────────────────────────────────────────────────────┐
│  1. GERAÇÃO (Python ETL)                                     │
│     materialize_unified_v2.py                                │
│     ├─ Lê dados brutos do datalake                          │
│     ├─ Agrega por ano                                       │
│     ├─ Gera suppliers-cache.json                            │
│     ├─ Gera deputies-cache.json                             │
│     └─ Gera categories-cache.json                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. CACHE GLOBAL (Singleton Service)                        │
│     GlobalCacheService                                       │
│     ├─ Carrega caches uma vez                               │
│     ├─ Deduplica requisições                                │
│     ├─ Mantém em memória                                    │
│     └─ Notifica mudanças                                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. HOOKS REACT                                              │
│     useGlobalCache, useSuppliers, useDeputies               │
│     ├─ Acesso fácil aos dados                               │
│     ├─ Loading states automáticos                           │
│     └─ Reatividade automática                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. COMPONENTES                                              │
│     FornecedoresPage, Dashboard, PerfilDeputado, etc.       │
│     ├─ Filtram por ano                                      │
│     ├─ Renderizam dados                                     │
│     └─ Sem requisições duplicadas                           │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Migração

### Para cada página que usa caches:

- [ ] Remover imports de `fetchManifest`, `fetchSuppliersCache`, etc.
- [ ] Adicionar `import { useGlobalCache } from '@/hooks/useGlobalCache'`
- [ ] Substituir chamadas diretas por hooks
- [ ] Usar campos `*PorAno` para filtros temporais
- [ ] Testar filtros por ano
- [ ] Verificar performance (deve ser mais rápida)

### Exemplo de migração:

```typescript
// ❌ ANTES
import { fetchManifest, fetchSuppliersCache } from '@/data-access/monitordespesas'

function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    async function load() {
      const manifest = await fetchManifest()
      const suppliers = await fetchSuppliersCache(manifest)
      setData(suppliers)
    }
    load()
  }, [])
  
  return <div>{/* usar data */}</div>
}

// ✅ DEPOIS
import { useSuppliers } from '@/hooks/useGlobalCache'

function MyComponent() {
  const { data, loading, error } = useSuppliers()
  
  if (loading) return <Loading />
  if (error) return <Error />
  
  return <div>{/* usar data */}</div>
}
```

---

## 🎯 Próximos Passos

1. ✅ Sistema de cache global implementado
2. ✅ Script de materialização com anos implementado
3. ⏳ Migrar todas as páginas para usar cache global
4. ⏳ Gerar caches com dados reais
5. ⏳ Testar filtros por ano em produção
6. ⏳ Adicionar testes automatizados
7. ⏳ Documentar padrões de uso

---

**Status:** Sistema pronto para uso! 🚀
**Próximo:** Executar `pnpm run etl:materialize:all` para gerar os caches
