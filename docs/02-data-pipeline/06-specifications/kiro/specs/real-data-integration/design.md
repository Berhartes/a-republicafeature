# Design: Complete Mock Data Elimination and Real Data Integration

## Overview

Este documento descreve o design para eliminar completamente todos os dados mock do projeto Monitor Despesas e integrar todos os componentes com dados reais dos caches materializados. O design foca em aproveitar a arquitetura de caches unificada existente, garantindo integração completa de dados em todas as páginas e componentes.

## Architecture

### Current State Analysis

**Problemas Identificados:**
- Componentes como `DeputadosCategoriaPage`, `TransacoesCategoriaPage` usam `Math.random()` para dados fake
- Muitas páginas não se conectam aos caches materializados existentes
- Arquitetura inconsistente para carregamento de dados
- Várias páginas mostram "Em desenvolvimento" ao invés de funcionalidade real
- Dados mock em loops e arrays hardcoded em vários componentes

**Assets Existentes:**
- Sistema robusto de caches materializados já funcional
- `suppliers-cache.json`, `deputies-cache.json`, `rankings-cache.json` já gerados
- Caches individuais `deputy-{id}.json`, `supplier-{cnpj}.json` já funcionais
- `caches-manifest.json` com metadados dos caches
- Processo de materialização `materialize_monitordespesasDf.py` já implementado

### Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  All Pages Connected to Real Data                          │
│  ├── /gastos/deputados (🔄 connect to deputies-cache)     │
│  ├── /gastos/fornecedores (🔄 connect to suppliers-cache) │
│  ├── /gastos/premiacoes (🔄 connect to rankings-cache)    │
│  ├── /gastos/categoria/* (🔄 eliminate mock data)         │
│  ├── /gastos/analise-avancada (🔄 connect to caches)      │
│  ├── /gastos/relatorios (🔄 connect to caches)            │
│  └── /gastos/dashboards (🔄 connect to caches)            │
├─────────────────────────────────────────────────────────────┤
│  Unified Cache Services Layer                               │
│  ├── CacheService (🔄 process existing caches)            │
│  ├── CategoryDataService (🔄 process by category)         │
│  ├── DeputyDataService (🔄 process deputy caches)         │
│  ├── SupplierDataService (✓ existing, enhance)            │
│  └── RankingDataService (🔄 process ranking caches)       │
├─────────────────────────────────────────────────────────────┤
│  Existing Materialized Cache System                        │
│  ├── suppliers-cache.json (✓ existing, enhance)           │
│  ├── deputies-cache.json (✓ existing, enhance)            │
│  ├── rankings-cache.json (✓ existing)                     │
│  ├── deputy-{id}.json (✓ existing, enhance)               │
│  ├── supplier-{cnpj}.json (✓ existing, enhance)           │
│  └── caches-manifest.json (✓ existing)                    │
└─────────────────────────────────────────────────────────────┘
```

## Design Principles

### 1. Unified Data Architecture
- **Single Source of Truth**: Todos os dados vêm do sistema de caches materializados
- **Padrões Consistentes**: Abordagem padronizada para carregamento de dados em todos os componentes
- **Hierarquia de Cache**: Uso eficiente de caches globais (suppliers-cache.json) e individuais (deputy-{id}.json)
- **Estratégia de Fallback**: Degradação graciosa quando caches não estão disponíveis

### 2. Performance-First Design
- **Progressive Loading**: Carregar dados essenciais primeiro, secundários em background
- **Cache Inteligente**: Cache local com invalidação baseada em timestamp
- **Lazy Loading**: Carregar dados apenas quando necessário (abas, páginas)
- **Queries Otimizadas**: Filtragem e agregação eficiente de dados

### 3. Maintainable Architecture
- **Service Layer**: Serviços dedicados para processamento de cache
- **Interfaces Consistentes**: Props e estruturas de dados padronizadas
- **Componentes Reutilizáveis**: Componentes base para funcionalidade comum
- **Separação Clara**: Lógica de dados separada da lógica de apresentação

## Components and Interfaces

### 1. Enhanced Cache Processing

**Existing Cache Structure to Leverage:**

```typescript
// suppliers-cache.json (existing, to be enhanced)
interface SupplierCache {
  suppliers: {
    cnpj: string
    name: string
    categories: {
      [category: string]: {
        totalAmount: number
        transactionCount: number
        evolution: {
          [year: string]: { [month: string]: number }
        }
        deputies: Array<{ id: string, amount: number }>
        suspicionScore: number
      }
    }
    totalRevenue: number
    suspicionScore: number
  }[]
  metadata: {
    generatedAt: string
    dataRange: { start: string, end: string }
  }
}

// deputies-cache.json (existing, to be enhanced)
interface DeputyCache {
  deputies: {
    id: string
    name: string
    party: string
    state: string
    categories: {
      [category: string]: {
        totalSpending: number
        transactionCount: number
        ranking: number
        evolution: {
          [year: string]: { [month: string]: number }
        }
        suppliers: Array<{ cnpj: string, amount: number }>
      }
    }
    totalSpending: number
    suspicionScore: number
  }[]
  metadata: {
    generatedAt: string
    dataRange: { start: string, end: string }
  }
}

// deputy-{id}.json (existing individual caches)
interface IndividualDeputyCache {
  basicInfo: {
    id: string
    name: string
    party: string
    state: string
  }
  transactions: {
    id: string
    date: string
    amount: number
    description: string
    category: string
    supplierCnpj: string
    supplierName: string
    suspicionScore: number
  }[]
  spendingEvolution: {
    [year: string]: {
      [month: string]: {
        total: number
        byCategory: { [category: string]: number }
      }
    }
  }
  supplierRelationships: {
    cnpj: string
    name: string
    totalAmount: number
    exclusivity: number
    suspicionScore: number
  }[]
}

// supplier-{cnpj}.json (existing individual caches)
interface IndividualSupplierCache {
  basicInfo: {
    cnpj: string
    name: string
    category: string
  }
  transactions: {
    id: string
    date: string
    amount: number
    description: string
    category: string
    deputyId: string
    deputyName: string
    suspicionScore: number
  }[]
  revenueEvolution: {
    [year: string]: {
      [month: string]: {
        total: number
        byCategory: { [category: string]: number }
      }
    }
  }
  deputyRelationships: {
    id: string
    name: string
    party: string
    state: string
    totalAmount: number
    exclusivity: number
    suspicionScore: number
  }[]
}

// rankings-cache.json (existing)
interface RankingCache {
  rankings: {
    type: 'deputy' | 'supplier' | 'category'
    period: string
    data: {
      id: string
      name: string
      value: number
      rank: number
      change: number
    }[]
  }[]
  metadata: {
    generatedAt: string
    period: string
  }
}
```

### 2. Cache Processing Services

**Core Cache Service:**
```typescript
export class CacheService {
  // Core cache loading
  async loadSupplierCache(): Promise<SupplierCache>
  async loadDeputyCache(): Promise<DeputyCache>
  async loadRankingCache(): Promise<RankingCache>
  async loadIndividualDeputy(id: string): Promise<IndividualDeputyCache>
  async loadIndividualSupplier(cnpj: string): Promise<IndividualSupplierCache>
  
  // Cache management
  getCacheTimestamp(cacheType: CacheType): Date
  invalidateCache(cacheType: CacheType): void
  isCacheStale(cacheType: CacheType): boolean
}

export class CategoryDataService {
  constructor(private cacheService: CacheService) {}
  
  // Category-specific data processing from existing caches
  async getDeputiesByCategory(category: string): Promise<DeputyData[]>
  async getTransactionsByCategory(category: string): Promise<Transaction[]>
  async getEvolutionByCategory(category: string): Promise<EvolutionData>
  async getRelationshipsByCategory(category: string): Promise<RelationshipData>
  async getAlertsByCategory(category: string): Promise<AlertData[]>
}

export class DeputyDataService {
  constructor(private cacheService: CacheService) {}
  
  async getAllDeputies(): Promise<DeputyData[]>
  async getDeputyById(id: string): Promise<DeputyData>
  async getDeputyRankings(): Promise<DeputyRanking[]>
  async getDeputyEvolution(id: string): Promise<EvolutionData>
}

export class SupplierDataService {
  constructor(private cacheService: CacheService) {}
  
  async getAllSuppliers(): Promise<SupplierData[]>
  async getSupplierByCnpj(cnpj: string): Promise<SupplierData>
  async getSupplierRankings(): Promise<SupplierRanking[]>
  async getSupplierEvolution(cnpj: string): Promise<EvolutionData>
}
```

### 3. Component Integration Strategy

**Category Pages (Eliminate Mock Data):**
- **DeputadosCategoriaPage**: Remove Math.random(), connect to deputies-cache.json
- **TransacoesCategoriaPage**: Remove fake loops, connect to individual deputy caches
- **EvolucaoCategoriaPage**: Remove mock evolution, connect to suppliers-cache evolution data
- **RelacoesCategoriaPage**: Remove placeholders, connect to relationship data from caches
- **AlertasCategoriaPage**: Remove placeholders, connect to suspicion scores from caches

**Main Pages (Connect to Real Data):**
- **/gastos/deputados**: Connect to deputies-cache.json for real deputy data
- **/gastos/fornecedores**: Connect to suppliers-cache.json for real supplier data
- **/gastos/premiacoes**: Connect to rankings-cache.json for real ranking data
- **/gastos/analise-avancada**: Connect to all caches for comprehensive analysis
- **/gastos/relatorios**: Connect to caches for real report generation

