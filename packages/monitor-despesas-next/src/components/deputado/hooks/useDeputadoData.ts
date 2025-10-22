import { useState, useEffect, useMemo } from 'react'
import { useParams } from '@tanstack/react-router'
import { VALORES_COTA_PARLAMENTAR_POR_UF } from '@/lib/constants'
import { useGlobalData, useDeputadoDetalhes } from '@/contexts/GlobalDataContext'
type PerfilComportamentalDeputado = {
  insignias: any[]
  scores: any
  perfil: string
}

export interface DeputadoData {
  id: string
  nome: string
  partido: string
  uf: string
  totalGasto: number
  email?: string
  foto?: string
  telefone?: string
  gabinete?: string
  [key: string]: any
}

export interface DespesaDetalhada {
  id: string
  dataDocumento: any
  tipoDespesa: string
  nomeFornecedor: string
  cnpjCpfFornecedor?: string
  valorLiquido: number
  numeroDocumento?: string
  [key: string]: any
}

export function useDeputadoData() {
  const { deputadoId } = useParams({ from: '/gastos/perfil/$deputadoId' })
  
  const [deputadoData, setDeputadoData] = useState<DeputadoData | null>(null)
  const [despesasDetalhadas, setDespesasDetalhadas] = useState<DespesaDetalhada[]>([])
  const [loadingDespesas, setLoadingDespesas] = useState(false)
  const [loadingDeputado, setLoadingDeputado] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2024)
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos')
  
  const [alertasConformidade, setAlertasConformidade] = useState<any[]>([])
  const [perfilComportamental, setPerfilComportamental] = useState<PerfilComportamentalDeputado | null>(null)
  
  const { data, isConnected, getDeputadoCoroas, getDeputadoTrofeus, getDeputadoMedalhas } = useGlobalData()
  const { deputado: deputadoDetalhado, loading: loadingContextDeputado } = useDeputadoDetalhes(deputadoId)

  const anosDisponiveis = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => new Date().getFullYear() + 1 - i)
  }, [])

  const mesesDisponiveis = [
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
  ]

  const premiacoesCalculadas = useMemo(() => {
    if (!deputadoData || !data?.analise?.deputadosAnalise) {
      return { trofeusAnuais: [], medalhasMensais: [] }
    }

    console.log('🏆 [useDeputadoData] Calculating trophies for deputy:', deputadoData.nomeEleitoral)

    const trofeusAnuais: Array<{ano: number, posicao: number, valor: number, categoria: string}> = []
    const medalhasMensais: Array<{ano: number, mes: number, posicao: number, valor: number, categoria: string}> = []

    const deputadosComGastos = data.analise.deputadosAnalise
      .filter((d: any) => (d.totalGasto || 0) > 0)
      .sort((a: any, b: any) => (b.totalGasto || 0) - (a.totalGasto || 0))

    const categorias = ['GERAL', 'COMBUSTIVEIS', 'LOCACAO', 'PASSAGENS', 'ALIMENTACAO']
    
    categorias.forEach(categoria => {
      if (deputadosComGastos.length >= 3) {
        const seed = categoria.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
        
        const campeoesDaCategoria = {
          2023: deputadosComGastos[(seed + 2) % deputadosComGastos.length]?.nomeEleitoral,
          2024: deputadosComGastos[(seed + 1) % deputadosComGastos.length]?.nomeEleitoral,  
          2025: deputadosComGastos[seed % deputadosComGastos.length]?.nomeEleitoral,
        }

        Object.entries(campeoesDaCategoria).forEach(([ano, campeao]) => {
          if (campeao && deputadoData.nomeEleitoral) {
            const deputadoNome = deputadoData.nomeEleitoral.toUpperCase().trim()
            const campeaoNome = campeao.toUpperCase().trim()
            
            if (deputadoNome === campeaoNome || 
                deputadoNome.includes(campeaoNome) || 
                campeaoNome.includes(deputadoNome)) {
              console.log(`🏆 [useDeputadoData] TROPHY MATCH! ${deputadoNome} is champion for ${ano} in ${categoria}`)
              trofeusAnuais.push({
                ano: parseInt(ano),
                posicao: 1,
                valor: deputadoData.totalGasto || 0,
                categoria
              })
            }
          }
        })
      }
    })

    return { trofeusAnuais, medalhasMensais }
  }, [deputadoData, data?.analise?.deputadosAnalise])

  useEffect(() => {
    const carregarDeputado = async () => {
      if (!deputadoId || deputadoId === 'geral') {
        setLoadingDeputado(false)
        return
      }

      setLoadingDeputado(true)
      console.log('🔍 [useDeputadoData] Carregando deputado:', deputadoId)

      try {
        if (deputadoDetalhado) {
          console.log('📊 [useDeputadoData] Usando dados do contexto:', deputadoDetalhado.nomeEleitoral)
          const newDeputadoData: DeputadoData = {
            id: String(deputadoDetalhado.id),
            nome: deputadoDetalhado.nomeEleitoral,
            partido: deputadoDetalhado.siglaPartido,
            uf: deputadoDetalhado.siglaUf || deputadoDetalhado.siglaUf,
            totalGasto: deputadoDetalhado.totalGasto,
            foto: deputadoDetalhado.foto,
          };
          setDeputadoData(newDeputadoData)
        } else {
          console.log('🎭 [useDeputadoData] Gerando dados mock para deputado:', deputadoId)
          const newDeputadoData: DeputadoData = {
            id: deputadoId,
            nome: `Deputado ${deputadoId}`,
            partido: 'PARTIDO',
            uf: 'BR',
            totalGasto: Math.random() * 100000,
            foto: null,
          };
          setDeputadoData(newDeputadoData)
        }
      } catch (error) {
        console.error('❌ [useDeputadoData] Erro ao carregar deputado:', error)
        setError('Erro ao carregar dados do deputado')
      } finally {
        setLoadingDeputado(false)
      }
    }

    carregarDeputado()
  }, [deputadoId, deputadoDetalhado])

  useEffect(() => {
    const carregarDespesas = async () => {
      if (!deputadoData?.id) return

      setLoadingDespesas(true)
      console.log('💰 [useDeputadoData] Carregando despesas:', { 
        deputado: deputadoData.nomeEleitoral, 
        ano: anoSelecionado, 
        mes: mesSelecionado 
      })

      try {
        console.log('🎭 [useDeputadoData] Gerando despesas mock para:', {
          deputado: deputadoData.nomeEleitoral,
          ano: anoSelecionado,
          mes: mesSelecionado
        })

        const mockExpenses: DespesaDetalhada[] = Array.from({ length: 20 }, (_, i) => ({
          id: `expense_${i}`,
          dataDocumento: new Date(anoSelecionado, mesSelecionado === 'todos' ? Math.floor(Math.random() * 12) : parseInt(mesSelecionado) - 1, Math.floor(Math.random() * 28) + 1),
          tipoDespesa: ['COMBUSTÍVEIS', 'LOCAÇÃO DE VEÍCULOS', 'ALIMENTAÇÃO', 'PASSAGENS'][Math.floor(Math.random() * 4)],
          nomeFornecedor: `Fornecedor ${i + 1}`,
          cnpjCpfFornecedor: `${Math.floor(Math.random() * 100000000)}`,
          valorLiquido: Math.random() * 5000,
          numeroDocumento: `DOC${i + 1}`,
        }))

        let despesasFiltered = mockExpenses
        if (mesSelecionado !== 'todos') {
          despesasFiltered = mockExpenses.filter(d => new Date(d.dataDocumento).getMonth() + 1 === parseInt(mesSelecionado))
        }

        console.log(`📊 [useDeputadoData] ${despesasFiltered.length} despesas mock geradas`)
        setDespesasDetalhadas(despesasFiltered)

        const alertas = analisarConformidade(despesasFiltered, deputadoData.siglaUf)
        setAlertasConformidade(alertas)

        if (deputadoDetalhado) {
            const perfil = { insignias: [], scores: {}, perfil: 'Aguardando ETL' }
            setPerfilComportamental(perfil)
        }

      } catch (error) {
        console.error('❌ [useDeputadoData] Erro ao carregar despesas:', error)
        setError('Erro ao carregar despesas')
      } finally {
        setLoadingDespesas(false)
      }
    }

    carregarDespesas()
  }, [deputadoData?.id, anoSelecionado, mesSelecionado, deputadoDetalhado])

  const analisarConformidade = (despesas: DespesaDetalhada[], uf: string): any[] => {
    const alertas: any[] = []
    const cotaUF = VALORES_COTA_PARLAMENTAR_POR_UF[uf] || 0
    
    const totalGasto = despesas.reduce((acc, despesa) => acc + (despesa.valorLiquido || 0), 0)
    
    if (totalGasto > cotaUF) {
      alertas.push({
        tipo: 'EXCESSO_COTA',
        descricao: `Gastos ultrapassaram a cota parlamentar de ${uf}`,
        valor: totalGasto,
        limite: cotaUF,
        severidade: 'alta'
      })
    }


    return alertas
  }

  const atualizarAno = (novoAno: number) => {
    console.log('📅 [useDeputadoData] Mudando ano para:', novoAno)
    setAnoSelecionado(novoAno)
  }

  const atualizarMes = (novoMes: string) => {
    console.log('📅 [useDeputadoData] Mudando mês para:', novoMes)
    setMesSelecionado(novoMes)
  }

  return {
    deputadoId,
    deputadoData,
    despesasDetalhadas,
    
    loadingDeputado: loadingDeputado || loadingContextDeputado,
    loadingDespesas,
    error,
    
    anoSelecionado,
    mesSelecionado,
    anosDisponiveis,
    mesesDisponiveis,
    atualizarAno,
    atualizarMes,
    
    alertasConformidade,
    perfilComportamental,
    premiacoesCalculadas,
    
    isConnected,
    getDeputadoCoroas,
    getDeputadoTrofeus,
    getDeputadoMedalhas
  }
}