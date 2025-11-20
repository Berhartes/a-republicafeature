# Auditoria de Dados Mock e Pendências - Integração Dados Reais

**Data:** 30 de outubro de 2025  
**Branch:** frontend-page-cleanup  
**Status Type-Check:** ✅ Passou sem erros

## ✅ Já Migrado para Dados Reais

### Deputados - Fluxo Principal
- ✅ `etl-cache.service.ts` - Loader unificado para caches ETL
- ✅ `useDeputadoData.ts` - Hook de perfil de deputado
- ✅ `deputy.store.ts` - Store Zustand de deputados
- ✅ Ranking de deputados, gastos, comparações

## 🔴 Arquivos Críticos Usando Math.random/Mocks em Produção

### 1. Fornecedores (Prioridade ALTA)

#### `usePerfilFornecedorData.ts` (linhas 250-370)
**Problema:** Gera transações históricas artificiais com Math.random
```typescript
const mes = Math.floor(Math.random() * 12) + 1
const dataBase = new Date(ano, mes - 1, Math.floor(Math.random() * 28) + 1)
const valorTransacao = Math.floor(valorMedioTransacao * (1 + (Math.random() - 0.5) * 0.4))
```
**Impacto:** Histórico de transações completamente falso
**Solução:** Carregar transações reais do cache `supplier-{cnpj}.json`

#### `usePerfilFornecedorData.ts` (linhas 358-372)
**Problema:** Fallback também usa Math.random para gerar transações
```typescript
const numTransacoes = fornecedor.transacoes || Math.floor(Math.random() * 20) + 5
const mesTransacao = mesSelecionado === 'todos' ? Math.floor(Math.random() * 12) + 1 : parseInt(mesSelecionado)
```
**Impacto:** Mesmo fallback produz dados falsos
**Solução:** Fallback deve usar localStorage ou cache mínimo, nunca dados randômicos

### 2. Contexto Global (Prioridade ALTA)

#### `GlobalDataContext.tsx` (linhas 267-286)
**Problema:** Fallback usa `generateMockDeputados()` quando cache falha
```typescript
const mockDeputados = generateMockDeputados().map(dep => ({
  id: dep.id,
  nomeEleitoral: dep.nome,
  siglaPartido: dep.partido,
  siglaUf: dep.estado,
  totalGasto: dep.totalGasto,
  gastos: dep.gastos,
  urlFoto: dep.urlFoto,
}))
```
**Impacto:** Contexto global pode ter dados falsos em caso de erro
**Solução:** Implementar fallback via localStorage ou erro explícito, sem mocks

### 3. Alertas de Categoria (Prioridade MÉDIA)

#### `categoria-alertas.service.ts` (linha 200)
**Problema:** Usa Math.random para gerar IDs de alertas reais
```typescript
id: `real-${fornecedor.cnpj}-${alertaReal.id || Math.random()}`
```
**Impacto:** IDs não determinísticos dificultam rastreamento
**Solução:** Usar hash determinístico dos dados (MD5/SHA do conteúdo)

### 4. Rankings Fallback (Prioridade MÉDIA)

#### `FallbackRankingProvider.ts` (linhas 135-137)
**Problema:** Gera dados sintéticos de deputados com Math.random
```typescript
totalAmount: Math.random() * 100000 + 10000,
transactionCount: Math.floor(Math.random() * 50) + 5,
supplierCount: Math.floor(Math.random() * 20) + 1,
```
**Impacto:** Rankings podem mostrar dados falsos em caso de falha
**Solução:** Fallback deve usar cache local ou estado vazio, não dados sintéticos

### 5. Páginas de Categoria (Prioridade MÉDIA - FASE 1.1-1.4)

#### `DeputadoEvolucaoPage.tsx` (linha 92)
**Problema:** Aplica variação aleatória em dados de evolução
```typescript
const variation = ano === anoAtual ? 1 : (0.8 + Math.random() * 0.4)
```
**Impacto:** Evolução temporal não reflete realidade
**Solução:** Usar dados de evolução temporal do cache

