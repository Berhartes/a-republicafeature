
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

import { 
  Deputy, 
  DeputyStoreState, 
  DeputyExpenses, 
  DeputyRanking, 
  DeputyComparison,
  DeputyListRequest,
  DeputyExpensesRequest,
  DeputyRankingRequest,
  DeputyComparisonRequest
} from '../types/deputy.types.js'

import { startTimer, increment, ParliamentaryMetrics } from '@/lib/observability/metrics'
import { ParliamentaryError, ErrorFactory, ErrorCode } from '@/lib/errors'
import { generateMockDeputados } from '@/lib/mocks/global-mocks'

interface DeputyActions {
  loadDeputies: (request?: DeputyListRequest) => Promise<void>
  loadDeputy: (deputyId: string) => Promise<void>
  loadDeputyExpenses: (request: DeputyExpensesRequest) => Promise<void>
  loadRanking: (request: DeputyRankingRequest) => Promise<void>
  compareDeputies: (request: DeputyComparisonRequest) => Promise<void>

  setFilters: (filters: Partial<DeputyStoreState['filters']>) => void
  clearFilters: () => void

  setPagination: (pagination: Partial<DeputyStoreState['pagination']>) => void
  loadNextPage: () => Promise<void>

  selectDeputy: (deputyId: string) => void
  clearSelection: () => void

  clearErrors: () => void
  setError: (key: keyof DeputyStoreState['errors'], error: string | null) => void

  updateAlertas: (alertas: any[]) => void
  updatePremiacoes: (premiacoes: any) => void
  updateStatistics: (statistics: any) => void

  invalidateCache: (pattern?: string) => Promise<void>
  refreshData: () => Promise<void>
}

const initialState: DeputyStoreState = {
  deputies: [],
  currentDeputy: null,
  expenses: {},
  rankings: [],
  comparisons: [],
  suspiciousPatterns: [],
  statistics: null,
  lastFetch: null,
  
  loading: {
    list: false,
    profile: false,
    expenses: false,
    ranking: false,
    comparison: false,
  },
  
  filters: {
    search: '',
    partido: '',
    uf: '',
    situacao: '',
    ano: new Date().getFullYear(),
    mes: 0, // 0 = todos os meses
  },
  
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false,
  },
  
  errors: {
    list: null,
    profile: null,
    expenses: null,
    ranking: null,
    comparison: null,
  },
}

