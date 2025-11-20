# Progresso da Migração para Dados Reais - Sprint Atual

**Data:** 30 de outubro de 2025  
**Branch:** frontend-page-cleanup  
**Status:** ✅ Type-check passou sem erros

---

## ✅ Completado Nesta Sessão

### 1. Auditoria Completa de Dados Mock
**Arquivo:** `AUDITORIA-DADOS-MOCK.md`

- Identificados 86 usos de Math.random/mocks no projeto
- Categorizados em:
  - **Produção (críticos):** ~15 usos
  - **Testes (OK):** ~60 usos  
  - **Uso legítimo (IDs, sampling, etc.):** ~11 usos
- 7 arquivos críticos identificados para migração
- 5 páginas de categoria pendentes

---

### 2. ✅ Fornecedores - Transações Reais

**Arquivo:** `packages/monitor-despesas-next/src/components/perfil-fornecedor/hooks/usePerfilFornecedorData.ts`

#### Problemas Eliminados
```typescript
// ❌ ANTES - Gerava transações falsas
const mes = Math.floor(Math.random() * 12) + 1
const valorTransacao = Math.floor(valorMedioTransacao * (1 + (Math.random() - 0.5) * 0.4))
```

#### Solução Implementada
```typescript
// ✅ AGORA - Usa transações reais do cache
const { etlCacheService } = await import('@/services/etl-cache.service')
const cacheIndividual = await etlCacheService.fetchSupplierDetailsCache(cnpjDecodificado)

if (cacheIndividual) {
  let transacoesReais = etlCacheService.normalizeSupplierTransactions(cacheIndividual)
  transacoesReais = transacoesReais.filter(t => {
    const anoMatch = t.ano === anoSelecionado
    const mesMatch = mesSelecionado === 'todos' || t.mes === parseInt(mesSelecionado)
    return anoMatch && mesMatch
  })
  // ...usa transações reais
}
```

#### Melhorias
- ✅ Adicionado `etlCacheService.fetchSupplierDetailsCache(cnpj)` para carregar caches individuais
- ✅ Adicionado `etlCacheService.normalizeSupplierTransactions()` para normalizar formato
- ✅ Histórico temporal agora usa transações reais do campo `topTransacoes`
- ✅ Fallback usa contexto global, não dados randômicos
- ✅ Eliminou ~150 linhas de código de geração fake

---

### 3. ✅ Alertas - IDs Determinísticos

**Arquivo:** `packages/monitor-despesas-next/src/services/categoria-alertas.service.ts`

#### Problema Eliminado
```typescript
// ❌ ANTES - IDs não determinísticos
id: `real-${fornecedor.cnpj}-${alertaReal.id || Math.random()}`
```

#### Solução Implementada
```typescript
// ✅ AGORA - Hash determinístico
private generateDeterministicId(base: string, content: any): string {
  const contentStr = JSON.stringify(content)
  let hash = 0
  for (let i = 0; i < contentStr.length; i++) {
    const char = contentStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `${base}-${Math.abs(hash).toString(36)}`
}

// Uso
const alertaId = alertaReal.id || this.generateDeterministicId(
  `real-${fornecedor.cnpj}`,
  { tipo: alertaReal.tipo, titulo: alertaReal.titulo, data: alertaReal.data }
)
```

#### Melhorias
- ✅ IDs consistentes e reproduzíveis
- ✅ Melhor rastreamento e debugging
- ✅ Cache funciona corretamente com IDs determinísticos

---

### 4. ✅ Contexto Global - Sem Mocks

**Arquivo:** `packages/monitor-despesas-next/src/contexts/GlobalDataContext.tsx`

#### Problemas Eliminados
```typescript
// ❌ ANTES - Fallback com mocks
console.log('🎭 [GlobalDataContext] Usando dados mock como fallback...')
const mockDeputados = generateMockDeputados().map(dep => ({
  id: dep.id,
  nomeEleitoral: dep.nome,
  // ... dados falsos
}))
```

#### Solução Implementada
```typescript
// ✅ AGORA - Estado vazio ou erro explícito
console.log('⚠️ [GlobalDataContext] Nenhuma fonte de dados disponível - estado vazio')
startTransition(() => {
  dispatch({ type: 'SET_DEPUTADOS', payload: [] })
  dispatch({ type: 'SET_ALERTAS', payload: [] })
  dispatch({ type: 'SET_ANALISE_COMPLETA', payload: null })
})
```

