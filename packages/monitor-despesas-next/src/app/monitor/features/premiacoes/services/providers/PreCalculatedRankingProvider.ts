import { DataProvider, DeputyData, RankingEntry, RankingQuery, RankingResult } from '../RankingEngine'
import { categoryRegistry } from '../categories/CategoryRegistry'

export class PreCalculatedRankingProvider implements DataProvider {
  name = 'PreCalculatedRankingProvider'
  priority = 200
  canProvide(query: RankingQuery): boolean {
    return !query.deputyIds?.length && !query.states?.length && !query.parties?.length
  }
  estimateResponseTime(_query: RankingQuery): number { return 100 }
  async fetchData(_query: RankingQuery): Promise<RankingResult | null> {
    return null
  }
  private convertLegacyData(legacyRanking: any[]): DeputyData[] {
    return legacyRanking.map(item => ({
      id: item.id || item.deputadoId || '',
      name: item.nome || item.deputadoNome || 'Deputado Não Identificado',
      civilName: item.nomeCivil || item.deputadoNomeCivil || '',
      party: item.partido || item.deputadoPartido || '',
      state: item.uf || item.deputadoUF || '',
      photoUrl: item.urlFoto,
      totalAmount: item.totalGastos || item.totalValor || 0,
      transactionCount: item.quantidadeTransacoes || item.totalTransacoes || 0,
      supplierCount: item.totalFornecedores || 0,
      lastUpdate: new Date(),
      dataQuality: 'high' as const
    }))
  }
  private sortAndPaginate(deputies: DeputyData[], query: RankingQuery): DeputyData[] {
    let sorted = [...deputies]
    const orderBy = query.orderBy || 'amount'
    const direction = query.orderDirection || 'desc'
    sorted.sort((a, b) => {
      let valueA: number, valueB: number
      switch (orderBy) {
        case 'amount': valueA = a.totalAmount; valueB = b.totalAmount; break
        case 'transactions': valueA = a.transactionCount; valueB = b.transactionCount; break
        case 'suppliers': valueA = a.supplierCount; valueB = b.supplierCount; break
        default: valueA = a.totalAmount; valueB = b.totalAmount
      }
      return direction === 'desc' ? valueB - valueA : valueA - valueB
    })
    const offset = query.offset || 0
    const limit = query.limit
    return limit ? sorted.slice(offset, offset + limit) : sorted.slice(offset)
  }
  private convertToRankingEntries(deputies: DeputyData[], query: RankingQuery): RankingEntry[] {
    const totalAmount = deputies.reduce((sum, d) => sum + d.totalAmount, 0)
    return deputies.map((deputy, index) => ({
      deputy,
      position: (query.offset || 0) + index + 1,
      categoryId: query.categoryId,
      year: query.year,
      percentageOfTotal: totalAmount > 0 ? (deputy.totalAmount / totalAmount) * 100 : 0,
      averageTransaction: deputy.transactionCount > 0 ? deputy.totalAmount / deputy.transactionCount : 0,
      trend: 'stable' as const
    }))
  }
}


