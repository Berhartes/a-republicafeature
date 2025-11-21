export interface DeputadoBase {
    id: string | number;
    nomeEleitoral: string;
    nome?: string;
    siglaPartido: string;
    siglaUf: string;
    email?: string | null;
    urlFoto?: string | null;
    uri?: string | null;
    legislatura?: number | null;
}
export interface DeputadoResumo extends DeputadoBase {
    totalDespesas: number;
    numeroDespesas: number;
    fornecedoresIdentificados?: number;
}
export interface DeputadoCacheItem extends DeputadoResumo {
    nomeCivil?: string | null;
    gastosPorAno?: Record<number, number>;
    transacoesPorAno?: Record<number, number>;
    topCategorias?: Array<{
        categoria: string;
        valor: number;
        percentual?: number;
    }>;
    topFornecedores?: Array<{
        fornecedor: string;
        valor: number;
        transacoes?: number;
    }>;
    totalTransacoesDetalhadas?: number;
    dadosCompletos?: boolean;
}
export interface DespesaDetalhada {
    ano: number;
    mes: number;
    tipoDespesa: string;
    valorDocumento: number | null;
    valorLiquido: number | null;
    nomeFornecedor: string;
    cnpjCpfFornecedor?: string | null;
    dataDocumento?: string | null;
    numDocumento?: string | null;
    urlDocumento?: string | null;
    valorGlosa?: number | null;
    numRessarcimento?: string | null;
    codDocumento?: number | null;
    tipoDocumento?: string | null;
    codTipoDocumento?: number | null;
    codLote?: number | null;
    parcela?: number | null;
}
export interface DeputadoDetalhado {
    metadata: {
        legislador: {
            id: number;
            nome: string;
            nomeEleitoral?: string;
            uri?: string;
            urlFoto?: string;
            email?: string;
            siglaPartido?: string;
            siglaUf?: string;
            totalDespesas?: number;
            numeroDespesas?: number;
            legislatura?: number;
        };
        generatedAt: string;
        legisladorDetalhes?: Record<string, unknown>;
    };
    anos: number[];
    despesas: DespesaDetalhada[];
}
export interface DeputadoPerfil {
    resumo: DeputadoResumo;
    detalhes: DeputadoDetalhado;
}
