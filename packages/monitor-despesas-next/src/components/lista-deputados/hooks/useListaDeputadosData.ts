import { useDeputyStore, deputySelectors } from '@/features/deputies/stores/deputy.store'
import { generateMockDeputados } from '@/lib/mocks/global-mocks'
import { useEffect } from 'react'

export function useListaDeputadosData() {
  const deputadosFromStore = useDeputyStore(deputySelectors.getDeputados)
  const loading = useDeputyStore(state => deputySelectors.isLoading(state).list)
  const error = useDeputyStore(state => deputySelectors.getErrors(state).list)
  const loadDeputies = useDeputyStore(state => state.loadDeputies)

  useEffect(() => {
    console.log('🔄 [useListaDeputadosData] useEffect executado. deputadosFromStore.length:', deputadosFromStore.length, 'loading:', loading, 'error:', error)
    if (deputadosFromStore.length === 0 && !loading && !error) {
      console.log('🔄 [useListaDeputadosData] Iniciando carregamento de deputados do cache ETL...')
      loadDeputies()
    }
  }, [deputadosFromStore.length, loading, error, loadDeputies])

  const deputados = deputadosFromStore.length > 0 ? deputadosFromStore : []

  const maxGasto = deputados.length > 0 ? Math.max(...deputados.map(d => d.totalGasto || 0)) : 0
  const maxScore = deputados.length > 0 ? Math.max(...deputados.map(d => d.scoreSuspeicao || 0)) : 100

  const partidosDisponiveis = Array.from(new Set(deputados.map(d => d.siglaPartido).filter(Boolean))).sort()
  const ufsDisponiveis = Array.from(new Set(deputados.map(d => d.siglaUf).filter(Boolean))).sort()

  return {
    deputados,
    deputadosProcessados: deputados,
    loading,
    error,
    isRefreshing: false,
    maxValues: { maxGasto, maxScore },
    partidosDisponiveis,
    ufsDisponiveis,
    hasOptimizedData: deputados.length > 0,
    optimizedDataInfo: deputados.length > 0 ? {
      source: 'cache-etl',
      dataAge: 'Recente',
      cacheInfo: {
        totalDeputados: deputados.length
      }
    } : null,
    refreshData: () => loadDeputies(),
    loadOptimizedData: () => loadDeputies(),
    clearOptimizedData: () => {},
  }
}