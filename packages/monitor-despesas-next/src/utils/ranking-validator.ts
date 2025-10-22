
export interface RankingValidationResult {
  isValid: boolean
  issues: string[]
  warnings: string[]
  score: number // 0-100, onde 100 é perfeito
  recommendations: string[]
}

export interface RankingData {
  ranking: any[]
  totalDeputados: number
  periodo: string
  _isFallback?: boolean
  _originalCount?: number
}

export function validateRanking(
  rankingData: RankingData | null,
  categoria: string,
  ano: string,
  historicalData?: RankingData
): RankingValidationResult {
  const result: RankingValidationResult = {
    isValid: true,
    issues: [],
    warnings: [],
    score: 100,
    recommendations: []
  }

  if (!rankingData || !rankingData.ranking) {
    result.isValid = false
    result.score = 0
    result.issues.push(`Nenhum dado encontrado para a categoria ${categoria} no período ${ano}`)
    result.recommendations.push(`Executar reprocessamento dos dados para ${categoria}`)
    return result
  }

  const { ranking, totalDeputados } = rankingData
  const deputadosCount = ranking.length

  if (deputadosCount === 0) {
    result.isValid = false
    result.score = 0
    result.issues.push('Ranking vazio - nenhum deputado encontrado')
    result.recommendations.push(`Verificar processamento de dados para a categoria ${categoria}`)
    return result
  }

  if (deputadosCount < 3) {
    result.score -= 30
    result.warnings.push(`Ranking muito pequeno: apenas ${deputadosCount} deputados`)
    result.recommendations.push(`Verificar se todos os deputados foram processados para ${categoria}`)
  }

  if (historicalData && historicalData.ranking.length > 0) {
    const historicalCount = historicalData.ranking.length
    const completenessPercentage = (deputadosCount / historicalCount) * 100

    if (completenessPercentage < 50) {
      result.isValid = false
      result.score -= 40
      result.issues.push(`Dados severamente incompletos: ${deputadosCount} deputados vs ${historicalCount} históricos (${completenessPercentage.toFixed(1)}%)`)
      result.recommendations.push('Reprocessar dados ou usar fallback histórico')
    } else if (completenessPercentage < 80) {
      result.score -= 20
      result.warnings.push(`Dados possivelmente incompletos: ${deputadosCount} deputados vs ${historicalCount} históricos (${completenessPercentage.toFixed(1)}%)`)
      result.recommendations.push('Considerar usar dados históricos como fallback')
    }
  }

  const deputadosComValorZero = ranking.filter(dep => (dep.totalGastos || dep.valor || 0) <= 0).length
  if (deputadosComValorZero > 0) {
    result.score -= 10
    result.warnings.push(`${deputadosComValorZero} deputados com valores zerados ou negativos`)
  }

  let ordemIncorreta = false
  for (let i = 1; i < ranking.length; i++) {
    const valorAnterior = ranking[i-1].totalGastos || ranking[i-1].valor || 0
    const valorAtual = ranking[i].totalGastos || ranking[i].valor || 0
    
    if (valorAtual > valorAnterior) {
      ordemIncorreta = true
      break
    }
  }
  
  if (ordemIncorreta) {
    result.score -= 15
    result.warnings.push('Ranking não está ordenado corretamente (ordem decrescente)')
    result.recommendations.push('Verificar algoritmo de ordenação dos rankings')
  }

  const deputadosSemNome = ranking.filter(dep => !dep.nome || dep.nome.trim() === '').length
  if (deputadosSemNome > 0) {
    result.score -= 20
    result.issues.push(`${deputadosSemNome} deputados sem nome`)
  }

  if (totalDeputados && totalDeputados !== deputadosCount) {
    result.score -= 5
    result.warnings.push(`Inconsistência: totalDeputados (${totalDeputados}) != ranking.length (${deputadosCount})`)
  }

  if (rankingData._isFallback) {
    result.warnings.push('Dados de fallback sendo utilizados')
    if (rankingData._originalCount && rankingData._originalCount > 0) {
      result.warnings.push(`Dados originais de ${ano} incompletos (${rankingData._originalCount} deputados)`)
    }
  }

  result.isValid = result.score >= 70 && result.issues.length === 0

  return result
}

export function validateMultipleRankings(
  rankings: { [year: string]: RankingData },
  categoria: string,
  historicalData?: RankingData
): { [year: string]: RankingValidationResult } {
  const results: { [year: string]: RankingValidationResult } = {}
  
  Object.entries(rankings).forEach(([year, rankingData]) => {
    results[year] = validateRanking(rankingData, categoria, year, historicalData)
  })
  
  return results
}

export function generateRankingHealthReport(validationResults: { [key: string]: RankingValidationResult }): {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  summary: string
  criticalIssues: string[]
  recommendations: string[]
} {
  const scores = Object.values(validationResults).map(r => r.score)
  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  
  const allIssues = Object.values(validationResults).flatMap(r => r.issues)
  const allRecommendations = [...new Set(Object.values(validationResults).flatMap(r => r.recommendations))]
  
  let overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  if (averageScore >= 90) overallHealth = 'excellent'
  else if (averageScore >= 70) overallHealth = 'good'
  else if (averageScore >= 50) overallHealth = 'fair'
  else overallHealth = 'poor'
  
  const validRankings = Object.values(validationResults).filter(r => r.isValid).length
  const totalRankings = Object.keys(validationResults).length
  
  return {
    overallHealth,
    summary: `${validRankings}/${totalRankings} rankings válidos. Score médio: ${averageScore.toFixed(1)}/100`,
    criticalIssues: allIssues,
    recommendations: allRecommendations
  }
}

const CATEGORIAS_PEQUENAS = [
  'LOCAÇÃO OU FRETAMENTO DE EMBARCAÇÕES',
  'LOCAÇÃO OU FRETAMENTO DE AERONAVES',
  'AQUISIÇÃO DE TOKENS'
]

export function isSmallCategory(categoria: string): boolean {
  return CATEGORIAS_PEQUENAS.some(cat => 
    categoria.toUpperCase().includes(cat) || cat.includes(categoria.toUpperCase())
  )
}
