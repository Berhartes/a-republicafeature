
export interface Deputy {
  id: string
  nome: string
  partido: string
  uf: string
  situacao: 'Exercício' | 'Licença' | 'Afastado'
  email?: string
  telefone?: string
  foto?: string
  
  gabinete?: string
  anexo?: string
  predio?: string
  sala?: string
  
  createdAt: Date
  updatedAt: Date
}

export interface DeputyExpenses {
  deputyId: string
  ano: number
  mes: number
  totalGasto: number
  totalTransacoes: number
  
  categorias: {
    [categoria: string]: {
      valor: number
      transacoes: number
      percentual: number
    }
  }
  
  topFornecedores: Array<{
    cnpj: string
    nome: string
    valor: number
    transacoes: number
    percentual: number
  }>
}

export interface DeputyRanking {
  deputyId: string
  nome: string
  partido: string
  uf: string
  
  posicaoGeral: number
  posicaoPartido: number
  posicaoUF: number
  
  totalGasto: number
  mediaGasto: number
  transacoes: number
  
  riskScore: number
  sustainabilityScore: number
  transparencyScore: number
  
  tendencia: 'crescente' | 'estavel' | 'decrescente'
  variacao: number // percentual
}

export interface DeputyComparison {
  deputies: Deputy[]
  period: {
    inicio: Date
    fim: Date
  }
  
  expenses: {
    [deputyId: string]: {
      total: number
      media: number
      mediana: number
      transacoes: number
    }
  }
  
  categoriesComparison: {
    [categoria: string]: {
      [deputyId: string]: {
        valor: number
        percentual: number
        ranking: number
      }
    }
  }
  
  insights: Array<{
    type: 'outlier' | 'pattern' | 'trend'
    deputyId: string
    message: string
    severity: 'low' | 'medium' | 'high'
    data: any
  }>
}

export interface DeputySuspiciousPattern {
  deputyId: string
  patternId: string
  type: 'valor_alto' | 'concentracao_fornecedor' | 'sazonalidade' | 'categoria_suspeita'
  description: string
  severity: 'baixa' | 'media' | 'alta' | 'critica'
  
  pattern: {
    detected: Date
    period: {
      inicio: Date
      fim: Date
    }
    value: number
    threshold: number
    evidence: any[]
  }
  
  status: 'novo' | 'investigando' | 'descartado' | 'confirmado'
  investigatedBy?: string
  investigatedAt?: Date
  notes?: string
}

export interface DeputyListRequest {
  page?: number
  limit?: number
  partido?: string
  uf?: string
  situacao?: string
  search?: string
  orderBy?: 'nome' | 'partido' | 'uf' | 'gastos'
  order?: 'asc' | 'desc'
}

export interface DeputyExpensesRequest {
  deputyId: string
  ano?: number
  mes?: number
  categoria?: string
  fornecedor?: string
}

export interface DeputyRankingRequest {
  period: 'mensal' | 'anual' | 'custom'
  ano?: number
  mes?: number
  inicio?: Date
  fim?: Date
  metric: 'total' | 'media' | 'risco'
  partido?: string
  uf?: string
  limit?: number
}

export interface DeputyComparisonRequest {
  deputyIds: string[]
  period: {
    inicio: Date
    fim: Date
  }
  metrics?: string[]
  includeInsights?: boolean
}

export interface DeputyStoreState {
  deputies: Deputy[]
  currentDeputy: Deputy | null
  expenses: { [deputyId: string]: DeputyExpenses[] }
  rankings: DeputyRanking[]
  comparisons: DeputyComparison[]
  suspiciousPatterns: DeputySuspiciousPattern[]
  statistics: any | null
  lastFetch: string | null
  
  loading: {
    list: boolean
    profile: boolean
    expenses: boolean
    ranking: boolean
    comparison: boolean
  }
  
  filters: {
    search: string
    partido: string
    uf: string
    situacao: string
    ano: number
    mes: number
  }
  
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  
  errors: {
    list: string | null
    profile: string | null
    expenses: string | null
    ranking: string | null
    comparison: string | null
  }
}

export interface DeputyEvents {
  deputy_selected: { deputyId: string }
  deputy_compared: { deputyIds: string[] }
  expenses_updated: { deputyId: string, period: string }
  pattern_detected: { deputyId: string, pattern: DeputySuspiciousPattern }
  ranking_updated: { period: string, metric: string }
}

export const DEPUTY_CACHE_KEYS = {
  LIST: 'deputies:list',
  PROFILE: (id: string) => `deputies:profile:${id}`,
  EXPENSES: (id: string, year: number, month?: number) => 
    `deputies:expenses:${id}:${year}${month ? `:${month}` : ''}`,
  RANKING: (period: string, metric: string) => `deputies:ranking:${period}:${metric}`,
  COMPARISON: (ids: string[], period: string) => 
    `deputies:comparison:${ids.sort().join(',')}:${period}`,
} as const

export enum DeputyErrorCode {
  DEPUTY_NOT_FOUND = 'DEPUTY_NOT_FOUND',
  EXPENSES_NOT_FOUND = 'EXPENSES_NOT_FOUND',
  INVALID_PERIOD = 'INVALID_PERIOD',
  COMPARISON_LIMIT_EXCEEDED = 'COMPARISON_LIMIT_EXCEEDED',
  RANKING_ERROR = 'RANKING_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}