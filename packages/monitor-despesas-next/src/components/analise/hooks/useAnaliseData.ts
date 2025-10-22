import { useState, useEffect, useMemo } from 'react'
import { useGlobalData } from '@/contexts/GlobalDataContext'
import { fornecedoresService, type FornecedorStats } from '@/services/fornecedores-service'

type DeputadoProcessado = {
  nome: string
  partido: string
  uf: string
  totalGasto: number
  numTransacoes: number
}

type FornecedorSuspeito = FornecedorStats

type FornecedorAnalisado = FornecedorStats & { concentracao: 'baixo' | 'medio' | 'alto' };

export interface AnaliseGeral {
  totalGastos: number
  totalTransacoes: number
  deputadosAtivos: number
  fornecedoresUnicos: number
  categoriasMaisUsadas: Array<{
    categoria: string
    total: number
    percentual: number
  }>
  evolucaoMensal: Array<any>
  alertasSuspeitos: number
}

export interface AnaliseDeputado {
  nome: string
  partido: string
  uf: string
  totalGasto: number
  transacoes: number
  mediaTransacao: number
  categoriasPrincipais: string[]
  riscosIdentificados: string[]
}

export interface AnaliseFornecedor {
  nome: string
  cnpj?: string
  totalRecebido: number
  transacoes: number
  deputadosAtendidos: number
  categoriasPrincipais: string[]
  categoriaRisco: 'baixo' | 'medio' | 'alto'
}

export interface PadraoSuspeito {
  tipo: string
  descricao: string
  ocorrencias: number
  valor: number
  nivel: 'baixo' | 'medio' | 'alto' | 'critico'
  deputadosEnvolvidos: string[]
}

