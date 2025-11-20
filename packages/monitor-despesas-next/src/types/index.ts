export * from './gastos'

// Page Audit Feature Types
// DESABILITADO: page-audit não existe mais
// export * from '../features/page-audit/types'

export interface Configuracoes {
  notificacoes: boolean
  alertasAutomaticos: boolean
  temaEscuro: boolean
  idiomaPortugues: boolean
  exportarComGraficos: boolean
  salvarNuvem: boolean
  analiseTempReal: boolean
  limitesPersonalizados: boolean
}

export interface LimitesAnalise {
  limiteMensal: number
  limiteCombustivel: number
  limiteAbastecimento: number
  minDeputadosFornecedor: number
}

export interface ResultadoBusca {
  tipo: 'deputado' | 'fornecedor' | 'alerta' | 'documento'
  titulo: string
  descricao: string
  valor?: number
  gravidade?: 'alta' | 'media' | 'baixa'
  onClick: () => void
}

export interface EstadoAplicacao {
  paginaAtual: string
  dadosCarregados: boolean
  analisandoArquivo: boolean
  progresso?: number
}

export interface NotificacaoToast {
  id: string
  tipo: 'success' | 'error' | 'warning' | 'info'
  titulo: string
  descricao?: string
  duracao?: number
}

export interface DadosExportacao {
  configuracoes: Configuracoes
  limites: LimitesAnalise
  analises: any
  dataExportacao: string
}