**Individual Profile Pages:**
- **Deputy profiles**: Connect to individual deputy-{id}.json caches
- **Supplier profiles**: Connect to individual supplier-{cnpj}.json caches
- **Category profiles**: Process data from global caches by category

**Data Loading Pattern:**
```typescript
const useRealData = <T>(loader: () => Promise<T>) => {
  const [state, setState] = useState<DataState<T>>({
    data: null,
    loading: true,
    error: null,
    cacheAge: null
  })
  
  useEffect(() => {
    loader()
      .then(data => setState({ 
        data, 
        loading: false, 
        error: null, 
        cacheAge: new Date() 
      }))
      .catch(error => setState({ 
        data: null, 
        loading: false, 
        error, 
        cacheAge: null 
      }))
  }, [])
  
  return state
}
```

## Implementation Strategy

### Phase 1: Immediate Mock Data Elimination

#### Category Pages Conversion
```typescript
// Before: Mock data generation in DeputadosCategoriaPage
const mockDeputados = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  nome: `Deputado ${i + 1}`,
  valor: Math.random() * 1000000
}))

// After: Real data loading
const { data: deputados, loading, error } = useRealData(() => 
  categoryDataService.getDeputiesByCategory(categoria)
)

// Before: Mock transactions in TransacoesCategoriaPage
const mockTransacoes = Array.from({ length: 100 }, (_, i) => ({
  id: i,
  valor: Math.random() * 50000,
  data: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
}))

// After: Real transactions
const { data: transacoes, loading, error } = useRealData(() => 
  categoryDataService.getTransactionsByCategory(categoria)
)
```

#### Service Implementation
```typescript
class CategoryDataService {
  constructor(private cacheService: CacheService) {}
  
  async getDeputiesByCategory(category: string): Promise<DeputyData[]> {
    const deputyCache = await this.cacheService.loadDeputyCache()
    return deputyCache.deputies
      .filter(deputy => deputy.categories[category])
      .sort((a, b) => (b.categories[category]?.totalSpending || 0) - (a.categories[category]?.totalSpending || 0))
  }
  
  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    const deputyCache = await this.cacheService.loadDeputyCache()
    const transactions: Transaction[] = []
    
    for (const deputy of deputyCache.deputies) {
      if (deputy.categories[category]) {
        const individualData = await this.cacheService.loadIndividualDeputy(deputy.id)
        const categoryTransactions = individualData.transactions
          .filter(t => t.category === category)
        transactions.push(...categoryTransactions)
      }
    }
    
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }
}
```

### Phase 2: Enhanced Materialization

#### Cache Structure Enhancement
```python
# Enhanced suppliers-cache.json structure
def generate_enhanced_supplier_cache(df_suppliers, df_transactions):
    cache = {
        "suppliers": [],
        "metadata": {
            "generatedAt": datetime.now().isoformat(),
            "categories": get_all_categories(df_transactions)
        }
    }
    
    for supplier_cnpj in df_suppliers['cnpj'].unique():
        supplier_data = process_supplier_by_categories(
            supplier_cnpj, df_suppliers, df_transactions
        )
        cache["suppliers"].append(supplier_data)
    
    return cache

def process_supplier_by_categories(cnpj, df_suppliers, df_transactions):
    supplier_transactions = df_transactions[df_transactions['cnpj'] == cnpj]
    categories_data = {}
    
    for category in supplier_transactions['category'].unique():
        category_transactions = supplier_transactions[
            supplier_transactions['category'] == category
        ]
        
        categories_data[category] = {
            "totalAmount": category_transactions['amount'].sum(),
            "transactionCount": len(category_transactions),
            "evolution": calculate_monthly_evolution(category_transactions),
            "deputies": get_deputy_relationships(category_transactions),
            "suspicionScore": calculate_suspicion_score(category_transactions)
        }
    
    return {
        "cnpj": cnpj,
        "name": df_suppliers[df_suppliers['cnpj'] == cnpj]['name'].iloc[0],
        "categories": categories_data
    }
```

### Phase 3: Complete Project Integration

