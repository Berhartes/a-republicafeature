
export interface CategoryData {
  categoria: string
  valor: number
  percentual: string
  count?: number // Fornecedores: número de entidades na categoria
  cor?: string   // Cor pré-calculada para otimização
}

export interface RecordistaData {
  nome: string
  valor: number
  partido?: string
  uf?: string
  nomeEleitoral?: string
  siglaPartido?: string
  siglaUf?: string
}

export interface ReferenceData {
  media?: number
  maximo?: number
  recordista?: RecordistaData
}

export interface LegendLabels {
  primary: string
  reference: string
  maximum: string
}

export interface CategoryDistributionChartProps {
  data: CategoryData[]
  loading: boolean
  
  context: 'fornecedores-page' | 'perfil-deputado'
  
  title?: string
  description?: string
  className?: string
  
  showPieChart?: boolean
  onTogglePieChart?: (show: boolean) => void
  maxHeight?: number
  showScrollIndicator?: boolean
  
  referenceData?: Record<string, ReferenceData>
  
  onCategoryClick?: (categoria: string) => void
  categoryUrlResolver?: (categoria: string) => string
  
  countLabel?: string // "fornecedores" | "transações"
  showAverage?: boolean
  showCount?: boolean
  showComparison?: boolean
  
  legendLabels?: LegendLabels
  
  emptyMessage?: string
  loadingMessage?: string
}

export interface CategoryBarItemProps {
  item: CategoryData
  index: number
  context: 'fornecedores-page' | 'perfil-deputado'
  referenceData?: ReferenceData
  showPieChart: boolean
  onCategoryClick?: (categoria: string) => void
  categoryUrlResolver?: (categoria: string) => string
  countLabel?: string
  showComparison?: boolean
  allData: CategoryData[] // Para cálculos de referência
}

export interface CategoryPieChartProps {
  data: CategoryData[]
  height?: number
}

export interface CategoryLegendProps {
  context: 'fornecedores-page' | 'perfil-deputado'
  labels: LegendLabels
  showPieChart: boolean
  maxHeight?: number
}

export const DEFAULT_CONTEXTS = {
  'fornecedores-page': {
    countLabel: 'fornecedores',
    showCount: true,
    showAverage: true,
    showComparison: false,
    legendLabels: {
      primary: 'Volume da Categoria',
      reference: 'Média por Fornecedor',
      maximum: 'Maior Volume'
    }
  },
  'perfil-deputado': {
    countLabel: 'transações',
    showCount: false,
    showAverage: true,
    showComparison: true,
    legendLabels: {
      primary: 'Gastos do Deputado',
      reference: 'Média dos Deputados',
      maximum: 'Recordista da Categoria'
    }
  }
} as const

export type ContextType = keyof typeof DEFAULT_CONTEXTS