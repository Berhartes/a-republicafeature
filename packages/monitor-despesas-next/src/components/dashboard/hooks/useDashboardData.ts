import { useState, useEffect } from 'react'
import { useGlobalData } from '@/contexts/GlobalDataContext'

export function useDashboardData() {
  const [analiseData, setAnaliseData] = useState<any>(null)
  const [uiCache, setUICache] = useState<any>(null)
  const { data: globalData, loading, error, isConnected, refetch } = useGlobalData()

  useEffect(() => {
    if (globalData) {
      console.log('🎨 [useDashboardData] Processando dados para UI cache...')

      setAnaliseData(globalData)

      const basicUICache = {
        deputados: globalData.deputados || [],
        analise: globalData.analise || {},
        timestamp: Date.now()
      }
      setUICache(basicUICache)
    }
  }, [globalData])

  const fetchJSONData = async (url: string) => {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return await response.json()
      }
    } catch (error) {
      console.warn(`Failed to fetch ${url}:`, error)
    }
    return null
  }

  const clearCache = () => {
    setUICache(null)
    setAnaliseData(null)
  }

  const getMetrics = () => {
    if (!analiseData) return {}

    return {
      totalDeputados: analiseData.deputados?.length || 0,
      totalGasto: analiseData.analise?.estatisticas?.totalGasto || 0,
      alertasAtivos: analiseData.analise?.alertas?.length || 0
    }
  }

  const getCacheData = () => {
    return {
      alertas: analiseData?.analise?.alertas || [],
      partidos: [],
      rankings: []
    }
  }

  const getCacheInfo = () => {
    return {
      size: uiCache ? JSON.stringify(uiCache).length : 0,
      lastUpdated: uiCache?.timestamp || null,
      isValid: !!uiCache
    }
  }

  return {
    analiseData,
    uiCache,
    loading,
    error,
    isConnected,
    refetch,
    fetchJSONData,
    clearCache,
    getMetrics,
    getCacheData,
    getCacheInfo
  }
}