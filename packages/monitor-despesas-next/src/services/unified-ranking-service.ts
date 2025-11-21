import type { DeputadoProcessado } from '@/types/etl-deputados.types'

export interface FiltrosRanking {
  ano?: number | 'todos'
  categoria?: string | 'TODAS'
  uf?: string | 'TODAS'
}

export interface EstatisticasRanking {
  totalDeputados: number
  totalGastos: number
  mediaGastos: number
}

/**
 * Returns ranking geral sorted by totalGastos (descending)
 */
export function getRankingGeral(
  deputados: DeputadoProcessado[]
): DeputadoProcessado[] {
  return [...deputados].sort((a, b) => b.totalGastos - a.totalGastos)
}

/**
 * Returns ranking filtered by specific year
 */
export function getRankingPorAno(
  deputados: DeputadoProcessado[],
  ano: number
): DeputadoProcessado[] {
  return deputados
    .filter((dep) => dep.gastosPorAno[ano] !== undefined)
    .map((dep) => ({
      ...dep,
      totalGastos: dep.gastosPorAno[ano] || 0,
      totalTransacoes: dep.transacoesPorAno[ano] || 0,
    }))
    .sort((a, b) => b.totalGastos - a.totalGastos)
}

/**
 * Returns ranking filtered by category
 */
export function getRankingPorCategoria(
  deputados: DeputadoProcessado[],
  categoria: string
): DeputadoProcessado[] {
  return deputados
    .map((dep) => {
      const categoriaData = dep.topCategorias.find(
        (cat) => cat.categoria === categoria
      )
      return {
        ...dep,
        totalGastos: categoriaData?.valor || 0,
      }
    })
    .filter((dep) => dep.totalGastos > 0)
    .sort((a, b) => b.totalGastos - a.totalGastos)
}

/**
 * Returns ranking with combined filters (ano, categoria, uf)
 */
export function getRankingFiltrado(
  deputados: DeputadoProcessado[],
  filtros: FiltrosRanking
): DeputadoProcessado[] {
  let resultado = [...deputados]

  // Filter by UF
  if (filtros.uf && filtros.uf !== 'TODAS') {
    resultado = resultado.filter((dep) => dep.siglaUf === filtros.uf)
  }

  // Filter by categoria
  if (filtros.categoria && filtros.categoria !== 'TODAS') {
    resultado = resultado
      .map((dep) => {
        const categoriaData = dep.topCategorias.find(
          (cat) => cat.categoria === filtros.categoria
        )
        return {
          ...dep,
          totalGastos: categoriaData?.valor || 0,
        }
      })
      .filter((dep) => dep.totalGastos > 0)
  }

  // Filter by ano
  if (filtros.ano && filtros.ano !== 'todos') {
    resultado = resultado
      .filter((dep) => dep.gastosPorAno[filtros.ano as number] !== undefined)
      .map((dep) => ({
        ...dep,
        totalGastos: dep.gastosPorAno[filtros.ano as number] || 0,
        totalTransacoes: dep.transacoesPorAno[filtros.ano as number] || 0,
      }))
  }

  return resultado.sort((a, b) => b.totalGastos - a.totalGastos)
}

/**
 * Computes statistics for a ranking
 */
export function calcularEstatisticasRanking(
  ranking: DeputadoProcessado[]
): EstatisticasRanking {
  const totalDeputados = ranking.length
  const totalGastos = ranking.reduce((sum, dep) => sum + dep.totalGastos, 0)
  const mediaGastos = totalDeputados > 0 ? totalGastos / totalDeputados : 0

  return {
    totalDeputados,
    totalGastos,
    mediaGastos,
  }
}
