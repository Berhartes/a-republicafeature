# 🎯 Plano de Execução - Melhorias Não Bloqueantes

**Data:** 30 de outubro de 2025  
**Branch:** frontend-page-cleanup  
**Tipo:** Otimizações e funcionalidades adicionais

---

## 📋 Visão Geral

Este plano aborda 3 frentes de melhoria:
1. **Correção do CategoriaDataService** (7 erros de tipo)
2. **Revisão de Math.random legítimo** (4 arquivos)
3. **Conexão de páginas de categoria** (5 páginas - FASE 1.1-1.4)

**Tempo Estimado Total:** 8-12 horas  
**Prioridade:** Média-Baixa (não bloqueia deploy)  
**Benefício:** Completar migração para dados reais e funcionalidades de categoria

---

## 🔧 FASE 1: Correção do CategoriaDataService

**Objetivo:** Corrigir 7 erros de tipo no serviço experimental  
**Tempo Estimado:** 1-2 horas  
**Prioridade:** Baixa  
**Dependências:** Nenhuma

### Erros Identificados

#### 1. Linha 182 - CategoryRegistry.getByName não existe
```typescript
// ❌ ATUAL
const categoryMeta = categoryRegistry.getByName(nome) || categoryRegistry.getById(nome)

// ✅ CORREÇÃO
const categoryMeta = categoryRegistry.getById(parseInt(nome))
```

**Ação:**
- Verificar interface de CategoryRegistry em `packages/shared/categorias-deputados.ts`
- Usar método correto disponível na interface
- Se necessário, implementar busca por nome manualmente

#### 2. Linha 283 - Método gerarAlertasCategoria não existe
```typescript
// ❌ ATUAL
const alertas = await this.alertasService.gerarAlertasCategoria(categoriaId)

// ✅ CORREÇÃO
const alertas = await this.alertasService.obterAlertasCategoria(categoriaId)
```

**Ação:**
- Corrigir nome do método para `obterAlertasCategoria`
- Verificar assinatura do método em `categoria-alertas.service.ts`

#### 3. Linha 284 - Método calcularEstatisticas não existe
```typescript
// ❌ ATUAL
const estatisticas = await this.alertasService.calcularEstatisticas(categoriaId)

// ✅ CORREÇÃO - Opção 1: Implementar método
// ou
// ✅ CORREÇÃO - Opção 2: Calcular inline
const estatisticas = {
  total: alertas.length,
  criticos: alertas.filter(a => a.severidade === 'CRITICA').length,
  altos: alertas.filter(a => a.severidade === 'ALTA').length,
  medios: alertas.filter(a => a.severidade === 'MEDIA').length
}
```

**Ação:**
- Verificar se método existe mas não é exportado
- OU implementar cálculo inline de estatísticas

#### 4. Linha 303 - Método buscarEvolucaoAnual não existe
```typescript
// ❌ ATUAL
const evolucaoAnual = await this.evolucaoService.buscarEvolucaoAnual(categoriaId)

// ✅ CORREÇÃO
const evolucaoAnual = await this.evolucaoService.obterEvolucaoCategoria(categoriaId)
```

**Ação:**
- Verificar método correto em `categoria-evolucao.service.ts`
- Ajustar nome do método

#### 5. Linha 304 - calcularEstatisticas é privado
```typescript
// ❌ ATUAL
const estatisticas = await this.evolucaoService.calcularEstatisticas(categoriaId)

// ✅ CORREÇÃO - Tornar método público OU calcular inline
const estatisticas = {
  totalAnos: evolucaoAnual.length,
  anoMaiorGasto: evolucaoAnual.reduce((max, e) => e.total > max.total ? e : max),
  crescimentoMedio: this.calcularCrescimentoMedio(evolucaoAnual)
}
```

**Ação:**
- Tornar método público se faz sentido
- OU implementar cálculo inline

#### 6 & 7. Linha 304 - Tipo de argumento incorreto
```typescript
// ❌ ATUAL - Passa string, espera array
const estatisticas = await this.evolucaoService.calcularEstatisticas(categoriaId)

// ✅ CORREÇÃO
const estatisticas = this.calcularEstatisticasEvolucao(evolucaoAnual)
```

