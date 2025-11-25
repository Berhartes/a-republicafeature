export type TimestampLike = {
    toDate?: () => Date
    seconds?: number
    nanoseconds?: number
} | null | undefined

export type FornecedorTimelineEntry = readonly [string, number, number?]

export interface LegacyRecebimentoEntry {
    valor?: number | string | null
    transacoes?: number | string | null
    quantidade?: number | string | null
}

export type LegacyRecebimentoPorMes = Record<string, LegacyRecebimentoEntry | number | null | undefined>

export interface RelacionamentoDeputadoResumo {
    deputadoId?: string
    id?: string | number
    nome?: string
    estado?: string
    partido?: string
    valor?: number
    valorTotal?: number
    numeroTransacoes?: number
    timeline?: { inicio?: string; fim?: string } | null
}

export interface RelacionamentoDeputadosCompacto {
    quantidade?: number | null
    principais?: RelacionamentoDeputadoResumo[]
    completa?: RelacionamentoDeputadoResumo[]
}

export interface DistribuicoesUltraCompactas {
    uf?: Record<string, [number | undefined, number | undefined]>
    cat?: Record<string, [number | undefined, number | undefined, number | undefined]>
    part?: Record<string, [number | undefined, number | undefined, number | undefined]>
}

export interface DistribuicoesLegadoDetalhes {
    valor?: number | null
    transacoes?: number | null
    deputados?: number | null
}

export interface DistribuicoesLegado {
    porUF?: {
        disponibilidade?: string[]
        detalhes?: Record<string, DistribuicoesLegadoDetalhes | undefined>
    }
    porCategoria?: {
        disponibilidade?: string[]
        detalhes?: Record<string, DistribuicoesLegadoDetalhes | undefined>
    }
    porPartido?: {
        disponibilidade?: string[]
        detalhes?: Record<string, DistribuicoesLegadoDetalhes | undefined>
    }
}

export interface PerfilFornecedorCompleto {
    identificacao?: {
        cnpj?: string
        nome?: string
        categoriaPrincipal?: string
        nomeFantasia?: string
        razaoSocial?: string
    }
    nome?: string
    cnpj?: string
    cnpjCpf?: string
    categoriasPrincipais?: Array<{ categoria?: string; valor?: number }>
    deputadosClientes?: Array<{
        nome?: string
        valor?: number
        id?: number | string
        deputadoId?: string
        partido?: string
        estado?: string
    }>
    timeline?: FornecedorTimelineEntry[]
    recebimentoPorMes?: LegacyRecebimentoPorMes
    relacionamentoDeputados?: RelacionamentoDeputadosCompacto
    numeroDeputadosRelacionados?: number | null
    dist?: DistribuicoesUltraCompactas | null
    distribuicoes?: DistribuicoesLegado | null
    metadados?: {
        periodos?: string | null
        periodosAtivos?: Record<string, string[]>
        proc?: {
            ts?: TimestampLike | string | number | null
            v?: string | null
        }
        processamento?: {
            timestamp?: string | null
            versao?: string | null
            [key: string]: unknown
        }
        [key: string]: unknown
    } | null
    [key: string]: unknown
}

export type PerfilFornecedorMetadados = NonNullable<PerfilFornecedorCompleto['metadados']>


