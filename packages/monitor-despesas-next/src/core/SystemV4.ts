
import { categoryRegistry, CategoryRegistry } from './categories/CategoryRegistry.js'
import { rankingEngine, RankingEngine } from './rankings/RankingEngine.js'
import { PreCalculatedRankingProvider } from './rankings/providers/PreCalculatedRankingProvider.js'
import { FallbackRankingProvider } from './rankings/providers/FallbackRankingProvider.js'

export interface SystemV4Config {
  enableCache: boolean
  
  defaultCacheTTL: number
  
  providerTimeout: number
  
  enableDebugLogs: boolean
  
  enableSyntheticData: boolean
}

const DEFAULT_CONFIG: SystemV4Config = {
  enableCache: true,
  defaultCacheTTL: 300, // 5 minutos
  providerTimeout: 5000, // 5 segundos
  enableDebugLogs: true,
  enableSyntheticData: false
}

export class SystemV4 {
  private config: SystemV4Config
  private initialized = false
  
  constructor(config: Partial<SystemV4Config> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    console.log('🚀 [SystemV4] Initializing new categorization and ranking system')
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log('✅ [SystemV4] System already initialized')
      return
    }
    
    console.log('🔧 [SystemV4] Starting system initialization...')
    
    try {
      await this.initializeCategoryRegistry()
      
      await this.initializeRankingProviders()
      
      await this.runConnectivityTests()
      
      this.initialized = true
      
      console.log('✅ [SystemV4] System initialization completed successfully')
      
      this.displaySystemStats()
      
    } catch (error) {
      console.error('❌ [SystemV4] System initialization failed:', error)
      throw error
    }
  }
  
  private async initializeCategoryRegistry(): Promise<void> {
    console.log('📊 [SystemV4] Initializing category registry...')
    
    const stats = categoryRegistry.getStats()
    
    console.log(`✅ [SystemV4] Category registry ready:`)
    console.log(`   - Total categories: ${stats.totalCategories}`)
    console.log(`   - Active categories: ${stats.activeCategories}`)
    console.log(`   - Total aliases: ${stats.totalAliases}`)
    console.log(`   - Total keywords: ${stats.totalKeywords}`)
    
    const testCases = [
      'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES',
      'locacao de carros',
      'combustivel',
      'alimentacao parlamentar'
    ]
    
    console.log('🧪 [SystemV4] Testing category matching:')
    for (const testCase of testCases) {
      const result = categoryRegistry.findCategory(testCase)
      if (result) {
        console.log(`   ✅ "${testCase}" → ${result.category.displayName} (${result.confidence.toFixed(2)})`)
      } else {
        console.log(`   ❌ "${testCase}" → No match found`)
      }
    }
  }
  
  private async initializeRankingProviders(): Promise<void> {
    console.log('🏆 [SystemV4] Initializing ranking providers...')
    
    const providers = [
      new PreCalculatedRankingProvider(),
      new FallbackRankingProvider()
    ]
    
    for (const provider of providers) {
      rankingEngine.registerProvider(provider)
    }
    
    console.log(`✅ [SystemV4] Registered ${providers.length} ranking providers`)
    
    const engineStats = rankingEngine.getStats()
    console.log(`   - Providers: ${engineStats.providersCount}`)
    console.log(`   - Cache size: ${engineStats.cacheSize}`)
  }
  
  private async runConnectivityTests(): Promise<void> {
    if (!this.config.enableDebugLogs) return
    
    console.log('🔌 [SystemV4] Running connectivity tests...')
    
    try {
      const generalRanking = await rankingEngine.getGeneralRanking(2024, 5)
      console.log(`   ✅ General ranking: ${generalRanking.entries.length} entries (${generalRanking.metadata.source})`)
      
      const categoryRanking = await rankingEngine.getCategoryRanking(1, 2024, 5) // Categoria 1 = veículos
      console.log(`   ✅ Category ranking: ${categoryRanking.entries.length} entries (${categoryRanking.metadata.source})`)
      
      const startTime = Date.now()
      await rankingEngine.getCategoryRanking(2, 2024, 10) // Categoria 2 = aeronaves
      const responseTime = Date.now() - startTime
      console.log(`   ✅ Performance test: ${responseTime}ms response time`)
      
    } catch (error) {
      console.warn('⚠️ [SystemV4] Some connectivity tests failed:', error)
    }
  }
  
  private displaySystemStats(): void {
    console.log('📈 [SystemV4] System Statistics:')
    console.log('='.repeat(50))
    
    const categoryStats = categoryRegistry.getStats()
    console.log('📊 Categories:')
    console.log(`   - Total: ${categoryStats.totalCategories}`)
    console.log(`   - Active: ${categoryStats.activeCategories}`)
    console.log(`   - Aliases: ${categoryStats.totalAliases}`)
    
    const rankingStats = rankingEngine.getStats()
    console.log('🏆 Rankings:')
    console.log(`   - Providers: ${rankingStats.providersCount}`)
    console.log(`   - Cache entries: ${rankingStats.cacheSize}`)
    
    console.log('⚙️ Configuration:')
    console.log(`   - Cache enabled: ${this.config.enableCache}`)
    console.log(`   - Cache TTL: ${this.config.defaultCacheTTL}s`)
    console.log(`   - Debug logs: ${this.config.enableDebugLogs}`)
    
    console.log('='.repeat(50))
  }
  
  
  cleanup(): void {
    console.log('🧹 [SystemV4] Cleaning up system resources...')
    
    rankingEngine.clearCache()
    
    console.log('✅ [SystemV4] Cleanup completed')
  }
  
  isReady(): boolean {
    return this.initialized
  }
  
  getConfig(): SystemV4Config {
    return { ...this.config }
  }
}

export const systemV4 = new SystemV4()

export const SystemV4Utils = {
  ensureInitialized: async (): Promise<void> => {
    if (!systemV4.isReady()) {
      await systemV4.initialize()
    }
  },
  
  findCategory: (text: string) => categoryRegistry.findCategory(text),
  
  getRanking: async (categoryId?: number, year?: number, limit?: number) => {
    await SystemV4Utils.ensureInitialized()
    
    if (categoryId) {
      return rankingEngine.getCategoryRanking(categoryId, year, limit)
    } else {
      return rankingEngine.getGeneralRanking(year, limit)
    }
  },
  
  getActiveCategories: () => categoryRegistry.getAllActive(),
  

  getSystemStats: () => ({
    categories: categoryRegistry.getStats(),
    rankings: rankingEngine.getStats(),
    ready: systemV4.isReady()
  })
}

export {
  categoryRegistry,
  rankingEngine,
  CategoryRegistry,
  RankingEngine
}