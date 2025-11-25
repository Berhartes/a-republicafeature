'use server'

import { loadDeputiesCache } from '@/actions/_cached-loaders'
import { parseDeputiesCache } from '@/services/analytics'
import { getRankingGeral, getRankingPorAno, getRankingPorCategoria, getRankingFiltrado, calcularEstatisticasRanking } from '../services/unified-ranking-service'
import { processarPremiacoes, identificarCampeaoGeral } from '../services/premiacao-unificada'

type FiltrosRanking = {
  ano?: number | 'todos'
  categoria?: string | 'TODAS'
  uf?: string | 'TODAS'
}

export async function getRankingPorCategoriaSA(categoria: string, limit: number = 10) {
  if (!categoria || categoria.trim() === '') return { ranking: [] }
  const rawCacheData = await loadDeputiesCache()
  const { deputados } = parseDeputiesCache(rawCacheData)
  const ranked = getRankingPorCategoria((deputados as any) || [], categoria)
  const limited = ranked.slice(0, Math.max(1, Math.min(limit, 50)))
  return {
    ranking: limited.map((dep: any) => ({
      deputadoId: dep.id,
      nomeEleitoral: dep.nomeEleitoral,
      foto: dep.foto,
      numeroTransacoes: dep.totalTransacoes,
      totalGasto: dep.totalGastos,
      fornecedorTopNome: undefined,
    })),
  }
}

export async function getRankingFiltradoSA(filtros: FiltrosRanking) {
  const rawCacheData = await loadDeputiesCache()
  const { deputados } = parseDeputiesCache(rawCacheData)
  const ranking = getRankingFiltrado((deputados as any) || [], filtros)
  const stats = calcularEstatisticasRanking(ranking as any)
  return { ranking, stats }
}

export async function getPremiacoesSA(filtros: FiltrosRanking) {
  const rawCacheData = await loadDeputiesCache()
  const { deputados } = parseDeputiesCache(rawCacheData)
  const rankingGeral = getRankingGeral((deputados as any) || [])
  const categoriasDisponiveis: string[] = Array.from(
    new Set<string>(
      (((deputados as any) || []) as any[]).flatMap((d: any) => (Array.isArray(d.topCategorias) ? d.topCategorias.map((c: any) => String(c.categoria || '')) : []))
    )
  ).filter(Boolean).sort()
  const anosDisponiveis: number[] = Array.from(
    new Set<number>(
      (((deputados as any) || []) as any[]).flatMap((d: any) => Array.isArray(d.anosDisponiveis) ? d.anosDisponiveis.map((x: any) => Number(x)) : [])
    )
  ).sort((a, b) => a - b)
  const porCategoria: Record<string, any[]> = {}
  categoriasDisponiveis.forEach((categoria) => { porCategoria[categoria] = getRankingPorCategoria((deputados as any) || [], categoria) })
  const porAno: Record<number, any[]> = {}
  anosDisponiveis.forEach((ano) => { porAno[ano] = getRankingPorAno((deputados as any) || [], ano) })
  const rankings = { geral: rankingGeral, porCategoria, porAno, estatisticas: calcularEstatisticasRanking(rankingGeral as any) }
  const premiacoes = processarPremiacoes((deputados as any) || [], rankings as any)
  const campeao = identificarCampeaoGeral((deputados as any) || [])
  const rankingFiltrado = getRankingFiltrado((deputados as any) || [], filtros)
  return { premiacoes, campeao, rankings, rankingFiltrado }
}

export async function getRankingAndAwards(filtros: FiltrosRanking = {}) {
  const raw = await loadDeputiesCache()
  const { deputados } = parseDeputiesCache(raw)

  const geral = getRankingGeral((deputados as any) || [])
  const estatisticas = calcularEstatisticasRanking(geral as any)

  const catsList: string[] = (((deputados as any) || []) as any[])
    .flatMap((dep: any) => Array.isArray(dep.topCategorias) ? dep.topCategorias.map((c: any) => String(c?.categoria || '')) : [])
    .filter(Boolean) as string[]
  const categorias = Array.from(new globalThis.Set(catsList)).sort() as string[]

  const anosList: number[] = (((deputados as any) || []) as any[])
    .flatMap((dep: any) => Array.isArray(dep.anosDisponiveis) ? dep.anosDisponiveis.map((a: any) => Number(a)) : [])
    .filter((n: any) => typeof n === 'number' && !isNaN(n)) as number[]
  const anos = Array.from(new globalThis.Set(anosList)).sort((a, b) => a - b)

  const porCategoria: Record<string, any[]> = {}
  categorias.forEach((cat) => { porCategoria[cat] = getRankingPorCategoria((deputados as any) || [], cat) })

  const porAno: Record<number, any[]> = {}
  anos.forEach((ano) => { porAno[ano] = getRankingPorAno((deputados as any) || [], ano) })

  const rankings = { geral, porCategoria, porAno, estatisticas }
  const premiacoes = processarPremiacoes((deputados as any) || [], rankings as any)
  const campeaoGeral = identificarCampeaoGeral((deputados as any) || [])

  const filtrosRanking = {
    ano: filtros.ano ?? 'todos',
    categoria: filtros.categoria ?? 'TODAS',
    uf: filtros.uf ?? 'TODAS',
  } as const
  const rankingFiltrado = getRankingFiltrado((deputados as any) || [], filtrosRanking)

  const limit = Math.max(1, Math.min((filtros as any).limit ?? 10, 50))
  const topFiltrado = rankingFiltrado.slice(0, limit)

  return {
    rankings,
    estatisticas,
    premiacoes,
    campeaoGeral,
    filtrado: {
      items: topFiltrado,
      total: rankingFiltrado.length,
    },
    metadata: {
      anosDisponiveis: anos,
      categoriasDisponiveis: categorias,
      lastUpdate: new Date().toISOString(),
    },
  }
}


