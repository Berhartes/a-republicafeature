import { useState, useMemo, useEffect, useTransition, startTransition, useCallback } from 'react'
import type { DeputadoProcessado } from '@/types/etl-deputados.types'

export type ViewMode = 'grid' | 'table' | 'cards'
export type SortOption = 'nome' | 'partido' | 'uf' | 'totalGasto' | 'ranking' | 'scoreSuspeicao'

export interface FilterState {
  searchTerm: string
  partido: string
  uf: string
  minGasto: number
  maxGasto: number
  minScore: number
  maxScore: number
  sortBy: SortOption
  sortOrder: 'asc' | 'desc'
  hasAlertas: boolean | null
  hasCoroas: boolean | null
}
import { useEventBus } from '@/lib/event-bus'

export interface ListaDeputadosFiltersState {
  viewMode: ViewMode
  showFilters: boolean
  showStats: boolean
  
  itemsPerPage: number
  currentPage: number
  totalPages: number
  
  filters: FilterState
  
  deputadosFiltrados: DeputadoProcessado[]
  deputadosPaginados: DeputadoProcessado[]
  
  totalFiltrados: number
  gastoTotalFiltrado: number
  gastoMedioFiltrado: number
}

export interface ListaDeputadosFiltersActions {
  setViewMode: (mode: ViewMode) => void
  setShowFilters: (show: boolean) => void
  setShowStats: (show: boolean) => void
  toggleFilters: () => void
  toggleStats: () => void
  
  setItemsPerPage: (items: number) => void
  setCurrentPage: (page: number) => void
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  
  setFilters: (filters: FilterState) => void
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  resetFilters: () => void
  
  aplicarFiltroRapido: (tipo: 'top10' | 'alertas' | 'coroas' | 'criticos' | 'baixoGasto') => void
  buscarDeputado: (termo: string) => void
  filtrarPorPartido: (partido: string) => void
  filtrarPorUF: (uf: string) => void
  ordenarPor: (campo: SortOption) => void
  
  handlePartidoClick: (data: { nome: string } | null) => void
  handleEstadoClick: (data: { nome: string } | null) => void
  clearPartidoFilter: () => void
  clearEstadoFilter: () => void
}

const defaultFilters: FilterState = {
  searchTerm: '',
  partido: 'TODOS',
  uf: 'TODOS',
  sortBy: 'totalGasto',
  sortOrder: 'desc',
  minGasto: 0,
  maxGasto: Infinity,
  minScore: 0,
  maxScore: 100,
  hasAlertas: null,
  hasCoroas: null
}

