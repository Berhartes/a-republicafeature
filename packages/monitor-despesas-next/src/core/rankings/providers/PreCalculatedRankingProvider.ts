
import { DataProvider, DeputyData, RankingEntry, RankingQuery, RankingResult } from '../RankingEngine.js'
import { categoryRegistry } from '../../categories/CategoryRegistry.js'

export class PreCalculatedRankingProvider implements DataProvider {
  name = 'PreCalculatedRankingProvider'
  priority = 200 // Prioridade alta - dados otimizados
  
  canProvide(query: RankingQuery): boolean {
    return !query.deputyIds?.length && !query.states?.length && !query.parties?.length
  }
  
  estimateResponseTime(_query: RankingQuery): number {
    return 100 // 100ms
  }
  
  async fetchData(query: RankingQuery): Promise<RankingResult | null> {
    const startTime = Date.now()
    
    try {
      console.log('📊 [PreCalculatedProvider] Fetching pre-calculated ranking')
      
  const rankingsOtimizadosService = await import('../../../services/rankings-otimizados-service')
      const service = new rankingsOtimizadosService.RankingsOtimizadosService()
      
      const category = query.categoryId ? categoryRegistry.getById(query.categoryId) : undefined
      
      let rankingData: any = null
      
      if (category) {
        if (query.year) {
          rankingData = await service.buscarRankingCategoriaPorAno(category.displayName, query.year)
        } else {
          rankingData = await service.buscarRankingCategoriaHistorico(category.displayName)
        }
      } else {
        if (query.year) {
          rankingData = await service.buscarRankingGeralPorAno(query.year)
        } else {
          rankingData = await service.buscarRankingGeralHistorico()
        }
      }
      
      if (!rankingData || !rankingData.ranking || rankingData.ranking.length === 0) {
        console.log('⚠️ [PreCalculatedProvider] No pre-calculated data found')
        return null
      }
      
      console.log(`📊 [PreCalculatedProvider] Found ${rankingData.ranking.length} pre-calculated entries`)
      
      const deputies = this.convertLegacyData(rankingData.ranking)
      
      const sortedDeputies = this.sortAndPaginate(deputies, query)
      
      const entries = this.convertToRankingEntries(sortedDeputies, query)
      
      const totalAmount = deputies.reduce((sum, d) => sum + d.totalAmount, 0)
      const totalTransactions = deputies.reduce((sum, d) => sum + d.transactionCount, 0)
      
      const result: RankingResult = {
        entries,
        metadata: {
          categoryId: query.categoryId,
          categoryName: category?.displayName,
          year: query.year,
          period: query.year ? query.year.toString() : 'historical',
          totalDeputies: deputies.length,
          totalAmount,
          totalTransactions,
          dataQuality: 'high', // Dados pré-calculados são de alta qualidade
          confidence: 0.95,
          lastUpdate: rankingData.ultimaAtualizacao ? 
            (rankingData.ultimaAtualizacao.toDate ? rankingData.ultimaAtualizacao.toDate() : new Date(rankingData.ultimaAtualizacao)) : 
            new Date(),
          source: 'pre-calculated',
          processingTime: Date.now() - startTime
        }
      }
      
      console.log(`✅ [PreCalculatedProvider] Processed ${entries.length} entries in ${result.metadata.processingTime}ms`)
      
      return result
      
    } catch (error) {
      console.error('❌ [PreCalculatedProvider] Error fetching pre-calculated data:', error)
      return null
    }
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
        case 'amount':
          valueA = a.totalAmount
          valueB = b.totalAmount
          break
        case 'transactions':
          valueA = a.transactionCount
          valueB = b.transactionCount
          break
        case 'suppliers':
          valueA = a.supplierCount
          valueB = b.supplierCount
          break
        default:
          valueA = a.totalAmount
          valueB = b.totalAmount
      }
      
      return direction === 'desc' ? valueB - valueA : valueA - valueB
    })
    
    const offset = query.offset || 0
    const limit = query.limit
    
    if (limit) {
      return sorted.slice(offset, offset + limit)
    }
    
    return sorted.slice(offset)
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