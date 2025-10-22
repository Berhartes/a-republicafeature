
export interface EtlDeputadoBasico {
  id: string
  nome: string
  nomeEleitoral: string
  nomeCivil: string
  siglaPartido: string
  siglaUf: string
  urlFoto: string
  idLegislatura: number
  totalAnos: number
  anosDisponiveis: number[]
  ultimaAtualizacao: string
  totalGastosTodos: number
  numeroTotalDespesas: number
  anoMaiorGasto: number
  valorMaiorGasto: number
}

export interface EtlDeputadoArquivo {
  basePath: string
  docId: string
  timestamp: string
  data: EtlDeputadoBasico
}

export interface EtlDeputadoAno {
  ano: number
  totalGasto: number
  numeroTransacoes: number
  despesas: EtlDespesa[]
  categorias: Record<string, EtlCategoriaAno>
  fornecedores: Record<string, EtlFornecedorAno>
  estatisticas: EtlEstatisticasAno
}

export interface EtlDespesa {
  id: string
  data: string
  categoria: string
  fornecedor: string
  cnpjFornecedor?: string
  valor: number
  descricao: string
  documento?: string
  tipoDocumento?: string
}

export interface EtlCategoriaAno {
  nome: string
  total: number
  transacoes: number
  percentual: number
  media: number
  fornecedoresMaisUsados: string[]
}

export interface EtlFornecedorAno {
  nome: string
  cnpj?: string
  total: number
  transacoes: number
  categorias: string[]
  ultimaTransacao: string
}

export interface EtlEstatisticasAno {
  ano: number
  totalGasto: number
  numeroTransacoes: number
  mediaTransacao: number
  mediana: number
  maiorTransacao: number
  menorTransacao: number
  categoriaComMaisGasto: string
  fornecedorComMaisGasto: string
  mesComMaisGasto: string
  trimestre: Record<string, number>
  evolucaoMensal: Record<string, number>
}

export interface DeputadoProcessado {
  id: string
  nomeEleitoral: string
  nomeCivil?: string
  siglaPartido: string
  siglaUf: string
  foto: string

  totalGastos: number
  totalTransacoes: number
  mediaTransacao: number

  gastosPorAno: Record<number, number>
  transacoesPorAno: Record<number, number>

  topCategorias: Array<{ categoria: string; valor: number; percentual: number }>
  topFornecedores: Array<{ fornecedor: string; valor: number; transacoes: number }>

  scoreSuspeicao: number
  classificacaoRisco: 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
  alertas: string[]

  ultimaAtualizacao: string
  anosDisponiveis: number[]
  dadosCompletos: boolean
}

export interface RankingDeputados {
  geral: DeputadoProcessado[]
  porCategoria: Record<string, DeputadoProcessado[]>
  porAno: Record<number, DeputadoProcessado[]>
  estatisticas: {
    totalDeputados: number
    totalGastos: number
    mediaGastos: number
    medianaGastos: number
  }
}

export interface PremiacoesProcessadas {
  coroas: Array<{
    deputadoId?: string
    titulo: string
    descricao: string
    categoria: string
    valor: number
  }>
  trofeus: Array<{
    deputadoId?: string
    titulo: string
    descricao: string
    categoria: string
    valor: number
  }>
  medalhas: Array<{
    deputadoId?: string
    titulo: string
    descricao: string
    categoria: string
    valor: number
  }>
  campeaoGeral?: {
    deputadoId?: string
    nome?: string
    nomeEleitoral?: string
    siglaPartido?: string
    siglaUf?: string
    valorTotal?: number
    id?: string
  }
  estatisticas: {
    totalCoroas: number
    totalTrofeus: number
    totalMedalhas: number
    totalPremiacoes: number
  }
}

export interface EtlCacheConfig {
  basePath: string
  maxAge: number // em minutos
  autoRefresh: boolean
  fallbackToLocalStorage: boolean
}

export interface EtlCacheStatus {
  connected: boolean
  lastUpdate: Date | null
  totalDeputados: number
  anosDisponiveis: number[]
  source: 'etl' | 'localStorage' | 'none'
  dataAge: string
}

export interface EtlSearchResult {
  deputados: DeputadoProcessado[]
  total: number
  source: string
  cached: boolean
  timestamp: Date
}