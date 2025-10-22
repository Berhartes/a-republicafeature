import { useState, useEffect, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { useGlobalData, useDeputadoDetalhes } from '@/contexts/GlobalDataContext'
import type {
  AlertaConformidade,
  AnoComDados,
  ComparativoPartidoItem,
  DeputadoDetalhadoMin,
  DespesaDetalhada,
  FornecedorResumo,
  PerfilComportamental,
  RedePolitica
} from '@/types/deputados'

export interface PerfilDeputadoData {
  deputadoId: string
  deputadoData: DeputadoDetalhadoMin | null
  despesasDetalhadas: DespesaDetalhada[]
  mediaDeputados: Record<string, number>
  anosComDados: AnoComDados[]
  alertasConformidade: AlertaConformidade[]
  perfilComportamental: PerfilComportamental | null
  comparativoPartido: ComparativoPartidoItem[]
  redesPoliticas: RedePolitica
  fornecedores: FornecedorResumo[]
}

export interface LoadingStates {
  loadingDespesas: boolean
  loadingComparativo: boolean
  loadingRelacoes: boolean
  loadingFornecedores: boolean
}

export function usePerfilDeputadoData() {
  const { deputadoId } = useParams({ from: '/gastos/perfil/$deputadoId' })
  
  const [deputadoData, setDeputadoData] = useState<DeputadoDetalhadoMin | null>(null)
  const [despesasDetalhadas, setDespesasDetalhadas] = useState<DespesaDetalhada[]>([])
  const [mediaDeputados, setMediaDeputados] = useState<Record<string, number>>({})
  const [anosComDados, setAnosComDados] = useState<AnoComDados[]>([])
  const [alertasConformidade, setAlertasConformidade] = useState<AlertaConformidade[]>([])
  const [perfilComportamental, setPerfilComportamental] = useState<PerfilComportamental | null>(null)
  
  const [comparativoPartido, setComparativoPartido] = useState<ComparativoPartidoItem[]>([])
  const [redesPoliticas, setRedesPoliticas] = useState<RedePolitica>({ nodes: [], edges: [] })
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([])
  
  const [loadingDespesas, setLoadingDespesas] = useState(false)
  const [loadingComparativo, setLoadingComparativo] = useState(false)
  const [loadingRelacoes, setLoadingRelacoes] = useState(false)
  const [loadingFornecedores, setLoadingFornecedores] = useState(false)

  const { data, isConnected, getDeputadoCoroas, getDeputadoTrofeus, getDeputadoMedalhas } = useGlobalData()

  const {
    loading: globalLoading,
    error: globalError,
    deputado: deputadoDetalhes
  } = useDeputadoDetalhes(deputadoId)

  const carregarDadosDeputado = async () => {
    if (!deputadoId || deputadoId === 'geral') return
    
    try {
      console.log('🔍 Sistema migrado - dados de deputado não disponíveis:', deputadoId)
      
      setDeputadoData({
        id: deputadoId,
        nome: 'Sistema Migrado - Dados não disponíveis',
        partido: 'N/A'
      })
    } catch (error) {
      console.error('❌ Erro ao carregar dados do deputado:', error)
    }
  }

  const carregarDespesasDetalhadas = async (ano: number, mes?: string) => {
    if (!deputadoId || deputadoId === 'geral') return
    
    setLoadingDespesas(true)
    try {
      console.log('🔍 Sistema migrado - despesas não disponíveis:', { deputadoId, ano, mes })
      
      setDespesasDetalhadas([])
    } catch (error) {
      console.error('❌ Erro ao carregar despesas:', error)
    } finally {
      setLoadingDespesas(false)
    }
  }

  const carregarMediaDeputados = async () => {
    try {
      console.log('🔍 Sistema migrado - médias não disponíveis')
      
      setMediaDeputados({})
    } catch (error) {
      console.error('❌ Erro ao carregar médias:', error)
    }
  }

  const detectarAnosComDados = async () => {
    if (!deputadoId || deputadoId === 'geral') return
    
    try {
      console.log('🔍 Sistema migrado - anos não disponíveis para:', deputadoId)
      
      setAnosComDados([])
    } catch (error) {
      console.error('❌ Erro ao detectar anos:', error)
    }
  }

  const carregarAlertasConformidade = async () => {
    if (!deputadoId || deputadoId === 'geral') return
    
    try {
      console.log('🔍 Sistema migrado - alertas não disponíveis')
      
      setAlertasConformidade([])
    } catch (error) {
      console.error('❌ Erro ao carregar alertas:', error)
    }
  }

  const gerarPerfilComportamental = async () => {
    if (!deputadoData || !despesasDetalhadas.length) return
    
    try {
      console.log('🔍 Sistema migrado - perfil comportamental não disponível')
      
      setPerfilComportamental(null)
    } catch (error) {
      console.error('❌ Erro ao gerar perfil:', error)
    }
  }

  const carregarComparativoPartido = async () => {
    if (!deputadoData) return
    
    setLoadingComparativo(true)
    try {
      console.log('🔍 Sistema migrado - comparativo não disponível:', deputadoData.siglaPartido)
      
      setComparativoPartido([])
    } catch (error) {
      console.error('❌ Erro ao carregar comparativo:', error)
    } finally {
      setLoadingComparativo(false)
    }
  }

  const carregarRedesPoliticas = async () => {
    if (!deputadoId || deputadoId === 'geral') return
    
    setLoadingRelacoes(true)
    try {
      console.log('🔍 Sistema migrado - redes políticas não disponíveis')
      
      setRedesPoliticas({ nodes: [], edges: [] })
    } catch (error) {
      console.error('❌ Erro ao carregar redes:', error)
    } finally {
      setLoadingRelacoes(false)
    }
  }

  const carregarFornecedores = async () => {
    if (!deputadoId || deputadoId === 'geral') return
    
    setLoadingFornecedores(true)
    try {
      console.log('🔍 Sistema migrado - fornecedores não disponíveis')
      
      setFornecedores([])
    } catch (error) {
      console.error('❌ Erro ao carregar fornecedores:', error)
    } finally {
      setLoadingFornecedores(false)
    }
  }

  const anosDisponiveis = useMemo(() => {
    return anosComDados.length > 0 
      ? anosComDados.map(a => a.ano).sort((a, b) => b - a)
      : Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + 1 - i)
  }, [anosComDados])

  const mesesDisponiveis = useMemo(() => [
    { valor: 'todos', nome: 'Ano completo' },
    { valor: '1', nome: 'Janeiro' },
    { valor: '2', nome: 'Fevereiro' },
    { valor: '3', nome: 'Março' },
    { valor: '4', nome: 'Abril' },
    { valor: '5', nome: 'Maio' },
    { valor: '6', nome: 'Junho' },
    { valor: '7', nome: 'Julho' },
    { valor: '8', nome: 'Agosto' },
    { valor: '9', nome: 'Setembro' },
    { valor: '10', nome: 'Outubro' },
    { valor: '11', nome: 'Novembro' },
    { valor: '12', nome: 'Dezembro' },
  ], [])

  const refetchGlobal = async () => {
    try {
      await Promise.all([
        carregarDadosDeputado(),
        detectarAnosComDados(),
        carregarMediaDeputados(),
        carregarAlertasConformidade()
      ])
    } catch (error) {
      console.error('❌ Erro no refetchGlobal:', error)
    }
  }

  useEffect(() => {
    if (deputadoId && deputadoId !== 'geral') {
      carregarDadosDeputado()
      detectarAnosComDados()
      carregarMediaDeputados()
      carregarAlertasConformidade()
    }
  }, [deputadoId])

  useEffect(() => {
    if (deputadoData && despesasDetalhadas.length > 0) {
      gerarPerfilComportamental()
    }
  }, [deputadoData, despesasDetalhadas])

  useEffect(() => {
    if (deputadoData?.siglaPartido) {
      carregarComparativoPartido()
    }
  }, [deputadoData])

  return {
    deputadoId,
    deputadoData,
    despesasDetalhadas,
    mediaDeputados,
    anosComDados,
    alertasConformidade,
    perfilComportamental,
    comparativoPartido,
    redesPoliticas,
    fornecedores,
    
    loadingDespesas,
    loadingComparativo,
    loadingRelacoes,
    loadingFornecedores,
    
    globalLoading,
    globalError,
    deputadoDetalhes,
    isConnected,
    data,
    
    anosDisponiveis,
    mesesDisponiveis,
    
    carregarDadosDeputado,
    carregarDespesasDetalhadas,
    carregarMediaDeputados,
    detectarAnosComDados,
    carregarAlertasConformidade,
    gerarPerfilComportamental,
    carregarComparativoPartido,
    carregarRedesPoliticas,
    carregarFornecedores,

    refetchGlobal,

    getDeputadoCoroas,
    getDeputadoTrofeus,
    getDeputadoMedalhas
  }
}