export const useDeputyStore = create<DeputyStoreState & DeputyActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        loadDeputies: async (request?: DeputyListRequest) => {
          const endTimer = startTimer('deputy_load_list')
          
          try {
            set(state => {
              state.loading.list = true
              state.errors.list = null
            })
            
            const cacheKey = `deputies:list:${JSON.stringify(request || {})}`
            
            const cached = null // await cacheStrategy.get(cacheKey)
            if (cached) {
              set(state => {
                state.deputies = cached.data
                state.pagination = cached.pagination
                state.loading.list = false
              })
              increment(ParliamentaryMetrics.CACHE_HITS)
              return
            }
            
            const response = await fetchDeputiesFromAPI(request)

            // Validar consistência dos dados
            const currentCount = get().deputies.length
            const newCount = response.deputies.length

            if (currentCount > 0 && newCount !== currentCount) {
              console.log(`🔄 [DeputyStore] Detectada inconsistência: ${currentCount} → ${newCount} deputados`)
              console.log('🗑️ [DeputyStore] Limpando cache persistente devido à inconsistência')

              // Limpar localStorage para evitar dados inconsistentes
              try {
                localStorage.removeItem('deputy-store')
              } catch (error) {
                console.warn('⚠️ [DeputyStore] Erro ao limpar localStorage:', error)
              }
            }

            set(state => {
              state.deputies = response.deputies
              state.pagination = response.pagination
              state.loading.list = false
            })
            
            increment(ParliamentaryMetrics.API_CALLS)
            
          } catch (error) {
            const parliamentaryError = error instanceof ParliamentaryError ? error : 
              ErrorFactory.createParliamentaryError(ErrorCode.NETWORK_ERROR, 'Failed to load deputies', { context: { originalError: error } })
            
            set(state => {
              state.loading.list = false
              state.errors.list = parliamentaryError.message
            })
            
            increment(ParliamentaryMetrics.ERRORS, { source: 'deputy_store' })
            throw parliamentaryError
          } finally {
            endTimer()
          }
        },

        loadDeputy: async (deputyId: string) => {
          const endTimer = startTimer('deputy_load_profile')
          
          try {
            set(state => {
              state.loading.profile = true
              state.errors.profile = null
            })
            
            const cacheKey = `deputies:profile:${deputyId}`
            
            const cached = null // await cacheStrategy.get(cacheKey)
            if (cached) {
              set(state => {
                state.currentDeputy = cached
                state.loading.profile = false
              })
              increment(ParliamentaryMetrics.CACHE_HITS)
              return
            }
            
            const deputy = await fetchDeputyFromAPI(deputyId)
            
            
            set(state => {
              state.currentDeputy = deputy
              state.loading.profile = false
            })
            
            increment(ParliamentaryMetrics.API_CALLS)
            
          } catch (error) {
            const parliamentaryError = error instanceof ParliamentaryError ? error : 
              ErrorFactory.createParliamentaryError(ErrorCode.DEPUTY_NOT_FOUND, `Deputy ${deputyId} not found`, { context: { originalError: error, deputyId } })
            
            set(state => {
              state.loading.profile = false
              state.errors.profile = parliamentaryError.message
            })
            
            throw parliamentaryError
          } finally {
            endTimer()
          }
        },

        loadDeputyExpenses: async (request: DeputyExpensesRequest) => {
          const endTimer = startTimer('deputy_load_expenses')
          
          try {
            set(state => {
              state.loading.expenses = true
              state.errors.expenses = null
            })
            
            const cacheKey = `deputies:expenses:${request.deputyId}:${request.ano || 'all'}:${request.mes || 'all'}`
            
            const cached = null // await cacheStrategy.get(cacheKey)
            if (cached) {
              set(state => {
                if (!state.expenses[request.deputyId]) {
                  state.expenses[request.deputyId] = []
                }
                state.expenses[request.deputyId] = cached
                state.loading.expenses = false
              })
              increment(ParliamentaryMetrics.CACHE_HITS)
              return
            }
            
            const expenses = await fetchDeputyExpensesFromAPI(request)
            
            
            set(state => {
              if (!state.expenses[request.deputyId]) {
                state.expenses[request.deputyId] = []
              }
              state.expenses[request.deputyId] = expenses
              state.loading.expenses = false
            })
            
            increment(ParliamentaryMetrics.API_CALLS)
            
          } catch (error) {
            const parliamentaryError = error instanceof ParliamentaryError ? error : 
              ErrorFactory.createParliamentaryError(ErrorCode.TRANSACTION_NOT_FOUND, 'Failed to load deputy expenses', { context: { originalError: error } })
            
            set(state => {
              state.loading.expenses = false
              state.errors.expenses = parliamentaryError.message
            })
            
            throw parliamentaryError
          } finally {
            endTimer()
          }
        },

        loadRanking: async (request: DeputyRankingRequest) => {
          const endTimer = startTimer('deputy_load_ranking')
          
          try {
            set(state => {
              state.loading.ranking = true
              state.errors.ranking = null
            })
            
            const cacheKey = `deputies:ranking:${JSON.stringify(request)}`
            
            const cached = null // await cacheStrategy.get(cacheKey)
            if (cached) {
              set(state => {
                state.rankings = cached
                state.loading.ranking = false
              })
              increment(ParliamentaryMetrics.CACHE_HITS)
              return
            }
            
            const ranking = await fetchDeputyRankingFromAPI(request)
            
            
            set(state => {
              state.rankings = ranking
              state.loading.ranking = false
            })
            
            increment(ParliamentaryMetrics.API_CALLS)
            
          } catch (error) {
            const parliamentaryError = error instanceof ParliamentaryError ? error : 
              ErrorFactory.createParliamentaryError(ErrorCode.RANKING_GENERATION_ERROR, 'Failed to load deputy ranking', { context: { originalError: error } })
            
            set(state => {
              state.loading.ranking = false
              state.errors.ranking = parliamentaryError.message
            })
            
            throw parliamentaryError
          } finally {
            endTimer()
          }
        },

        compareDeputies: async (request: DeputyComparisonRequest) => {
          const endTimer = startTimer('deputy_comparison')
          
          try {
            if (request.deputyIds.length > 5) {
              throw ErrorFactory.createParliamentaryError(
                ErrorCode.INVALID_DATA_FORMAT,
                'Cannot compare more than 5 deputies at once',
                { userMessage: 'Máximo de 5 deputados para comparação' }
              )
            }
            
            set(state => {
              state.loading.comparison = true
              state.errors.comparison = null
            })
            
            const cacheKey = `deputies:comparison:${request.deputyIds.sort().join(',')}:${JSON.stringify(request.period)}`
            
            const cached = null // await cacheStrategy.get(cacheKey)
            if (cached) {
              set(state => {
                state.comparisons = [cached]
                state.loading.comparison = false
              })
              increment(ParliamentaryMetrics.CACHE_HITS)
              return
            }
            
            const comparison = await fetchDeputyComparisonFromAPI(request)
            
            
            set(state => {
              state.comparisons = [comparison]
              state.loading.comparison = false
            })
            
            increment(ParliamentaryMetrics.API_CALLS)
            
          } catch (error) {
            const parliamentaryError = error instanceof ParliamentaryError ? error : 
              ErrorFactory.createParliamentaryError(ErrorCode.NETWORK_ERROR, 'Failed to compare deputies', { context: { originalError: error } })
            
            set(state => {
              state.loading.comparison = false
              state.errors.comparison = parliamentaryError.message
            })
            
            throw parliamentaryError
          } finally {
            endTimer()
          }
        },

        setFilters: (filters) => {
          set(state => {
            Object.assign(state.filters, filters)
            state.pagination.page = 1
            state.pagination.hasMore = false
          })
        },

        clearFilters: () => {
          set(state => {
            state.filters = { ...initialState.filters }
            state.pagination = { ...initialState.pagination }
          })
        },

        setPagination: (pagination) => {
          set(state => {
            Object.assign(state.pagination, pagination)
          })
        },

        loadNextPage: async () => {
          const state = get()
          if (state.loading.list || !state.pagination.hasMore) {
            return
          }
          
          await get().loadDeputies({
            page: state.pagination.page + 1,
            limit: state.pagination.limit,
            ...state.filters,
          })
        },

        selectDeputy: (deputyId) => {
          set(state => {
            const deputy = state.deputies.find(d => d.id === deputyId) || null
            state.currentDeputy = deputy
          })
        },

        clearSelection: () => {
          set(state => {
            state.currentDeputy = null
          })
        },

        clearErrors: () => {
          set(state => {
            state.errors = { ...initialState.errors }
          })
        },

        setError: (key, error) => {
          set(state => {
            state.errors[key] = error
          })
        },

        updateAlertas: (alertas: any[]) => {
          set(state => {
            state.suspiciousPatterns = alertas
          })
        },

        updatePremiacoes: (premiacoes: any) => {
          set(state => {
            state.rankings = Array.isArray(premiacoes) ? premiacoes : []
          })
        },

        updateStatistics: (statistics: any) => {
          set(state => {
            state.statistics = statistics
          })
        },

        invalidateCache: async (pattern) => {
          console.log('🗑️ [DeputyStore] Invalidando cache:', pattern)

          // Limpar dados da store
          set(state => {
            state.deputies = []
            state.currentDeputy = null
            state.expenses = {}
            state.rankings = []
            state.comparisons = []
            state.suspiciousPatterns = []
            state.statistics = null
            state.lastFetch = null
          })

          // Se for invalidação completa, limpar também o localStorage persistente
          if (pattern === 'deputies' || !pattern) {
            try {
              localStorage.removeItem('deputy-store')
              console.log('🗑️ [DeputyStore] Cache localStorage limpo')
            } catch (error) {
              console.warn('⚠️ [DeputyStore] Erro ao limpar localStorage:', error)
            }
          }
        },

        refreshData: async () => {
          const state = get()
          await get().invalidateCache('deputies')
          
          if (state.currentDeputy) {
            await get().loadDeputy(state.currentDeputy.id)
          }
          
          await get().loadDeputies()
        },
      })),
      {
        name: 'deputy-store',
        partialize: (state) => ({
          filters: state.filters,
          pagination: state.pagination,
        }),
      }
    ),
    { name: 'DeputyStore' }
  )
)

