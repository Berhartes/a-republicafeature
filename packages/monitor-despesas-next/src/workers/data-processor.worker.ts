// Web Worker for heavy data processing
import type { DeputadoProcessado } from '@/types/etl-deputados.types'

interface ProcessingMessage {
  type: 'PROCESS_RANKINGS' | 'FILTER_RANKINGS' | 'COMPUTE_STATISTICS'
  payload: any
  id: string
}

interface ProcessingResult {
  type: string
  result: any
  id: string
  error?: string
}

// Função para normalizar dados de deputados
function normalizeDeputado(deputado: any): DeputadoProcessado {
  return {
    id: deputado.id || '',
    // Priorizar nomeEleitoral do ETL, com fallback para nome
    nomeEleitoral: deputado.nomeEleitoral || deputado.nome || '',
    nomeCivil: deputado.nomeCivil || deputado.nome || '',
    // Priorizar siglaPartido do ETL, com fallback para partido
    siglaPartido: deputado.siglaPartido || deputado.partido || '',
    siglaUf: deputado.siglaUf || deputado.uf || '',
    foto: deputado.foto || deputado.urlFoto || '',
    totalGastos: Number(deputado.totalGastos || deputado.valorTotal || 0),
    totalTransacoes: Number(deputado.totalTransacoes || deputado.numeroTransacoes || 0),
    mediaTransacao: Number(deputado.mediaTransacao || 0),
    gastosPorAno: deputado.gastosPorAno || {},
    transacoesPorAno: deputado.transacoesPorAno || {},
    topCategorias: deputado.topCategorias || [],
    topFornecedores: deputado.topFornecedores || [],
    scoreSuspeicao: Number(deputado.scoreSuspeicao || 0),
    classificacaoRisco: deputado.classificacaoRisco || 'Baixo',
    alertas: deputado.alertas || [],
    ultimaAtualizacao: deputado.ultimaAtualizacao || new Date().toISOString(),
    anosDisponiveis: deputado.anosDisponiveis || [],
    dadosCompletos: deputado.dadosCompletos || false
  }
}

// Função para filtrar rankings
function filterRankings(rankings: any[], filters: { ano?: string | number; categoria?: string }) {
  let filtered = [...rankings]

  if (filters.ano && filters.ano !== 'todos' && filters.ano !== 'TODAS') {
    const ano = Number(filters.ano)
    if (!isNaN(ano)) {
      filtered = filtered.filter(item => {
        const itemAno = item.ano || item.anoReferencia
        return itemAno === ano
      })
    }
  }

  if (filters.categoria && filters.categoria !== 'TODAS') {
    filtered = filtered.filter(item => {
      return item.categoria === filters.categoria ||
             item.categoriaOriginal === filters.categoria ||
             item.categoriaNormalizada === filters.categoria
    })
  }

  return filtered.map(normalizeDeputado)
}

// Função para computar estatísticas
function computeStatistics(data: any) {
  const rankings = data.rankings?.geral || []
  const premiacoes = data.premiacoes

  const totalDeputados = rankings.length
  const totalGastos = rankings.reduce((sum: number, d: any) => sum + (Number(d.totalGastos) || 0), 0)
  const mediaGastos = totalDeputados > 0 ? totalGastos / totalDeputados : 0

  const totalPremiacoes = !premiacoes ? 0 :
    (premiacoes.coroas?.length || 0) +
    (premiacoes.trofeus?.length || 0) +
    (premiacoes.medalhas?.length || 0)

  return {
    totalDeputados,
    totalGastos,
    mediaGastos,
    totalPremiacoes,
    estatisticasComputadas: {
      coroas: premiacoes?.estatisticas?.totalCoroas || 0,
      trofeusMedalhas: (premiacoes?.estatisticas?.totalTrofeus || 0) + (premiacoes?.estatisticas?.totalMedalhas || 0)
    }
  }
}

// Processamento de rankings complexos
function processRankings(data: any) {
  const startTime = performance.now()

  try {
    // Normalizar dados
    const geral: DeputadoProcessado[] = (data.geral || []).map(normalizeDeputado)

    // Processar por categoria
    const porCategoria: Record<string, DeputadoProcessado[]> = {}
    if (data.porCategoria) {
      Object.keys(data.porCategoria).forEach(categoria => {
        porCategoria[categoria] = (data.porCategoria[categoria] || []).map(normalizeDeputado)
      })
    }

    // Processar por ano
    const porAno: Record<number, DeputadoProcessado[]> = {}
    if (data.porAno) {
      Object.keys(data.porAno).forEach(ano => {
        const anoNum = Number(ano)
        if (!isNaN(anoNum)) {
          porAno[anoNum] = (data.porAno[ano] || []).map(normalizeDeputado)
        }
      })
    }

    const processTime = performance.now() - startTime
    console.log(`🚀 [Worker] Rankings processados em ${processTime.toFixed(2)}ms`)

    return {
      geral,
      porCategoria,
      porAno,
      estatisticas: {
        totalDeputados: geral.length,
        totalGastos: geral.reduce((sum: number, d: DeputadoProcessado) => sum + d.totalGastos, 0),
        mediaGastos: geral.length > 0 ? geral.reduce((sum: number, d: DeputadoProcessado) => sum + d.totalGastos, 0) / geral.length : 0,
        medianaGastos: geral.length > 0 ? geral[Math.floor(geral.length / 2)]?.totalGastos || 0 : 0
      }
    }
  } catch (error) {
    throw new Error(`Erro no processamento: ${error}`)
  }
}

// Event listener do worker
self.addEventListener('message', (event: MessageEvent<ProcessingMessage>) => {
  const { type, payload, id } = event.data

  try {
    let result: any

    switch (type) {
      case 'PROCESS_RANKINGS':
        result = processRankings(payload)
        break

      case 'FILTER_RANKINGS':
        result = filterRankings(payload.rankings, payload.filters)
        break

      case 'COMPUTE_STATISTICS':
        result = computeStatistics(payload)
        break

      default:
        throw new Error(`Tipo de processamento desconhecido: ${type}`)
    }

    const message: ProcessingResult = {
      type,
      result,
      id
    }

    ;(self as any).postMessage(message)
  } catch (err: any) {
    const message: ProcessingResult = {
      type,
      result: null,
      id,
      error: err?.message || String(err)
    }

    ;(self as any).postMessage(message)
  }
})

export {}