**Ação:**
- Passar dados corretos (array de evolução) ao invés de ID

### Checklist de Execução - FASE 1

- [ ] Ler arquivo completo `CategoriaDataService.ts`
- [ ] Ler interfaces de `CategoryRegistry`, `CategoriaAlertasService`, `CategoriaEvolucaoService`
- [ ] Corrigir linha 182 - CategoryRegistry
- [ ] Corrigir linha 283 - gerarAlertasCategoria → obterAlertasCategoria
- [ ] Corrigir linha 284 - Implementar ou ajustar calcularEstatisticas (alertas)
- [ ] Corrigir linha 303 - buscarEvolucaoAnual → método correto
- [ ] Corrigir linhas 304 (erros 5, 6, 7) - calcularEstatisticas (evolução)
- [ ] Executar `pnpm type-check` para validar
- [ ] Testar se serviço compila sem erros

---

## 🔍 FASE 2: Auditoria de Math.random Legítimo

**Objetivo:** Revisar e documentar usos legítimos de Math.random  
**Tempo Estimado:** 1 hora  
**Prioridade:** Baixa  
**Dependências:** Nenhuma

### Arquivos para Revisar

#### 1. etl-cache.service.ts (linha 1591)
```typescript
// ATUAL
id: `${dados.cnpj}-${t.documento || Math.random()}-${t.ano}-${t.mes}`
```

**Análise:**
- **Contexto:** Fallback quando documento está vazio
- **Legítimo?** ✅ SIM - Edge case de erro, raramente executado
- **Ação:** Documentar com comentário explicativo

