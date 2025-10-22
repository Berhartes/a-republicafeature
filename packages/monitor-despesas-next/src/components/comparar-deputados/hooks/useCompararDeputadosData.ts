import { useState, useEffect, useMemo } from 'react'
import { useDeputados, useGlobalData, DeputadoData } from '@/contexts/GlobalDataContext'

export type Metrica = 'gastos' | 'alertas' | 'categorias' | 'evolucao' | 'ranking'

export type DeputadoComparisonData = {
  nome: string
  nomeSimples: string
  totalGasto: number
  numAlertas: number
  scoreSuspeicao: number
  mediaGasto: number
  numTransacoes: number
}

export type SortConfig = { 
  key: keyof DeputadoComparisonData
  direction: 'asc' | 'desc' 
}

export function useCompararDeputadosData() {
  const { deputados, loading, error } = useDeputados()
  const { data: globalData } = useGlobalData()

  const [deputadosSelecionados, setDeputadosSelecionados] = useState<DeputadoData[]>([])
  const [despesasDetalhadas, setDespesasDetalhadas] = useState<Record<string, any[]>>({})
  const [loadingDespesas, setLoadingDespesas] = useState(false)

  const adicionarDeputado = (deputado: DeputadoData) => {
    if (deputadosSelecionados.length >= 5) {
      console.warn('Máximo de 5 deputados para comparação')
      return false
    }
    
    if (deputadosSelecionados.find(d => d.id === deputado.id)) {
      console.warn('Deputado já selecionado')
      return false
    }
    
    setDeputadosSelecionados(prev => [...prev, deputado])
    return true
  }

  const removerDeputado = (deputadoId: number) => {
    setDeputadosSelecionados(prev => prev.filter(d => d.id !== deputadoId))
    
    setDespesasDetalhadas(prev => {
      const newDespesas = { ...prev }
      delete newDespesas[deputadoId.toString()]
      return newDespesas
    })
  }

  const limparSelecoes = () => {
    setDeputadosSelecionados([])
    setDespesasDetalhadas({})
  }

  const carregarDespesasDetalhadas = async (ano?: number) => {
    if (deputadosSelecionados.length === 0) return

    setLoadingDespesas(true)
    try {
      console.log('🔍 Carregando despesas detalhadas para comparação...')
      
      const novasDespesas: Record<string, any[]> = {}
      
      for (const deputado of deputadosSelecionados) {
        try {
          const despesas = await Service.buscarDespesasDeputado(
            deputado.id,
            ano || new Date().getFullYear()
          )
          novasDespesas[deputado.id.toString()] = despesas
          console.log(`✅ Despesas carregadas para ${deputado.nomeEleitoral}: ${despesas.length}`)
        } catch (error) {
          console.error(`❌ Erro ao carregar despesas de ${deputado.nomeEleitoral}:`, error)
          novasDespesas[deputado.id.toString()] = []
        }
      }
      
      setDespesasDetalhadas(novasDespesas)
      
    } catch (error) {
      console.error('❌ Erro geral ao carregar despesas:', error)
    } finally {
      setLoadingDespesas(false)
    }
  }

  const dadosComparacao = useMemo((): DeputadoComparisonData[] => {
    return deputadosSelecionados.map(deputado => {
      const despesas = despesasDetalhadas[deputado.id.toString()] || []
      const totalGasto = despesas.reduce((sum, d) => sum + (d.valorDocumento || 0), 0)
      const numTransacoes = despesas.length
      const mediaGasto = numTransacoes > 0 ? totalGasto / numTransacoes : 0
      
      const deputadoGlobal = globalData?.deputados?.find(d => d.id === deputado.id)
      const numAlertas = deputadoGlobal?.alertas?.length || 0
      const scoreSuspeicao = deputadoGlobal?.scoreSuspeicao || 0

      return {
        nome: deputado.nomeEleitoral,
        nomeSimples: deputado.nomeEleitoral.split(' ')[0], // Primeiro nome para charts
        totalGasto,
        numAlertas,
        scoreSuspeicao,
        mediaGasto,
        numTransacoes
      }
    })
  }, [deputadosSelecionados, despesasDetalhadas, globalData])

  const estatisticasComparacao = useMemo(() => {
    if (dadosComparacao.length === 0) return null

    const totalGastos = dadosComparacao.reduce((sum, d) => sum + d.totalGasto, 0)
    const totalAlertas = dadosComparacao.reduce((sum, d) => sum + d.numAlertas, 0)
    const totalTransacoes = dadosComparacao.reduce((sum, d) => sum + d.numTransacoes, 0)
    
    const maiorGasto = Math.max(...dadosComparacao.map(d => d.totalGasto))
    const menorGasto = Math.min(...dadosComparacao.map(d => d.totalGasto))
    const mediaGastos = totalGastos / dadosComparacao.length
    
    const deputadoMaiorGasto = dadosComparacao.find(d => d.totalGasto === maiorGasto)
    const deputadoMenorGasto = dadosComparacao.find(d => d.totalGasto === menorGasto)
    const deputadoMaisAlertas = dadosComparacao.reduce((max, d) => 
      d.numAlertas > max.numAlertas ? d : max
    )

    return {
      totalGastos,
      totalAlertas,
      totalTransacoes,
      mediaGastos,
      maiorGasto,
      menorGasto,
      deputadoMaiorGasto,
      deputadoMenorGasto,
      deputadoMaisAlertas,
      numeroDeputados: dadosComparacao.length
    }
  }, [dadosComparacao])

  const exportarComparacao = () => {
    if (dadosComparacao.length === 0) return

    const dados = {
      comparacao: dadosComparacao,
      estatisticas: estatisticasComparacao,
      exportado_em: new Date().toISOString(),
      deputados_comparados: deputadosSelecionados.map(d => ({
        id: d.id,
        nome: d.nomeEleitoral,
        partido: d.siglaPartido,
        uf: d.siglaUf
      }))
    }

    const csv = [
      ['Nome', 'Partido', 'UF', 'Total Gasto', 'Nº Alertas', 'Score Suspeição', 'Nº Transações', 'Média por Transação'],
      ...deputadosSelecionados.map(dep => {
        const dados = dadosComparacao.find(d => d.nomeEleitoral === dep.nomeEleitoral)
        return [
          dep.nomeEleitoral,
          dep.siglaPartido,
          dep.siglaUf,
          dados?.totalGasto.toFixed(2) || '0',
          dados?.numAlertas.toString() || '0',
          dados?.scoreSuspeicao.toFixed(2) || '0',
          dados?.numTransacoes.toString() || '0',
          dados?.mediaGasto.toFixed(2) || '0'
        ]
      })
    ].map(linha => linha.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `comparacao_deputados_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    if (deputadosSelecionados.length > 0) {
      carregarDespesasDetalhadas()
    }
  }, [deputadosSelecionados.length])

  return {
    deputados,
    deputadosSelecionados,
    despesasDetalhadas,
    dadosComparacao,
    estatisticasComparacao,
    
    loading,
    loadingDespesas,
    error,
    
    adicionarDeputado,
    removerDeputado,
    limparSelecoes,
    carregarDespesasDetalhadas,
    exportarComparacao,
    
    podeAdicionarDeputado: deputadosSelecionados.length < 5,
    temDeputadosSelecionados: deputadosSelecionados.length > 0,
    temDadosParaComparacao: dadosComparacao.length > 1
  }
}