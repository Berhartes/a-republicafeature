
import { useState, useEffect, useCallback, useMemo } from 'react'
import { premiacoesGlobalCache, type ProcessedPremiacoesData, type DeputadoRankingV4, type PremiacoesCacheInfo } from '@/services/premiacoes-global-cache'
import { premiacoesProcessor } from '@/services/premiacoes-processor'
import { SystemV4Utils, categoryRegistry } from '@/core/SystemV4'
import { type PremiacoesGlobais } from '@/services/premiacao-unificada'
import type { RankingEntry, RankingResult } from '@/core/rankings/RankingEngine'

export interface UseGlobalPremiacoesOptions {
  autoLoad?: boolean
  enableSystemV4Fallback?: boolean
  refreshInterval?: number // em minutos
  enableProgressTracking?: boolean
}

export interface UseGlobalPremiacoesResult {
  premiacoes: PremiacoesGlobais | null
  rankings: {
    geral: DeputadoRankingV4[]
    porCategoria: Record<string, DeputadoRankingV4[]>
    porAno: Record<string, DeputadoRankingV4[]>
  }
  estatisticas: {
    totalDeputados: number
    totalCategorias: number
    valorTotalGeral: number
    deputadoComMaisGastos: { nome: string; valor: number }
    categoriaComMaisGastos: { nome: string; valor: number }
  } | null

  loading: boolean
  error: string | null
  processando: boolean
  progress: { percent: number; message: string } | null

  cacheInfo: {
    fonte: 'cache-premiacoes' | 'cache-transacoes' | 'systemv4' | 'none'
    idade: string | null
    status: 'fresh' | 'valid' | 'aging' | 'expired' | 'empty'
    ultimaAtualizacao: string | null
  }

  refresh: (forceReprocess?: boolean) => Promise<void>
  clearCache: () => void
  getRankingPorCategoria: (categoria: string) => DeputadoRankingV4[]
  getRankingPorAno: (ano: string) => DeputadoRankingV4[]
  
  loadFromSystemV4: (categoria?: string, ano?: number) => Promise<DeputadoRankingV4[]>
}

function mapRankingEntry(entry: RankingEntry, index: number): DeputadoRankingV4 {
  const deputy = entry.deputy

  return {
    id: deputy.id,
    nome: deputy.name,
    partido: deputy.party,
    uf: deputy.state,
    valorTotal: deputy.totalAmount,
    totalGastos: deputy.totalAmount,
    totalTransacoes: deputy.transactionCount,
    premiacoes: [],
    posicao: entry.position ?? index + 1,
    percentualDoTotal: entry.percentageOfTotal,
    metadata: {
      averageTransaction: entry.averageTransaction,
      supplierCount: deputy.supplierCount,
      trend: entry.trend,
      previousPosition: entry.previousPosition
    }
  }
}