**Melhoria Sugerida:**
```typescript
// Fallback: usa timestamp + random para garantir unicidade em caso de documento vazio
id: `${dados.cnpj}-${t.documento || `NODOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}-${t.ano}-${t.mes}`
```

#### 2. useParliamentaryObservability.ts (linha 86)
```typescript
// ATUAL
return Math.random() < sampleRate
```

**Análise:**
- **Contexto:** Sample rate para métricas de observabilidade
- **Legítimo?** ✅ SIM - Padrão de sampling estatístico
- **Ação:** Manter e documentar

#### 3. useDataWorker.ts (linha 73)
```typescript
// ATUAL
const id = Math.random().toString(36).substring(2, 15)
```

**Análise:**
- **Contexto:** ID único para operação de web worker
- **Legítimo?** ✅ SIM - ID técnico, não dado de negócio
- **Ação:** Manter (ou considerar crypto.randomUUID() se disponível)

**Melhoria Sugerida:**
```typescript
const id = crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15)
```

#### 4. NotificationCenter.tsx (linha 64)
```typescript
// ATUAL
const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)]
```

**Análise:**
- **Contexto:** Componente demo de notificações
- **Legítimo?** ⚠️ DEPENDE - Se é demo UI, OK. Se vai para produção, revisar.
- **Ação:** Verificar se componente está em uso real ou é apenas exemplo

#### 5. FornecedoresErrorBoundary.tsx (linha 36)
```typescript
// ATUAL
const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
```

**Análise:**
- **Contexto:** ID único de erro para tracking
- **Legítimo?** ✅ SIM - ID técnico de error tracking
- **Ação:** Manter

#### 6. lib/logger.ts (~linha 82)
**Análise:**
- **Contexto:** IDs de operações de logging
- **Legítimo?** ✅ SIM
- **Ação:** Manter

#### 7. lib/accessibility.ts (~linha 341)
**Análise:**
- **Contexto:** IDs únicos para elementos DOM
- **Legítimo?** ✅ SIM
- **Ação:** Manter

### Checklist de Execução - FASE 2

- [ ] Ler contexto de cada uso de Math.random nos 7 arquivos
- [ ] Adicionar comentários explicativos onde necessário
- [ ] Considerar melhorias (crypto.randomUUID, timestamp + random)
- [ ] Verificar se NotificationCenter.tsx está em produção
- [ ] Documentar decisões no ESTADO-ATUAL-PROJETO.md

---

## 🎨 FASE 3: Páginas de Categoria - FASE 1.1-1.4

**Objetivo:** Conectar 5 páginas de categoria aos caches ETL reais  
**Tempo Estimado:** 6-8 horas  
**Prioridade:** Média  
**Dependências:** Idealmente FASE 1 (CategoriaDataService) completa

### Páginas a Implementar

#### 3.1 DeputadosCategoriaPage.tsx
**Tempo:** 1.5 horas  
**Dados Necessários:** `deputies-cache.json`

**Implementação:**
```typescript
// Estrutura de dados
interface DeputadoCategoriaView {
  deputado: {
    id: string
    nome: string
    partido: string
    uf: string
    foto: string
  }
  gastos: {
    total: number
    numTransacoes: number
    mediaTransacao: number
    fornecedores: number
  }
  categoria: {
    id: number
    nome: string
    percentualTotal: number // % dos gastos do deputado nesta categoria
  }
}
```

**Tarefas:**
1. Criar hook `useDeputadosCategoria(categoriaId)`
2. Carregar deputies-cache.json via etlCacheService
3. Filtrar por categoria usando campo `categoria` das transações
4. Calcular agregações: total, média, count
5. Implementar ordenação por gasto total
6. Adicionar filtros: partido, UF, período
7. Implementar paginação/virtualização
8. Adicionar loading states e error handling

#### 3.2 TransacoesCategoriaPage.tsx
**Tempo:** 1.5 horas  
**Dados Necessários:** `suppliers-cache.json` + `deputies-cache.json`

**Implementação:**
```typescript
interface TransacaoCategoriaView {
  id: string
  data: Date
  deputado: {
    nome: string
    partido: string
  }
  fornecedor: {
    cnpj: string
    nome: string
  }
  valor: number
  documento: string
  descricao: string
  categoria: {
    id: number
    nome: string
  }
}
```

**Tarefas:**
1. Criar hook `useTransacoesCategoria(categoriaId)`
2. Carregar suppliers-cache.json E deputies-cache.json
3. Cruzar dados para enriquecer transações
4. Filtrar por categoria
5. Ordenar por data/valor
6. Implementar busca por deputado/fornecedor
7. Adicionar filtros: período, valor mín/máx
8. Implementar paginação (importante - pode ter muitas transações)

#### 3.3 EvolucaoCategoriaPage.tsx
**Tempo:** 2 horas  
**Dados Necessários:** `deputies-cache.json` (agregação temporal)

**Implementação:**
```typescript
interface EvolucaoCategoriaView {
  categoria: {
    id: number
    nome: string
  }
  evolucao: {
    ano: number
    mes: number
    total: number
    numTransacoes: number
    deputadosAtivos: number
    fornecedores: number
    crescimentoPercentual: number // vs período anterior
  }[]
}
```

**Tarefas:**
1. Criar hook `useEvolucaoCategoria(categoriaId)`
2. Carregar deputies-cache.json
3. Agregar transações por ano/mês para a categoria
4. Calcular métricas: total, count, deputados únicos, fornecedores únicos
5. Calcular crescimento percentual período a período
6. Implementar visualizações: gráfico de linha, barras, área
7. Adicionar filtros: granularidade (mensal/anual), período
8. Adicionar comparações: vs outras categorias, vs total

#### 3.4 RelacoesCategoriaPage.tsx
**Tempo:** 2 horas  
**Dados Necessários:** `suppliers-cache.json` + `deputies-cache.json`

**Implementação:**
```typescript
interface RelacaoCategoriaView {
  deputado: {
    id: string
    nome: string
    partido: string
  }
  fornecedor: {
    cnpj: string
    nome: string
  }
  relacionamento: {
    numTransacoes: number
    valorTotal: number
    primeiraTransacao: Date
    ultimaTransacao: Date
    mediaValor: number
    categorias: number[] // IDs das categorias
    score: number // Score de proximidade
  }
}
```

**Tarefas:**
1. Criar hook `useRelacoesCategoria(categoriaId)`
2. Carregar suppliers-cache.json E deputies-cache.json
3. Identificar pares deputado-fornecedor na categoria
4. Calcular métricas de relacionamento
5. Calcular score de proximidade (frequência × valor × recência)
6. Implementar visualização de rede/grafo
7. Adicionar filtros: score mínimo, valor mínimo
8. Implementar busca por deputado ou fornecedor

#### 3.5 AlertasCategoriaPage.tsx
**Tempo:** 1.5 horas  
**Dados Necessários:** Já implementado em `categoria-alertas.service.ts`

**Implementação:**
```typescript
interface AlertaCategoriaView {
  id: string
  tipo: 'VALOR_ALTO' | 'FREQUENCIA_ALTA' | 'RELACIONAMENTO_SUSPEITO' | 'PADRAO_ANOMALO'
  severidade: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
  categoria: {
    id: number
    nome: string
  }
  entidades: {
    deputado?: string
    fornecedor?: string
  }
  dados: {
    titulo: string
    descricao: string
    valor?: number
    threshold?: number
    data: Date
  }
}
```

**Tarefas:**
1. Criar hook `useAlertasCategoria(categoriaId)`
2. Usar serviço já implementado `categoria-alertas.service.ts`
3. Filtrar alertas por categoria
4. Implementar ordenação por severidade/data
5. Adicionar filtros: tipo, severidade, período
6. Implementar detalhamento de alerta
7. Adicionar ações: marcar como visto, exportar
8. Implementar estatísticas: total por tipo, por severidade

### Estrutura Comum para Todas as Páginas

```typescript
// Layout padrão
<CategoriaPageLayout>
  <CategoriaHeader 
    categoria={categoria}
    breadcrumb={['Categorias', categoria.nome]}
  />
  
  <CategoriaFilters
    filters={filters}
    onFilterChange={handleFilterChange}
  />
  
  <CategoriaMetrics
    data={metricas}
    loading={loading}
  />
  
  <CategoriaContent>
    {/* Conteúdo específico da página */}
  </CategoriaContent>
  
  <CategoriaFooter
    actions={['Exportar', 'Compartilhar', 'Imprimir']}
  />