export function useListaDeputadosFilters(
  deputadosProcessados: DeputadoProcessado[],
  maxGasto: number = 1000000
): ListaDeputadosFiltersState & ListaDeputadosFiltersActions {
  
  const { emit } = useEventBus()
  const [, startTransition] = useTransition()
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [showStats, setShowStats] = useState(false)
  
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)
  
  const [inputFilters, setInputFilters] = useState<FilterState>({
    ...defaultFilters,
    maxGasto: maxGasto || Infinity // Usar o valor real máximo dos dados
  })
  
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    maxGasto: maxGasto || Infinity // Usar o valor real máximo dos dados
  })

  useEffect(() => {
    if (inputFilters.searchTerm !== filters.searchTerm) {
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          setFilters(prev => ({
            ...prev,
            searchTerm: inputFilters.searchTerm
          }))
        })
      }, 300) // 300ms debounce for search
      
      return () => clearTimeout(timeoutId)
    }
  }, [inputFilters.searchTerm, filters.searchTerm])

  useEffect(() => {
    const hasRangeChanges = 
      inputFilters.minGasto !== filters.minGasto ||
      inputFilters.maxGasto !== filters.maxGasto ||
      inputFilters.minScore !== filters.minScore ||
      inputFilters.maxScore !== filters.maxScore

    if (hasRangeChanges) {
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          setFilters(prev => ({
            ...prev,
            minGasto: inputFilters.minGasto,
            maxGasto: inputFilters.maxGasto,
            minScore: inputFilters.minScore,
            maxScore: inputFilters.maxScore
          }))
        })
      }, 100) // 100ms debounce for ranges (faster for sliders)
      
      return () => clearTimeout(timeoutId)
    }
  }, [inputFilters.minGasto, inputFilters.maxGasto, inputFilters.minScore, inputFilters.maxScore, 
      filters.minGasto, filters.maxGasto, filters.minScore, filters.maxScore])

  useEffect(() => {
    if (maxGasto && maxGasto !== filters.maxGasto && filters.maxGasto === Infinity) {
      const newMaxGasto = maxGasto
      setInputFilters(prev => ({ ...prev, maxGasto: newMaxGasto }))
      setFilters(prev => ({ ...prev, maxGasto: newMaxGasto }))
    }
  }, [maxGasto])

  const deputadosFiltrados = useMemo(() => {
    console.log('🔍 [useListaDeputadosFilters] Iniciando filtros. Deputados recebidos:', deputadosProcessados.length)
    console.log('🔍 [useListaDeputadosFilters] Filtros ativos:', filters)

    const startTime = Date.now()
    let filtrados = [...deputadosProcessados]

    emit('filter:applied', {
      filterType: 'deputados',
      filterValue: filters,
      resultCount: 0,
      timestamp: startTime
    })

    const CHUNK_SIZE = 1000
    if (deputadosProcessados.length > CHUNK_SIZE) {
      filtrados = processDeputadosInChunks(deputadosProcessados, filters, maxGasto, CHUNK_SIZE)
    } else {
      filtrados = applyDeputadosFilters(deputadosProcessados, filters, maxGasto)
    }

    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`🔍 [useListaDeputadosFilters] Filtrados: ${filtrados.length}/${deputadosProcessados.length} em ${duration}ms`)
    
    emit('filter:applied', {
      filterType: 'deputados',
      filterValue: filters,
      resultCount: filtrados.length,
      timestamp: endTime
    })

    console.log(`✅ [useListaDeputadosFilters] Filtros aplicados. Resultados: ${filtrados.length}/${deputadosProcessados.length}`)

    return filtrados
  }, [deputadosProcessados, filters, maxGasto, emit])

  const totalPages = Math.ceil(deputadosFiltrados.length / itemsPerPage)
  
  const currentPageAdjusted = useMemo(() => {
    return Math.min(currentPage, Math.max(1, totalPages))
  }, [currentPage, totalPages])

  const deputadosPaginados = useMemo(() => {
    const startIndex = (currentPageAdjusted - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return deputadosFiltrados.slice(startIndex, endIndex)
  }, [deputadosFiltrados, currentPageAdjusted, itemsPerPage])

  const { totalFiltrados, gastoTotalFiltrado, gastoMedioFiltrado } = useMemo(() => {
    const total = deputadosFiltrados.length
    const gastoTotal = deputadosFiltrados.reduce((acc, d) => acc + (d.totalGastos || d.totalGasto || 0), 0)
    const gastoMedio = total > 0 ? gastoTotal / total : 0

    return {
      totalFiltrados: total,
      gastoTotalFiltrado: gastoTotal,
      gastoMedioFiltrado: gastoMedio
    }
  }, [deputadosFiltrados])

  const toggleFilters = () => setShowFilters(!showFilters)
  const toggleStats = () => setShowStats(!showStats)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const nextPage = () => {
    if (currentPageAdjusted < totalPages) {
      setCurrentPage(currentPageAdjusted + 1)
    }
  }

  const prevPage = () => {
    if (currentPageAdjusted > 1) {
      setCurrentPage(currentPageAdjusted - 1)
    }
  }

  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
    immediate: boolean = false
  ) => {
    setInputFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset para primeira página ao filtrar

    if (immediate || key === 'partido' || key === 'uf' || key === 'sortBy' || key === 'hasAlertas' || key === 'hasCoroas') {
      setFilters(prev => ({ ...prev, [key]: value }))
    }
  }, [])

  const resetFilters = useCallback(() => {
    const newFilters = {
      ...defaultFilters,
      maxGasto: maxGasto || Infinity
    }
    
    setInputFilters(newFilters)
    
    startTransition(() => {
      setFilters(newFilters)
    })
    
    setCurrentPage(1)
    
    emit('filter:cleared', {
      timestamp: Date.now()
    })
    
    console.log('🔄 [useListaDeputadosFilters] Filtros resetados')
  }, [maxGasto, emit])

  const aplicarFiltroRapido = (tipo: 'top10' | 'alertas' | 'coroas' | 'criticos' | 'baixoGasto') => {
    console.log(`⚡ [useListaDeputadosFilters] Aplicando filtro rápido: ${tipo}`)
    
    const newFilters = { ...defaultFilters, maxGasto: maxGasto || Infinity }
    
    switch (tipo) {
      case 'top10':
        newFilters.sortBy = 'totalGasto'
        setItemsPerPage(10)
        break

      case 'alertas':
        newFilters.hasAlertas = true
        newFilters.sortBy = 'scoreSuspeicao'
        break

      case 'coroas':
        newFilters.hasCoroas = true
        newFilters.sortBy = 'totalGasto'
        break

      case 'criticos':
        newFilters.minScore = 70
        newFilters.sortBy = 'scoreSuspeicao'
        break

      case 'baixoGasto':
        newFilters.maxGasto = 50000
        newFilters.sortBy = 'totalGasto'
        break
    }
    
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const buscarDeputado = (termo: string) => {
    updateFilter('searchTerm', termo)
  }

  const filtrarPorPartido = (partido: string) => {
    updateFilter('partido', partido)
  }

  const filtrarPorUF = (uf: string) => {
    updateFilter('uf', uf)
  }

  const ordenarPor = (campo: SortOption) => {
    updateFilter('sortBy', campo)
  }

  const handlePartidoClick = (data: { nome: string } | null) => {
    if (!data?.nome) return

    console.log(`📊 [useListaDeputadosFilters] Clique no partido: ${data.nome}`)

    if (filters.partido === data.nome) {
      updateFilter('partido', 'TODOS')
    } else {
      updateFilter('partido', data.nome)
    }
  }

  const handleEstadoClick = (data: { nome: string } | null) => {
    if (!data?.nome) return

    console.log(`🗺️ [useListaDeputadosFilters] Clique no estado: ${data.nome}`)

    if (filters.uf === data.nome) {
      updateFilter('uf', 'TODOS')
    } else {
      updateFilter('uf', data.nome)
    }
  }

  const clearPartidoFilter = () => {
    console.log('🔄 [useListaDeputadosFilters] Limpando filtro de partido')
    updateFilter('partido', 'TODOS')
  }

  const clearEstadoFilter = () => {
    console.log('🔄 [useListaDeputadosFilters] Limpando filtro de estado')
    updateFilter('uf', 'TODOS')
  }

  const adjustedCurrentPage = Math.min(currentPage, Math.max(1, totalPages))
  if (adjustedCurrentPage !== currentPage) {
    setCurrentPage(adjustedCurrentPage)
  }

  return {
    viewMode,
    showFilters,
    showStats,
    itemsPerPage,
    currentPage: currentPageAdjusted,
    totalPages,
    filters: inputFilters, // Retornar inputFilters para UI responsiva
    deputadosFiltrados,
    deputadosPaginados,
    totalFiltrados,
    gastoTotalFiltrado,
    gastoMedioFiltrado,

    setViewMode,
    setShowFilters,
    setShowStats,
    toggleFilters,
    toggleStats,
    setItemsPerPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    setFilters,
    updateFilter,
    resetFilters,
    aplicarFiltroRapido,
    buscarDeputado,
    filtrarPorPartido,
    filtrarPorUF,
    ordenarPor,
    handlePartidoClick,
    handleEstadoClick,
    clearPartidoFilter,
    clearEstadoFilter
  }
}

