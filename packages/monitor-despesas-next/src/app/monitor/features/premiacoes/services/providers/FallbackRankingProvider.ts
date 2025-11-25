import { DataProvider, DeputyData, RankingEntry, RankingQuery, RankingResult } from '../RankingEngine'
import { categoryRegistry } from '../categories/CategoryRegistry'

export class FallbackRankingProvider implements DataProvider {
  name = 'FallbackRankingProvider'
  priority = 10
  canProvide(_query: RankingQuery): boolean { return true }
  estimateResponseTime(_query: RankingQuery): number { return 50 }
  async fetchData(query: RankingQuery): Promise<RankingResult | null> {
    const syntheticData = await this.generateDeterministicData(query)
    const result: RankingResult = {
      entries: syntheticData,
      metadata: {
        categoryId: query.categoryId,
        categoryName: query.categoryId ? categoryRegistry.getById(query.categoryId)?.displayName : undefined,
        year: query.year,
        period: query.year ? query.year.toString() : 'synthetic',
        totalDeputies: syntheticData.length,
        totalAmount: syntheticData.reduce((sum, entry) => sum + entry.deputy.totalAmount, 0),
        totalTransactions: syntheticData.reduce((sum, entry) => sum + entry.deputy.transactionCount, 0),
        dataQuality: 'low',
        confidence: 0.3,
        lastUpdate: new Date(),
        source: 'fallback',
        processingTime: 0,
      }
    }
    return result
  }
  private async generateDeterministicData(query: RankingQuery): Promise<RankingEntry[]> {
    const category = query.categoryId ? categoryRegistry.getById(query.categoryId) : undefined
    const limit = Math.min(query.limit || 20, 50)
    const partidos = ['PT', 'PSDB', 'MDB', 'PL', 'PDT'] as const
    const estados = ['SP', 'RJ', 'MG', 'BA', 'PR', 'RS'] as const
    const syntheticDeputies: DeputyData[] = []
    for (let i = 0; i < limit; i++) {
      const party = partidos[i % partidos.length] ?? 'SEM PARTIDO'
      const state = estados[i % estados.length] ?? 'BR'
      const seedValue = `${query.categoryId || 'geral'}_${query.year || 2024}_${i}`.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0)
      const normalizedSeed = Math.abs(seedValue) / 2147483647
      const deputy: DeputyData = {
        id: `fallback_${query.categoryId || 'geral'}_${i + 1}`,
        name: category ? `${category.displayName} - Deputado ${i + 1}` : `Deputado Exemplo ${i + 1}`,
        civilName: `Nome Civil ${i + 1}`,
        party,
        state,
        photoUrl: `https://www.camara.leg.br/internet/deputado/bandep/fallback_${i + 1}.jpg`,
        totalAmount: 10000 + (normalizedSeed * 100000),
        transactionCount: 5 + Math.floor(normalizedSeed * 50),
        supplierCount: 1 + Math.floor(normalizedSeed * 20),
        lastUpdate: new Date(),
        dataQuality: 'low'
      }
      syntheticDeputies.push(deputy)
    }
    syntheticDeputies.sort((a, b) => b.totalAmount - a.totalAmount)
    return this.convertToRankingEntries(syntheticDeputies, query)
  }
  private convertToRankingEntries(deputies: DeputyData[], query: RankingQuery, fallbackYear?: number): RankingEntry[] {
    const totalAmount = deputies.reduce((sum, d) => sum + d.totalAmount, 0)
    return deputies.map((deputy, index) => ({
      deputy,
      position: (query.offset || 0) + index + 1,
      categoryId: query.categoryId,
      year: fallbackYear || query.year,
      percentageOfTotal: totalAmount > 0 ? (deputy.totalAmount / totalAmount) * 100 : 0,
      averageTransaction: deputy.transactionCount > 0 ? deputy.totalAmount / deputy.transactionCount : 0,
      trend: 'stable' as const
    }))
  }
}


