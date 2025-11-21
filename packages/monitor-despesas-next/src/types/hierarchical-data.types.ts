
import type {
  DeputadoMonitorDados,
  DespesasAnuaisDeputado,
  FornecedorMonitorDados,
  TransacoesAnuaisFornecedor
} from '@a-republica/monitordespesas-schema'
import type {
  DistribuicoesLegado,
  DistribuicoesUltraCompactas,
  FornecedorTimelineEntry,
  LegacyRecebimentoPorMes,
  PerfilFornecedorMetadados,
  RelacionamentoDeputadosCompacto
} from '@/lib/fornecedor-utils'
// DESABILITADO: global-fornecedores-processor não existe mais
// import { ProcessedFornecedoresData } from '@/services/global-fornecedores-processor'

// Tipo fallback para ProcessedFornecedoresData
export type ProcessedFornecedoresData = Record<string, any>


export interface BaseHierarchicalEntity { id: string }
export interface BaseAnnualData { ano: number }


export type DeputadoHierarchicalData = DeputadoMonitorDados & {
  categoriasPrincipais?: Array<{ categoria: string; valor: number; percentual: number }>
  topFornecedores?: DespesasAnuaisDeputado['topFornecedores']
}

export type DeputadoAnnualData = DespesasAnuaisDeputado


export type FornecedorHierarchicalData = FornecedorMonitorDados & {
  deputadosAtendidos?: string[]
  categorias?: string[]
  scoreSuspeicao?: number
  alertas?: string[]
  relacionamentoMonogamico?: {
    temRelacionamento: boolean
    criterioAtendido: '4_meses_consecutivos' | '8_meses_ano' | 'ambos' | 'nenhum'
    deputadoExclusivo?: string
    periodoMaisLongo?: string
    mesesConsecutivos?: number
    resumoAnalise?: string
  }
  timeline?: FornecedorTimelineEntry[]
  recebimentoPorMes?: LegacyRecebimentoPorMes
  relacionamentoDeputados?: RelacionamentoDeputadosCompacto
  dist?: DistribuicoesUltraCompactas
  distribuicoes?: DistribuicoesLegado
  metadados?: PerfilFornecedorMetadados
}

export type FornecedorAnnualData = TransacoesAnuaisFornecedor


export interface HierarchicalCacheData extends ProcessedFornecedoresData {

  deputadosHierarchicos?: {
    [deputadoId: string]: {
      dadosBasicos: DeputadoHierarchicalData
      anosDisponiveis: number[]
      dadosAnuais?: {
        [ano: string]: DeputadoAnnualData
      }
    }
  }

  fornecedoresHierarchicos?: {
    [cnpjCpf: string]: {
      dadosBasicos: FornecedorHierarchicalData
      anosDisponiveis: number[]
      dadosAnuais?: {
        [ano: string]: FornecedorAnnualData
      }
    }
  }

  hierarchicalMetadata?: {
    structureVersion: string
    isHierarchicalCache: true
    totalDeputados: number
    totalFornecedores: number
    anosAbrangidos: number[]
    lastHierarchicalSync: string
  }
}


export interface HierarchicalProcessingOptions {
  forceRefresh?: boolean
  progressCallback?: (progress: { percent: number; message: string; stage: string }) => void

  entidadesTipo?: 'deputados' | 'fornecedores' | 'ambos'
  entidadesIds?: string[] // IDs específicos para processar
  anosEspecificos?: number[] // Anos específicos para processar
  incluirDadosAnuais?: boolean // Se deve carregar dados anuais ou só básicos
  modoHierarquico?: boolean // Ativar estrutura hierárquica

  exportarParaPC?: boolean
  diretorioExportacao?: string // ex: '/relatorios/monitordespesas/'

  sincronizar?: boolean
  estrutura?: 'monitordespesas' // Estrutura base no 
}


export interface ETLCommandParams {
  entidade: 'deputados' | 'fornecedores' | 'despesas'
  legislatura?: number // 57
  limite?: number // 30
  flags?: {
    pc?: boolean
    api?: boolean
    cache?: boolean
    force?: boolean
  }

  deputadoId?: string
  fornecedorCnpj?: string
  anosEspecificos?: number[]
}

export interface ETLCommandResult {
  success: boolean
  processedEntities: number
  processingTime: number
  estruturaGerada: {
    api?: string[]
    pc?: string[]
    cache?: string[]
  }
  error?: string
  logs: string[]
}

// DESABILITADO: global-fornecedores-processor não existe mais
// export type { ProcessedFornecedoresData, ProcessingOptions } from '@/services/global-fornecedores-processor'
export type ProcessingOptions = Record<string, any>
export type { GastoParlamentar, FornecedorSuspeito, AnaliseDeputado } from '@/types/gastos'