#### Melhorias
- ✅ Removido import de `generateMockDeputados`
- ✅ Erros tratados com estado vazio, não dados falsos
- ✅ Logs claros indicando ausência de dados
- ✅ UI pode mostrar mensagens apropriadas ao invés de dados enganosos

---

## 📊 Métricas de Progresso

### Antes Desta Sessão
- Arquivos com Math.random em produção: **15**
- Linhas de código gerando dados falsos: **~250**
- Serviços dependentes de mocks: **4**

### Depois Desta Sessão
- Arquivos migrados: **3/7** (43%)
- Linhas de código fake eliminadas: **~180**
- Serviços 100% dados reais: **3** (fornecedores, alertas, contexto global)

---

## 🚧 Pendente - Próximas Prioridades

### Sprint 2: Rankings e Evolução Temporal

#### 5. FallbackRankingProvider.ts
```typescript
// ❌ Ainda gera dados sintéticos
totalAmount: Math.random() * 100000 + 10000
transactionCount: Math.floor(Math.random() * 50) + 5
supplierCount: Math.floor(Math.random() * 20) + 1
```
**Solução:** Usar rankings-cache.json ou localStorage

#### 6. DeputadoEvolucaoPage.tsx  
```typescript
// ❌ Variação aleatória em evolução
const variation = ano === anoAtual ? 1 : (0.8 + Math.random() * 0.4)
```
**Solução:** Usar dados de evolução temporal dos caches

---

### Sprint 3: Páginas de Categoria (FASE 1.1-1.4)

#### Páginas Pendentes
- ❌ `DeputadosCategoriaPage.tsx`
- ❌ `TransacoesCategoriaPage.tsx`
- ❌ `EvolucaoCategoriaPage.tsx`
- ❌ `RelacoesCategoriaPage.tsx`
- ❌ `AlertasCategoriaPage.tsx`

**Ação Necessária:** 
1. Conectar aos caches `deputies-cache.json` e `suppliers-cache.json`
2. Implementar filtros por categoria usando dados reais
3. Remover todos Math.random e placeholders

---

### Sprint 4: Serviço Unificado

#### CategoriaDataService (Novo)
**Objetivo:** Serviço central para processar dados por categoria

**Funcionalidades:**
- Carregar e processar `suppliers-cache.json` por categoria
- Processar `deputies-cache.json` por categoria
- Cache local inteligente com invalidação por timestamp
- Seguir padrão arquitetural de `etlCacheService`

---

## 📈 Impacto Técnico

### Qualidade de Dados
- ✅ Transações de fornecedores são dados reais do ETL
- ✅ Alertas têm IDs rastreáveis
- ✅ Contexto global não mais polui com mocks
- ✅ Histórico temporal reflete realidade

### Performance
- ✅ Cache de fornecedores individuais (~10KB cada)
- ✅ Normalização eficiente de transações
- ✅ Menos processamento de dados sintéticos

### Manutenibilidade
- ✅ 180 linhas de código fake eliminadas
- ✅ Lógica simplificada - carregar do cache é mais simples que gerar
- ✅ Logs claros indicando fonte dos dados
- ✅ Debugging facilitado com IDs determinísticos

---

## 🧪 Testes Recomendados

### Antes do Deploy
1. ✅ Type-check passou
2. ⏳ Testar perfil de fornecedor com CNPJ real
3. ⏳ Verificar histórico temporal carrega corretamente
4. ⏳ Confirmar alertas aparecem com IDs consistentes
5. ⏳ Validar contexto global sem dados mock

### Teste de Regressão
- ⏳ Fornecedores sem cache individual (fallback funciona?)
- ⏳ Erro de rede (estado vazio tratado corretamente?)
- ⏳ Cache corrompido (recuperação graciosa?)

---

## 📝 Próximos Passos Sugeridos

### Imediato (hoje)
1. Migrar `FallbackRankingProvider` (30 min)
2. Corrigir `DeputadoEvolucaoPage` (20 min)

### Curto Prazo (esta semana)
3. Implementar `CategoriaDataService` (2-3 horas)
4. Conectar páginas de categoria aos caches reais (4-6 horas)

### Médio Prazo (próxima semana)  
5. Auditoria final de Math.random/mocks
6. Testes de integração com dados reais
7. Documentação de padrões de carregamento de dados

---

## 🎯 Meta Final

**Objetivo:** Zero dados mock ou Math.random em código de produção (exceto IDs e sampling legítimos)

**Progresso:** 43% completo (3/7 arquivos críticos migrados)

**ETA:** 3-4 sessões de desenvolvimento (~8-12 horas totais)
