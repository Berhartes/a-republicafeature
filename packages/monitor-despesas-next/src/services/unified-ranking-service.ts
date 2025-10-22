import { useCallback, useEffect, useState } from 'react'
import { RankingsOtimizadosService } from '@/services/rankings-otimizados-service'

export interface DeputadoRanking {
  id: string
  nomeEleitoral: string
  siglaPartido: string
  siglaUf: string
  totalGastos?: number
  totalValor?: number
  quantidadeTransacoes?: number
  totalTransacoes?: number
  posicao?: number
  tendencia?: string
  categoria?: string
  ano?: number
}

interface RankingServiceResult {
  ranking: DeputadoRanking[]
  ultimaAtualizacao: Date | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const rankingsService = new RankingsOtimizadosService()

function normalizarEntrada(entry: Record<string, unknown>, index: number): DeputadoRanking | null {
  const id = String(
    entry.id ??
    entry.deputadoId ??
    entry.codigoDeputado ??
    entry.codigo ??
    index
  )

  const nomeEleitoral = String(
    entry.nomeEleitoral ??
    entry.nome ??
    entry.deputadoNome ??
    entry.deputadoNomeCivil ??
    ''
  )

  if (!id || !nomeEleitoral) {
    return null
  }

  const siglaPartido = String(entry.siglaPartido ?? entry.partido ?? 'N/D')
  const siglaUf = String(entry.siglaUf ?? entry.uf ?? 'N/D')
  const totalGastos = Number(entry.totalGastos ?? entry.totalValor ?? entry.valorTotal ?? 0)
  const totalTransacoes = Number(entry.totalTransacoes ?? entry.quantidadeTransacoes ?? entry.transacoes ?? 0)
  const posicao = typeof entry.ranking === 'number' ? entry.ranking : undefined
  const tendencia = typeof entry.tendencia === 'string' ? entry.tendencia : undefined
  const categoria = typeof entry.categoria === 'string' ? entry.categoria : undefined
  const ano = typeof entry.ano === 'number' ? entry.ano : undefined

  return {
    id,
    nomeEleitoral,
    siglaPartido,
    siglaUf,
    totalGastos,
    totalValor: totalGastos,
    totalTransacoes,
    quantidadeTransacoes: totalTransacoes,
    posicao,
    tendencia,
    categoria,
    ano
  }
}

async function carregarRanking(opcoes: { tipo: 'geral' | 'categoria'; ano?: number; categoria?: string }) {
  if (opcoes.tipo === 'categoria') {
    if (opcoes.categoria && typeof opcoes.ano === 'number') {
      return rankingsService.buscarRankingCategoriaPorAno(opcoes.categoria, opcoes.ano)
    }

    if (opcoes.categoria) {
      return rankingsService.buscarRankingCategoriaHistorico(opcoes.categoria)
    }
  } else {
    if (typeof opcoes.ano === 'number') {
      return rankingsService.buscarRankingGeralPorAno(opcoes.ano)
    }
  }

  return rankingsService.buscarRankingGeralHistorico()
}

export function useRankingService(opcoes: { tipo?: 'geral' | 'categoria'; ano?: number; categoria?: string } = {}): RankingServiceResult {
  const [ranking, setRanking] = useState<DeputadoRanking[]>([])
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { tipo = 'geral', ano, categoria } = opcoes

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resposta = await carregarRanking({ tipo, ano, categoria })
      if (!resposta || !resposta.ranking || resposta.ranking.length === 0) {
        setRanking([])
        setUltimaAtualizacao(resposta?.ultimaAtualizacao ?? null)
        return
      }

      const itens = resposta.ranking
        .map((entry, index) => normalizarEntrada(entry as Record<string, unknown>, index))
        .filter((item): item is DeputadoRanking => item !== null)

      setRanking(itens)
      setUltimaAtualizacao(resposta.ultimaAtualizacao ?? null)
    } catch (err) {
      console.error('[useRankingService] Falha ao carregar ranking', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar ranking')
      setRanking([])
    } finally {
      setLoading(false)
    }
  }, [tipo, ano, categoria])

  useEffect(() => {
    void carregar()
  }, [carregar])

  return {
    ranking,
    ultimaAtualizacao,
    loading,
    error,
    refetch: carregar
  }
}