#### Páginas de Categoria (não auditadas ainda)
- `DeputadosCategoriaPage.tsx`
- `TransacoesCategoriaPage.tsx`
- `EvolucaoCategoriaPage.tsx`
- `RelacoesCategoriaPage.tsx`
- `AlertasCategoriaPage.tsx`

## 🟡 Uso Legítimo de Math.random (Manter)

### Geração de IDs Únicos (OK)
- `lib/logger.ts` - IDs de operações
- `lib/accessibility.ts` - IDs de acessibilidade
- `features/page-audit/services/*.ts` - IDs de duplicatas/operações

### Visualizações (OK)
- `DependencyGraphVisualization.tsx` - Ângulos aleatórios para layout de grafo

### Observabilidade/Sampling (OK)
- `useParliamentaryObservability.ts` - Sample rate para métricas

### Notificações UI (OK)
- `NotificationCenter.tsx` - Seleção aleatória de notificações mock (componente de exemplo)

### Error Boundaries (OK)
- `ErrorBoundary.tsx`, `FornecedoresErrorBoundary.tsx` - IDs de erro únicos

## 🟢 Arquivos de Teste (Ignorar)
- `**/__tests__/**/*.test.{ts,tsx}` - 40+ arquivos de teste com mocks legítimos
- `features/page-audit/__tests__/integration-performance.test.ts`
- `features/page-audit/services/__tests__/performance.test.ts`
- Etc.

## 📋 Plano de Ação Priorizado

### Sprint 1: Fornecedores e Contexto Global (CRÍTICO)
1. ✅ **usePerfilFornecedorData.ts** - Migrar geração de transações para dados reais
2. ✅ **GlobalDataContext.tsx** - Remover fallback com mocks
3. ✅ **FallbackRankingProvider.ts** - Implementar fallback inteligente

### Sprint 2: Alertas e Páginas de Evolução
4. ✅ **categoria-alertas.service.ts** - IDs determinísticos
5. ✅ **DeputadoEvolucaoPage.tsx** - Usar dados reais de evolução

### Sprint 3: Páginas de Categoria (FASE 1.1-1.4 do Spec)
6. ✅ **DeputadosCategoriaPage** - Conectar ao deputies-cache.json
7. ✅ **TransacoesCategoriaPage** - Agregação de transações reais
8. ✅ **EvolucaoCategoriaPage** - Dados de evolução temporal
9. ✅ **RelacoesCategoriaPage + AlertasCategoriaPage** - Relacionamentos e scores

### Sprint 4: Serviço Unificado de Categorias
10. ✅ **CategoriaDataService** - Serviço central seguindo padrão etlCacheService

### Sprint 5: Auditoria Final
11. ✅ Grep completo para confirmar eliminação
12. ✅ Type-check e build
13. ✅ Testes manuais de fluxos principais

## 📊 Métricas

- **Total de ocorrências Math.random/mocks:** 86
- **Em produção (críticas):** ~15
- **Em testes (OK):** ~60
- **Uso legítimo (OK):** ~11
- **Arquivos críticos a migrar:** 7
- **Páginas de categoria a conectar:** 5

## 🎯 Próximos Passos Imediatos

1. **Migrar usePerfilFornecedorData** - Maior volume de dados falsos
2. **Corrigir GlobalDataContext** - Contexto crítico usado em toda aplicação
3. **Implementar CategoriaDataService** - Base para todas páginas de categoria
4. **Conectar páginas de categoria** - Completar FASE 1 do spec

## 📝 Notas de Implementação

### Padrão de Migração
Seguir padrão estabelecido em `etl-cache.service.ts` e `useDeputadoData.ts`:
- Carregar dados de caches materializados
- Processar/transformar conforme necessário
- Cache local com invalidação por timestamp
- Fallback para localStorage quando disponível
- Tratamento robusto de erros sem dados falsos

### Arquivos de Suporte
- `bancoDados/monitordespesas/manifest.json` - Manifesto dos caches
- `test-cache-output/suppliers-cache.json` - Cache de fornecedores
- `test-cache-output/caches-manifest.json` - Metadados dos caches