</CategoriaPageLayout>
```

### Componentes Compartilhados a Criar

1. **CategoriaPageLayout** - Layout comum
2. **CategoriaHeader** - Cabeçalho com breadcrumb e categoria
3. **CategoriaFilters** - Filtros reutilizáveis
4. **CategoriaMetrics** - Cards de métricas
5. **CategoriaLoadingState** - Loading skeleton
6. **CategoriaErrorState** - Error boundary/fallback
7. **CategoriaEmptyState** - Estado vazio

### Checklist de Execução - FASE 3

#### Preparação
- [ ] Criar pasta `components/categoria/` para componentes compartilhados
- [ ] Implementar componentes de layout base
- [ ] Criar hooks compartilhados: `useCategoriaMetadata`, `useCategoriaCache`

#### Página 3.1 - Deputados
- [ ] Criar `DeputadosCategoriaPage.tsx`
- [ ] Implementar `useDeputadosCategoria` hook
- [ ] Implementar filtros e ordenação
- [ ] Testar com categoria real (ex: Passagens Aéreas)

#### Página 3.2 - Transações
- [ ] Criar `TransacoesCategoriaPage.tsx`
- [ ] Implementar `useTransacoesCategoria` hook
- [ ] Implementar paginação e busca
- [ ] Testar com categoria real

#### Página 3.3 - Evolução
- [ ] Criar `EvolucaoCategoriaPage.tsx`
- [ ] Implementar `useEvolucaoCategoria` hook
- [ ] Implementar gráficos de evolução temporal
- [ ] Testar com categoria real

#### Página 3.4 - Relações
- [ ] Criar `RelacoesCategoriaPage.tsx`
- [ ] Implementar `useRelacoesCategoria` hook
- [ ] Implementar visualização de rede
- [ ] Testar com categoria real

#### Página 3.5 - Alertas
- [ ] Criar `AlertasCategoriaPage.tsx`
- [ ] Implementar `useAlertasCategoria` hook
- [ ] Conectar com `categoria-alertas.service.ts`
- [ ] Testar com categoria real

#### Finalização
- [ ] Executar `pnpm type-check`
- [ ] Executar `pnpm build`
- [ ] Testar todas as páginas manualmente
- [ ] Verificar performance (tempo de carregamento)
- [ ] Documentar padrões implementados

---

## 📊 Cronograma Sugerido

### Semana 1 (3-4 horas)
- **Dia 1:** FASE 1 - Correção CategoriaDataService (1-2h)
- **Dia 2:** FASE 2 - Auditoria Math.random (1h)
- **Dia 3:** FASE 3 Preparação - Componentes base (1-2h)

### Semana 2 (4-5 horas)
- **Dia 1:** Página 3.1 - DeputadosCategoria (1.5h)
- **Dia 2:** Página 3.2 - TransacoesCategoria (1.5h)
- **Dia 3:** Página 3.3 - EvolucaoCategoria (2h)

### Semana 3 (3-4 horas)
- **Dia 1:** Página 3.4 - RelacoesCategoria (2h)
- **Dia 2:** Página 3.5 - AlertasCategoria (1.5h)
- **Dia 3:** Testes e validação final (1h)

---

## 🎯 Critérios de Sucesso

### FASE 1
- ✅ `pnpm type-check` passa sem erros em CategoriaDataService
- ✅ Todos os 7 erros de tipo corrigidos
- ✅ Serviço compila e pode ser importado

### FASE 2
- ✅ Todos os 7 usos de Math.random revisados e documentados
- ✅ Comentários explicativos adicionados onde necessário
- ✅ Melhorias implementadas (crypto.randomUUID onde aplicável)

### FASE 3
- ✅ 5 páginas de categoria implementadas e funcionais
- ✅ Todas carregam dados reais dos caches ETL
- ✅ Zero uso de Math.random ou dados mock
- ✅ Filtros e ordenação funcionando
- ✅ Loading states e error handling implementados
- ✅ Performance aceitável (< 3s para carregamento)
- ✅ Build passa sem erros

---

## 🚀 Comandos de Validação

```bash
# Type-check
pnpm type-check

