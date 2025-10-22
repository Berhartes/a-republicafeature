import { premiacoesProcessor } from '@/services/premiacoes-processor'
import type { PremiacoesGlobais, PremiacaoResumo } from '@/services/premiacoes-global-cache'

export interface PremiacoesDeputado {
  deputadoId: string
  deputadoNome: string
  totalPremiacoes: number
  valorTotalPremiacoes: number
  quantidadeTransacoes?: number
  coroas: PremiacaoResumo[]
  trofeus: PremiacaoResumo[]
  medalhas: PremiacaoResumo[]
  estatisticas: {
    totalCoroas: number
    totalTrofeus: number
    totalMedalhas: number
  }
  ultimaAtualizacao: Date
}

export interface PremiacaoVisual {
  tipo: 'coroa' | 'trofeu' | 'medalha'
  subtipo: 'geral' | 'categoria'
  emoji: string
  descricao: string
  categoria?: string
  ano?: number
  valor: number
  posicao?: number
  cor: string
}

export interface PremiacaoAgrupada {
  tipo: 'coroa' | 'trofeu' | 'medalha'
  descricao: string
  categoria?: string
  emoji: string
  quantidade: number
  melhorPosicao: number
  cor: string
  premiacoes: PremiacaoVisual[]
  numeroAlto?: string
}

function formatarNomeDeputado(defaultNome: string | undefined, deputadoId: string): string {
  if (defaultNome && defaultNome.trim().length > 0) {
    return defaultNome
  }
  return `Deputado ${deputadoId}`
}

function somarValores(premiacoes: PremiacaoResumo[]): number {
  return premiacoes.reduce((total, premiacao) => total + (premiacao.valor || 0), 0)
}

function inferirNome(deputadoId: string, premiacoes: PremiacoesGlobais): string {
  const fonte = premiacoes.coroas.find(item => item.deputadoId === deputadoId)
    || premiacoes.trofeus.find(item => item.deputadoId === deputadoId)
    || premiacoes.medalhas.find(item => item.deputadoId === deputadoId)

  return formatarNomeDeputado(fonte?.deputadoNome, deputadoId)
}

function obterEmojiParaTipo(tipo: 'coroa' | 'trofeu' | 'medalha', posicao?: number): string {
  if (tipo === 'coroa') return '👑'
  if (tipo === 'trofeu') return '🏆'
  if (tipo === 'medalha') {
    if (posicao === 1) return '🥇'
    if (posicao === 2) return '🥈'
    if (posicao === 3) return '🥉'
    return '🎖️'
  }
  return '⭐'
}

function obterCorParaTipo(tipo: 'coroa' | 'trofeu' | 'medalha', subtipo: 'geral' | 'categoria', posicao?: number): string {
  if (tipo === 'coroa') {
    return subtipo === 'geral'
      ? 'from-pink-500 to-purple-600'
      : 'from-blue-500 to-indigo-600'
  }

  if (tipo === 'trofeu') {
    return subtipo === 'geral'
      ? 'from-yellow-500 to-amber-600'
      : 'from-blue-500 to-blue-700'
  }

  if (tipo === 'medalha') {
    if (posicao === 2) return 'from-slate-400 to-slate-600'
    if (posicao === 3) return 'from-amber-600 to-orange-700'
    return 'from-purple-500 to-purple-700'
  }

  return 'from-gray-500 to-gray-700'
}

function construirDescricao(tipo: 'coroa' | 'trofeu' | 'medalha', premiacao: PremiacaoResumo): string {
  const base = tipo === 'coroa'
    ? premiacao.tipo === 'geral' ? 'Campeão Geral Histórico' : `Campeão da categoria ${premiacao.categoria}`
    : tipo === 'trofeu'
      ? premiacao.tipo === 'geral'
        ? `Campeão Geral ${premiacao.ano ?? ''}`.trim()
        : `Campeão ${premiacao.categoria} ${premiacao.ano ?? ''}`.trim()
      : premiacao.posicao
        ? `${premiacao.posicao}º lugar ${premiacao.tipo === 'geral' ? 'Geral' : `da categoria ${premiacao.categoria ?? ''}`}`.trim()
        : 'Medalha de mérito'

  return base
}

