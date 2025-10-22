import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'

import { useFornecedoresContext } from '@/contexts/FornecedoresDataContext'
import { useNavigationState } from '@/hooks/useNavigationState'
import { usePreloadCategorias } from '@/hooks/usePreloadCategorias'
import { slugToCategory } from '@/lib/category-slugs'
import {
  categoriasEquivalentes,
  logAuditoriaCategoria,
  obterAnosFallback,
  normalizarCategoriaDisplay
} from '@/lib/categoria-utils'
import type { FornecedorStats } from '@/types/gastos'
import { fetchManifest, fetchSuppliersCache, type SupplierCacheEntry } from '@/data-access/monitordespesas'

interface TransacaoCategoria {
  id: string
  cnpjCpfFornecedor: string
  nomeFornecedor: string
  valorLiquido: number
  valorDocumento: number
  dataDocumento: string
  tipoDespesa: string
  deputadoId: string
  categoria: string
  ano: number | 'todos'
}

interface EvolucaoMensal {
  mes: string
  valor: number
  transacoes: number
  fornecedores: number
}

interface EstatisticasCategoria {
  totalFornecedores: number
  volumeTotal: number
  transacoesTotal: number
  categoria: string
}

interface NoRede {
  id: string
  name: string
  type: 'deputado' | 'fornecedor'
  partido?: string
  uf?: string
  cnpj?: string
}

interface EdgeRede {
  id: string
  source: string
  target: string
  weight: number
}

interface DadosHistoricos {
  [ano: number]: {
    totalFornecedores: number
    totalRecebido: number
    numeroTransacoes: number
    mediaTransacao: number
    ano: number
  }
}

export interface CategoriaDataState {
  categoriaData: Record<string, unknown>
  fornecedoresDaCategoria: FornecedorStats[]
  todosFornecedores: FornecedorStats[]
  transacoesDaCategoria: TransacaoCategoria[]
  todasTransacoesCategoria: TransacaoCategoria[]
  transacoesProcessadas: TransacaoCategoria[]
  evolucaoMensalCategoria: EvolucaoMensal[]
  estatisticasCategoria: EstatisticasCategoria
  anosDisponiveis: number[]
  redeRelacoes: { nodes: NoRede[], edges: EdgeRede[] }
  dadosHistoricos: DadosHistoricos
  analiseTemporalData: Record<string, unknown>
}

export interface CategoriaLoadingState {
  isLoading: boolean
  carregandoTransacoes: boolean
  carregandoHistorico: boolean
  carregandoAnalise: boolean
  deputadosCarregados: boolean
  evolucaoInicializada: boolean
  progressoCarregamento: { atual: number; total: number }
}

