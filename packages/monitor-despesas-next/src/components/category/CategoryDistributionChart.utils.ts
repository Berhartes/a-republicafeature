
import { CategoryData, ReferenceData } from './CategoryDistributionChart.types'
import { getCategoriaColor } from '@/lib/categoria-colors'

export const calculateBarPercentages = (
  item: CategoryData,
  referenceData?: ReferenceData,
  allData?: CategoryData[]
) => {
  const valor = item.valor
  const mediaCategoria = referenceData?.media || 0
  const maxCategoria = referenceData?.maximo || 0
  
  let valorReferencia = valor
  if (allData && allData.length > 0) {
    const maxDoDataset = Math.max(...allData.map(d => d.valor))
    valorReferencia = Math.max(valor, mediaCategoria, maxCategoria, maxDoDataset)
  } else {
    valorReferencia = Math.max(valor, mediaCategoria, maxCategoria)
  }
  
  const percentualPrincipal = valorReferencia > 0 ? (valor / valorReferencia) * 100 : 0
  const percentualMedia = valorReferencia > 0 ? (mediaCategoria / valorReferencia) * 100 : 0
  const percentualMax = valorReferencia > 0 ? (maxCategoria / valorReferencia) * 100 : 0
  
  return {
    principal: Math.max(percentualPrincipal, 3), // Mínimo 3% para visibilidade
    media: Math.max(percentualMedia, 5), // Mínimo 5% para visibilidade da linha
    maximo: percentualMax,
    valorReferencia
  }
}

export const calculateComparison = (
  valor: number,
  mediaCategoria: number
): {
  tipo: 'acima' | 'abaixo' | 'igual'
  percentual: number
  formatado: string
} => {
  if (mediaCategoria <= 0) {
    return { tipo: 'igual', percentual: 0, formatado: '0%' }
  }
  
  if (valor > mediaCategoria) {
    const percentual = ((valor / mediaCategoria - 1) * 100)
    return {
      tipo: 'acima',
      percentual,
      formatado: `↗ ${percentual.toFixed(1)}% acima da média`
    }
  } else if (valor < mediaCategoria) {
    const percentual = ((1 - valor / mediaCategoria) * 100)
    return {
      tipo: 'abaixo',
      percentual,
      formatado: `↘ ${percentual.toFixed(1)}% abaixo da média`
    }
  } else {
    return {
      tipo: 'igual',
      percentual: 0,
      formatado: '≈ Na média'
    }
  }
}

export const calculateRecordPercentage = (
  valor: number,
  recordeValor: number
): {
  atingiuRecorde: boolean
  percentual: number
  formatado: string
} => {
  if (recordeValor <= 0) {
    return { atingiuRecorde: false, percentual: 0, formatado: '0%' }
  }
  
  const percentual = (valor / recordeValor) * 100
  
  return {
    atingiuRecorde: valor >= recordeValor,
    percentual,
    formatado: valor >= recordeValor 
      ? '🔥 Recorde atingido!'
      : `${percentual.toFixed(1)}% do recorde`
  }
}

export const formatCurrency = (
  valor: number,
  context: 'fornecedores-page' | 'perfil-deputado'
): string => {
  const options = context === 'fornecedores-page' 
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
  
  return valor.toLocaleString('pt-BR', options)
}

export const shouldShowPieLabel = (
  percentual: string,
  categoria: string,
  minPercentual: number = 4
): boolean => {
  const percentualNum = parseFloat(percentual)
  return percentualNum >= minPercentual
}

export const truncateCategory = (
  categoria: string,
  maxLength: number = 25
): string => {
  if (categoria.length <= maxLength) return categoria
  return categoria.substring(0, maxLength) + '...'
}

export const getCategoryColor = (categoria: string): string => {
  return getCategoriaColor(categoria)
}

export const calculateSummaryStats = (data: CategoryData[]) => {
  if (!data || data.length === 0) {
    return {
      totalCategorias: 0,
      valorTotal: 0,
      mediaValor: 0,
      maiorCategoria: null,
      menorCategoria: null
    }
  }
  
  const valorTotal = data.reduce((sum, item) => sum + item.valor, 0)
  const mediaValor = valorTotal / data.length
  const sortedByValue = [...data].sort((a, b) => b.valor - a.valor)
  
  return {
    totalCategorias: data.length,
    valorTotal,
    mediaValor,
    maiorCategoria: sortedByValue[0],
    menorCategoria: sortedByValue[sortedByValue.length - 1]
  }
}

export const getComparisonClasses = (
  tipo: 'acima' | 'abaixo' | 'igual'
): string => {
  switch (tipo) {
    case 'acima':
      return 'text-orange-600'
    case 'abaixo':
      return 'text-green-600'
    case 'igual':
    default:
      return 'text-blue-600'
  }
}