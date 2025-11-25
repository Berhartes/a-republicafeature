import type {
  DeputadoProcessado,
  RankingDeputados,
  PremiacoesProcessadas,
  PremiacaoItem,
} from '@/types/etl-deputados.types'

export function processarPremiacaoItem(
  deputado: DeputadoProcessado,
  tipo: 'coroa' | 'trofeu' | 'medalha',
  contexto: { categoria?: string; ano?: number; posicao: number }
): PremiacaoItem {
  const titulo = gerarTituloPremiacoes(tipo, contexto.categoria, contexto.ano)
  const descricao = gerarDescricaoPremiacoes(deputado, contexto)
  return {
    deputadoId: deputado.id,
    titulo,
    descricao,
    categoria: contexto.categoria || 'Geral',
    valor: deputado.totalGastos,
    nomeEleitoral: deputado.nomeEleitoral,
    siglaPartido: deputado.siglaPartido,
    siglaUf: deputado.siglaUf,
    ano: contexto.ano,
    posicao: contexto.posicao,
  }
}

export function gerarTituloPremiacoes(
  tipo: string,
  categoria?: string,
  ano?: number
): string {
  const prefixos: Record<string, string> = { coroa: 'Campeão', trofeu: 'Campeão', medalha: 'Destaque' }
  const prefixo = prefixos[tipo] || 'Premiação'
  return ano ? `${prefixo} ${categoria || 'Geral'} ${ano}` : `${prefixo} ${categoria || 'Geral'}`
}

export function gerarDescricaoPremiacoes(
  deputado: DeputadoProcessado,
  contexto: { categoria?: string; ano?: number; posicao: number }
): string {
  const posicaoTexto = contexto.posicao === 1 ? '1º lugar' : contexto.posicao === 2 ? '2º lugar' : '3º lugar'
  const categoriaTexto = contexto.categoria || 'Geral'
  const anoTexto = contexto.ano ? ` em ${contexto.ano}` : ''
  return `${posicaoTexto} em ${categoriaTexto}${anoTexto} - ${deputado.siglaPartido}/${deputado.siglaUf}`
}

export function processarPremiacoes(
  deputados: DeputadoProcessado[],
  rankings: RankingDeputados
): PremiacoesProcessadas {
  const coroas: PremiacaoItem[] = []
  if (rankings.geral.length > 0) coroas.push(processarPremiacaoItem(rankings.geral[0], 'coroa', { posicao: 1, categoria: 'Geral' }))
  Object.entries(rankings.porCategoria).forEach(([categoria, ranking]) => { if (ranking.length > 0) coroas.push(processarPremiacaoItem(ranking[0], 'coroa', { posicao: 1, categoria })) })
  const trofeus: PremiacaoItem[] = []
  Object.entries(rankings.porAno).forEach(([anoStr, ranking]) => { if (ranking.length > 0) trofeus.push(processarPremiacaoItem(ranking[0], 'trofeu', { posicao: 1, ano: parseInt(anoStr, 10), categoria: `Ano ${anoStr}` })) })
  const medalhas: PremiacaoItem[] = []
  if (rankings.geral.length > 1) medalhas.push(processarPremiacaoItem(rankings.geral[1], 'medalha', { posicao: 2, categoria: 'Geral' }))
  if (rankings.geral.length > 2) medalhas.push(processarPremiacaoItem(rankings.geral[2], 'medalha', { posicao: 3, categoria: 'Geral' }))
  Object.entries(rankings.porCategoria).forEach(([categoria, ranking]) => {
    if (ranking.length > 1) medalhas.push(processarPremiacaoItem(ranking[1], 'medalha', { posicao: 2, categoria }))
    if (ranking.length > 2) medalhas.push(processarPremiacaoItem(ranking[2], 'medalha', { posicao: 3, categoria }))
  })
  Object.entries(rankings.porAno).forEach(([anoStr, ranking]) => {
    const ano = parseInt(anoStr, 10)
    if (ranking.length > 1) medalhas.push(processarPremiacaoItem(ranking[1], 'medalha', { posicao: 2, ano, categoria: `Ano ${ano}` }))
    if (ranking.length > 2) medalhas.push(processarPremiacaoItem(ranking[2], 'medalha', { posicao: 3, ano, categoria: `Ano ${ano}` }))
  })
  const totalCoroas = coroas.length
  const totalTrofeus = trofeus.length
  const totalMedalhas = medalhas.length
  const totalPremiacoes = totalCoroas + totalTrofeus + totalMedalhas
  const campeaoGeral = identificarCampeaoGeral(deputados)
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

export function identificarCampeaoGeral(
  deputados: DeputadoProcessado[]
): PremiacoesProcessadas['campeaoGeral'] | undefined {
  if (deputados.length === 0) return undefined
  const campeao = [...deputados].sort((a, b) => b.totalGastos - a.totalGastos)[0]
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


