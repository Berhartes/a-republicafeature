import { CategoryDefinition, categoryRegistry } from './categories/CategoryRegistry'

export interface DeputyData {
  id: string
  name: string
  civilName: string
  party: string
  state: string
  photoUrl?: string
  totalAmount: number
  transactionCount: number
  supplierCount: number
  lastUpdate: Date
  dataQuality: 'high' | 'medium' | 'low'
}

export interface RankingEntry {
  deputy: DeputyData
  position: number
  categoryId?: number
  year?: number
  percentageOfTotal: number
  averageTransaction: number
  trend?: 'up' | 'down' | 'stable'
  previousPosition?: number
}

export interface RankingResult {
  entries: RankingEntry[]
  metadata: {
    categoryId?: number
    categoryName?: string
    year?: number
    period: string
    totalDeputies: number
    totalAmount: number
    totalTransactions: number
    dataQuality: 'high' | 'medium' | 'low'
    confidence: number
    lastUpdate: Date
    source: 'real-time' | 'pre-calculated' | 'cached' | 'fallback'
    processingTime: number
  }
}

export interface RankingQuery {
  categoryId?: number
  year?: number
  deputyIds?: string[]
  states?: string[]
  parties?: string[]
  limit?: number
  offset?: number
  orderBy?: 'amount' | 'transactions' | 'suppliers'
  orderDirection?: 'asc' | 'desc'
  useCache?: boolean
  maxAge?: number
}

export interface DataProvider {
  name: string
  priority: number
  canProvide(query: RankingQuery): boolean
  fetchData(query: RankingQuery): Promise<RankingResult | null>
  estimateResponseTime(query: RankingQuery): number
}

export class RankingEngine {
  private providers: DataProvider[] = []
  private cache: Map<string, { data: RankingResult, timestamp: number, maxAge: number }> = new Map()

  constructor() {}

  registerProvider(provider: DataProvider): void {
    const insertIndex = this.providers.findIndex(p => p.priority < provider.priority)
    if (insertIndex === -1) this.providers.push(provider)
    else this.providers.splice(insertIndex, 0, provider)
  }

  private generateCacheKey(query: RankingQuery): string {
    const parts = [
      'ranking',
      query.categoryId || 'all',
      query.year || 'all',
      query.limit || 'unlimited',
      query.offset || 0,
      query.orderBy || 'amount',
      query.orderDirection || 'desc',
      (query.deputyIds || []).sort().join(','),
      (query.states || []).sort().join(','),
      (query.parties || []).sort().join(',')
    ]
    return parts.join(':')
  }

  async executeQuery(query: RankingQuery): Promise<RankingResult> {
    const startTime = Date.now()
    const cacheKey = this.generateCacheKey(query)
    if (query.useCache !== false) {
      const cached = this.getCachedResult(cacheKey, query.maxAge || 300)
      if (cached) {
        return { ...cached, metadata: { ...cached.metadata, source: 'cached', processingTime: Date.now() - startTime } }
      }
    }
    const availableProviders = this.providers.filter(p => p.canProvide(query))
    for (const provider of availableProviders) {
      try {
        const result = await provider.fetchData(query)
        if (result) {
          const processingTime = Date.now() - startTime
          result.metadata.processingTime = processingTime
          if (query.useCache !== false && result.metadata.dataQuality !== 'low') {
            this.cacheResult(cacheKey, result, query.maxAge || 300)
          }
          return result
        }
      } catch {}
    }
    return this.createEmptyResult(query, Date.now() - startTime)
  }

  private getCachedResult(key: string, maxAge: number): RankingResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null
    const age = (Date.now() - cached.timestamp) / 1000
    if (age > cached.maxAge) {
      this.cache.delete(key)
      return null
    }
    return cached.data
  }

  private cacheResult(key: string, result: RankingResult, maxAge: number): void {
    this.cache.set(key, { data: result, timestamp: Date.now(), maxAge })
    if (this.cache.size > 1000) this.cleanupCache()
  }

  private cleanupCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    this.cache.forEach((value, key) => {
      const age = (now - value.timestamp) / 1000
      if (age > value.maxAge) keysToDelete.push(key)
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  private createEmptyResult(query: RankingQuery, processingTime: number): RankingResult {
    const category = query.categoryId ? categoryRegistry.getById(query.categoryId) : undefined
    return {
      entries: [],
      metadata: {
        categoryId: query.categoryId,
        categoryName: category?.displayName,
        year: query.year,
        period: query.year ? query.year.toString() : 'all',
        totalDeputies: 0,
        totalAmount: 0,
        totalTransactions: 0,
        dataQuality: 'low',
        confidence: 0,
        lastUpdate: new Date(),
        source: 'fallback',
        processingTime
      }
    }
  }
}

export const rankingEngine = new RankingEngine()

export const RankingUtils = {
  formatCurrency: (amount: number): string => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount),
  formatNumber: (num: number): string => new Intl.NumberFormat('pt-BR').format(num),
  calculatePercentageChange: (current: number, previous: number): number => previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100,
  determineTrend: (currentPos: number, previousPos?: number): 'up' | 'down' | 'stable' => {
    if (!previousPos) return 'stable'
    if (currentPos < previousPos) return 'up'
    if (currentPos > previousPos) return 'down'
    return 'stable'
  }
}