export function useGlobalPremiacoes(options: UseGlobalPremiacoesOptions = {}): UseGlobalPremiacoesResult {
  const {
    autoLoad = true,
    enableSystemV4Fallback = true,
    refreshInterval,
    enableProgressTracking = true
  } = options

  const [data, setData] = useState<ProcessedPremiacoesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [progress, setProgress] = useState<{ percent: number; message: string } | null>(null)

  const premiacoes = useMemo<PremiacoesGlobais | null>(() => {
    return data?.premiacoes ?? null
  }, [data])

  const rankings = useMemo<UseGlobalPremiacoesResult['rankings']>(() => {
    const base: UseGlobalPremiacoesResult['rankings'] = {
      geral: [],
      porCategoria: {},
      porAno: {}
    }

    const raw = data?.rankings
    if (!raw) {
      return base
    }

    if (Array.isArray(raw)) {
      return {
        ...base,
        geral: raw
      }
    }

    return {
      geral: raw.geral ?? [],
      porCategoria: raw.porCategoria ?? {},
      porAno: raw.porAno ?? {}
    }
  }, [data])

  const estatisticas = useMemo<UseGlobalPremiacoesResult['estatisticas']>(() => {
    if (!data?.estatisticas) {
      return null
    }

    const {
      totalDeputados,
      totalCategorias = 0,
      valorTotalGeral,
      valorTotal,
      deputadoComMaisGastos,
      categoriaComMaisGastos
    } = data.estatisticas

    return {
      totalDeputados,
      totalCategorias,
      valorTotalGeral: valorTotalGeral ?? valorTotal,
      deputadoComMaisGastos: deputadoComMaisGastos ?? { nome: 'N/A', valor: 0 },
      categoriaComMaisGastos: categoriaComMaisGastos ?? { nome: 'N/A', valor: 0 }
    }
  }, [data])

  const cacheInfo = useMemo<UseGlobalPremiacoesResult['cacheInfo']>(() => {
    const info: PremiacoesCacheInfo = premiacoesGlobalCache.getCacheInfo()

    let fonte: 'cache-premiacoes' | 'cache-transacoes' | 'systemv4' | 'none' = 'none'
    if (info.hasValidCache) {
      fonte = 'cache-premiacoes'
    } else if (data?.metadata?.baseadoEm === 'cache-transacoes') {
      fonte = 'cache-transacoes'
    } else if (data?.metadata?.baseadoEm === 'systemv4-fallback') {
      fonte = 'systemv4'
    }

    const ageMs = typeof info.age === 'number' ? info.age : null
    const idade = ageMs != null ? `${Math.max(1, Math.round(ageMs / 1000))}s` : null

    return {
      fonte,
      idade,
      status: info.status,
      ultimaAtualizacao: info.lastUpdated
    }
  }, [data])

  const loadData = useCallback(async (forceReprocess: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      console.log('🏆 [useGlobalPremiacoes] Carregando dados de premiações...')

      if (!forceReprocess) {
        const cacheData = premiacoesGlobalCache.getCache()
        if (cacheData) {
          console.log('⚡ [useGlobalPremiacoes] Dados carregados do cache de premiações')
          setData(cacheData)
          setLoading(false)
          return
        }

        const acceptableCache = premiacoesGlobalCache.getAcceptableCache()
        if (acceptableCache) {
          console.log('📦 [useGlobalPremiacoes] Dados carregados do cache aceitável')
          setData(acceptableCache)
          setLoading(false)
          return
        }
      }

      console.log('🔄 [useGlobalPremiacoes] Processando dados do cache de transações...')
      setProcessando(true)
      
      if (enableProgressTracking) {
        premiacoesProcessor.setProgressCallback((percent, message) => {
          setProgress({ percent, message })
        })
      }

      const processedData = await premiacoesProcessor.processarPremiacoes({
        forceRefresh: forceReprocess
      })

      if (processedData) {
        console.log('✅ [useGlobalPremiacoes] Dados processados com sucesso')
        setData(processedData)
        setProcessando(false)
        setProgress(null)
        setLoading(false)
        return
      }

      throw new Error('Falha no processamento de premiações')

    } catch (error) {
      console.error('❌ [useGlobalPremiacoes] Erro ao carregar dados:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      
      if (enableSystemV4Fallback) {
        console.log('🔄 [useGlobalPremiacoes] Tentando fallback SystemV4...')
        try {
          const fallbackData = await loadSystemV4Fallback()
          if (fallbackData.length > 0) {
            const fallbackTotal = fallbackData.reduce((sum, dep) => sum + (dep.totalGastos ?? dep.valorTotal ?? 0), 0)
            const fallbackYear = new Date().getFullYear().toString()

            setData({
              rankings: {
                geral: fallbackData,
                porCategoria: {} as Record<string, DeputadoRankingV4[]>,
                porAno: { [fallbackYear]: fallbackData }
              },
              premiacoes: {
                coroas: [],
                campeaoGeral: null,
                campeoesCategorias: [],
                trofeus: [],
                medalhas: [],
                estatisticas: { totalCoroas: 0, totalTrofeus: 0, totalMedalhas: 0, totalPremiacoes: 0 },
                top10Geral: fallbackData.slice(0, 10),
                top10PorCategoria: {} as Record<string, typeof fallbackData>,
                ultimaAtualizacao: new Date()
              },
              estatisticas: {
                totalPremiacoes: 0,
                valorTotal: fallbackTotal,
                totalDeputados: fallbackData.length,
                totalCategorias: 0,
                valorTotalGeral: fallbackTotal,
                deputadoComMaisGastos: fallbackData[0]
                  ? {
                      nome: fallbackData[0].nome,
                      valor: fallbackData[0].totalGastos ?? fallbackData[0].valorTotal ?? 0
                    }
                  : { nome: 'N/A', valor: 0 },
                categoriaComMaisGastos: { nome: 'N/A', valor: 0 }
              },
              categorias: {} as Record<string, unknown>,
              metadata: {
                processedAt: new Date().toISOString(),
                dataVersion: 'fallback',
                tempoProcessamento: 0,
                versao: '1.0.0-fallback',
                baseadoEm: 'systemv4-fallback',
                totalTransacoesFonte: 0,
                lastUpdatedAt: new Date().toISOString()
              }
            })
            console.log('✅ [useGlobalPremiacoes] Fallback SystemV4 carregado com sucesso')
          }
        } catch (fallbackError) {
          console.error('❌ [useGlobalPremiacoes] Fallback SystemV4 também falhou:', fallbackError)
        }
      }
    } finally {
      setLoading(false)
      setProcessando(false)
      setProgress(null)
    }
  }, [enableSystemV4Fallback, enableProgressTracking])

  const loadSystemV4Fallback = useCallback(async (): Promise<DeputadoRankingV4[]> => {
    console.log('🔄 [useGlobalPremiacoes] Carregando dados do SystemV4...')
    
    try {
      const rankingData = await SystemV4Utils.getRanking(undefined, undefined, 100) as RankingResult
      const totalAmount = rankingData.entries.reduce((sum, current) => sum + current.deputy.totalAmount, 0)

      const ranking = rankingData.entries.map((entry, index) => {
        const mapped = mapRankingEntry(entry, index)
        return {
          ...mapped,
          percentualDoTotal: totalAmount > 0 ? (entry.deputy.totalAmount / totalAmount) * 100 : 0
        }
      })

      console.log('✅ [useGlobalPremiacoes] SystemV4 fallback carregado:', ranking.length, 'deputados')
      return ranking
    } catch (error) {
      console.error('❌ [useGlobalPremiacoes] Erro no SystemV4 fallback:', error)
      return []
    }
  }, [])

  const refresh = useCallback(async (forceReprocess: boolean = false) => {
    await loadData(forceReprocess)
  }, [loadData])

  const clearCache = useCallback(() => {
    premiacoesGlobalCache.clearCache()
    setData(null)
    setError(null)
    console.log('🗑️ [useGlobalPremiacoes] Cache limpo')
  }, [])

  const getRankingPorCategoria = useCallback((categoria: string): DeputadoRankingV4[] => {
    return rankings.porCategoria[categoria] || []
  }, [rankings.porCategoria])

  const getRankingPorAno = useCallback((ano: string): DeputadoRankingV4[] => {
    return rankings.porAno[ano] || []
  }, [rankings.porAno])

  const loadFromSystemV4 = useCallback(async (categoria?: string, ano?: number): Promise<DeputadoRankingV4[]> => {
    try {
      const categoryInfo = categoria && categoria !== 'TODAS' ? 
        categoryRegistry.findCategory(categoria) : undefined
      const categoryId = categoryInfo?.category.id

      const rankingData = await SystemV4Utils.getRanking(categoryId, ano, 100) as RankingResult
      const totalAmount = rankingData.entries.reduce((sum, current) => sum + current.deputy.totalAmount, 0)

      return rankingData.entries.map((entry, index) => {
        const mapped = mapRankingEntry(entry, index)
        return {
          ...mapped,
          categoria,
          percentualDoTotal: totalAmount > 0 ? (entry.deputy.totalAmount / totalAmount) * 100 : 0
        }
      })
    } catch (error) {
      console.error('❌ [useGlobalPremiacoes] Erro ao carregar do SystemV4:', error)
      return []
    }
  }, [])

  useEffect(() => {
    if (autoLoad) {
      loadData()
    }
  }, [autoLoad, loadData])

  useEffect(() => {
    if (refreshInterval && refreshInterval > 0) {
      const interval = setInterval(() => {
        console.log('🔄 [useGlobalPremiacoes] Refresh automático...')
        loadData(false) // Não forçar reprocessamento
      }, refreshInterval * 60 * 1000) // Converter minutos para ms

      return () => clearInterval(interval)
    }
  }, [refreshInterval, loadData])

  return {
    premiacoes,
    rankings,
    estatisticas,

    loading,
    error,
    processando,
    progress,

    cacheInfo,

    refresh,
    clearCache,
    getRankingPorCategoria,
    getRankingPorAno,
    loadFromSystemV4
  }
}
