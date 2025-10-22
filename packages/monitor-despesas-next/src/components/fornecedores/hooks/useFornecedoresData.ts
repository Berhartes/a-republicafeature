import { useState, useEffect, useCallback } from 'react'
import { useFornecedoresContextOptional } from '@/contexts/FornecedoresDataContext'
import { fornecedoresService } from '@/services/fornecedores-service'
import type { FornecedorStats } from '@/types/gastos'
import { useGlobalFornecedoresProcessor } from '@/hooks/useGlobalFornecedoresProcessor'

export interface FornecedoresFilters {
  busca: string
  filtroScore: string
  filtroValor: string
  filtroDeputados: string
  filtroCategoria: string
  filtroTransacoes: string
  filtroAlerta: string
  apenasComAlertas: boolean
  estadoFiltro: string
}

export interface FornecedoresDataState {
  fornecedores: FornecedorStats[]
  fornecedoresFiltrados: FornecedorStats[]
  fornecedoresOrdenados: FornecedorStats[]
  categoriasDisponiveis: string[]
  estatisticasGerais: any
  loading: boolean
  mostrarTodos: boolean
  carregandoMais: boolean
  temMaisItens: boolean
  paginaAtual: number
}

const obterCategoriaRisco = (score: number): string => {
  if (score >= 80) return 'Crítico'
  if (score >= 60) return 'Alto'
  if (score >= 40) return 'Médio'
  return 'Baixo'
}

