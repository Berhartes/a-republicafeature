import { z } from 'zod'

// Suppliers cache: unify either `fornecedores` or `data`
const fornecedorItemSchema = z.object({}).passthrough()
export const suppliersCacheSchema = z.object({
  fornecedores: z.array(fornecedorItemSchema).optional(),
  data: z.array(fornecedorItemSchema).optional(),
  metadata: z.object({}).passthrough().optional(),
}).passthrough()

export function parseSuppliersCache(payload: unknown): { fornecedores: any[] } {
  const result = suppliersCacheSchema.safeParse(payload)
  if (!result.success) return { fornecedores: [] }
  const parsed = result.data
  const fornecedores = Array.isArray(parsed.fornecedores)
    ? parsed.fornecedores
    : Array.isArray(parsed.data)
      ? parsed.data
      : []
  return { fornecedores }
}

// Deputies cache: unify `deputados` or `data.deputados`
const deputadoItemSchema = z.object({}).passthrough()
export const deputiesCacheSchema = z.union([
  z.array(deputadoItemSchema),
  z.object({
    deputados: z.array(deputadoItemSchema).optional(),
    data: z.union([
      z.array(deputadoItemSchema),
      z.object({ deputados: z.array(deputadoItemSchema).optional() }).passthrough(),
    ]).optional(),
    metadata: z.object({}).passthrough().optional(),
  }).passthrough(),
])

export function parseDeputiesCache(payload: unknown): { deputados: any[] } {
  if (payload == null) return { deputados: [] }
  const result = deputiesCacheSchema.safeParse(payload)
  if (!result.success) return { deputados: [] }
  const parsed = result.data as any
  const deputados = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.deputados)
      ? parsed.deputados
      : parsed.data && Array.isArray(parsed.data)
        ? parsed.data
        : parsed.data && Array.isArray(parsed?.data?.deputados)
          ? parsed.data.deputados
        : []
  return { deputados }
}

// Analysis cache: alertas + fornecedoresSuspeitos arrays
const alertaItemSchema = z.object({}).passthrough()
const fornecedorSuspeitoSchema = z.object({}).passthrough()
export const analysisCacheSchema = z.object({
  alertas: z.array(alertaItemSchema).optional(),
  fornecedoresSuspeitos: z.array(fornecedorSuspeitoSchema).optional(),
  metadata: z.object({}).passthrough().optional(),
}).passthrough()

export function parseAnalysisCache(payload: unknown): { alertas: any[]; fornecedoresSuspeitos: any[] } {
  const result = analysisCacheSchema.safeParse(payload)
  if (!result.success) return { alertas: [], fornecedoresSuspeitos: [] }
  const parsed = result.data
  return {
    alertas: Array.isArray(parsed.alertas) ? parsed.alertas : [],
    fornecedoresSuspeitos: Array.isArray(parsed.fornecedoresSuspeitos) ? parsed.fornecedoresSuspeitos : [],
  }
}

// Premiacoes cache: premiacoes with arrays
const premiacaoItemSchema = z.object({}).passthrough()
export const premiacoesCacheSchema = z.object({
  premiacoes: z.object({
    coroas: z.array(premiacaoItemSchema).optional(),
    trofeus: z.array(premiacaoItemSchema).optional(),
    medalhas: z.array(premiacaoItemSchema).optional(),
  }).passthrough().optional(),
  metadata: z.object({}).passthrough().optional(),
}).passthrough()

export function parsePremiacoesCache(payload: unknown): { premiacoes: { coroas: any[]; trofeus: any[]; medalhas: any[] } } {
  const result = premiacoesCacheSchema.safeParse(payload)
  const parsed = result.success ? result.data : { premiacoes: { coroas: [], trofeus: [], medalhas: [] } }
  const base = parsed.premiacoes || { coroas: [], trofeus: [], medalhas: [] }
  return {
    premiacoes: {
      coroas: Array.isArray(base.coroas) ? base.coroas : [],
      trofeus: Array.isArray(base.trofeus) ? base.trofeus : [],
      medalhas: Array.isArray(base.medalhas) ? base.medalhas : [],
    },
  }
}

// Dados completos por deputado: validação leve das despesas
const despesaDetalhadaSchema = z.object({
  dataDocumento: z.string().optional().nullable(),
  nomeFornecedor: z.string().optional().nullable(),
  tipoDespesa: z.string().optional().nullable(),
  valorLiquido: z.number().optional().nullable(),
}).passthrough()

export const dadosCompletosDeputadoSchema = z.object({
  despesas: z.array(despesaDetalhadaSchema).default([]),
}).passthrough()

export function parseDadosCompletosDeputado(payload: unknown): { despesas: any[] } {
  const parsed = dadosCompletosDeputadoSchema.parse(payload)
  return { despesas: parsed.despesas }
}
