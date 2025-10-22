
import { useState, useEffect, useCallback, useMemo } from 'react'
import { SystemV4Utils } from '@/core/SystemV4'
import { CategoryDefinition } from '@/core/categories/CategoryRegistry'
import { RankingResult, RankingQuery } from '@/core/rankings/RankingEngine'

export interface UseSystemV4Options {
  autoInitialize?: boolean
  
  defaultCacheEnabled?: boolean
  
  defaultCacheTTL?: number
}

export interface UseSystemV4Result {
  isReady: boolean
  isInitializing: boolean
  initError: string | null
  
  categories: CategoryDefinition[]
  findCategory: (text: string) => CategoryDefinition | null
  
  getRanking: (options: Omit<RankingQuery, 'useCache' | 'maxAge'>) => Promise<RankingResult>
  
  stats: ReturnType<typeof SystemV4Utils.getSystemStats>
  
  initialize: () => Promise<void>
  refresh: () => void
}

export const useSystemV4 = (options: UseSystemV4Options = {}): UseSystemV4Result => {
  const {
    autoInitialize = true,
    defaultCacheEnabled: _defaultCacheEnabled = true,
    defaultCacheTTL: _defaultCacheTTL = 300
  } = options
  
  const [isReady, setIsReady] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  const [stats, setStats] = useState(SystemV4Utils.getSystemStats())
  
  const initialize = useCallback(async () => {
    if (isInitializing || isReady) return
    
    setIsInitializing(true)
    setInitError(null)
    
    try {
      console.log('🪝 [useSystemV4] Initializing system...')
      
      await SystemV4Utils.ensureInitialized()
      
      const activeCategories = SystemV4Utils.getActiveCategories()
      setCategories(activeCategories)
      
      setStats(SystemV4Utils.getSystemStats())
      
      setIsReady(true)
      console.log('✅ [useSystemV4] System initialized successfully')
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setInitError(errorMessage)
      console.error('❌ [useSystemV4] Initialization failed:', error)
    } finally {
      setIsInitializing(false)
    }
  }, [isInitializing, isReady])
  
  const refresh = useCallback(() => {
    if (!isReady) return
    
    console.log('🔄 [useSystemV4] Refreshing data...')
    
    const activeCategories = SystemV4Utils.getActiveCategories()
    setCategories(activeCategories)
    
    setStats(SystemV4Utils.getSystemStats())
  }, [isReady])
  
  useEffect(() => {
    if (autoInitialize && !isReady && !isInitializing) {
      initialize()
    }
  }, [autoInitialize, isReady, isInitializing, initialize])
  
  const findCategory = useCallback((text: string): CategoryDefinition | null => {
    const result = SystemV4Utils.findCategory(text)
    return result ? result.category : null
  }, [])
  
  const getRanking = useCallback(async (options: Omit<RankingQuery, 'useCache' | 'maxAge'>): Promise<RankingResult> => {
    if (!isReady) {
      throw new Error('System not ready. Call initialize() first.')
    }
    
    return SystemV4Utils.getRanking(
      options.categoryId,
      options.year,
      options.limit
    )
  }, [isReady])
  
  return {
    isReady,
    isInitializing,
    initError,
    
    categories,
    stats,
    
    findCategory,
    getRanking,
    initialize,
    refresh
  }
}

export const useRanking = (query: RankingQuery) => {
  const [ranking, setRanking] = useState<RankingResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { getRanking, isReady } = useSystemV4()
  
  useEffect(() => {
    if (!isReady) return
    
    const fetchRanking = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('🪝 [useRanking] Fetching ranking:', query)
        
        const result = await getRanking(query)
        setRanking(result)
        
        console.log(`✅ [useRanking] Ranking fetched: ${result.entries.length} entries`)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ranking'
        setError(errorMessage)
        console.error('❌ [useRanking] Error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRanking()
  }, [getRanking, isReady, JSON.stringify(query)])
  
  const reload = useCallback(() => {
    if (!isReady) return
    
    const fetchRanking = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await getRanking(query)
        setRanking(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch ranking'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRanking()
  }, [getRanking, isReady, query])
  
  return {
    ranking,
    loading,
    error,
    reload
  }
}

export const useCategory = (categoryId?: number) => {
  const { categories, isReady } = useSystemV4()
  
  const category = useMemo(() => {
    if (!categoryId || !isReady) return null
    return categories.find(c => c.id === categoryId) || null
  }, [categories, categoryId, isReady])
  
  return {
    category,
    isReady
  }
}

export const useCategories = (categoryIds?: number[]) => {
  const { categories, isReady } = useSystemV4()
  
  const selectedCategories = useMemo(() => {
    if (!categoryIds?.length || !isReady) return []
    return categories.filter(c => categoryIds.includes(c.id))
  }, [categories, categoryIds, isReady])
  
  return {
    categories: selectedCategories,
    allCategories: categories,
    isReady
  }
}

export const useRankingFilters = () => {
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [year, setYear] = useState<number | undefined>()
  const [limit, setLimit] = useState<number>(100)
  const [orderBy, setOrderBy] = useState<'amount' | 'transactions' | 'suppliers'>('amount')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')
  
  const query: RankingQuery = useMemo(() => ({
    categoryId,
    year,
    limit,
    orderBy,
    orderDirection,
    useCache: true,
    maxAge: 300
  }), [categoryId, year, limit, orderBy, orderDirection])
  
  const resetFilters = useCallback(() => {
    setCategoryId(undefined)
    setYear(undefined)
    setLimit(100)
    setOrderBy('amount')
    setOrderDirection('desc')
  }, [])
  
  return {
    categoryId,
    year,
    limit,
    orderBy,
    orderDirection,
    
    setCategoryId,
    setYear,
    setLimit,
    setOrderBy,
    setOrderDirection,
    
    query,
    
    resetFilters
  }
}

export const useRankingPage = () => {
  const system = useSystemV4()
  const filters = useRankingFilters()
  const ranking = useRanking(filters.query)
  
  return {
    ...system,
    
    filters,
    
    ranking: ranking.ranking,
    rankingLoading: ranking.loading,
    rankingError: ranking.error,
    reloadRanking: ranking.reload
  }
}