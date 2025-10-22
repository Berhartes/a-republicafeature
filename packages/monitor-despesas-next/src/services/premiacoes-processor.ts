export interface PremiacaoResumo {
  tipo: 'coroa' | 'trofeu' | 'medalha'
  subtipo: 'geral' | 'categoria'
  categoria?: string
  ano?: number
  posicao?: number
  valor?: number
  emoji: string
  descricao: string
  cor: string
}

export interface PremiacoesDeputado {
  deputadoId: string
  deputadoNome: string
  totalPremiacoes: number
  valorTotalPremiacoes: number
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

export class PremiacoesProcessor {
  private premiacoes: Map<string, PremiacoesDeputado> = new Map()

  setPremiacoes(deputadoId: string, premiacoes: PremiacoesDeputado): void {
    this.premiacoes.set(deputadoId, premiacoes)
  }

  getPremiacoes(deputadoId: string): PremiacoesDeputado | undefined {
    return this.premiacoes.get(deputadoId)
  }

  getAllPremiacoes(): PremiacoesDeputado[] {
    return Array.from(this.premiacoes.values())
  }

  limparPremiacoes(): void {
    this.premiacoes.clear()
  }

  calcularTotais(): {
    totalCoroas: number
    totalTrofeus: number
    totalMedalhas: number
  } {
    const all = this.getAllPremiacoes()
    return {
      totalCoroas: all.reduce((acc, p) => acc + p.estatisticas.totalCoroas, 0),
      totalTrofeus: all.reduce((acc, p) => acc + p.estatisticas.totalTrofeus, 0),
      totalMedalhas: all.reduce((acc, p) => acc + p.estatisticas.totalMedalhas, 0)
    }
  }
}

export const premiacoesProcessor = new PremiacoesProcessor()