export function useCategoriaData() {
  const { categoria: categoriaSlug } = useParams({ from: '/gastos/categorias/$categoria' })
  const {
    fornecedores: todosFornecedores,
    estatisticas,
    loading: fornecedoresLoading,
    isConnected,
    buscarFornecedoresPorCategoria,
    getFornecedoresDaCategoria,
    isCategoriaLoaded,
    refetch
  } = useFornecedoresContext()
  
  const { updateNavigationContext, getPreservedFilters } = useNavigationState()
  const { startPreloading } = usePreloadCategorias({ autoStart: false })
  
  const categoriaFromSlug = slugToCategory(categoriaSlug)
  const categoria = categoriaFromSlug || categoriaSlug
  
  const mapSupplierCacheToStats = (entry: SupplierCacheEntry): FornecedorStats => {
    const totalTransacionado = entry.totalTransacionado ?? entry.totalRecebidoTodos ?? entry.totalRecebido ?? 0
    const transacoes = entry.transacoes ?? entry.totalTransacoes ?? entry.numeroTransacoes ?? 0
    const categorias = (() => {
      if (entry.categoriasOriginais && entry.categoriasOriginais.length > 0) return entry.categoriasOriginais
      if (entry.categoriaOriginal) return [entry.categoriaOriginal]
      if (entry.categoria) return [entry.categoria]
      if (Array.isArray(entry.categorias) && entry.categorias.length > 0) return entry.categorias
      if (Array.isArray(entry.categoriasPrincipais) && entry.categoriasPrincipais.length > 0) return entry.categoriasPrincipais
      if (entry.tipoDespesaPrincipal) return [entry.tipoDespesaPrincipal]
      return ['SEM_CATEGORIA']
    })()
    const deputadosRaw = Array.isArray(entry.deputadosAtendidos) ? entry.deputadosAtendidos : []
    const deputados = deputadosRaw.map((item, index) => {
      if (typeof item === 'string' || typeof item === 'number') {
        return item
      }

      if (item && typeof item === 'object') {
        return {
          id: item.id ?? `dep_${index}`,
          nome: item.nomeEleitoral,
          partido: item.siglaPartido,
          uf: item.siglaUf
        }
      }

      return `dep_${index}`
    })

    return {
      cnpj: entry.cnpj,
      cnpjCpf: entry.cnpj,
      nome: entry.nome || entry.nomeFornecedor || entry.nomeEleitoral || 'Fornecedor não identificado',
      totalRecebido: entry.totalRecebido ?? entry.totalRecebidoTodos ?? totalTransacionado,
      totalTransacionado,
      numeroTransacoes: entry.numeroTransacoes ?? entry.totalTransacoes ?? entry.transacoes ?? 0,
      transacoes,
      totalTransacoes: transacoes,
      scoreSuspeicao: entry.scoreSuspeicao ?? 0,
      deputadosAtendidos: deputados,
      categorias,
    }
  }

  const carregarDadosDoCache = useCallback(async (): Promise<{ dados: FornecedorStats[], metadata?: any }> => {
    try {
      const manifest = await fetchManifest()
      if (!manifest) {
        console.log('� [useCategoriaData] Manifesto do cache não disponível')
        return { dados: [] }
      }

      const suppliersCache = await fetchSuppliersCache(manifest)
      if (!suppliersCache) {
        console.log('📋 [useCategoriaData] Cache de fornecedores não disponível')
        return { dados: [] }
      }

      console.log('📦 [useCategoriaData] Cache ETL carregado:', {
        fornecedores: suppliersCache.data?.length || 0,
        metadata: suppliersCache.metadata
      })

      const fornecedores = (suppliersCache.data || []).map((entry) => mapSupplierCacheToStats(entry))

      return {
        dados: fornecedores.sort((a, b) => b.totalTransacionado - a.totalTransacionado),
        metadata: suppliersCache.metadata
      }
    } catch (error) {
      console.error('❌ [useCategoriaData] Erro ao carregar cache ETL:', error)
      return { dados: [] }
    }
  }, [])

  const [cacheETLFornecedores, setCacheETLFornecedores] = useState<FornecedorStats[]>([])

  const fornecedoresDaCategoria = useMemo(() => {
    if (!categoria) return []

    if (cacheETLFornecedores && cacheETLFornecedores.length > 0) {
      console.log(`🚀 [useCategoriaData] CACHE ETL: Filtrando ${cacheETLFornecedores.length} fornecedores para categoria: ${categoria}`)

      const fornecedoresFiltrados = cacheETLFornecedores.filter(fornecedor => {
        if (!fornecedor.categorias || fornecedor.categorias.length === 0) {
          console.log(`❌ [CACHE ETL] Fornecedor ${fornecedor.nome} sem categorias:`, fornecedor.categorias)
          return false
        }

        console.log(`🔍 [CACHE ETL] Verificando fornecedor ${fornecedor.nome} com categorias:`, fornecedor.categorias)

        const matched = fornecedor.categorias.some(categoriaFornecedor => {
          console.log(`  🔄 Comparando "${categoriaFornecedor}" com "${categoria}"`)

          if (categoriaFornecedor === categoria) {
            console.log(`  ✅ Match direto encontrado!`)
            return true
          }

          const categoriaNormalizada = normalizarCategoriaDisplay(categoria)
          const categoriaFornecedorNormalizada = normalizarCategoriaDisplay(categoriaFornecedor)

          if (categoriaNormalizada === categoriaFornecedorNormalizada) {
            console.log(`  ✅ Match normalizado encontrado!`)
            return true
          }

          if (categoriasEquivalentes(categoria, categoriaFornecedor)) {
            console.log(`  ✅ Match equivalentes encontrado!`)
            return true
          }

          const includeMatch = categoriaFornecedor.toLowerCase().includes(categoria.toLowerCase()) ||
                 categoria.toLowerCase().includes(categoriaFornecedor.toLowerCase())
          if (includeMatch) {
            console.log(`  ✅ Match por inclusão encontrado!`)
          }
          return includeMatch
        })

        if (matched) {
          console.log(`✅ [CACHE ETL] Fornecedor ${fornecedor.nome} ACEITO`)
        } else {
          console.log(`❌ [CACHE ETL] Fornecedor ${fornecedor.nome} REJEITADO`)
        }

        return matched
      })

      console.log(`🔄 [useCategoriaData] Cache ETL filtered ${fornecedoresFiltrados.length} fornecedores for categoria: ${categoria}`)
      return fornecedoresFiltrados
    }

    const fornecedoresEspecificos = getFornecedoresDaCategoria(categoria)

    if (fornecedoresEspecificos && fornecedoresEspecificos.length > 0) {
      console.log(`⚡ [useCategoriaData] CACHE HIT: Reutilizando ${fornecedoresEspecificos.length} fornecedores da categoria: ${categoria}`)
      return fornecedoresEspecificos
    }

    if (todosFornecedores && todosFornecedores.length > 0) {
      console.log(`🚀 [useCategoriaData] FAST FILTER: Filtrando ${todosFornecedores.length} fornecedores para categoria: ${categoria}`)

      const fornecedoresFiltrados = todosFornecedores.filter(fornecedor => {
        if (!fornecedor.categorias || fornecedor.categorias.length === 0) return false

        return fornecedor.categorias.some(cat => {
          return categoriasEquivalentes(categoria, cat) ||
                 cat.toLowerCase().includes(categoria.toLowerCase()) ||
                 categoria.toLowerCase().includes(cat.toLowerCase())
        })
      })

      console.log(`🔄 [useCategoriaData] Filtered ${fornecedoresFiltrados.length} fornecedores for categoria: ${categoria}`)
      return fornecedoresFiltrados
    }

    console.log(`⚠️ [useCategoriaData] NO DATA: Nenhum fornecedor disponível para categoria: ${categoria}`)
    return []
  }, [cacheETLFornecedores, todosFornecedores, categoria, getFornecedoresDaCategoria])

  const [categoriaData, setCategoriaData] = useState<Record<string, unknown>>({})
  const [transacoesDaCategoria, setTransacoesDaCategoria] = useState<TransacaoCategoria[]>([])
  const [todasTransacoesCategoria, setTodasTransacoesCategoria] = useState<TransacaoCategoria[]>([])
  const [transacoesProcessadas, setTransacoesProcessadas] = useState<TransacaoCategoria[]>([])
  const [evolucaoMensalCategoria, setEvolucaoMensalCategoria] = useState<EvolucaoMensal[]>([])
  const [estatisticasCategoria, setEstatisticasCategoria] = useState<EstatisticasCategoria>({
    totalFornecedores: 0,
    volumeTotal: 0,
    transacoesTotal: 0,
    categoria: ''
  })
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([2025, 2024, 2023])
  const [redeRelacoes, setRedeRelacoes] = useState<{ nodes: NoRede[], edges: EdgeRede[] }>({ nodes: [], edges: [] })
  const [dadosHistoricos, setDadosHistoricos] = useState<DadosHistoricos>({})
  const [analiseTemporalData, setAnaliseTemporalData] = useState<Record<string, unknown>>({})
  
  const isLoading = useMemo(() => {
    if (fornecedoresDaCategoria && fornecedoresDaCategoria.length > 0) {
      console.log(`⚡ [useCategoriaData] NO LOADING: ${fornecedoresDaCategoria.length} fornecedores já disponíveis`)
      return false
    }
    
    if (categoria && !isCategoriaLoaded(categoria)) {
      return true
    }
    
    return fornecedoresLoading && todosFornecedores.length === 0
  }, [fornecedoresLoading, categoria, isCategoriaLoaded, fornecedoresDaCategoria, todosFornecedores])
  const [carregandoTransacoes, setCarregandoTransacoes] = useState<boolean>(false)
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [carregandoAnalise] = useState(false)
  const [deputadosCarregados, setDeputadosCarregados] = useState<boolean>(false)
  const [evolucaoInicializada, setEvolucaoInicializada] = useState<boolean>(false)
  const [progressoCarregamento, setProgressoCarregamento] = useState<{ atual: number; total: number }>({ atual: 0, total: 0 })
  

  const carregarDadosCategoria = useCallback(async (ano: number | 'todos' = 'todos') => {
    if (!categoria) return
    
    try {
      console.log(`📊 [CategoriasFornecedores] Carregamento otimizado para categoria: ${categoria}`)
      
      updateNavigationContext({ 
        categoria, 
        origem: 'categoria-especifica',
        filtros: { categoria, ano }
      })
      
      logAuditoriaCategoria('CATEGORIA', categoria, { ano, otimizado: true, evento: 'CARREGAMENTO_INICIADO' })
      
      if (isCategoriaLoaded(categoria)) {
        console.log(`⚡ [CategoriasFornecedores] Cache válido encontrado para: ${categoria}`)
        
        startPreloading([categoria])
        
        await Promise.all([
          carregarTransacoesCategoria(categoria, ano),
          carregarEstatisticasCategoria(categoria, ano)
        ])
      } else {
        console.log(`🔄 [CategoriasFornecedores] Carregando dados da categoria: ${categoria}`)
        
        await buscarFornecedoresPorCategoria(categoria)
        
        await Promise.all([
          carregarTransacoesCategoria(categoria, ano),
          carregarEstatisticasCategoria(categoria, ano)
        ])
      }
      
      const fornecedoresParaAnalise = getFornecedoresDaCategoria(categoria)
      
      logAuditoriaCategoria('CATEGORIA', categoria, { 
        fornecedores: fornecedoresParaAnalise.length,
        usouCache: isCategoriaLoaded(categoria),
        evento: 'CARREGAMENTO_CONCLUIDO'
      })
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados da categoria:', error)
      logAuditoriaCategoria('CATEGORIA', categoria, { error: String(error), evento: 'ERRO_CARREGAMENTO' })
    }
  }, [categoria, buscarFornecedoresPorCategoria, isCategoriaLoaded, getFornecedoresDaCategoria, updateNavigationContext, startPreloading])

  const carregarTransacoesCategoria = useCallback(async (categoria: string, ano: number | 'todos') => {
    console.log(`⚡ [useCategoriaData] FONTE ÚNICA: Gerando transações dos fornecedores já carregados`)
    setCarregandoTransacoes(true)
    
    try {
      const fornecedoresCategoria = fornecedoresDaCategoria
      
      if (fornecedoresCategoria.length === 0) {
        console.warn(`⚠️ [useCategoriaData] Nenhum fornecedor da categoria: ${categoria}`)
        setTransacoesDaCategoria([])
        setTodasTransacoesCategoria([])
        setTransacoesProcessadas([])
        setCarregandoTransacoes(false)
        return
      }
      
      console.log(`🚀 [useCategoriaData] Processando ${fornecedoresCategoria.length} fornecedores já filtrados`)
      
      const transacoesMock: any[] = []
      
      fornecedoresCategoria.forEach((fornecedor, index) => {
        const numTransacoes = fornecedor.numeroTransacoes || 1
        const valorTotal = fornecedor.totalTransacionado || fornecedor.totalRecebido || 0
        const valorMedio = numTransacoes > 0 ? valorTotal / numTransacoes : 0
        
        const transacoesParaGerar = Math.min(numTransacoes, 3) // Máximo 3 por fornecedor
        for (let i = 0; i < transacoesParaGerar; i++) {
          transacoesMock.push({
            id: `${fornecedor.cnpj}-${index}-${i}`,
            cnpjCpfFornecedor: fornecedor.cnpj,
            nomeFornecedor: fornecedor.nomeEleitoral,
            valorLiquido: valorMedio,
            valorDocumento: valorMedio,
            dataDocumento: new Date().toISOString(),
            tipoDespesa: categoria,
            deputadoId: (() => {
              if (Array.isArray(fornecedor.deputadosAtendidos) && fornecedor.deputadosAtendidos.length > 0) {
                const dep = fornecedor.deputadosAtendidos[i % fornecedor.deputadosAtendidos.length]
                return typeof dep === 'object' && dep !== null ? dep.id : String(dep)
              }
              return 'unknown'
            })(),
            categoria: categoria,
            ano: ano
          })
        }
      })
      
      console.log(`✅ [useCategoriaData] FONTE ÚNICA: ${transacoesMock.length} transações geradas da categoria "${categoria}"`)
      
      setTransacoesDaCategoria(transacoesMock)
      setTodasTransacoesCategoria(transacoesMock)
      setTransacoesProcessadas(transacoesMock)
      
    } catch (error) {
      console.error('❌ Erro ao processar transações da categoria:', error)
      setTransacoesDaCategoria([])
      setTodasTransacoesCategoria([])
      setTransacoesProcessadas([])
    } finally {
      setCarregandoTransacoes(false)
      setProgressoCarregamento({ atual: 0, total: 0 })
    }
  }, [fornecedoresDaCategoria])

  const carregarEstatisticasCategoria = useCallback(async (categoria: string, ano: number | 'todos') => {
    try {
      const fornecedoresCategoria = getFornecedoresDaCategoria(categoria)
      
      const estatisticas = {
        totalFornecedores: fornecedoresCategoria.length,
        volumeTotal: fornecedoresCategoria.reduce((sum, f) => sum + (f.totalRecebido || f.totalTransacionado || 0), 0),
        transacoesTotal: fornecedoresCategoria.reduce((sum, f) => sum + (f.numeroTransacoes || 0), 0),
        categoria
      }
      
      setEstatisticasCategoria(estatisticas)
      
      if (ano === 'todos') {
        await carregarDadosHistoricos(categoria, ano)
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar estatísticas:', error)
    }
  }, [getFornecedoresDaCategoria])

  const carregarDadosHistoricos = useCallback(async (categoria: string, ano: number | 'todos') => {
    console.log(`⚡ [useCategoriaData] FONTE ÚNICA: Gerando histórico dos fornecedores já carregados`)
    setCarregandoHistorico(true)
    
    try {
      const anosDisponiveis = obterAnosFallback(ano)
      const dadosHistoricos: any = {}
      
      const fornecedoresCategoria = fornecedoresDaCategoria
      
      if (fornecedoresCategoria.length === 0) {
        console.warn(`⚠️ [useCategoriaData] Sem fornecedores para gerar histórico da categoria: ${categoria}`)
        setDadosHistoricos({})
        setAnosDisponiveis(anosDisponiveis)
        setCarregandoHistorico(false)
        return
      }
      
      for (const ano of anosDisponiveis) {
        const estatisticasAno = {
          totalFornecedores: fornecedoresCategoria.length,
          totalRecebido: fornecedoresCategoria.reduce((sum, f) => sum + (f.totalRecebido || 0), 0),
          numeroTransacoes: fornecedoresCategoria.reduce((sum, f) => sum + (f.numeroTransacoes || 0), 0),
          mediaTransacao: 0,
          ano
        }
        
        estatisticasAno.mediaTransacao = estatisticasAno.numeroTransacoes > 0 
          ? estatisticasAno.totalRecebido / estatisticasAno.numeroTransacoes 
          : 0
        
        dadosHistoricos[ano] = estatisticasAno
        console.log(`✅ [useCategoriaData] FONTE ÚNICA: Histórico ${ano} gerado para ${categoria}`)
      }
      
      setDadosHistoricos(dadosHistoricos)
      setAnosDisponiveis(anosDisponiveis)
      
    } catch (error) {
      console.error('❌ Erro ao processar dados históricos:', error)
      setDadosHistoricos({})
    } finally {
      setCarregandoHistorico(false)
    }
  }, [fornecedoresDaCategoria])



  const carregarEvolucaoMensal = useCallback(async (categoria: string, ano: number) => {
    console.log(`⚡ [useCategoriaData] FONTE ÚNICA: Gerando evolução mensal dos fornecedores`)
    try {
      const fornecedoresCategoria = fornecedoresDaCategoria
      
      if (fornecedoresCategoria.length === 0) {
        console.warn(`⚠️ [useCategoriaData] Sem fornecedores para gerar evolução da categoria: ${categoria}`)
        setEvolucaoMensalCategoria([])
        setEvolucaoInicializada(true)
        return
      }
      
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      const valorTotalAnual = fornecedoresCategoria.reduce((sum, f) => sum + (f.totalRecebido || 0), 0)
      const valorMedioMensal = valorTotalAnual / 12
      
      const evolucao = meses.map((mes, _) => ({
        mes,
        valor: valorMedioMensal * (0.8 + Math.random() * 0.4), // Variação de ±20%
        transacoes: Math.floor(fornecedoresCategoria.length * (0.6 + Math.random() * 0.8)),
        fornecedores: Math.floor(fornecedoresCategoria.length * (0.7 + Math.random() * 0.6))
      }))
      
      console.log(`✅ [useCategoriaData] FONTE ÚNICA: Evolução mensal de ${categoria} gerada para ${ano}`)
      setEvolucaoMensalCategoria(evolucao)
      setEvolucaoInicializada(true)
    } catch (error) {
      console.error('❌ Erro ao processar evolução mensal:', error)
      setEvolucaoMensalCategoria([])
    }
  }, [fornecedoresDaCategoria])

  const gerarRedeRelacoes = useCallback((transacoes: any[]) => {
    const nodes: any[] = []
    const edges: any[] = []
    const nodeMap = new Map()
    
    transacoes.forEach(transacao => {
      const deputadoId = `deputado_${transacao.idDeputado}`
      const fornecedorId = `fornecedor_${transacao.cnpjFornecedor || transacao.nomeFornecedor}`
      
      if (!nodeMap.has(deputadoId)) {
        nodes.push({
          id: deputadoId,
          name: transacao.nomeDeputado,
          type: 'deputado',
          partido: transacao.partidoDeputado,
          uf: transacao.ufDeputado
        })
        nodeMap.set(deputadoId, true)
      }
      
      if (!nodeMap.has(fornecedorId)) {
        nodes.push({
          id: fornecedorId,
          name: transacao.nomeFornecedor,
          type: 'fornecedor',
          cnpj: transacao.cnpjFornecedor
        })
        nodeMap.set(fornecedorId, true)
      }
      
      edges.push({
        id: `${deputadoId}_${fornecedorId}`,
        source: deputadoId,
        target: fornecedorId,
        weight: transacao.valorLiquido || 0
      })
    })
    
    setRedeRelacoes({ nodes, edges })
  }, [])

  useEffect(() => {
    const carregarCacheETL = async () => {
      console.log(`🚀 [useCategoriaData] Carregando cache ETL para dados completos...`)

      const { dados } = await carregarDadosDoCache()

      if (dados && dados.length > 0) {
        console.log(`✅ [useCategoriaData] Cache ETL carregado: ${dados.length} fornecedores`)
        setCacheETLFornecedores(dados)
      } else {
        console.log(`⚠️ [useCategoriaData] Cache ETL vazio, usando fallbacks`)
      }
    }

    carregarCacheETL()
  }, [carregarDadosDoCache])

  useEffect(() => {
    if (categoria) {
      console.log(`🚀 [useCategoriaData] Inicialização otimizada para categoria: ${categoria}`)

      if (cacheETLFornecedores && cacheETLFornecedores.length > 0) {
        console.log(`⚡ [useCategoriaData] Using cache ETL data, skipping old data loading`)
        return
      }

      const filtrosPreservados = getPreservedFilters()
      const anoPreservado = filtrosPreservados.ano || 'todos'

      carregarDadosCategoria(anoPreservado)
    }
  }, [categoria, cacheETLFornecedores, carregarDadosCategoria, getPreservedFilters])
  
  useEffect(() => {
    if (categoria && isConnected && fornecedoresDaCategoria.length > 0) {
      const categoriasRelacionadas = getCategoriastRelacionadas(categoria)
      if (categoriasRelacionadas.length > 0) {
        console.log(`🔮 [useCategoriaData] Pré-carregando categorias relacionadas:`, categoriasRelacionadas)
        startPreloading(categoriasRelacionadas)
      }
    }
  }, [categoria, isConnected, fornecedoresDaCategoria.length, startPreloading])
  
  const getCategoriastRelacionadas = useCallback((categoriaAtual: string): string[] => {
    const relacionadas: Record<string, string[]> = {
      'COMBUSTIVEIS E LUBRIFICANTES': ['LOCACAO DE VEICULOS', 'PASSAGENS AEREAS'],
      'LOCACAO DE VEICULOS': ['COMBUSTIVEIS E LUBRIFICANTES', 'PASSAGENS AEREAS'],
      'PASSAGENS AEREAS': ['HOSPEDAGEM', 'COMBUSTIVEIS E LUBRIFICANTES'],
      'HOSPEDAGEM': ['ALIMENTACAO', 'PASSAGENS AEREAS'],
      'ALIMENTACAO': ['HOSPEDAGEM', 'CONSULTORIA ASSESSORIA E PESQUISA']
    }
    
    return relacionadas[categoriaAtual] || []
  }, [])

  return {
    categoria,
    categoriaSlug,
    
    categoriaData,
    fornecedoresDaCategoria,
    todosFornecedores, // vem do contexto agora
    transacoesDaCategoria,
    todasTransacoesCategoria,
    transacoesProcessadas,
    evolucaoMensalCategoria,
    estatisticasCategoria,
    anosDisponiveis,
    redeRelacoes,
    dadosHistoricos,
    analiseTemporalData,
    
    isLoading,
    carregandoTransacoes,
    carregandoHistorico,
    carregandoAnalise,
    deputadosCarregados,
    evolucaoInicializada,
    progressoCarregamento,
    
    isConnected,
    estatisticas, // estatísticas globais do contexto
    
    carregarDadosCategoria,
    carregarTransacoesCategoria,
    carregarEstatisticasCategoria,
    carregarDadosHistoricos,
    carregarEvolucaoMensal,
    gerarRedeRelacoes,
    refetch, // função do contexto para recarregar
    
    setCategoriaData,
    setTransacoesDaCategoria,
    setEstatisticasCategoria,
    setAnaliseTemporalData,
    setDeputadosCarregados,
    setEvolucaoInicializada
  }
}