# Build completo
pnpm --filter @a-republica/monitor-despesas-next run build

# Grep para verificar Math.random em produção (excluindo testes e libs)
grep -r "Math.random" packages/monitor-despesas-next/src --include="*.ts" --include="*.tsx" --exclude-dir="__tests__" --exclude-dir="node_modules"

# Verificar imports de mocks
grep -r "generateMock" packages/monitor-despesas-next/src --include="*.ts" --include="*.tsx" --exclude-dir="__tests__"
```

---

## 📝 Notas Importantes

### Priorização
1. **Alta:** FASE 1 (CategoriaDataService) - se for usado no futuro
2. **Média:** FASE 3 (Páginas categoria) - funcionalidade nova
3. **Baixa:** FASE 2 (Auditoria Math.random) - já documentado

### Flexibilidade
- FASE 1 pode ser SKIPADA se CategoriaDataService não for necessário
- FASE 3 pode ser dividida em sprints menores (1-2 páginas por vez)
- FASE 2 pode ser executada em paralelo com outras fases

### Dependências de Dados
Todas as páginas dependem de:
- `bancoDados/monitordespesas/manifest.json`
- `test-cache-output/suppliers-cache.json`
- `test-cache-output/deputies-cache.json`
- `packages/shared/categorias-deputados.ts` (metadados de categorias)

---

## ✅ Conclusão

Este plano fornece um roteiro completo para:
1. ✅ Corrigir código experimental (CategoriaDataService)
2. ✅ Validar usos legítimos de Math.random
3. ✅ Implementar funcionalidades de categoria com dados reais

**Tempo Total:** 8-12 horas  
**Complexidade:** Média  
**Impacto:** Alto (completa migração para dados reais + novas funcionalidades)

Pronto para execução quando for conveniente! 🚀
