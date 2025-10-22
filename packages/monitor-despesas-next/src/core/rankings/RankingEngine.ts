
import { CategoryDefinition, categoryRegistry } from '../categories/CategoryRegistry.js'

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
  maxAge?: number // em segundos
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
  
  constructor() {
    console.log('🏆 [RankingEngine] Initializing ranking engine v4')
  }
  
  registerProvider(provider: DataProvider): void {
    const insertIndex = this.providers.findIndex(p => p.priority < provider.priority)
    
    if (insertIndex === -1) {
      this.providers.push(provider)
    } else {
      this.providers.splice(insertIndex, 0, provider)
    }
    
    console.log(`✅ [RankingEngine] Registered provider: ${provider.name} (priority: ${provider.priority})`)
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
    
    console.log('🔍 [RankingEngine] Executing query:', query)
    
    if (query.useCache !== false) {
      const cached = this.getCachedResult(cacheKey, query.maxAge || 300) // 5 min default
      if (cached) {
        console.log('📦 [RankingEngine] Returning cached result')
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            source: 'cached',
            processingTime: Date.now() - startTime
          }
        }
      }
    }
    
    const availableProviders = this.providers.filter(p => p.canProvide(query))
    
    console.log(`🔄 [RankingEngine] Found ${availableProviders.length} available providers`)
    
    for (const provider of availableProviders) {
      try {
        console.log(`🚀 [RankingEngine] Trying provider: ${provider.name}`)
        
        const result = await provider.fetchData(query)
        
        if (result) {
          const processingTime = Date.now() - startTime
          
          result.metadata.processingTime = processingTime
          
          if (query.useCache !== false && result.metadata.dataQuality !== 'low') {
            this.cacheResult(cacheKey, result, query.maxAge || 300)
          }
          
          console.log(`✅ [RankingEngine] Success with provider: ${provider.name} (${processingTime}ms)`)
          return result
        }
      } catch (error) {
        console.warn(`⚠️ [RankingEngine] Provider ${provider.name} failed:`, error)
      }
    }
    
    console.log('🔄 [RankingEngine] All providers failed, returning empty result')
    
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
    this.cache.set(key, {
      data: result,
      timestamp: Date.now(),
      maxAge
    })
    
    if (this.cache.size > 1000) {
      this.cleanupCache()
    }
  }
  
  private cleanupCache(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((value, key) => {
      const age = (now - value.timestamp) / 1000
      if (age > value.maxAge) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
    
    console.log(`🧹 [RankingEngine] Cleaned up ${keysToDelete.length} expired cache entries`)
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
  
  
  async getGeneralRanking(year?: number, limit: number = 100): Promise<RankingResult> {
    return this.executeQuery({
      year,
      limit,
      orderBy: 'amount',
      orderDirection: 'desc',
      useCache: true
    })
  }
  
  async getCategoryRanking(categoryId: number, year?: number, limit: number = 100): Promise<RankingResult> {
    return this.executeQuery({
      categoryId,
      year,
      limit,
      orderBy: 'amount',
      orderDirection: 'desc',
      useCache: true
    })
  }
  
  async getStateRanking(state: string, year?: number, limit: number = 100): Promise<RankingResult> {
    return this.executeQuery({
      states: [state],
      year,
      limit,
      orderBy: 'amount',
      orderDirection: 'desc',
      useCache: true
    })
  }
  
  async getPartyRanking(party: string, year?: number, limit: number = 100): Promise<RankingResult> {
    return this.executeQuery({
      parties: [party],
      year,
      limit,
      orderBy: 'amount',
      orderDirection: 'desc',
      useCache: true
    })
  }
  
  getStats(): {
    providersCount: number
    cacheSize: number
    cacheHitRate: number
  } {
    return {
      providersCount: this.providers.length,
      cacheSize: this.cache.size,
      cacheHitRate: 0 // TODO: implementar tracking de hit rate
    }
  }
  
  clearCache(): void {
    this.cache.clear()
    console.log('🗑️ [RankingEngine] Cache cleared')
  }
  
  getProviders(): { name: string, priority: number }[] {
    return this.providers.map(p => ({ name: p.name, priority: p.priority }))
  }
}

export const rankingEngine = new RankingEngine()

export const RankingUtils = {
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  },
  
  formatNumber: (num: number): string => {
    return new Intl.NumberFormat('pt-BR').format(num)
  },
  
  calculatePercentageChange: (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  },
  
  determineTrend: (currentPos: number, previousPos?: number): 'up' | 'down' | 'stable' => {
    if (!previousPos) return 'stable'
    if (currentPos < previousPos) return 'up' // Posição menor = melhor no ranking
    if (currentPos > previousPos) return 'down'
    return 'stable'
  }
}