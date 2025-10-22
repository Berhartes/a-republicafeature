import { useState, useEffect, useCallback } from 'react'
import { deputadosGlobalCache } from '@/services/deputados-global-cache'
import { ETLDeputadosResult, ETLDeputadoData } from '@/services/sistema-etl-bridge'

export interface DeputadosOptimizadosState {
  hasOptimizedData: boolean
  isLoading: boolean
  error: string | null

  deputados: ETLDeputadoData[]
  estatisticas: ETLDeputadosResult['estatisticas'] | null
  metadata: ETLDeputadosResult['metadata'] | null

  cacheInfo: {
    exists: boolean
    lastUpdate: Date | null
    dataSource: string | null
    totalDeputados: number
    size: string
  }
}

export interface DeputadosOptimizadosActions {
  loadOptimizedData: () => Promise<void>
  clearOptimizedData: () => void
  refreshCacheInfo: () => void

  shouldUseOptimizedData: () => boolean
  getDataAge: () => string | null
}

export function useDeputadosOptimizados(): DeputadosOptimizadosState & DeputadosOptimizadosActions {
  const [state, setState] = useState<DeputadosOptimizadosState>({
    hasOptimizedData: false,
    isLoading: false,
    error: null,
    deputados: [],
    estatisticas: null,
    metadata: null,
    cacheInfo: {
      exists: false,
      lastUpdate: null,
      dataSource: null,
      totalDeputados: 0,
      size: '0 KB'
    }
  })

  useEffect(() => {
    refreshCacheInfo()

    if (deputadosGlobalCache.isValidCache()) {
      loadOptimizedData()
    }
  }, [])

  const loadOptimizedData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      console.log('🎯 [useDeputadosOptimizados] Carregando dados otimizados...')

      const optimizedData = deputadosGlobalCache.getCache()

      if (optimizedData && optimizedData.success) {
        setState(prev => ({
          ...prev,
          hasOptimizedData: true,
          deputados: optimizedData.deputados,
          estatisticas: optimizedData.estatisticas,
          metadata: optimizedData.metadata,
          isLoading: false
        }))

        console.log(`✅ [useDeputadosOptimizados] ${optimizedData.deputados.length} deputados carregados do cache otimizado`)
      } else {
        setState(prev => ({
          ...prev,
          hasOptimizedData: false,
          isLoading: false,
          error: 'Dados otimizados não encontrados ou inválidos'
        }))

        console.log('📭 [useDeputadosOptimizados] Nenhum dado otimizado encontrado')
      }

      refreshCacheInfo()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      setState(prev => ({
        ...prev,
        hasOptimizedData: false,
        isLoading: false,
        error: errorMessage
      }))

      console.error('❌ [useDeputadosOptimizados] Erro ao carregar dados otimizados:', error)
    }
  }, [])

  const clearOptimizedData = useCallback(() => {
    try {
      deputadosGlobalCache.clearCache()

      setState(prev => ({
        ...prev,
        hasOptimizedData: false,
        deputados: [],
        estatisticas: null,
        metadata: null,
        error: null
      }))

      refreshCacheInfo()

      console.log('🗑️ [useDeputadosOptimizados] Dados otimizados limpos')
    } catch (error) {
      console.error('❌ [useDeputadosOptimizados] Erro ao limpar dados:', error)
    }
  }, [])

  const refreshCacheInfo = useCallback(() => {
    try {
      const cacheInfo = deputadosGlobalCache.getCacheMetadata()
      setState(prev => ({ ...prev, cacheInfo }))
    } catch (error) {
      console.error('❌ [useDeputadosOptimizados] Erro ao atualizar info do cache:', error)
    }
  }, [])

  const shouldUseOptimizedData = useCallback((): boolean => {
    return state.hasOptimizedData &&
           state.deputados.length > 0 &&
           deputadosGlobalCache.isValidCache()
  }, [state.hasOptimizedData, state.deputados.length])

  const getDataAge = useCallback((): string | null => {
    if (!state.cacheInfo.lastUpdate) return null

    const now = new Date()
    const lastUpdate = new Date(state.cacheInfo.lastUpdate)
    const diffMs = now.getTime() - lastUpdate.getTime()

    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays > 0) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`
    if (diffHours > 0) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`
    if (diffMinutes > 0) return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`
    return 'Agora mesmo'
  }, [state.cacheInfo.lastUpdate])

  return {
    ...state,

    loadOptimizedData,
    clearOptimizedData,
    refreshCacheInfo,

    shouldUseOptimizedData,
    getDataAge
  }
}