export function useFornecedoresData() {
  const globalProcessor = useGlobalFornecedoresProcessor()
  
  const fornecedoresContext = useFornecedoresContextOptional()
  
  const contextData = fornecedoresContext ? {
    isLoading: fornecedoresContext.loading,
    error: fornecedoresContext.error,
    refetch: fornecedoresContext.refetch,
    isConnected: fornecedoresContext.isConnected
  } : null

  const [fornecedores, setFornecedores] = useState<FornecedorStats[]>([])
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<FornecedorStats[]>([])
  const [fornecedoresOrdenados, setFornecedoresOrdenados] = useState<FornecedorStats[]>([])
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([])
  const [estatisticasGerais, setEstatisticasGerais] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [temMaisItens, setTemMaisItens] = useState(true)
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [ordenacao, setOrdenacao] = useState('score-desc')

  const ITENS_POR_PAGINA = 100

  const [filters, setFilters] = useState<FornecedoresFilters>({
    busca: '',
    filtroScore: 'todos',
    filtroValor: 'todos',
    filtroDeputados: 'todos',
    filtroCategoria: 'todas',
    filtroTransacoes: 'todas',
    filtroAlerta: 'todos',
    apenasComAlertas: false,
    estadoFiltro: 'todos'
  })

  const carregarFornecedores = async (apenasComScore = false) => {
    if (fornecedoresContext) {
      console.log('🔄 [useFornecedoresData] Usando FornecedoresDataProvider...')
      await fornecedoresContext.buscarFornecedores({
        ano: new Date().getFullYear(),
        mes: 'todos',
        uf: filters.estadoFiltro !== 'todos' ? filters.estadoFiltro : undefined,
        offset: 0,
        apenasComScore,
        scoreMinimo: 0,
      })
      setMostrarTodos(!apenasComScore)
      return
    }
    
    setLoading(true)
    try {
      console.log('🔄 [useFornecedoresData] Fallback para serviço direto...')
      
      const response = await fornecedoresService.buscarFornecedoresUnificado({
        ano: new Date().getFullYear(),
        mes: 'todos',
        uf: filters.estadoFiltro !== 'todos' ? filters.estadoFiltro : undefined,
        offset: 0,
        apenasComScore,
        scoreMinimo: 0,
      })

      setFornecedores(response.fornecedores)
      setEstatisticasGerais(response.estatisticas)
      setTemMaisItens(response.hasMore)
      setMostrarTodos(!apenasComScore)
      
      console.log(`✅ ${response.fornecedores.length} fornecedores carregados via fallback`)
      
    } catch (error) {
      console.error('❌ Erro ao carregar fornecedores:', error)
      setFornecedores([])
      setEstatisticasGerais(null)
    } finally {
      setLoading(false)
    }
  }

  const carregarMaisFornecedores = async () => {
    if (carregandoMais || !temMaisItens) return
    
    setCarregandoMais(true)
    try {
      const response = await fornecedoresService.buscarFornecedoresUnificado({
        ano: new Date().getFullYear(),
        mes: 'todos',
        uf: filters.estadoFiltro !== 'todos' ? filters.estadoFiltro : undefined,
        offset: fornecedores.length,
        apenasComScore: !mostrarTodos,
        scoreMinimo: 30
      })

      if (response.fornecedores.length > 0) {
        setFornecedores(prev => [...prev, ...response.fornecedores])
        setPaginaAtual(prev => prev + 1)
        setTemMaisItens(response.hasMore)
      } else {
        setTemMaisItens(false)
      }
    } catch (error) {
      console.error('Erro ao carregar mais fornecedores:', error)
    } finally {
      setCarregandoMais(false)
    }
  }

  const aplicarFiltrosUnificados = useCallback((dados: FornecedorStats[]) => {
    if (!Array.isArray(dados) || dados.length === 0) {
      console.log('⚠️ [FILTROS] Dados de entrada inválidos:', { dados: dados, tipo: typeof dados })
      return []
    }
    
  let resultado = [...dados]
  const filtrosAplicados: string[] = []
    
    console.log('🔍 [FILTROS] Iniciando filtragem:', {
      dadosEntrada: dados.length,
      amostraDados: dados.slice(0, 2).map(f => ({
        nome: f.nome,
        cnpj: f.cnpj,
        valor: f.totalRecebido || f.totalTransacionado,
        categorias: f.categorias
      }))
    })

    if (filters.busca) {
      const buscaNormalizada = filters.busca.toLowerCase().trim()
      resultado = resultado.filter(f => {
        const nomeNorm = f.nome.toLowerCase().trim()
        const cnpjNorm = f.cnpj.replace(/[^\d]/g, '') // Remove formatação
        const deputadosNorm = Array.isArray(f.deputadosAtendidos)
          ? f.deputadosAtendidos.map(d => {
              const depStr = typeof d === 'object' && d !== null ? (d.nome || d.id || String(d)) : String(d)
              return depStr.toLowerCase().trim()
            })
          : []
        
        return nomeNorm.includes(buscaNormalizada) ||
               cnpjNorm.includes(buscaNormalizada.replace(/[^\d]/g, '')) ||
               deputadosNorm.some(d => d.includes(buscaNormalizada))
      })
      filtrosAplicados.push(`Busca: "${filters.busca}"`)
    }

    if (filters.filtroScore !== 'todos') {
      switch (filters.filtroScore) {
        case 'alto':
          resultado = resultado.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Alto' || obterCategoriaRisco(f.scoreSuspeicao) === 'Crítico')
          break
        case 'medio':
          resultado = resultado.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Médio')
          break
        case 'baixo':
          resultado = resultado.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Baixo')
          break
      }
      filtrosAplicados.push(`Score: ${filters.filtroScore}`)
    }

    if (filters.filtroValor !== 'todos') {
      switch (filters.filtroValor) {
        case 'ate10k':
          resultado = resultado.filter(f => f.totalTransacionado <= 10000)
          break
        case '10k-50k':
          resultado = resultado.filter(f => f.totalTransacionado > 10000 && f.totalTransacionado <= 50000)
          break
        case '50k-100k':
          resultado = resultado.filter(f => f.totalTransacionado > 50000 && f.totalTransacionado <= 100000)
          break
        case '100k-500k':
          resultado = resultado.filter(f => f.totalTransacionado > 100000 && f.totalTransacionado <= 500000)
          break
        case 'acima500k':
          resultado = resultado.filter(f => f.totalTransacionado > 500000)
          break
      }
      filtrosAplicados.push(`Valor: ${filters.filtroValor}`)
    }

    if (filters.filtroCategoria !== 'todas') {
      resultado = resultado.filter(f => 
        f.categorias.some(cat => cat.toLowerCase().includes(filters.filtroCategoria.toLowerCase()))
      )
      filtrosAplicados.push(`Categoria: ${filters.filtroCategoria}`)
    }

    if (filters.filtroTransacoes !== 'todas') {
      switch (filters.filtroTransacoes) {
        case 'poucas':
          resultado = resultado.filter(f => f.totalTransacoes <= 5)
          break
        case 'normais':
          resultado = resultado.filter(f => f.totalTransacoes > 5 && f.totalTransacoes <= 20)
          break
        case 'muitas':
          resultado = resultado.filter(f => f.totalTransacoes > 20)
          break
      }
      filtrosAplicados.push(`Transações: ${filters.filtroTransacoes}`)
    }

    if (filters.apenasComAlertas) {
      resultado = resultado.filter(f => f.scoreSuspeicao >= 30)
      filtrosAplicados.push('Apenas com alertas')
    }

    console.log(`🔍 Filtros aplicados (${filtrosAplicados.length}):`, filtrosAplicados)
    console.log(`📊 Resultado: ${resultado.length} de ${dados.length} fornecedores`)

    return resultado
  }, [filters])

  const aplicarOrdenacao = useCallback((dados: FornecedorStats[]) => {
    const resultado = [...dados]
    
    switch (ordenacao) {
      case 'score-desc':
        return resultado.sort((a, b) => b.scoreSuspeicao - a.scoreSuspeicao)
      case 'score-asc':
        return resultado.sort((a, b) => a.scoreSuspeicao - b.scoreSuspeicao)
      case 'valor-desc':
        return resultado.sort((a, b) => b.totalTransacionado - a.totalTransacionado)
      case 'valor-asc':
        return resultado.sort((a, b) => a.totalTransacionado - b.totalTransacionado)
      case 'nome-asc':
        return resultado.sort((a, b) => a.nome.localeCompare(b.nome))
      case 'nome-desc':
        return resultado.sort((a, b) => b.nome.localeCompare(a.nome))
      case 'transacoes-desc':
        return resultado.sort((a, b) => b.totalTransacoes - a.totalTransacoes)
      case 'transacoes-asc':
        return resultado.sort((a, b) => a.totalTransacoes - b.totalTransacoes)
      default:
        return resultado
    }
  }, [ordenacao])

  useEffect(() => {
    console.log('🔍 [FILTROS] Aplicando filtros...', {
      fornecedoresOriginais: fornecedores.length,
      filtros: filters
    })
    
    const filtrados = aplicarFiltrosUnificados(fornecedores)
    setFornecedoresFiltrados(filtrados)
    
    console.log('📊 [FILTROS] Resultado:', {
      fornecedoresOriginais: fornecedores.length,
      fornecedoresFiltrados: filtrados.length,
      filtrosAtivos: Object.entries(filters).filter(([key, value]) => 
        value !== 'todos' && value !== 'todas' && value !== '' && value !== false
      )
    })
  }, [fornecedores, filters, aplicarFiltrosUnificados])

  useEffect(() => {
    const ordenados = aplicarOrdenacao(fornecedoresFiltrados)
    setFornecedoresOrdenados(ordenados)
  }, [fornecedoresFiltrados, ordenacao, aplicarOrdenacao])

  useEffect(() => {
    if (fornecedores.length > 0) {
      const categoriasUnicas = new Set<string>()
      
      fornecedores.forEach(fornecedor => {
        fornecedor.categorias.forEach(categoria => {
          if (categoria && categoria.trim() !== '' && categoria !== 'Não especificado') {
            categoriasUnicas.add(categoria.trim())
          }
        })
      })
      
      const categoriasOrdenadas = Array.from(categoriasUnicas).sort((a, b) => a.localeCompare(b))
      setCategoriasDisponiveis(categoriasOrdenadas)
      
      console.log(`📊 [CATEGORIAS] Encontradas ${categoriasOrdenadas.length} categorias únicas:`, categoriasOrdenadas.slice(0, 10))
    }
  }, [fornecedores])

  useEffect(() => {
    console.log('=== FORNECEDORES PAGE - Versão Unificada ===')
    if (fornecedores.length === 0) { // Só carregar se não há dados do cache global
      carregarFornecedores(false) // false = carregar todos os fornecedores
    }
  }, [filters.estadoFiltro])

  const updateFilter = (key: keyof FornecedoresFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const resetarFiltros = () => {
    setFilters({
      busca: '',
      filtroScore: 'todos',
      filtroValor: 'todos',
      filtroDeputados: 'todos',
      filtroCategoria: 'todas',
      filtroTransacoes: 'todas',
      filtroAlerta: 'todos',
      apenasComAlertas: false,
      estadoFiltro: 'todos'
    })
  }

  useEffect(() => {
    console.log('🎨 [useFornecedoresData] Verificando cache global...', {
      dadosProcessados: !!globalProcessor.dadosProcessados,
      temCacheValido: globalProcessor.temCacheValido,
      loading,
      fornecedoresLength: fornecedores.length
    })
    
    let dadosCache = globalProcessor.dadosProcessados
    let tipoCache = 'processados'
    
    if (!dadosCache) {
      dadosCache = globalProcessor.getAcceptableCache()
      tipoCache = 'acceptable'
    }
    
    if (!dadosCache) {
      dadosCache = globalProcessor.getStaleCache()
      tipoCache = 'stale'
    }
    
    if (dadosCache) {
      console.log(`✅ [useFornecedoresData] Carregando dados do cache ${tipoCache}`, {
        totalFornecedores: dadosCache.totalFornecedores,
        categorias: Object.keys(dadosCache.categorias).length,
        lastProcessed: dadosCache.lastProcessed
      })
      
      const todosOsFornecedores: FornecedorStats[] = []
      const categorias: string[] = []
      
      try {
        Object.entries(dadosCache.categorias).forEach(([categoria, fornecedoresDaCategoria]) => {
          if (Array.isArray(fornecedoresDaCategoria) && fornecedoresDaCategoria.length > 0) {
            categorias.push(categoria)
            fornecedoresDaCategoria.forEach(fornecedor => {
              if (fornecedor && (fornecedor.nome || fornecedor.cnpj)) {
                const totalRecebido = fornecedor.totalRecebido ?? fornecedor.totalTransacionado ?? 0
                const numeroTransacoes = fornecedor.numeroTransacoes ?? fornecedor.transacoes ?? fornecedor.totalTransacoes ?? 0

                const fornecedorNormalizado: FornecedorStats = {
                  nome: fornecedor.nome || 'Nome não informado',
                  cnpj: fornecedor.cnpj || '',
                  cnpjCpf: fornecedor.cnpjCpf || fornecedor.cnpj || '',
                  totalRecebido,
                  totalTransacionado: fornecedor.totalTransacionado ?? totalRecebido,
                  numeroTransacoes,
                  transacoes: fornecedor.transacoes ?? numeroTransacoes,
                  totalTransacoes: fornecedor.totalTransacoes ?? fornecedor.transacoes ?? numeroTransacoes,
                  scoreSuspeicao: fornecedor.scoreSuspeicao || 0,
                  deputadosAtendidos: fornecedor.deputadosAtendidos || [],
                  categorias: fornecedor.categorias || [categoria],
                  valorMedioTransacao: fornecedor.valorMedioTransacao || 0,
                  ...fornecedor // Manter outros campos que possam existir
                }
                
                todosOsFornecedores.push(fornecedorNormalizado)
              } else {
                console.warn('⚠️ [useFornecedoresData] Fornecedor com dados muito incompletos:', fornecedor)
              }
            })
          }
        })
        
        if (todosOsFornecedores.length > 0) {
          setFornecedores(todosOsFornecedores)
          setCategoriasDisponiveis(categorias)
          setEstatisticasGerais(dadosCache.estatisticas)
          setLoading(false)
          
          console.log(`✅ [useFornecedoresData] Cache carregado com sucesso:`, {
            fornecedores: todosOsFornecedores.length,
            categorias: categorias.length,
            tipoCache,
            amostra: todosOsFornecedores.slice(0, 3).map(f => ({ 
              nome: f.nome, 
              valor: f.totalRecebido || f.totalTransacionado,
              categoria: f.categorias?.[0]
            }))
          })
        } else {
          console.error('❌ [useFornecedoresData] Cache carregado mas sem fornecedores válidos')
          if (!loading) {
            carregarFornecedores(false)
          }
        }
        
      } catch (error) {
        console.error('❌ [useFornecedoresData] Erro ao processar dados do cache:', error)
        if (!loading) {
          carregarFornecedores(false)
        }
      }
      
    } else if (!loading && fornecedores.length === 0) {
      console.log('⚠️ [useFornecedoresData] Nenhum cache disponível, tentando carregar dados do service...')
      carregarFornecedores(false)
    } else {
      console.log('📋 [useFornecedoresData] Estado atual:', {
        temCache: !!dadosCache,
        loading,
        fornecedoresCarregados: fornecedores.length
      })
    }
  }, [globalProcessor.dadosProcessados, globalProcessor.temCacheValido, loading, fornecedores.length])

  useEffect(() => {
    if (!loading && fornecedores.length > 0) {
      const fornecedoresZerados = fornecedores.filter(f => 
        (!f.nome || f.nome === 'Nome não informado') && 
        (!f.totalRecebido || f.totalRecebido === 0) &&
        (!f.totalTransacionado || f.totalTransacionado === 0)
      )
      
      if (fornecedoresZerados.length > fornecedores.length * 0.5) { // Se mais de 50% estão zerados
        console.warn('🚨 [useFornecedoresData] AUTO-RECOVERY: Dados zerados detectados!', {
          total: fornecedores.length,
          zerados: fornecedoresZerados.length,
          porcentagem: (fornecedoresZerados.length / fornecedores.length * 100).toFixed(1) + '%'
        })
        
        setTimeout(() => {
          console.log('🔄 [useFornecedoresData] AUTO-RECOVERY: Tentando recarregar dados...')
          
          globalProcessor.limparCache()
          
          carregarFornecedores(false)
        }, 2000)
      }
    }
  }, [loading, fornecedores])

  useEffect(() => {
    if (!loading && fornecedores.length > 0) {
      const dadosValidos = fornecedores.filter(f => 
        f.nome && f.nome !== 'Nome não informado' && 
        (f.totalRecebido > 0 || f.totalTransacionado > 0)
      )
      
      if (dadosValidos.length === 0) {
        console.error('❌ [useFornecedoresData] CRÍTICO: Nenhum fornecedor com dados válidos encontrado!')
      } else if (dadosValidos.length < fornecedores.length * 0.8) {
        console.warn('⚠️ [useFornecedoresData] ATENÇÃO: Muitos fornecedores com dados incompletos', {
          validos: dadosValidos.length,
          total: fornecedores.length,
          porcentagemValida: (dadosValidos.length / fornecedores.length * 100).toFixed(1) + '%'
        })
      } else {
        console.log('✅ [useFornecedoresData] Dados validados com sucesso', {
          validos: dadosValidos.length,
          total: fornecedores.length
        })
      }
    }
  }, [loading, fornecedores])

  return {
    fornecedores,
    fornecedoresFiltrados,
    fornecedoresOrdenados,
    categoriasDisponiveis,
    estatisticasGerais,
    
    loading,
    mostrarTodos,
    carregandoMais,
    temMaisItens,
    paginaAtual,
    ordenacao,
    
    filters,
    
    isConnected: contextData?.isConnected ?? true,
    Loading: contextData?.isLoading ?? loading,
    error: contextData?.error ?? null,
    
    temCacheGlobal: globalProcessor.temCacheValido,
    cacheGlobalInfo: globalProcessor.cacheInfo,
    
    carregarFornecedores,
    carregarMaisFornecedores,
    updateFilter,
    resetarFiltros,
    setOrdenacao,
    setMostrarTodos,
    refetch: contextData?.refetch ?? (() => carregarFornecedores(true)),
    
    iniciarProcessamentoGlobal: globalProcessor.iniciarProcessamento,
    limparCacheGlobal: globalProcessor.limparCache
  }
}