function toVisual(tipo: 'coroa' | 'trofeu' | 'medalha', premiacao: PremiacaoResumo): PremiacaoVisual {
  const subtipo: 'geral' | 'categoria' = premiacao.tipo
  const descricao = construirDescricao(tipo, premiacao)
  const emoji = obterEmojiParaTipo(tipo, premiacao.posicao)
  const cor = obterCorParaTipo(tipo, subtipo, premiacao.posicao)

  return {
    tipo,
    subtipo,
    emoji,
    descricao,
    categoria: premiacao.categoria,
    ano: premiacao.ano,
    valor: premiacao.valor,
    posicao: premiacao.posicao,
    cor
  }
}

export const deputadoPremiacaoUnificado = {
  async buscarPremiacoesDeputado(deputadoId: string): Promise<PremiacoesDeputado> {
    if (!deputadoId) {
      throw new Error('ID do deputado é obrigatório para buscar premiações')
    }

    const processed = await premiacoesProcessor.processarPremiacoes()
    const { premiacoes, rankings } = processed

    const coroas = premiacoes.coroas.filter(item => item.deputadoId === deputadoId)
    const trofeus = premiacoes.trofeus.filter(item => item.deputadoId === deputadoId)
    const medalhas = premiacoes.medalhas.filter(item => item.deputadoId === deputadoId)

    const rankingGeral = rankings.geral.find(item => item.id === deputadoId)
    const deputadoNome = inferirNome(deputadoId, premiacoes)

    const totalPremiacoes = coroas.length + trofeus.length + medalhas.length
    const valorTotalPremiacoes = somarValores(coroas) + somarValores(trofeus) + somarValores(medalhas)

    return {
      deputadoId,
      deputadoNome,
      totalPremiacoes,
      valorTotalPremiacoes,
      quantidadeTransacoes: rankingGeral?.totalTransacoes,
      coroas,
      trofeus,
      medalhas,
      estatisticas: {
        totalCoroas: coroas.length,
        totalTrofeus: trofeus.length,
        totalMedalhas: medalhas.length
      },
      ultimaAtualizacao: new Date(premiacoes.ultimaAtualizacao)
    }
  },

  converterPremiacoesParaVisuais(premiacoes: PremiacoesDeputado): PremiacaoVisual[] {
    const visuais: PremiacaoVisual[] = []

  for (const premiacao of premiacoes.coroas) {
      visuais.push(toVisual('coroa', premiacao))
    }

    for (const premiacao of premiacoes.trofeus) {
      visuais.push(toVisual('trofeu', premiacao))
    }

    for (const premiacao of premiacoes.medalhas) {
      visuais.push(toVisual('medalha', premiacao))
    }

    return visuais.sort((a, b) => b.valor - a.valor)
  },

  converterPremiacoesAgrupadas(premiacoes: PremiacoesDeputado): PremiacaoAgrupada[] {
    const agrupamento = new Map<string, PremiacaoAgrupada>()

    const adicionar = (visual: PremiacaoVisual) => {
      const chave = `${visual.tipo}-${visual.subtipo}-${visual.categoria ?? 'geral'}-${visual.ano ?? 'hist'}`
      if (!agrupamento.has(chave)) {
        agrupamento.set(chave, {
          tipo: visual.tipo,
          descricao: visual.descricao,
          categoria: visual.categoria,
          emoji: visual.emoji,
          quantidade: 0,
          melhorPosicao: visual.posicao ?? 1,
          cor: visual.cor,
          premiacoes: [],
          numeroAlto: undefined
        })
      }

      const grupo = agrupamento.get(chave)!
      grupo.quantidade += 1
      grupo.premiacoes.push(visual)
      if ((visual.posicao ?? 4) < grupo.melhorPosicao) {
        grupo.melhorPosicao = visual.posicao ?? grupo.melhorPosicao
      }
      if (grupo.quantidade > 1) {
        grupo.numeroAlto = String(grupo.quantidade)
      }
    }

    const visuais = this.converterPremiacoesParaVisuais(premiacoes)
    visuais.forEach(adicionar)

    return Array.from(agrupamento.values()).sort((a, b) => b.quantidade - a.quantidade)
  },

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }
}

export default deputadoPremiacaoUnificado
