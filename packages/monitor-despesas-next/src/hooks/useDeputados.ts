
import { useEffect, useMemo } from 'react'
import { useDeputyStore, useDeputySelectors } from '@/features/deputies/stores/deputy.store'
import { handleError, createInvalidYearError } from '@/lib/errors'
import type { GastoDeputado, AlertaSuspeito } from '@/types/gastos'

export const useDeputados = () => {
  const selectors = useDeputySelectors()
  
  const deputados = useDeputyStore(selectors.getDeputados)
  const selectedDeputado = useDeputyStore(selectors.getSelectedDeputado)
  const isLoading = useDeputyStore(selectors.isLoading)
  const error = useDeputyStore(state => state.errors?.list)
  const searchTerm = useDeputyStore(state => state.filters?.search || '')
  const selectedYear = useDeputyStore(state => state.filters?.ano || new Date().getFullYear())
  const alertas = useDeputyStore(selectors.getAlertas)
  const premiacoes = useDeputyStore(selectors.getPremiacoes)
  const statistics = useDeputyStore(selectors.getStatistics)
  
  const {
    loadDeputies,
    loadDeputy,
    selectDeputy,
    refreshData,
    clearErrors
  } = useDeputyStore()

  useEffect(() => {
    if (!deputados.length && !isLoading && !error) {
      loadDeputies().catch(err => {
        handleError(err, {
          component: 'useDeputados',
          action: 'auto-fetch'
        })
      })
    }
  }, [deputados.length, isLoading, error, loadDeputies])

  const computedValues = useMemo(() => {
    return {
      deputados,
      filteredDeputados: deputados, // Already filtered in store
      loading: isLoading,
      error,
      searchTerm,
      selectedYear,
      alertas,
      fornecedoresSuspeitos: [], // TODO: Move to separate store if needed
      analiseCompleta: null, // TODO: Move to analytics store if needed
      premiacoesGlobais: premiacoes,
      
      selectedDeputado,
      statistics,
      
      hasData: deputados.length > 0,
      isEmpty: !isLoading && deputados.length === 0,
      hasError: !!error,
      
      setDeputados: (newDeputados: GastoDeputado[]) => {
        console.warn('[useDeputados] setDeputados is deprecated. Data is now managed automatically.')
      },
      
      setLoading: (loading: boolean) => {
        console.warn('[useDeputados] setLoading is deprecated. Loading state is managed automatically.')
      },
      
      setError: (error: string | null) => {
        console.warn('[useDeputados] setError is deprecated. Use error handling system instead.')
        if (error) {
          handleError(new Error(error), {
            component: 'useDeputados',
            action: 'legacy-setError'
          })
        }
      },
      
      setSearchTerm: async (term: string) => {
        try {
          console.warn('[useDeputados] setSearchTerm not implemented in store yet')
        } catch (err) {
          await handleError(err, {
            component: 'useDeputados',
            action: 'setSearchTerm',
            searchTerm: term
          })
        }
      },

      setSelectedYear: async (year: string) => {
        try {
          const yearNum = parseInt(year)
          const currentYear = new Date().getFullYear()

          if (isNaN(yearNum) || yearNum < 2019 || yearNum > currentYear) {
            throw createInvalidYearError(yearNum)
          }

          console.warn('[useDeputados] setSelectedYear not implemented in store yet')
        } catch (err) {
          await handleError(err, {
            component: 'useDeputados',
            action: 'setSelectedYear',
            year
          })
        }
      },
      
      setFilteredDeputados: (filtered: GastoDeputado[]) => {
        console.warn('[useDeputados] setFilteredDeputados is deprecated. Filtering is now automatic.')
      },
      
      setAlertas: (alertas: AlertaSuspeito[]) => {
        console.warn('[useDeputados] setAlertas is deprecated. Use updateAlertas action.')
        useDeputyStore.getState().updateAlertas(alertas)
      },
      
      setPremiacoesGlobais: (premiacoes: any) => {
        console.warn('[useDeputados] setPremiacoesGlobais is deprecated. Use updatePremiacoes action.')
        useDeputyStore.getState().updatePremiacoes(premiacoes)
      },
      
      selectDeputado: async (deputado: GastoDeputado | null) => {
        try {
          selectDeputy(deputado?.id || '')
        } catch (err) {
          await handleError(err, {
            component: 'useDeputados',
            action: 'selectDeputado',
            deputyId: deputado?.id
          })
        }
      },

      fetchDeputadoDetails: async (id: string) => {
        try {
          return await loadDeputy(id)
        } catch (err) {
          await handleError(err, {
            component: 'useDeputados',
            action: 'fetchDeputadoDetails',
            deputyId: id
          })
          return null
        }
      },
      
      refreshData: async () => {
        try {
          await refreshData()
        } catch (err) {
          await handleError(err, {
            component: 'useDeputados',
            action: 'refreshData'
          })
        }
      },
      
      clearError: () => {
        clearErrors()
      }
    }
  }, [
    deputados,
    isLoading,
    error,
    searchTerm,
    selectedYear,
    alertas,
    premiacoes,
    selectedDeputado,
    statistics,
    selectDeputy,
    loadDeputy,
    refreshData,
    clearErrors
  ])

  return computedValues
}