#### Main Pages Integration
```typescript
// /gastos/deputados page
const DeputadosPage = () => {
  const { data: deputados, loading, error } = useRealData(() => 
    cacheService.loadDeputyCache()
  )
  
  if (loading) return <DeputadosPageSkeleton />
  if (error) return <ErrorState error={error} retry={() => window.location.reload()} />
  
  return (
    <DeputadosPageLayout>
      <DeputadosRanking deputados={deputados.deputies} />
      <DeputadosFilters onFilter={handleFilter} />
      <DeputadosStats stats={deputados.statistics} />
    </DeputadosPageLayout>
  )
}

// /gastos/premiacoes page
const PremiacoesPage = () => {
  const { data: rankings, loading, error } = useRealData(() => 
    cacheService.loadRankingCache()
  )
  
  return (
    <PremiacoesPageLayout>
      <RankingsList rankings={rankings.rankings} />
      <RankingFilters onFilter={handleFilter} />
      <RankingCharts data={rankings.chartData} />
    </PremiacoesPageLayout>
  )
}
```

#### Individual Profile Pages
```typescript
// Deputy profile page
const DeputyProfilePage = ({ deputyId }: { deputyId: string }) => {
  const { data: deputy, loading, error } = useRealData(() => 
    cacheService.loadIndividualDeputy(deputyId)
  )
  
  return (
    <ProfileLayout>
      <DeputyHeader deputy={deputy.basicInfo} />
      <DeputySpendingChart data={deputy.spendingEvolution} />
      <DeputyTransactionsList transactions={deputy.transactions} />
      <DeputyRelationships relationships={deputy.supplierRelationships} />
    </ProfileLayout>
  )
}

// Supplier profile page
const SupplierProfilePage = ({ cnpj }: { cnpj: string }) => {
  const { data: supplier, loading, error } = useRealData(() => 
    cacheService.loadIndividualSupplier(cnpj)
  )
  
  return (
    <ProfileLayout>
      <SupplierHeader supplier={supplier.basicInfo} />
      <SupplierRevenueChart data={supplier.revenueEvolution} />
      <SupplierDeputiesList deputies={supplier.deputyRelationships} />
      <SupplierAlerts alerts={supplier.alerts} />
    </ProfileLayout>
  )
}
```

## Error Handling and Reliability

### Cache Availability Strategy
```typescript
class RobustCacheService {
  private localCache = new Map<string, { data: any, timestamp: Date }>()
  
  async loadWithFallback<T>(cacheKey: string, loader: () => Promise<T>): Promise<T> {
    try {
      // Try to load from remote cache
      const data = await loader()
      this.localCache.set(cacheKey, { data, timestamp: new Date() })
      return data
    } catch (error) {
      // Fallback to local cache if available
      const cached = this.localCache.get(cacheKey)
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.warn(`Using cached data for ${cacheKey}`, error)
        return cached.data
      }
      
      // If no valid cache, throw error
      throw new Error(`Failed to load ${cacheKey} and no valid cache available`)
    }
  }
  
  private isCacheValid(timestamp: Date): boolean {
    const maxAge = 60 * 60 * 1000 // 1 hour
    return Date.now() - timestamp.getTime() < maxAge
  }
}
```

### Error Boundary Implementation
```typescript
const DataErrorBoundary = ({ children, fallback }: { 
  children: React.ReactNode
  fallback: React.ComponentType<{ error: Error, retry: () => void }>
}) => {
  const [error, setError] = useState<Error | null>(null)
  
  const retry = useCallback(() => {
    setError(null)
    // Trigger re-render of children
  }, [])
  
  if (error) {
    return React.createElement(fallback, { error, retry })
  }
  
  return (
    <ErrorBoundary onError={setError}>
      {children}
    </ErrorBoundary>
  )
}
```

## Performance Optimization

### Progressive Loading Strategy
```typescript
const useProgressiveData = <T>(loaders: (() => Promise<T>)[]) => {
  const [states, setStates] = useState<DataState<T>[]>(
    loaders.map(() => ({ data: null, loading: true, error: null }))
  )
  
  useEffect(() => {
    // Load essential data first
    loaders[0]()
      .then(data => updateState(0, { data, loading: false, error: null }))
      .catch(error => updateState(0, { data: null, loading: false, error }))
    
    // Load secondary data in background
    setTimeout(() => {
      loaders.slice(1).forEach((loader, index) => {
        loader()
          .then(data => updateState(index + 1, { data, loading: false, error: null }))
          .catch(error => updateState(index + 1, { data: null, loading: false, error }))
      })
    }, 100)
  }, [])
  
  return states
}
```

