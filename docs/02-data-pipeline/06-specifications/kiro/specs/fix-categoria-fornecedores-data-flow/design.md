# Design Document

## Overview

Este documento detalha o design da solução para corrigir o fluxo de dados entre a página de fornecedores geral (`/gastos/fornecedores`) e as páginas de categoria (`/gastos/categorias/[categoria]`). O problema identificado é que a página de categoria não está utilizando corretamente a mesma estrutura de dados da página geral, resultando em imports quebrados e conexões de dados inconsistentes.

## Architecture

### Current State Analysis

**Página Fornecedores (Funcional):**
- Utiliza `FornecedoresPage.tsx` que carrega dados diretamente do cache ETL
- Implementa carregamento via `fetchManifest()` e `fetchSuppliersCache()`
- Processa dados localmente com filtros e paginação
- Funciona corretamente com gráficos e estatísticas

**Página Categoria (Problemática):**
- Utiliza `CategoriasFornecedores.tsx` com hooks complexos
- Depende de `useCategoriaData` que tem implementação mock/incompleta
- Utiliza `FornecedoresDataProvider` que pode estar desatualizado
- Não compartilha a mesma fonte de dados da página principal

### Proposed Architecture

```mermaid
graph TD
    A[ETL Pipeline] --> B[Data Lake - suppliers-cache.json]
    B --> C[Shared Data Service]
    C --> D[Fornecedores Page]
    C --> E[Categoria Page]
    
    F[Category Filter Service] --> E
    G[Shared Components] --> D
    G --> E
    
    H[URL Router] --> I{Route Type}
    I -->|/gastos/fornecedores| D
    I -->|/gastos/categorias/[categoria]| E
```

## Components and Interfaces

### 1. Shared Data Service

**Interface: `IFornecedoresDataService`**
```typescript
interface IFornecedoresDataService {
  carregarTodosFornecedores(): Promise<FornecedorSimples[]>
  carregarFornecedoresPorCategoria(categoria: string): Promise<FornecedorSimples[]>
  calcularEstatisticas(fornecedores: FornecedorSimples[]): EstatisticasSimples
  processarDadosParaGraficos(fornecedores: FornecedorSimples[], filtros?: FiltrosGraficos): DadosGraficos
}
```

**Implementation: `FornecedoresDataService`**
- Centraliza acesso ao cache ETL (`fetchManifest`, `fetchSuppliersCache`)
- Implementa lógica de transformação de dados consistente
- Gerencia cache e debouncing
- Fornece métodos para ambas as páginas

### 2. Category Filter Service

**Interface: `ICategoryFilterService`**
```typescript
interface ICategoryFilterService {
  validarCategoria(categoria: string): boolean
  normalizarCategoria(categoria: string): string
  aplicarFiltroCategoria(fornecedores: FornecedorSimples[], categoria: string): FornecedorSimples[]
  obterCategoriasDisponiveis(fornecedores: FornecedorSimples[]): string[]
}
```

### 3. Shared Components

**Componentes Reutilizáveis:**
- `FornecedoresTable` - Tabela de fornecedores com paginação
- `FornecedoresStats` - Cards de estatísticas
- `FornecedoresCharts` - Gráficos (Top 5, Distribuição por categoria)
- `FornecedoresFilters` - Filtros de busca, categoria e score

### 4. Updated Page Components

**FornecedoresPage (Minimal Changes):**
- Migrar para usar `FornecedoresDataService`
- Manter funcionalidade atual
- Extrair componentes reutilizáveis

**CategoriaPage (Major Refactor):**
- Simplificar para usar `FornecedoresDataService`
- Aplicar filtro de categoria via `CategoryFilterService`
- Reutilizar componentes da página principal
- Remover dependências de hooks complexos

## Data Models

### Core Data Types

```typescript
interface FornecedorSimples {
  cnpj: string
  nome: string
  totalTransacionado: number
  transacoes: number
  scoreSuspeicao: number
  categoria: string
  deputadosAtendidos: number
  evolucaoAnual?: Record<string, { valor: number; transacoes: number; deputados: number }>
}

interface EstatisticasSimples {
  totalFornecedores: number
  totalVolume: number
  mediaScore: number
  fornecedoresSuspeitos: number
}

interface DadosGraficos {
  top5Fornecedores: FornecedorRanking[]
  categoriaData: CategoryData[]
}

interface FiltrosGraficos {
  anoSelecionado: number | 'todos'
  categoriaSelecionada: string
}
```

### Data Flow

1. **ETL → Data Lake**: Dados processados salvos em `suppliers-cache.json`
2. **Data Service → Cache**: Carregamento único do cache ETL
3. **Data Service → Pages**: Fornecimento de dados processados
4. **Category Filter → Categoria Page**: Aplicação de filtro específico
5. **Shared Components**: Renderização consistente em ambas as páginas

## Error Handling

### Error Types and Handling

1. **ETL Cache Not Found**
   - Fallback: Exibir mensagem informativa
   - Action: Orientar usuário sobre ETL pipeline
   - Recovery: Botão de retry

2. **Invalid Category**
   - Validation: Verificar categoria antes de aplicar filtro
   - Fallback: Redirect para página geral ou 404
   - User Feedback: Mensagem de categoria não encontrada

3. **Data Processing Errors**
   - Logging: Console logs detalhados
   - Fallback: Dados vazios com mensagem explicativa
   - Recovery: Botão de recarregar dados

### Error Boundaries

```typescript
interface ErrorBoundaryState {
  hasError: boolean
  errorType: 'data-load' | 'category-invalid' | 'processing' | 'unknown'
  errorMessage: string
}
```

## Testing Strategy

### Unit Tests

1. **FornecedoresDataService**
   - Test data loading from ETL cache
   - Test data transformation logic
   - Test error handling scenarios
   - Mock ETL cache responses

2. **CategoryFilterService**
   - Test category validation
   - Test category normalization
   - Test filtering logic
   - Test edge cases (empty data, invalid categories)

3. **Shared Components**
   - Test component rendering with various data states
   - Test user interactions (pagination, filtering)
   - Test loading and error states

### Integration Tests

1. **Page-to-Service Integration**
   - Test data flow from service to page components
   - Test category filtering end-to-end
   - Test shared component integration

2. **Route-based Testing**
   - Test navigation between pages
   - Test URL parameter handling
   - Test category slug processing

### Performance Tests

1. **Data Loading Performance**
   - Measure ETL cache loading time
   - Test with large datasets
   - Verify debouncing effectiveness

2. **Filtering Performance**
   - Test category filtering with large datasets
   - Measure component re-render performance
   - Verify pagination efficiency

## Implementation Phases

### Phase 1: Core Services
- Implement `FornecedoresDataService`
- Implement `CategoryFilterService`
- Create shared data types and interfaces

### Phase 2: Shared Components
- Extract reusable components from `FornecedoresPage`
- Create component library for fornecedores functionality
- Implement error boundaries

### Phase 3: Page Refactoring
- Migrate `FornecedoresPage` to use new services
- Completely refactor `CategoriaPage` to use shared architecture
- Remove deprecated hooks and contexts

### Phase 4: Testing and Optimization
- Implement comprehensive test suite
- Performance optimization
- Error handling improvements

## Migration Strategy

### Backward Compatibility
- Maintain existing URLs and routing
- Preserve current functionality during migration
- Gradual rollout with feature flags if needed

### Data Consistency
- Ensure both pages show identical data for same filters
- Maintain consistent sorting and pagination
- Preserve user experience during transition

### Rollback Plan
- Keep current implementation as backup
- Implement feature toggle for new vs old implementation
- Monitor for regressions and performance issues