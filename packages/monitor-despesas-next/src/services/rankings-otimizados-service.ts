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

export class RankingsOtimizadosService {
  private rankings: Map<string, DeputadoRanking[]> = new Map()

  setRanking(tipo: string, ranking: DeputadoRanking[]): void {
    this.rankings.set(tipo, ranking)
  }

  getRanking(tipo: string): DeputadoRanking[] {
    return this.rankings.get(tipo) || []
  }

  getRankingPorCategoria(categoria: string, limite: number = 10): DeputadoRanking[] {
    const ranking = this.rankings.get('categoria') || []
    return ranking
      .filter(d => d.categoria === categoria)
      .slice(0, limite)
  }

  getRankingGeral(limite: number = 10): DeputadoRanking[] {
    const ranking = this.rankings.get('geral') || []
    return ranking.slice(0, limite)
  }

  limparRankings(): void {
    this.rankings.clear()
  }
}

export const rankingsOtimizadosService = new RankingsOtimizadosService()