function applyDeputadosFilters(
  deputados: DeputadoProcessado[], 
  filters: FilterState, 
  maxGasto: number
): DeputadoProcessado[] {
  let filtrados = [...deputados]

  if (filters.searchTerm.trim()) {
    const termo = filters.searchTerm.toLowerCase()
    filtrados = filtrados.filter(d => 
      d.nomeEleitoral.toLowerCase().includes(termo) ||
      d.siglaPartido.toLowerCase().includes(termo) ||
      d.siglaUf.toLowerCase().includes(termo)
    )
  }

  if (filters.partido !== 'TODOS') {
    filtrados = filtrados.filter(d => d.siglaPartido === filters.partido)
  }

  if (filters.uf !== 'TODOS') {
    filtrados = filtrados.filter(d => d.siglaUf === filters.uf)
  }

  filtrados = filtrados.filter(d => {
    const totalGasto = d.totalGastos || d.totalGasto || 0
    return totalGasto >= filters.minGasto &&
           totalGasto <= (filters.maxGasto === Infinity ? maxGasto : filters.maxGasto)
  })

  filtrados = filtrados.filter(d => 
    d.scoreSuspeicao >= filters.minScore && 
    d.scoreSuspeicao <= filters.maxScore
  )

  if (filters.hasAlertas !== null) {
    filtrados = filtrados.filter(d => {
      const hasAlertas = Array.isArray(d.alertas) && d.alertas.length > 0
      return hasAlertas === filters.hasAlertas
    })
  }

  if (filters.hasCoroas !== null) {
    filtrados = filtrados.filter(d => {
      const hasCoroas = d.classificacaoRisco === 'Crítico' || d.scoreSuspeicao >= 80
      return hasCoroas === filters.hasCoroas
    })
  }

  return sortDeputados(filtrados, filters.sortBy)
}

