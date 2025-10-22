export interface DeputadoDetalhadoMin {
  id: string
  nome: string
  siglaPartido?: string
  [key: string]: unknown
}

export type DespesaDetalhada = Record<string, unknown>

export type MediaDeputado = Record<string, number>

export interface AnoComDados {
  ano: number
  quantidade: number
}

export type AlertaConformidade = Record<string, unknown>

export type PerfilComportamental = Record<string, unknown>

export type ComparativoPartidoItem = Record<string, unknown>

export interface RedePolitica {
  nodes: unknown[]
  edges: unknown[]
}

export type FornecedorResumo = Record<string, unknown>
