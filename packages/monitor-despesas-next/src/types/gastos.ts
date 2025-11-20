import type {
  DistribuicoesLegado,
  DistribuicoesUltraCompactas,
  FornecedorTimelineEntry,
  LegacyRecebimentoPorMes,
  PerfilFornecedorMetadados,
  RelacionamentoDeputadosCompacto
} from '@/lib/fornecedor-utils'

export interface GastoParlamentar {
  txNomeParlamentar: string
  cpf: string | null
  ideCadastro: string | null
  nuCarteiraParlamentar: string | null
  nuLegislatura: number
  sgUF: string
  sgPartido: string | null
  codLegislatura: number
  numSubCota: number
  txtDescricao: string
  numEspecificacaoSubCota: number
  txtDescricaoEspecificacao: string | null
  nomeFornecedor: string
  cnpjCpfFornecedor: string
  txtNumero: number
  indTipoDocumento: number
  datEmissao: string
  vlrDocumento: number
  vlrGlosa: number
  vlrLiquido: number
  numMes: number
  numAno: number
  numParcela: number
  txtPassageiro: string | null
  txtTrecho: string | null
  numLote: number
  numRessarcimento: string | null
  datPagamentoRestituicao: string | null
  vlrRestituicao: string | null
  nuDeputadoId: number // Este parece ser o ID do deputado no GastoParlamentar original
  ideDocumento: number
  urlDocumento: string
}

export interface AlertaSuspeito {
  id: string // ID do alerta
  tipo: 'SUPERFATURAMENTO' | 'LIMITE_EXCEDIDO' | 'FORNECEDOR_SUSPEITO' | 'CONCENTRACAO_TEMPORAL' | 'VALOR_REPETIDO' | 'FORNECEDOR_SUSPEITO_CONTRATADO'
  gravidade: 'ALTA' | 'MEDIA' | 'BAIXA'
  deputado: string // Nome do deputado
  deputadoId?: string | number // ID do deputado associado ao alerta
  descricao: string
  valor: number
  detalhes: Record<string, any>
  dataDeteccao: Date // Data que o alerta foi detectado/gerado
}

export interface FornecedorSuspeito {
  cnpj: string
  nome: string
  totalRecebido: number
  numTransacoes: number
  deputadosAtendidos: number // Contagem de deputados únicos
  deputadosNomes?: string[] // Array com nomes dos deputados
  mediaTransacao: number
  indiceSuspeicao: number
  alertas: string[] // Tipos de alertas associados a este fornecedor
  razoesSuspeita?: string[] // Alias para alertas ou descrições mais detalhadas
  categorias?: string[] // Categorias de despesas atendidas
  relacionamentoMonogamico?: {
    temRelacionamento: boolean
    criterioAtendido: '4_meses_consecutivos' | '8_meses_ano' | 'ambos' | 'nenhum'
    deputadoExclusivo?: string
    periodoMaisLongo?: string // ex: "2023-01 a 2023-06"
    mesesConsecutivos?: number
    resumoAnalise?: string
  }
}

export interface AnaliseDeputado {
  id: string | number // Adicionar ID do deputado para navegação
  nome: string
  partido: string
  uf: string
  totalGasto: number
  numTransacoes: number
  gastoMedio: number
  maioresCategorias: {
    categoria: string
    valor: number
    percentual: number
  }[]
  alertas: AlertaSuspeito[] // Lista de alertas associados a este deputado
  scoreSuspeicao: number
}

export interface GastoDeputado {
  id?: string | number // ID do deputado para navegação
  nomeEleitoral: string
  nomeCivil?: string
  siglaPartido: string
  siglaUf: string
  totalGasto: number
  gastos: {
    data: string
    valor: number
    categoria: string
    fornecedor: string
    cnpj?: string
  }[]
  urlFoto?: string
  situacao?: string
  condicaoEleitoral?: string
  scoreSuspeicao?: number
  alertas?: string[]
  numTransacoes?: number
  foto?: string
  rankingAnual?: number
  ranking?: number
  detalhesCarregados?: boolean
}

export interface TransacaoSuspeita {
  id: string
  valor: number
  data: string
  fornecedor: string
  categoria: string
}

export interface RelatorioAnalise {
  dataAnalise: Date
  periodoAnalisado: {
    inicio: Date
    fim: Date
  }
  totalRegistros: number
  totalGasto: number
  numDeputados: number // Número de deputados na análise
  alertasGerados: number // Total de alertas gerados
  deputadosSuspeitos: AnaliseDeputado[] // Lista de deputados com análise detalhada
  fornecedoresSuspeitos: FornecedorSuspeito[] // Lista de fornecedores suspeitos
  padroesSuspeitos: {
    tipo: string
    ocorrencias: number
    descricao: string
  }[]
}

export interface FornecedorStats {
  cnpj: string
  cnpjCpf?: string // Alias para compatibilidade
  nome: string

  totalRecebido?: number // Campo do pacote: totalRecebidoTodos
  totalTransacionado: number // Mantido para compatibilidade legacy
  numeroTransacoes?: number // Campo do pacote: numeroTotalTransacoes
  transacoes: number // Mantido para compatibilidade legacy
  totalTransacoes?: number // Alias usado pela camada de UI legacy
  totalTransacoesDetalhadas?: number

  scoreSuspeicao: number
  deputadosAtendidos: Array<string | number | { id: string; nomeEleitoral?: string; siglaPartido?: string; siglaUf?: string }>
  numeroDeputadosAtendidos?: number // Campo do pacote: numeroDeputadosRelacionados
  categorias: string[]

  categoriaRisco?: string
  alertas?: string[]

  timeline?: FornecedorTimelineEntry[]
  recebimentoPorMes?: LegacyRecebimentoPorMes
  relacionamentoDeputados?: RelacionamentoDeputadosCompacto
  dist?: DistribuicoesUltraCompactas | null
  distribuicoes?: DistribuicoesLegado | null
  metadados?: PerfilFornecedorMetadados

  lastUpdated?: string
  classificacaoLavaJato?: 'SUSPEITO' | 'REGULAR' | 'LIMPO'
  concentracaoRisco?: number
  concentracao?: 'baixo' | 'medio' | 'alto'
  valorMedioTransacao?: number
}

export interface DespesaDetalhada {
  id?: string | number
  valorLiquido: number | string
  tipoDespesa?: string
  categoria?: string
  nomeFornecedor?: string
  cnpjCpfFornecedor?: string
  dataEmissao?: string
  numeroDocumento?: string
  descricao?: string
  valorDocumento?: number
  valorGlosa?: number
  mes?: number
  ano?: number
}

export interface BuscarFornecedoresOptions {
  ano?: number | 'todos'
  mes?: string | 'todos'
  offset?: number
  limite?: number
  apenasComScore?: boolean
  scoreMinimo?: number
  categoria?: string
  deputadoId?: string
  ordenacao?: 'valor' | 'score' | 'nome'
  direcao?: 'asc' | 'desc'
  uf?: string
}

export interface FornecedoresResponse {
  fornecedores: FornecedorStats[]
  total: number
  hasMore: boolean
  offset: number
  limit: number
  estatisticas?: { total: number; volume: number; transacoes: number } | Record<string, any>
  dataSource?:
    | ''
    | 'simulated'
    | 'hybrid'
    | 'cached-real'
    | 'file-real'
    | '-real'
    | 'simulated-fallback'
    | 'cached-indexeddb'
    | 'cache-unavailable'
    | 'cached-multilevel'
    | 'cache-error' // Fonte dos dados
  success?: boolean
  data?: FornecedorStats[]
  source?: string
  etlVersion?: string
  message?: string
}
