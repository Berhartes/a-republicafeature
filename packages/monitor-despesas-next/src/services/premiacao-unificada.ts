import type {
  DeputadoProcessado,
  RankingDeputados,
  PremiacoesProcessadas,
  PremiacaoItem,
} from '@/types/etl-deputados.types'
import {
  processarPremiacaoItem,
} from './premiacoes-processor'

/**
 * Main function to process deputados and rankings into PremiacoesProcessadas
 * Pure function - receives all data as parameters, no I/O
 */
export function processarPremiacoes(
  deputados: DeputadoProcessado[],
  rankings: RankingDeputados
): PremiacoesProcessadas {
  const coroas = processarCoroas(rankings)
  const trofeus = processarTrofeus(rankings)
  const medalhas = processarMedalhas(rankings)
  const campeaoGeral = identificarCampeaoGeral(deputados)

  const totalCoroas = coroas.length
  const totalTrofeus = trofeus.length
  const totalMedalhas = medalhas.length
  const totalPremiacoes = totalCoroas + totalTrofeus + totalMedalhas

  return {
    coroas,
    trofeus,
    medalhas,
    coroasOuro: coroas,
    trofeusPrata: trofeus,
    medalhasBronze: medalhas,
    badgesEspeciais: [],
    campeaoGeral,
    estatisticas: {
      totalCoroas,
      totalTrofeus,
      totalMedalhas,
      totalPremiacoes,
      totalCoroasOuro: totalCoroas,
      totalTrofeusPrata: totalTrofeus,
      totalMedalhasBronze: totalMedalhas,
      totalBadgesEspeciais: 0,
      deputadosPremiados: new Set([
        ...coroas.map((c) => c.deputadoId),
        ...trofeus.map((t) => t.deputadoId),
        ...medalhas.map((m) => m.deputadoId),
      ].filter(Boolean)).size,
    },
  }
}

/**
 * Identify top performers (1st place in geral/categoria/ano) - Coroas
 */
export function processarCoroas(rankings: RankingDeputados): PremiacaoItem[] {
  const coroas: PremiacaoItem[] = []

  // Campeão geral
  if (rankings.geral.length > 0) {
    const campeao = rankings.geral[0]
    coroas.push(
      processarPremiacaoItem(campeao, 'coroa', {
        posicao: 1,
        categoria: 'Geral',
      })
    )
  }

  // Campeões por categoria (1st place)
  Object.entries(rankings.porCategoria).forEach(([categoria, ranking]) => {
    if (ranking.length > 0) {
      const campeao = ranking[0]
      coroas.push(
        processarPremiacaoItem(campeao, 'coroa', {
          posicao: 1,
          categoria,
        })
      )
    }
  })

  return coroas
}

/**
 * Identify annual champions (1st place per year) - Troféus
 */
export function processarTrofeus(rankings: RankingDeputados): PremiacaoItem[] {
  const trofeus: PremiacaoItem[] = []

  // Campeões por ano (1st place)
  Object.entries(rankings.porAno).forEach(([anoStr, ranking]) => {
    if (ranking.length > 0) {
      const ano = parseInt(anoStr, 10)
      const campeao = ranking[0]
      trofeus.push(
        processarPremiacaoItem(campeao, 'trofeu', {
          posicao: 1,
          ano,
          categoria: `Ano ${ano}`,
        })
      )
    }
  })

  return trofeus
}

/**
 * Identify category champions (2nd-3rd place) - Medalhas
 */
export function processarMedalhas(
  rankings: RankingDeputados
): PremiacaoItem[] {
  const medalhas: PremiacaoItem[] = []

  // 2nd and 3rd place in geral
  if (rankings.geral.length > 1) {
    const segundo = rankings.geral[1]
    medalhas.push(
      processarPremiacaoItem(segundo, 'medalha', {
        posicao: 2,
        categoria: 'Geral',
      })
    )
  }
  if (rankings.geral.length > 2) {
    const terceiro = rankings.geral[2]
    medalhas.push(
      processarPremiacaoItem(terceiro, 'medalha', {
        posicao: 3,
        categoria: 'Geral',
      })
    )
  }

  // 2nd and 3rd place por categoria
  Object.entries(rankings.porCategoria).forEach(([categoria, ranking]) => {
    if (ranking.length > 1) {
      const segundo = ranking[1]
      medalhas.push(
        processarPremiacaoItem(segundo, 'medalha', {
          posicao: 2,
          categoria,
        })
      )
    }
    if (ranking.length > 2) {
      const terceiro = ranking[2]
      medalhas.push(
        processarPremiacaoItem(terceiro, 'medalha', {
          posicao: 3,
          categoria,
        })
      )
    }
  })

  // 2nd and 3rd place por ano
  Object.entries(rankings.porAno).forEach(([anoStr, ranking]) => {
    const ano = parseInt(anoStr, 10)
    if (ranking.length > 1) {
      const segundo = ranking[1]
      medalhas.push(
        processarPremiacaoItem(segundo, 'medalha', {
          posicao: 2,
          ano,
          categoria: `Ano ${ano}`,
        })
      )
    }
    if (ranking.length > 2) {
      const terceiro = ranking[2]
      medalhas.push(
        processarPremiacaoItem(terceiro, 'medalha', {
          posicao: 3,
          ano,
          categoria: `Ano ${ano}`,
        })
      )
    }
  })

  return medalhas
}

/**
 * Find deputado with highest totalGastos
 */
export function identificarCampeaoGeral(
  deputados: DeputadoProcessado[]
): PremiacoesProcessadas['campeaoGeral'] | undefined {
  if (deputados.length === 0) return undefined

  const campeao = [...deputados].sort(
    (a, b) => b.totalGastos - a.totalGastos
  )[0]

  return {
    deputadoId: campeao.id,
    id: campeao.id,
    nome: campeao.nome,
    nomeEleitoral: campeao.nomeEleitoral,
    siglaPartido: campeao.siglaPartido,
    siglaUf: campeao.siglaUf,
    valorTotal: campeao.totalGastos,
  }
}