### Intelligent Caching
```typescript
class IntelligentCache {
  private cache = new Map<string, CacheEntry>()
  
  async get<T>(key: string, loader: () => Promise<T>, ttl: number = 300000): Promise<T> {
    const entry = this.cache.get(key)
    
    if (entry && Date.now() - entry.timestamp < ttl) {
      return entry.data
    }
    
    const data = await loader()
    this.cache.set(key, { data, timestamp: Date.now() })
    return data
  }
  
  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}
```

## Testing Strategy

### Component Testing with Real Data
```typescript
describe('DeputadosCategoriaPage', () => {
  it('should load and display real deputy data', async () => {
    const mockCacheService = {
      loadDeputyCache: jest.fn().mockResolvedValue({
        deputies: [{ id: '123', name: 'Real Deputy', categories: { ALIMENTACAO: { totalSpending: 50000 } } }]
      })
    }
    
    render(
      <CacheServiceProvider value={mockCacheService}>
        <DeputadosCategoriaPage categoria="ALIMENTACAO" />
      </CacheServiceProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Real Deputy')).toBeInTheDocument()
      expect(screen.getByText('R$ 50.000,00')).toBeInTheDocument()
    })
  })
  
  it('should handle cache loading errors gracefully', async () => {
    const mockCacheService = {
      loadDeputyCache: jest.fn().mockRejectedValue(new Error('Cache unavailable'))
    }
    
    render(
      <CacheServiceProvider value={mockCacheService}>
        <DeputadosCategoriaPage categoria="ALIMENTACAO" />
      </CacheServiceProvider>
    )
    
    await waitFor(() => {
      expect(screen.getByText(/erro ao carregar dados/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeInTheDocument()
    })
  })
})
```

### Integration Testing
```typescript
describe('Cache Integration', () => {
  it('should load data from actual cache files', async () => {
    const cacheService = new CacheService()
    const data = await cacheService.loadSupplierCache()
    
    expect(data).toBeDefined()
    expect(data.suppliers).toBeInstanceOf(Array)
    expect(data.suppliers.length).toBeGreaterThan(0)
    expect(data.metadata.generatedAt).toBeDefined()
  })
})
```

## Monitoring and Observability

### Performance Monitoring
```typescript
class PerformanceMonitor {
  static trackCacheLoad(cacheType: string, startTime: number) {
    const duration = Date.now() - startTime
    console.log(`Cache load: ${cacheType} took ${duration}ms`)
    
    // Send to analytics
    analytics.track('cache_load', {
      cacheType,
      duration,
      timestamp: new Date().toISOString()
    })
  }
  
  static trackError(error: Error, context: string) {
    console.error(`Error in ${context}:`, error)
    
    // Send to error tracking
    errorTracking.captureException(error, { context })
  }
}
```

### Health Monitoring
```typescript
const CacheHealthMonitor = () => {
  const [health, setHealth] = useState<CacheHealth>({})
  
  useEffect(() => {
    const checkHealth = async () => {
      const checks = await Promise.allSettled([
        cacheService.loadSupplierCache(),
        cacheService.loadDeputyCache(),
        cacheService.loadRankingCache()
      ])
      
      setHealth({
        suppliers: checks[0].status === 'fulfilled',
        deputies: checks[1].status === 'fulfilled',
        rankings: checks[2].status === 'fulfilled',
        lastCheck: new Date()
      })
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <HealthDashboard health={health} />
  )
}
```

## Migration Strategy

### Gradual Migration Approach
1. **Phase 1**: Convert category pages (immediate impact)
2. **Phase 2**: Enhance materialization (better data)
3. **Phase 3**: Convert main pages (broader impact)
4. **Phase 4**: Convert remaining pages (complete coverage)
5. **Phase 5**: Optimize and monitor (performance)

### Risk Mitigation
- **Feature Flags**: Enable/disable real data integration per page
- **Rollback Strategy**: Keep mock data as fallback during transition
- **Monitoring**: Comprehensive error tracking and performance monitoring
- **Testing**: Extensive testing with real data before deployment

## Success Metrics

### Technical Metrics
- **Zero Mock Data**: No `Math.random()` or hardcoded arrays in components
- **Cache Coverage**: 100% of pages connected to real caches
- **Performance**: Page load times within acceptable limits
- **Error Rate**: < 1% error rate for cache loading operations

### User Experience Metrics
- **Data Accuracy**: All displayed data matches source data
- **Responsiveness**: All interactions respond within 500ms
- **Reliability**: 99.9% uptime for data loading functionality
- **Usability**: No user-facing errors due to data integration issues

This design provides a comprehensive roadmap for eliminating all mock data and achieving complete integration with the materialized cache system, ensuring a robust, performant, and maintainable application ready for production use.