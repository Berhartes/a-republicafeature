export interface Deputado {
    id: string
    nome: string
    partido: string
    uf: string
    totalDespesas: number
    numeroDespesas: number
    fornecedoresIdentificados?: number
    posicao?: number
    porAno?: {
        [ano: string]: number
    }
}

export interface PremiacoesData {
    rankingsFiltrados: Deputado[]
    estatisticas: {
        totalDeputados: number
        campeao: string
        maiorGasto: number
    }
    metadata: {
        anosDisponiveis: number[]
        categoriasDisponiveis: string[]
        ufsDisponiveis: string[]
        lastUpdate: string
        totalPremiacoes?: number
    }
    premiacoes?: {
        coroas?: Array<any>
        trofeus?: Array<any>
        medalhas?: Array<any>
    }
}