export function useAnaliseData() {
  const [dadosAnalise, setDadosAnalise] = useState<{
    deputados: DeputadoProcessado[]
    fornecedores: FornecedorSuspeito[]
    estatisticas: any
  } | null>(null)
  
  const [fornecedoresAnalisados, setFornecedoresAnalisados] = useState<FornecedorAnalisado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [mostrarTodosFornecedores, setMostrarTodosFornecedores] = useState(false)
  const [filtroRisco, setFiltroRisco] = useState<'todos' | 'baixo' | 'medio' | 'alto' | 'critico'>('todos')
  const [ordenacao, setOrdenacao] = useState<'nome' | 'valor' | 'risco' | 'transacoes'>('valor')
  
  const { data, isConnected } = useGlobalData()

  useEffect(() => {
    const carregarDadosAnalise = async () => {
      setLoading(true)
      setError(null)
      
      try {
        console.log('📊 [useAnaliseData] Iniciando carregamento de dados de análise...')
        
        console.log('📊 [useAnaliseData] Usando dados do contexto global')
        
        if (data?.analise) {
          const dadosFormatados = {
            deputados: data.analise.deputadosAnalise || data.analise.deputados || [],
            fornecedores: data.analise.fornecedoresSuspeitos || data.analise.fornecedores || [],
            estatisticas: data.analise.estatisticas || {}
          }
          setDadosAnalise(dadosFormatados)
        } else {
          setDadosAnalise({
            deputados: [],
            fornecedores: [],
            estatisticas: {}
          })
        }
        
        console.log('🏢 [useAnaliseData] Carregando dados de fornecedores...')
        await carregarFornecedores()
        
      } catch (error) {
        console.error('❌ [useAnaliseData] Erro ao carregar dados:', error)
        setError(error instanceof Error ? error.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    
    carregarDadosAnalise()
  }, [data])

  const carregarFornecedores = async () => {
    try {
      console.log('🏢 [useAnaliseData] Buscando fornecedores...')
      const fornecedoresResponse = await fornecedoresService.buscarFornecedoresUnificado({});
      const fornecedores = fornecedoresResponse.fornecedores;
      
      const fornecedoresProcessados = fornecedores
        .map(f => ({
          ...f,
          concentracao: calcularConcentracaoRisco(f)
        }))
        .sort((a, b) => b.totalTransacionado - a.totalTransacionado)
      
      console.log(`✅ [useAnaliseData] ${fornecedoresProcessados.length} fornecedores carregados`)
      setFornecedoresAnalisados(fornecedoresProcessados)
      
    } catch (error) {
      console.error('❌ [useAnaliseData] Erro ao carregar fornecedores:', error)
    }
  }

  const calcularConcentracaoRisco = (fornecedor: FornecedorStats): 'baixo' | 'medio' | 'alto' => {
    let pontuacao = 0
    
    if (fornecedor.totalTransacionado > 1000000) pontuacao += 30
    else if (fornecedor.totalTransacionado > 500000) pontuacao += 20
    else if (fornecedor.totalTransacionado > 100000) pontuacao += 10
    
    const deputadosAtendidos = fornecedor.deputadosAtendidos?.length || 0
    if (deputadosAtendidos <= 2) pontuacao += 25
    else if (deputadosAtendidos <= 5) pontuacao += 15
    else if (deputadosAtendidos <= 10) pontuacao += 5
    
    if (fornecedor.scoreSuspeicao && fornecedor.scoreSuspeicao > 70) pontuacao += 25
    else if (fornecedor.scoreSuspeicao && fornecedor.scoreSuspeicao > 50) pontuacao += 15
    
    if (pontuacao >= 50) return 'alto'
    if (pontuacao >= 25) return 'medio'
    return 'baixo'
  }

  const analiseGeral = useMemo((): AnaliseGeral => {
    const deputados = dadosAnalise?.deputados || []
    const fornecedores = Array.isArray(fornecedoresAnalisados) ? fornecedoresAnalisados : []
    
    if (!Array.isArray(deputados) || deputados.length === 0) {
      return {
        totalGastos: 0,
        totalTransacoes: 0,
        deputadosAtivos: 0,
        fornecedoresUnicos: fornecedores.length,
        categoriasMaisUsadas: [],
        evolucaoMensal: [],
        alertasSuspeitos: fornecedores.filter(f => f.concentracao === 'alto').length
      }
    }

    const totalGastos = deputados.reduce((acc, d) => acc + (d.totalGasto || 0), 0)
    const totalTransacoes = deputados.reduce((acc, d) => acc + (d.numTransacoes || 0), 0)
    const deputadosAtivos = deputados.filter(d => (d.totalGasto || 0) > 0).length
    
    const categoriasMaisUsadas = [
      { categoria: 'COMBUSTÍVEIS E LUBRIFICANTES', total: totalGastos * 0.25, percentual: 25 },
      { categoria: 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS', total: totalGastos * 0.20, percentual: 20 },
      { categoria: 'PASSAGENS AÉREAS', total: totalGastos * 0.15, percentual: 15 },
      { categoria: 'TELEFONIA', total: totalGastos * 0.12, percentual: 12 },
      { categoria: 'ALIMENTAÇÃO', total: totalGastos * 0.10, percentual: 10 }
    ]

    return {
      totalGastos,
      totalTransacoes,
      deputadosAtivos,
      fornecedoresUnicos: fornecedores.length,
      categoriasMaisUsadas,
      evolucaoMensal: [], // Será implementado conforme necessário
      alertasSuspeitos: fornecedores.filter(f => f.concentracao === 'alto').length
    }
  }, [dadosAnalise, fornecedoresAnalisados])

  const padroesSuspeitos = useMemo((): PadraoSuspeito[] => {
    const padroes: PadraoSuspeito[] = []
    const fornecedores = Array.isArray(fornecedoresAnalisados) ? fornecedoresAnalisados : []
    const deputados = dadosAnalise?.deputados || []
    
    const fornecedoresAltoRisco = fornecedores.filter(f => f.concentracao === 'alto')
    if (fornecedoresAltoRisco.length > 0) {
      padroes.push({
        tipo: 'Concentração de Fornecedores',
        descricao: 'Fornecedores com alto volume e poucos deputados atendidos',
        ocorrencias: fornecedoresAltoRisco.length,
        valor: fornecedoresAltoRisco.reduce((acc, f) => acc + f.totalTransacionado, 0),
        nivel: fornecedoresAltoRisco.length > 10 ? 'critico' : fornecedoresAltoRisco.length > 5 ? 'alto' : 'medio',
        deputadosEnvolvidos: []
      })
    }
    
    const deputadosAltoGasto = Array.isArray(deputados) 
      ? deputados.filter(d => (d.totalGasto || 0) > 500000) 
      : []
    if (deputadosAltoGasto.length > 0) {
      padroes.push({
        tipo: 'Gastos Elevados',
        descricao: 'Deputados com gastos superiores a R$ 500.000',
        ocorrencias: deputadosAltoGasto.length,
        valor: deputadosAltoGasto.reduce((acc, d) => acc + (d.totalGasto || 0), 0),
        nivel: deputadosAltoGasto.length > 20 ? 'critico' : deputadosAltoGasto.length > 10 ? 'alto' : 'medio',
        deputadosEnvolvidos: deputadosAltoGasto.map(d => d.nomeEleitoral).slice(0, 5)
      })
    }
    
    return padroes.sort((a, b) => b.valor - a.valor)
  }, [dadosAnalise, fornecedoresAnalisados])

  const fornecedoresFiltrados = useMemo(() => {
    const fornecedores = Array.isArray(fornecedoresAnalisados) ? fornecedoresAnalisados : []
    let filtrados = fornecedores
    
    if (filtroRisco !== 'todos') {
      filtrados = filtrados.filter(f => f.concentracao === filtroRisco)
    }
    
    filtrados.sort((a, b) => {
      switch (ordenacao) {
        case 'nome':
          return a.nomeEleitoral.localeCompare(b.nomeEleitoral)
        case 'valor':
          return b.totalTransacionado - a.totalTransacionado
        case 'risco':
          const riskOrder = { 'baixo': 1, 'medio': 2, 'alto': 3 }
          return (riskOrder[b.concentracao] || 0) - (riskOrder[a.concentracao] || 0)
        case 'transacoes':
          return (b.transacoes || 0) - (a.transacoes || 0)
        default:
          return 0
      }
    })
    
    if (!mostrarTodosFornecedores && filtrados.length > 20) {
      filtrados = filtrados.slice(0, 20)
    }
    
    return filtrados
  }, [fornecedoresAnalisados, filtroRisco, ordenacao, mostrarTodosFornecedores])

  return {
    dadosAnalise,
    fornecedoresAnalisados: fornecedoresFiltrados,
    analiseGeral,
    padroesSuspeitos,
    
    loading,
    error,
    isConnected,
    
    mostrarTodosFornecedores,
    setMostrarTodosFornecedores,
    filtroRisco,
    setFiltroRisco,
    ordenacao,
    setOrdenacao,
    
    carregarFornecedores
  }
}