function processDeputadosInChunks(
  deputados: DeputadoProcessado[], 
  filters: FilterState, 
  maxGasto: number, 
  chunkSize: number
): DeputadoProcessado[] {
  const chunks: DeputadoProcessado[][] = []
  
  for (let i = 0; i < deputados.length; i += chunkSize) {
    chunks.push(deputados.slice(i, i + chunkSize))
  }
  
  const results: DeputadoProcessado[] = []
  for (const chunk of chunks) {
    const chunkResult = applyDeputadosFilters(chunk, filters, maxGasto)
    results.push(...chunkResult)
  }
  
  return sortDeputados(results, filters.sortBy)
}

function sortDeputados(deputados: DeputadoProcessado[], sortBy: SortOption): DeputadoProcessado[] {
  return deputados.sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case 'nome':
        comparison = a.nomeEleitoral.localeCompare(b.nomeEleitoral)
        break
      case 'totalGasto':
      case 'gastos':
        const totalGastoA = a.totalGastos || a.totalGasto || 0
        const totalGastoB = b.totalGastos || b.totalGasto || 0
        comparison = totalGastoB - totalGastoA // Descendente por padrão
        break
      case 'partido':
        comparison = a.siglaPartido.localeCompare(b.siglaPartido)
        break
      case 'uf':
        comparison = a.siglaUf.localeCompare(b.siglaUf)
        break
      case 'scoreSuspeicao':
      case 'score':
        comparison = (b.scoreSuspeicao || 0) - (a.scoreSuspeicao || 0) // Descendente por padrão
        break
      case 'alertas':
        const alertasA = a.alertas?.length || 0
        const alertasB = b.alertas?.length || 0
        comparison = alertasB - alertasA // Descendente por padrão
        break
      default:
        const defaultGastoA = a.totalGastos || a.totalGasto || 0
        const defaultGastoB = b.totalGastos || b.totalGasto || 0
        comparison = defaultGastoB - defaultGastoA
    }

    return comparison
  })
}