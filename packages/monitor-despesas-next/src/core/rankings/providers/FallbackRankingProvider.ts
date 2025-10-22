
import { DataProvider, DeputyData, RankingEntry, RankingQuery, RankingResult } from '../RankingEngine.js'
import { categoryRegistry } from '../../categories/CategoryRegistry.js'

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
      
      const syntheticData = this.generateSyntheticData(query)
      
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
    if (!query.year || query.year <= 2020) {
      return null // Não tentar fallback temporal para anos muito antigos
    }
    
    console.log('🕐 [FallbackProvider] Trying temporal fallback')
    
    const fallbackYears = [query.year - 1, query.year - 2, query.year - 3]
    
    for (const fallbackYear of fallbackYears) {
      try {
    const rankingsOtimizadosService = await import('../../../services/rankings-otimizados-service')
        const service = new rankingsOtimizadosService.RankingsOtimizadosService()
        
        const category = query.categoryId ? categoryRegistry.getById(query.categoryId) : undefined
        
        let rankingData: any = null
        
        if (category) {
          rankingData = await service.buscarRankingCategoriaPorAno(category.displayName, fallbackYear)
        } else {
          rankingData = await service.buscarRankingGeralPorAno(fallbackYear)
        }
        
        if (rankingData && rankingData.ranking && rankingData.ranking.length > 0) {
          console.log(`✅ [FallbackProvider] Found temporal fallback data for year ${fallbackYear}`)
          
          const deputies = this.convertLegacyData(rankingData.ranking)
          const entries = this.convertToRankingEntries(deputies, query, fallbackYear)
          
          return {
            entries,
            metadata: {
              categoryId: query.categoryId,
              categoryName: category?.displayName,
              year: query.year, // Manter ano original na resposta
              period: `${query.year} (fallback from ${fallbackYear})`,
              totalDeputies: deputies.length,
              totalAmount: deputies.reduce((sum, d) => sum + d.totalAmount, 0),
              totalTransactions: deputies.reduce((sum, d) => sum + d.transactionCount, 0),
              dataQuality: 'medium', // Dados temporais são de qualidade média
              confidence: 0.7,
              lastUpdate: new Date(),
              source: 'fallback',
              processingTime: Date.now() - Date.now()
            }
          }
        }
      } catch (error) {
        console.warn(`⚠️ [FallbackProvider] Failed to get temporal fallback for year ${fallbackYear}:`, error)
      }
    }
    
    return null
  }
  
  private generateSyntheticData(query: RankingQuery): RankingEntry[] {
    console.log('🎭 [FallbackProvider] Generating synthetic data for development')
    
    const category = query.categoryId ? categoryRegistry.getById(query.categoryId) : undefined
      const limit = Math.min(query.limit || 20, 50) // Máximo 50 entradas sintéticas
      const partidos = ['PT', 'PSDB', 'MDB', 'PL', 'PDT'] as const
      const estados = ['SP', 'RJ', 'MG', 'BA', 'PR', 'RS'] as const
    
    const syntheticDeputies: DeputyData[] = []
    
    for (let i = 0; i < limit; i++) {
      const party = partidos[i % partidos.length] ?? 'SEM PARTIDO'
      const state = estados[i % estados.length] ?? 'BR'

      const deputy: DeputyData = {
        id: `synthetic_${i + 1}`,
          name: category ? `${category.displayName} - Deputado ${i + 1}` : `Deputado Exemplo ${i + 1}`,
        civilName: `Nome Civil ${i + 1}`,
        party,
        state,
        photoUrl: `https://www.camara.leg.br/internet/deputado/bandep/synthetic_${i + 1}.jpg`,
        totalAmount: Math.random() * 100000 + 10000, // Entre R$ 10k e R$ 110k
        transactionCount: Math.floor(Math.random() * 50) + 5, // Entre 5 e 55 transações
        supplierCount: Math.floor(Math.random() * 20) + 1, // Entre 1 e 21 fornecedores
        lastUpdate: new Date(),
        dataQuality: 'low'
      }
      
      syntheticDeputies.push(deputy)
    }
    
    syntheticDeputies.sort((a, b) => b.totalAmount - a.totalAmount)
    
    return this.convertToRankingEntries(syntheticDeputies, query)
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