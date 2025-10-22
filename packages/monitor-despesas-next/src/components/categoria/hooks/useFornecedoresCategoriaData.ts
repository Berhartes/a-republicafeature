
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useGlobalFornecedoresProcessor } from '@/hooks/useGlobalFornecedoresProcessor'
import { type FornecedorStats } from '@/services/fornecedores-service'
import { 
  categoriasEquivalentes, 
  normalizarCategoriaDisplay
} from '@/lib/categoria-utils'

export interface FornecedoresCategoriaFilters {
  busca: string
  filtroScore: string
  filtroValor: string
  filtroDeputados: string
  filtroTransacoes: string
  filtroAlerta: string
  apenasComAlertas: boolean
  estadoFiltro: string
  anoFiltro: string
}

export interface FornecedoresCategoriaDataState {
  fornecedores: FornecedorStats[]
  fornecedoresFiltrados: FornecedorStats[]
  fornecedoresOrdenados: FornecedorStats[]
  estatisticasGerais: any
  loading: boolean
  mostrarTodos: boolean
  carregandoMais: boolean
  temMaisItens: boolean
  paginaAtual: number
  categoria: string
}

export function useFornecedoresCategoriaData(categoria: string) {
  const {
    status: processingStatus,
    progress,
    isProcessing,
    error: processingError,
    dadosProcessados,
    ultimoProcessamento,
    temCacheValido,
    cacheInfo,
    iniciarProcessamento,
    cancelarProcessamento,
    limparCache,
    atualizarDados,
    getFornecedoresPorCategoria,
    getCategorias,
    getEstatisticasGlobais,
    getStaleCache,
    getAcceptableCache,
    hasAcceptableCache
  } = useGlobalFornecedoresProcessor()

  const fornecedoresDaCategoria = useMemo(() => {
    let todosFornecedores: FornecedorStats[] = []
    
    if (temCacheValido && dadosProcessados) {
      todosFornecedores = Object.values(dadosProcessados.categorias).flat()
    } else if (hasAcceptableCache()) {
      const acceptableCache = getAcceptableCache()
      if (acceptableCache) {
        todosFornecedores = Object.values(acceptableCache.categorias).flat()
      }
    } else {
      const staleCache = getStaleCache()
      if (staleCache) {
        todosFornecedores = Object.values(staleCache.categorias).flat()
      }
    }
    
    if (!todosFornecedores || todosFornecedores.length === 0 || !categoria) return []
    
    return todosFornecedores.filter(fornecedor => {
      if (!fornecedor.categorias || fornecedor.categorias.length === 0) return false
      
      return fornecedor.categorias.some(categoriaFornecedor => {
        const categoriaNormalizada = normalizarCategoriaDisplay(categoriaFornecedor)
        const filtroNormalizado = normalizarCategoriaDisplay(categoria)
        
        return categoriasEquivalentes(categoriaNormalizada, filtroNormalizado) ||
               categoriaNormalizada === filtroNormalizado ||
               categoriaFornecedor === categoria // Fallback para correspondência exata
      })
    })
  }, [categoria, temCacheValido, dadosProcessados, hasAcceptableCache, getAcceptableCache, getStaleCache])

  const [fornecedores, setFornecedores] = useState<FornecedorStats[]>([])
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<FornecedorStats[]>([])
  const [fornecedoresOrdenados, setFornecedoresOrdenados] = useState<FornecedorStats[]>([])
  const [estatisticasGerais, setEstatisticasGerais] = useState<any>(null)
  
  const [loading, setLoading] = useState(isProcessing)
  const [mostrarTodos, setMostrarTodos] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [temMaisItens, setTemMaisItens] = useState(true)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [ordenacao, setOrdenacao] = useState('score-desc')
  
  const isConnected = true

  const ITENS_POR_PAGINA = 100

  const [filters, setFilters] = useState<FornecedoresCategoriaFilters>({
    busca: '',
    filtroScore: 'todos',
    filtroValor: 'todos',
    filtroDeputados: 'todos',
    filtroTransacoes: 'todas',
    filtroAlerta: 'todos',
    apenasComAlertas: false,
    estadoFiltro: 'todos',
    anoFiltro: '2025' // Igual às premiações
  })

  const anosDisponiveis = [2025, 2024, 2023]

  const carregarFornecedores = async (forceRefresh = false) => {
    console.log(`⚡ [useFornecedoresCategoriaData] UNIFICADO: Carregando fornecedores da categoria "${categoria}"`);
    
    if (forceRefresh && !isProcessing) {
      console.log(`🔄 [useFornecedoresCategoriaData] Force refresh: iniciando processamento global`);
      await atualizarDados();
    }
    
    console.log(`✅ [useFornecedoresCategoriaData] Usando ${fornecedoresDaCategoria.length} fornecedores filtrados para categoria "${categoria}"`);
  }

  const aplicarFiltros = (fornecedoresList: FornecedorStats[] = fornecedores) => {
    let fornecedoresFiltradosLocal = [...fornecedoresList]

    if (filters.busca.trim()) {
      const termoBusca = filters.busca.toLowerCase().trim()
      fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(forn =>
        forn.nomeEleitoral.toLowerCase().includes(termoBusca) ||
        forn.cnpj.includes(termoBusca)
      )
    }

    if (filters.filtroScore !== 'todos') {
      switch (filters.filtroScore) {
        case 'suspeitos':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.scoreSuspeicao >= 30)
          break
        case 'baixo-risco':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.scoreSuspeicao < 30)
          break
        case 'alto-risco':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.scoreSuspeicao >= 50)
          break
      }
    }

    if (filters.filtroValor !== 'todos') {
      switch (filters.filtroValor) {
        case 'acima-100k':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.totalTransacionado >= 100000)
          break
        case 'acima-500k':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.totalTransacionado >= 500000)
          break
        case 'acima-1m':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.totalTransacionado >= 1000000)
          break
      }
    }

    if (filters.filtroDeputados !== 'todos') {
      switch (filters.filtroDeputados) {
        case 'multiplos':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.deputadosAtendidos.length > 1)
          break
        case 'exclusivos':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.deputadosAtendidos.length === 1)
          break
        case 'muitos':
          fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.deputadosAtendidos.length >= 5)
          break
      }
    }

    if (filters.apenasComAlertas) {
      fornecedoresFiltradosLocal = fornecedoresFiltradosLocal.filter(f => f.alertas && f.alertas.length > 0)
    }

    setFornecedoresFiltrados(fornecedoresFiltradosLocal)
    aplicarOrdenacao(fornecedoresFiltradosLocal)
  }

  const aplicarOrdenacao = (fornecedoresList: FornecedorStats[] = fornecedoresFiltrados) => {
  const fornecedoresOrdenadosLocal = [...fornecedoresList]

    switch (ordenacao) {
      case 'score-desc':
        fornecedoresOrdenadosLocal.sort((a, b) => b.scoreSuspeicao - a.scoreSuspeicao)
        break
      case 'score-asc':
        fornecedoresOrdenadosLocal.sort((a, b) => a.scoreSuspeicao - b.scoreSuspeicao)
        break
      case 'valor-desc':
        fornecedoresOrdenadosLocal.sort((a, b) => b.totalTransacionado - a.totalTransacionado)
        break
      case 'valor-asc':
        fornecedoresOrdenadosLocal.sort((a, b) => a.totalTransacionado - b.totalTransacionado)
        break
      case 'nome-asc':
        fornecedoresOrdenadosLocal.sort((a, b) => a.nomeEleitoral.localeCompare(b.nomeEleitoral))
        break
      case 'deputados-desc':
        fornecedoresOrdenadosLocal.sort((a, b) => b.deputadosAtendidos.length - a.deputadosAtendidos.length)
        break
      default:
        break
    }

    setFornecedoresOrdenados(fornecedoresOrdenadosLocal)
  }

  const updateFilter = (filtro: string, valor: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filtro]: valor }
      return newFilters
    })
  }

  const handleAnoChange = useCallback((novoAno: string) => {
    updateFilter('anoFiltro', novoAno)
  }, [])

  const resetarFiltros = () => {
    setFilters({
      busca: '',
      filtroScore: 'todos',
      filtroValor: 'todos',
      filtroDeputados: 'todos',
      filtroTransacoes: 'todas',
      filtroAlerta: 'todos',
      apenasComAlertas: false,
      estadoFiltro: 'todos',
      anoFiltro: '2025'
    })
  }

  useEffect(() => {
    if (fornecedoresDaCategoria.length > 0) {
      console.log(`🔄 [useFornecedoresCategoriaData] UNIFICADO: Atualizando com ${fornecedoresDaCategoria.length} fornecedores da categoria "${categoria}"`)
      
      const fornecedoresProcessados = fornecedoresDaCategoria.map(f => ({
        ...f,
        totalTransacionado: f.totalRecebido || f.totalTransacionado || 0,
        numeroTransacoes: f.numeroTransacoes || f.transacoes || 0
      }))
      
      setFornecedores(fornecedoresProcessados)
      
      const deputadosUnicos = new Set()
      fornecedoresProcessados.forEach(f => {
        if (f.deputadosAtendidos && Array.isArray(f.deputadosAtendidos)) {
          f.deputadosAtendidos.forEach(dep => deputadosUnicos.add(dep))
        }
      })
      
      const estatisticas = {
        totalFornecedores: fornecedoresProcessados.length,
        totalDeputadosProcessados: deputadosUnicos.size,
        transacoesTotais: fornecedoresProcessados.reduce((sum, f) => sum + (f.numeroTransacoes || 0), 0),
        valorMedioFornecedor: fornecedoresProcessados.length > 0 
          ? fornecedoresProcessados.reduce((sum, f) => sum + (f.totalTransacionado || 0), 0) / fornecedoresProcessados.length
          : 0,
        volumeTotal: fornecedoresProcessados.reduce((sum, f) => sum + (f.totalTransacionado || 0), 0)
      }
      setEstatisticasGerais(estatisticas)
      
      aplicarFiltros(fornecedoresProcessados)
      setLoading(false)
    } else if (!isProcessing) {
      setLoading(false)
    }
  }, [fornecedoresDaCategoria, categoria, isProcessing])
  
  useEffect(() => {
    setLoading(isProcessing)
  }, [isProcessing])
  
  useEffect(() => {
    console.log(`📊 [useFornecedoresCategoriaData] Estado atual:`, {
      categoria,
      fornecedores: fornecedores.length,
      fornecedoresFiltrados: fornecedoresFiltrados.length,
      fornecedoresOrdenados: fornecedoresOrdenados.length,
      loading,
      isConnected,
      filters
    })
  }, [categoria, fornecedores.length, fornecedoresFiltrados.length, fornecedoresOrdenados.length, loading, isConnected, filters])

  useEffect(() => {
    if (fornecedores.length > 0) {
      aplicarFiltros()
    }
  }, [fornecedores, filters.busca, filters.filtroScore, filters.filtroValor, filters.filtroDeputados, filters.apenasComAlertas])

  useEffect(() => {
    if (fornecedoresFiltrados.length > 0) {
      aplicarOrdenacao()
    }
  }, [fornecedoresFiltrados, ordenacao])

  return {
    fornecedores,
    fornecedoresFiltrados,
    fornecedoresOrdenados,
    estatisticasGerais,
    loading,
    mostrarTodos,
    carregandoMais,
    temMaisItens,
    paginaAtual,
    ordenacao,
    filters,
    isConnected, // Usar status do contexto
    anosDisponiveis, // ✅ NOVO: Anos disponíveis
    categoria, // ✅ NOVO: Categoria atual
    carregarFornecedores,
    updateFilter,
    resetarFiltros,
    setOrdenacao,
    setMostrarTodos,
    handleAnoChange // ✅ NOVO: Handler para mudança de ano
  }
}