async function fetchDeputiesFromAPI(request?: DeputyListRequest): Promise<{
  deputies: Deputy[]
  pagination: DeputyStoreState['pagination']
}> {
  console.log('🔍 [fetchDeputiesFromAPI] Carregando deputados diretamente do cache...')
  console.log('🔍 [fetchDeputiesFromAPI] URL atual:', window.location.href)
  console.log('🔍 [fetchDeputiesFromAPI] Tentando acessar: /cache/deputies-cache.json?t=' + Date.now())

  try {
    console.log('📦 [fetchDeputiesFromAPI] Carregando deputies-cache.json diretamente...')
    const response = await fetch('/cache/deputies-cache.json?t=' + Date.now())
    console.log('📦 [fetchDeputiesFromAPI] Response status:', response.status)
    console.log('📦 [fetchDeputiesFromAPI] Response ok:', response.ok)

    if (!response.ok) {
      console.error('❌ [fetchDeputiesFromAPI] Falha ao carregar deputies-cache.json:', response.status)
      console.error('❌ [fetchDeputiesFromAPI] Response headers:', [...response.headers.entries()])
      throw new Error(`HTTP ${response.status}`)
    }

    const cacheData = await response.json()
    console.log('📊 [fetchDeputiesFromAPI] Cache carregado com sucesso:', cacheData)
    console.log('📊 [fetchDeputiesFromAPI] Estrutura do cache:', Object.keys(cacheData))

    let deputados: Deputy[] = []

    if (cacheData.data && cacheData.data.deputados && Array.isArray(cacheData.data.deputados)) {
      console.log('📊 [fetchDeputiesFromAPI] Usando estrutura data.deputados com', cacheData.data.deputados.length, 'deputados')
      deputados = cacheData.data.deputados.map((dep: any) => ({
        id: dep.id || dep.nome || '',
        nome: dep.nome || '',
        partido: dep.partido || dep.siglaPartido || 'SEM PARTIDO',
        uf: dep.uf || dep.siglaUf || 'N/A',
        situacao: dep.situacao || 'EXERCICIO',
        totalGasto: dep.totalGasto || 0,
        gastos: dep.gastos || [],
        foto: dep.foto || dep.urlFoto,
        email: dep.email,
        scoreSuspeicao: dep.scoreSuspeicao || 0,
        alertas: dep.alertas || [],
        ranking: dep.ranking
      }))
    }

    if (deputados.length > 0) {
      console.log(`✅ [fetchDeputiesFromAPI] ${deputados.length} deputados carregados diretamente do cache`)

      return {
        deputies: deputados,
        pagination: {
          page: request?.page || 1,
          limit: request?.limit || 20,
          total: deputados.length,
          hasMore: false,
        },
      }
    } else {
      console.log('❌ [fetchDeputiesFromAPI] Nenhum deputado encontrado')
    }

    console.log('🎭 [fetchDeputiesFromAPI] Usando dados mock como fallback')
    const mockDeputies = generateMockDeputados()
    return {
      deputies: mockDeputies,
      pagination: {
        page: request?.page || 1,
        limit: request?.limit || 20,
        total: mockDeputies.length,
        hasMore: false,
      },
    }

  } catch (error) {
    console.error('❌ [fetchDeputiesFromAPI] Erro ao carregar deputados:', error)

    const mockDeputies = generateMockDeputados()
    return {
      deputies: mockDeputies,
      pagination: {
        page: request?.page || 1,
        limit: request?.limit || 20,
        total: mockDeputies.length,
        hasMore: false,
      },
    }
  }
}


