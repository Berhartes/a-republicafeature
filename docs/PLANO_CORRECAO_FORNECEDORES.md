# 🔍 Plano de Investigação e Correção - Página Fornecedores

## 📋 Problema Identificado

A página `/gastos/fornecedores` (http://localhost:3001/gastos/fornecedores) não está recebendo os dados corretamente do cache Materialize. 

### ✅ Análise Realizada

1. **Cache existe e está acessível**
   - ✅ Arquivo: `packages/monitor-despesas-next/public/cache/suppliers-cache.json` (2.4 MB)
   - ✅ Manifest: `packages/monitor-despesas-next/public/cache/caches-manifest.json` 
   - ✅ Estrutura do cache: `{ "fornecedores": [...] }`

2. **Função `normalizeCachePayload` já trata o wrapper**
   - ✅ Código em `monitordespesas.ts` já extrai `payload.fornecedores`

3. **Problema: Mapeamento de campos incompatível**
   - ❌ Cache usa: `documento`, `total_recebido`, `numero_transacoes`, `numero_legisladores`
   - ❌ Service espera: `cnpj`, `totalTransacionado`, `transacoes`, `deputadosAtendidos`

## 🎯 Estrutura Real do Cache

```json
{
  "fornecedores": [
    {
      "id": "TAM",
      "nome": "TAM",
      "documento": null,
      "tipo_fornecedor": null,
      "tipo_despesa_principal": "PASSAGEM AÉREA - SIGEPA",
      "total_recebido": 2069314.21,
      "numero_transacoes": 1874,
      "numero_legisladores": 24,
      "score_suspeicao": null,
      "categorias": [
        {
          "categoria": "PASSAGEM AÉREA - SIGEPA",
          "total": 2069314.21
        }
      ],
      "anos": [...],
      "ranking": 1,
      "totalRecebidoPorAno": { "2024": 1434433.23, "2025": 634880.98 },
      "transacoesPorAno": { "2024": 1312, "2025": 562 },
      "deputadosPorAno": { "2024": 24, "2025": 18 },
      "anosDisponiveis": [2024, 2025]
    }
  ]
}
```

## 🔧 Plano de Correção

### Etapa 1: Atualizar mapeamento de campos

**Arquivo:** `packages/monitor-despesas-next/src/services/fornecedores-data.service.ts`

**1. Atualizar tipagens compatíveis com o cache**  
Antes de mexer no mapeamento, alinhar os tipos definidos em `packages/monitor-despesas-next/src/data-access/monitordespesas.ts`. O contrato `SupplierCacheEntry` está desatualizado (não conhece os campos snake_case, nem o formato híbrido de `categorias`). Ajustar conforme abaixo, mantendo os demais campos existentes:

```typescript
export interface SupplierCacheEntry {
  // ...campos já definidos
  documento?: string | null
  tipo_fornecedor?: string | null
  tipo_despesa_principal?: string | null
  total_recebido?: number | null
  numero_transacoes?: number | null
  numero_legisladores?: number | null
  score_suspeicao?: number | null
  categorias?: Array<string | { categoria?: string | null; total?: number | null }>
  totalRecebidoPorAno?: Record<string, number>
  transacoesPorAno?: Record<string, number>
  deputadosPorAno?: Record<string, number>
  anosDisponiveis?: number[]
  anos?: Array<{
    ano: number
    total: number
    numero_transacoes?: number
    numero_legisladores?: number
  }>
}
```

Se preferir separar responsabilidades, criar um tipo auxiliar (`type MaterializeFornecedor = SupplierCacheEntry & { ... }`) no próprio serviço para centralizar esses campos adicionais.

**2. Corrigir a transformação dos dados**  
No bloco `// Transformar dados do cache para formato padronizado`, aplicar o novo mapeamento considerando a estrutura real:

```typescript
// ANTES (incorreto):
const fornecedores: FornecedorSimples[] = (suppliersCache.data as FornecedorStats[]).map((f: FornecedorStats) => ({
  cnpj: f.cnpj || '',
  nome: f.nome || 'Fornecedor não identificado',
  totalTransacionado: f.totalTransacionado || f.totalRecebido || 0,
  transacoes: f.transacoes || f.totalTransacoes || f.numeroTransacoes || 0,
  scoreSuspeicao: f.scoreSuspeicao || 0,
  categoria: (Array.isArray(f.categorias) && f.categorias.length > 0) ? f.categorias[0] : 'SEM_CATEGORIA',
  deputadosAtendidos: Array.isArray(f.deputadosAtendidos) ? f.deputadosAtendidos.length : 0,
  evolucaoAnual: (f as any).evolucaoAnual || undefined
}))

// DEPOIS (correto):
type MaterializeFornecedor = SupplierCacheEntry & {
  documento?: string | null
  total_recebido?: number | null
  numero_transacoes?: number | null
  numero_legisladores?: number | null
  tipo_despesa_principal?: string | null
  score_suspeicao?: number | null
  categorias?: Array<string | { categoria?: string | null; total?: number | null }>
  totalRecebidoPorAno?: Record<string, number>
  transacoesPorAno?: Record<string, number>
  deputadosPorAno?: Record<string, number>
}

const fornecedores: FornecedorSimples[] = (suppliersCache.data as MaterializeFornecedor[]).map((f) => {
  const categorias = Array.isArray(f.categorias) ? f.categorias : []
  const categoriaPrincipal = f.tipo_despesa_principal
    ?? categorias
      .map(item => typeof item === 'string' ? item : item?.categoria)
      .find(Boolean)
    ?? 'SEM_CATEGORIA'

  return {
    cnpj: f.documento ?? f.cnpj ?? '',
    nome: f.nome ?? f.nomeFornecedor ?? 'Fornecedor não identificado',
    totalTransacionado: f.total_recebido ?? f.totalRecebido ?? f.totalTransacionado ?? 0,
    transacoes: f.numero_transacoes ?? f.numeroTransacoes ?? f.transacoes ?? f.totalTransacoes ?? 0,
    scoreSuspeicao: f.score_suspeicao != null ? Number(f.score_suspeicao) : f.scoreSuspeicao ?? 0,
    categoria: categoriaPrincipal,
    deputadosAtendidos:
      f.numero_legisladores
      ?? (Array.isArray(f.deputadosAtendidos)
        ? f.deputadosAtendidos.length
        : Number(f.deputadosAtendidos) || 0),
    evolucaoAnual: f.totalRecebidoPorAno
      ? Object.entries(f.totalRecebidoPorAno).reduce((acc, [ano, valor]) => {
          acc[ano] = {
            valor: Number(valor) || 0,
            transacoes: f.transacoesPorAno?.[ano] ?? 0,
            deputados: f.deputadosPorAno?.[ano] ?? 0
          }
          return acc
        }, {} as Record<string, { valor: number; transacoes: number; deputados: number }>)
      : undefined
  }
})
```

### Etapa 2: Adicionar logs de debug

**Adicionar logo após confirmar que `suppliersCache.data` foi carregado, antes da transformação:**

```typescript
const firstSupplier = Array.isArray(suppliersCache.data) ? suppliersCache.data[0] : null

console.log('🔍 [FornecedoresDataService] Estrutura do primeiro fornecedor materializado:',
  firstSupplier
    ? {
        keys: Object.keys(firstSupplier),
        sample: {
          nome: firstSupplier.nome,
          documento: firstSupplier.documento,
          total_recebido: firstSupplier.total_recebido,
          numero_transacoes: firstSupplier.numero_transacoes,
          numero_legisladores: firstSupplier.numero_legisladores
        }
      }
    : 'Nenhum fornecedor encontrado'
)
```

### Etapa 3: Testar a correção

```powershell
# 1. Limpar cache do navegador
# F12 > Application > Storage > Clear site data

# 2. Recarregar a página
# http://localhost:3001/gastos/fornecedores

# 3. Verificar console para:
# - "✅ [FornecedoresDataService] Dados transformados: { total: X, ... }"
# - Sem erros de mapeamento
```

## 📊 Checklist de Validação

- [ ] Console mostra "Cache Materialize carregado" com contagem > 0
- [ ] Console mostra "Dados transformados" com total > 0
- [ ] Estatísticas aparecem no topo da página (Total Fornecedores, Volume Total, etc.)
- [ ] Gráfico "Top 5 Fornecedores" é renderizado
- [ ] Gráfico "Distribuição por Categoria" é renderizado
- [ ] Tabela mostra lista de fornecedores
- [ ] Filtros de busca/categoria/score funcionam
- [ ] Não há erros no console do navegador

## 🚨 Pontos de Atenção

1. **Campos snake_case vs camelCase**
   - Cache usa: `total_recebido`, `numero_transacoes`, `numero_legisladores`
   - Interface usa: `totalRecebido`, `numeroTransacoes`, `numeroLegisladores`

2. **Categorias podem ser array de objetos ou strings**
   - Tratar: `categorias: [{ categoria: "X", total: Y }]`
   - Ou: `categorias: ["X", "Y"]`

3. **Campo documento vs cnpj**
   - Cache usa: `documento`
   - Interface espera: `cnpj`

4. **evolucaoAnual tem estrutura específica**
   - Usar `totalRecebidoPorAno`, `transacoesPorAno`, `deputadosPorAno`

## 🔄 Comandos para Execução

```powershell
# Verificar estrutura do primeiro fornecedor no cache
Get-Content packages/monitor-despesas-next/public/cache/suppliers-cache.json | ConvertFrom-Json | Select-Object -ExpandProperty fornecedores | Select-Object -First 1 | ConvertTo-Json -Depth 5

# Após correção do código, verificar se o dev server está rodando
# Se não estiver, iniciar com pnpm:
pnpm --filter @a-republica/monitor-despesas-next dev

# Abrir navegador em:
# http://localhost:3001/gastos/fornecedores
```

## 📝 Arquivos a Modificar

1. **`packages/monitor-despesas-next/src/data-access/monitordespesas.ts`**
    - Atualizar a interface `SupplierCacheEntry` com os campos snake_case e coleções híbridas.
2. **`packages/monitor-despesas-next/src/services/fornecedores-data.service.ts`**
    - Ajustar o bloco de transformação dentro de `fetchFornecedoresFromMaterialize` e incluir o log de diagnóstico antes do mapeamento.

## ✅ Resultado Esperado

Após a correção:
- Página carrega dados do cache Materialize
- Estatísticas mostram valores corretos
- Gráficos são renderizados com dados
- Tabela mostra lista completa de fornecedores
- Filtros funcionam normalmente
- Console não mostra erros

## 🐛 Troubleshooting

### Se ainda não carregar dados:

1. **Verificar manifest**
   ```powershell
   Get-Content packages/monitor-despesas-next/public/cache/caches-manifest.json | ConvertFrom-Json
   ```

2. **Verificar se arquivo existe**
   ```powershell
   Test-Path packages/monitor-despesas-next/public/cache/suppliers-cache.json
   ```

3. **Verificar logs do navegador**
   - Abrir DevTools (F12)
   - Aba Console
   - Procurar por erros ou warnings

4. **Limpar IndexedDB**
   - F12 > Application > IndexedDB
   - Deletar "MonitorDespesasCache"
   - Recarregar página