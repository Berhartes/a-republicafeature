
import { DataProvider, DeputyData, RankingEntry, RankingQuery, RankingResult } from '../RankingEngine'
import { categoryRegistry } from '../../categories/CategoryRegistry'

export class FallbackRankingProvider implements DataProvider {
  name = 'FallbackRankingProvider'
  priority = 10 // Prioridade baixa - último recurso
  
  canProvide(_query: RankingQuery): boolean {
    return true
  }
  
  estimateResponseTime(_query: RankingQuery): number {
    return 50 // 50ms
  }
  
  async fetchData(query: RankingQuery): Promise<RankingResult | null> {
    const startTime = Date.now()
    
    try {
      console.log('🔄 [FallbackProvider] Generating fallback data')
      
      const temporalData = await this.tryTemporalFallback(query)
      if (temporalData) {
        return temporalData
      }
      
      const syntheticData = await this.generateSyntheticData(query)
      
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
          dataQuality: 'low', // Dados de fallback são de baixa qualidade
          confidence: 0.3,
          lastUpdate: new Date(),
          source: 'fallback',
          processingTime: Date.now() - startTime
        }
      }
      
      console.log(`🔄 [FallbackProvider] Generated ${syntheticData.length} synthetic entries`)
      
      return result
      
    } catch (error) {
      console.error('❌ [FallbackProvider] Error generating fallback data:', error)
      return null
    }
  }
  
  private async tryTemporalFallback(query: RankingQuery): Promise<RankingResult | null> {
    // DESABILITADO: Serviço rankings-otimizados-service não existe mais
    // TODO: Reimplementar usando data-actions.ts
    return null
  }
  
  private async generateSyntheticData(query: RankingQuery): Promise<RankingEntry[]> {
    console.log('🔄 [FallbackProvider] ETL cache service não disponível, gerando dados sintéticos')
    
    // DESABILITADO: etl-cache.service não existe mais
    // TODO: Reimplementar usando data-actions.ts
    
    console.log('🎭 [FallbackProvider] Falling back to deterministic synthetic data')
    return this.generateDeterministicData(query)
  }

  private generateDeterministicData(query: RankingQuery): RankingEntry[] {
    const category = query.categoryId ? categoryRegistry.getById(query.categoryId) : undefined
    const limit = Math.min(query.limit || 20, 50)
    const partidos = ['PT', 'PSDB', 'MDB', 'PL', 'PDT'] as const
    const estados = ['SP', 'RJ', 'MG', 'BA', 'PR', 'RS'] as const

    const syntheticDeputies: DeputyData[] = []

    for (let i = 0; i < limit; i++) {
      const party = partidos[i % partidos.length] ?? 'SEM PARTIDO'
      const state = estados[i % estados.length] ?? 'BR'

      const seedValue = `${query.categoryId || 'geral'}_${query.year || 2024}_${i}`.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)

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

  private convertEtlDataToDeputyData(etlData: any[]): DeputyData[] {
    return etlData.map(entry => ({
      id: entry.id || entry.deputadoId || '',
      name: entry.nome || entry.deputadoNome || 'Deputado Não Identificado',
      civilName: entry.nomeCivil || entry.deputadoNomeCivil || '',
      party: entry.siglaPartido || entry.partido || entry.deputadoPartido || '',
      state: entry.siglaUf || entry.uf || entry.deputadoUF || '',
      photoUrl: entry.urlFoto || entry.foto,
      totalAmount: entry.totalDespesas || entry.totalGastos || entry.totalValor || 0,
      transactionCount: entry.numeroDespesas || entry.quantidadeTransacoes || entry.totalTransacoes || 0,
      supplierCount: entry.fornecedoresIdentificados || entry.totalFornecedores || 0,
      lastUpdate: new Date(),
      dataQuality: 'medium' as const
    }))
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
      dataQuality: 'medium' as const
    }))
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