async function fetchDeputyFromAPI(deputyId: string): Promise<Deputy> {
  throw ErrorFactory.createParliamentaryError(ErrorCode.DEPUTY_NOT_FOUND, 'Mock implementation')
}

async function fetchDeputyExpensesFromAPI(request: DeputyExpensesRequest): Promise<DeputyExpenses[]> {
  return []
}

async function fetchDeputyRankingFromAPI(request: DeputyRankingRequest): Promise<DeputyRanking[]> {
  return []
}

async function fetchDeputyComparisonFromAPI(request: DeputyComparisonRequest): Promise<DeputyComparison> {
  throw ErrorFactory.createParliamentaryError(ErrorCode.NETWORK_ERROR, 'Mock implementation')
}



export const deputySelectors = {
  getDeputados: (state: DeputyStoreState) => state.deputies || [],
  getSelectedDeputado: (state: DeputyStoreState) => state.currentDeputy,
  getAlertas: (state: DeputyStoreState) => state.suspiciousPatterns || [],
  getPremiacoes: (state: DeputyStoreState) => state.rankings || [],
  getStatistics: (state: DeputyStoreState) => state.statistics || null,
  getCurrentPage: (state: DeputyStoreState) => state.pagination?.page || 1,
  getTotalPages: (state: DeputyStoreState) => Math.ceil((state.pagination?.total || 0) / (state.pagination?.limit || 20)),
  
  getPaginatedDeputados: (state: DeputyStoreState) => {
    const { deputies, filters, pagination } = state;
    const filtered = (deputies || []).filter(deputy => {
      const { search, partido, uf, situacao } = filters || {};
      if (search && deputy.nome && !deputy.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (partido && deputy.partido !== partido) return false;
      if (uf && deputy.uf !== uf) return false;
      if (situacao && deputy.situacao !== situacao) return false;
      return true;
    });

    const { page = 1, limit = 20 } = pagination || {};
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  },

  isLoading: (state: DeputyStoreState) => state.loading || {},
  getErrors: (state: DeputyStoreState) => state.errors || {},
  hasErrors: (state: DeputyStoreState) => Object.values(state.errors || {}).some(error => error !== null),

  getFilteredDeputies: (state: DeputyStoreState) => {
    const { deputies, filters } = state;
    return (deputies || []).filter(deputy => {
      const { search, partido, uf, situacao } = filters || {};
      if (search && deputy.nome && !deputy.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (partido && deputy.partido !== partido) return false;
      if (uf && deputy.uf !== uf) return false;
      if (situacao && deputy.situacao !== situacao) return false;
      return true;
    });
  },
  getFilters: (state: DeputyStoreState) => state.filters || {},
  getPagination: (state: DeputyStoreState) => state.pagination || {},
};

export const useDeputySelectors = () => {
  console.warn(
    '[useDeputySelectors] This hook is deprecated. Please import `deputySelectors` directly.'
  );
  const store = useDeputyStore();

  return {
    getDeputados: () => deputySelectors.getDeputados(store),
    getSelectedDeputado: () => deputySelectors.getSelectedDeputado(store),
    getAlertas: () => deputySelectors.getAlertas(store),
    getPremiacoes: () => deputySelectors.getPremiacoes(store),
    getStatistics: () => deputySelectors.getStatistics(store),
    getCurrentPage: () => deputySelectors.getCurrentPage(store),
    getTotalPages: () => deputySelectors.getTotalPages(store),
    getPaginatedDeputados: () => deputySelectors.getPaginatedDeputados(store),
    isLoading: () => deputySelectors.isLoading(store),
    hasErrors: () => deputySelectors.hasErrors(store),
    filteredDeputies: deputySelectors.getFilteredDeputies(store),
    filters: () => deputySelectors.getFilters(store),
    pagination: () => deputySelectors.getPagination(store),
  };
};