export const useDeputadoSelection = () => {
  const selectors = useDeputySelectors()
  const selectedDeputado = useDeputyStore(selectors.getSelectedDeputado)
  const isLoadingDetails = useDeputyStore(state => state.loading?.profile || false)
  const { selectDeputy, loadDeputy } = useDeputyStore()

  const selectDeputadoWithDetails = async (deputado: GastoDeputado) => {
    try {
      selectDeputy(deputado.id || '')

      if (deputado.id && !deputado.detalhesCarregados) {
        await loadDeputy(deputado.id)
      }
    } catch (err) {
      await handleError(err, {
        component: 'useDeputadoSelection',
        action: 'selectWithDetails',
        deputyId: deputado.id
      })
    }
  }

  return {
    selectedDeputado,
    isLoadingDetails,
    selectDeputadoWithDetails,
    clearSelection: () => selectDeputy('')
  }
}

export const useDeputadoSearch = () => {
  const selectors = useDeputySelectors()
  const searchTerm = useDeputyStore(state => state.filters?.search || '')
  const searchResults = selectors.filteredDeputies
  const isSearching = useDeputyStore(state => state.loading?.list || false)
  const { setFilters, clearFilters } = useDeputyStore()

  return {
    searchTerm,
    searchResults,
    isSearching,
    setSearchTerm: (term: string) => setFilters({ search: term }),
    clearSearch: () => setFilters({ search: '' }),
    clearFilters
  }
}

export const useDeputadoStatistics = () => {
  const statistics = useDeputyStore(state => state.statistics || null)
  const premiacoes = useDeputyStore(state => state.rankings || [])
  const alertas = useDeputyStore(state => state.suspiciousPatterns || [])

  return {
    statistics,
    premiacoes,
    alertas,
    hasStatistics: !!statistics,
    hasPremiacoes: premiacoes.length > 0,
    hasAlertas: alertas.length > 0
  }
}

export const useDeputadoPagination = () => {
  const selectors = useDeputySelectors()
  const currentPage = useDeputyStore(state => state.pagination?.page || 1)
  const totalItems = useDeputyStore(state => state.pagination?.total || 0)
  const itemsPerPage = useDeputyStore(state => state.pagination?.limit || 20)
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedDeputados = selectors.getPaginatedDeputados()

  const { setPagination } = useDeputyStore()

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedDeputados,
    setPage: (page: number) => setPagination({ page }),
    setItemsPerPage: (limit: number) => setPagination({ limit, page: 1 }),
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    goToNextPage: () => setPagination({ page: currentPage + 1 }),
    goToPrevPage: () => setPagination({ page: currentPage - 1 })
  }
}

export const useDeputadosMigrationStatus = () => {
  const stats = useDeputyStore(state => {
    const isStale = () => {
      if (!state.lastFetch) return true
      const now = new Date().getTime()
      const lastFetch = new Date(state.lastFetch).getTime()
      return (now - lastFetch) > (1000 * 60 * 15) // 15 minutes
    }

    return {
      deputadosCount: state.deputies?.length || 0,
      lastFetch: state.lastFetch || null,
      isStale,
      hasFilters: !!(state.filters?.search || state.filters?.partido || state.filters?.uf),
      performance: {
        cacheHit: !isStale() && state.deputies.length > 0,
        storeSize: state.deputies.length
      }
    }
  })

  return {
    migrated: true, // Always true since we're using the new store
    stats,
    recommendations: [
      'Update components to use specialized hooks (useDeputadoSelection, useDeputadoSearch)',
      'Remove direct state mutations in favor of store actions',
      'Implement error boundaries for better error handling'
    ]
  }
}