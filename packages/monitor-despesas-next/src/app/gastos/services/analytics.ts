import { z } from 'zod'

export const SUPPLIERS_CACHE_NAME = 'suppliers-cache'
export const DEPUTIES_CACHE_NAME = 'deputies-cache'

const yearRecordSchema = z.object({
  ano: z.union([z.string(), z.number()]).transform((value: string | number) => Number(value)),
  total: z.number().optional().default(0),
})

const nullableString = z.string().nullable().optional()

const fornecedorRecordSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  nome: z.string(),
  nomeFornecedor: nullableString,
  documento: nullableString,
  cnpj: nullableString,
  // Campos de total (diferentes formatos)
  total_recebido: z.number().optional(),
  totalRecebido: z.number().optional(),
  totalTransacionado: z.number().optional(),
  totalGasto: z.number().optional(),
  // Campos de transações (diferentes formatos)
  numTransacoes: z.number().optional(),
  numero_transacoes: z.number().optional(),
  numeroTransacoes: z.number().optional(),
  transacoes: z.number().optional(),
  // Arrays e records
  anos: z.array(yearRecordSchema).optional(),
  anosDisponiveis: z.array(z.number()).optional(),
  totalRecebidoPorAno: z.record(z.string(), z.number()).optional(),
  transacoesPorAno: z.record(z.string(), z.number()).optional(),
  deputadosPorAno: z.record(z.string(), z.number()).optional(),
  evolucaoAnual: z.record(z.string(), z.any()).optional(),
}).passthrough()

export const suppliersCacheSchema = z
  .object({
    // Aceita tanto "fornecedores" quanto "data" para compatibilidade com diferentes versões do cache
    fornecedores: z.array(fornecedorRecordSchema).optional(),
    data: z.array(fornecedorRecordSchema).optional(),
    metadata: z
      .object({
        totalFornecedores: z.number().nonnegative().optional().default(0),
        anosDisponiveis: z.array(z.number()).optional().default([]),
        generatedAt: z.string().optional(),
      })
      .passthrough()
      .default({ totalFornecedores: 0, anosDisponiveis: [] }),
  })
  .passthrough()
  .transform((val) => ({
    // Normaliza: se existe "data", usa como "fornecedores"
    fornecedores: val.fornecedores || val.data || [],
    metadata: val.metadata,
  }))

export type SuppliersCacheData = z.infer<typeof suppliersCacheSchema>
export type SupplierRecord = z.infer<typeof fornecedorRecordSchema>

export type NormalizedFornecedor = {
  id: string
  nome: string
  cnpj: string
  totalGasto: number
  numTransacoes: number
  anos: Array<{ ano: number; total: number }>
  anosDisponiveis: number[]
}

export type PartidoResumoItem = {
  partido: string
  totalGasto: number
  numDeputados: number
  mediaPorDeputado: number
}

export type UfResumoItem = {
  uf: string
  totalGasto: number
  numDeputados: number
  mediaPorDeputado: number
}

export function parseSuppliersCache(payload: unknown): SuppliersCacheData {
  return suppliersCacheSchema.parse(payload)
}

export function normalizeFornecedor(record: SupplierRecord): NormalizedFornecedor {
  const id = record.id !== undefined ? String(record.id) : record.nome
  const cnpj = (record.cnpj || record.documento || '').trim() || id

  const anosFromArray = Array.isArray(record.anos) ? record.anos : []
  const anosFromRecord = Object.entries(record.totalRecebidoPorAno || {}).map(([ano, total]) => ({
    ano: Number(ano),
    total: typeof total === 'number' ? total : 0,
  }))
  const anosFromEvolucao = Object.entries(record.evolucaoAnual || {}).map(([ano, data]: [string, any]) => ({
    ano: Number(ano),
    total: typeof data?.valor === 'number' ? data.valor : 0,
  }))

  const anosAccumulator = new Map<number, number>()
  const appendYear = (ano?: number, total?: number) => {
    if (!Number.isFinite(ano)) {
      return
    }
    const safeAno = Number(ano)
    const safeTotal = Number(total || 0)
    anosAccumulator.set(safeAno, (anosAccumulator.get(safeAno) || 0) + safeTotal)
  }

  anosFromArray.forEach((entry: { ano: number; total: number }) => appendYear(entry.ano, entry.total))
  anosFromRecord.forEach((entry: { ano: number; total: number }) => appendYear(entry.ano, entry.total))
  anosFromEvolucao.forEach((entry: { ano: number; total: number }) => appendYear(entry.ano, entry.total))

  const anos = Array.from(anosAccumulator.entries())
    .map(([ano, total]) => ({ ano, total }))
    .sort((a, b) => b.ano - a.ano)

  const totalGasto =
    record.totalRecebido ??
    record.totalTransacionado ??
    record.total_recebido ??
    record.totalGasto ??
    anos.reduce((sum, entry) => sum + entry.total, 0)

  const numTransacoes = (() => {
    if (typeof record.numeroTransacoes === 'number') {
      return record.numeroTransacoes
    }
    if (typeof record.transacoes === 'number') {
      return record.transacoes
    }
    if (typeof record.numTransacoes === 'number') {
      return record.numTransacoes
    }
    if (typeof record.numero_transacoes === 'number') {
      return record.numero_transacoes
    }
    if (record.transacoesPorAno) {
      return Object.values(record.transacoesPorAno).reduce((sum: number, value) =>
        typeof value === 'number' ? sum + value : sum,
      0)
    }
    if (record.evolucaoAnual) {
      return Object.values(record.evolucaoAnual).reduce((sum: number, data: any) =>
        typeof data?.transacoes === 'number' ? sum + data.transacoes : sum,
      0)
    }
    return 0
  })()

  const anosDisponiveis =
    record.anosDisponiveis && record.anosDisponiveis.length > 0
      ? [...record.anosDisponiveis].sort((a, b) => a - b)
      : anos.map(entry => entry.ano).sort((a, b) => a - b)

  return {
    id,
    nome: record.nome,
    cnpj,
    totalGasto: Number(totalGasto || 0),
    numTransacoes,
    anos,
    anosDisponiveis,
  }
}

const deputyYearRecordSchema = z.object({
  ano: z.union([z.string(), z.number()]).transform((value: string | number) => Number(value)),
  total: z.number().optional().default(0),
})

const deputyRecordSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    nome: nullableString,
    nomeEleitoral: nullableString,
    partido: nullableString,
    siglaPartido: nullableString,
    uf: nullableString,
    siglaUf: nullableString,
    urlFoto: nullableString,
    foto: nullableString,
    email: nullableString,
    emailProfissional: nullableString,
    telefone: nullableString,
    telefoneGabinete: nullableString,
    totalGastos: z.number().optional(),
    totalDespesas: z.number().optional(),
    total_despesas: z.number().optional(),
    totalTransacoes: z.number().optional(),
    numeroDespesas: z.number().optional(),
    numero_despesas: z.number().optional(),
    gastosPorAno: z.record(z.string(), z.number()).optional(),
    transacoesPorAno: z.record(z.string(), z.number()).optional(),
    fornecedoresPorAno: z.record(z.string(), z.number()).optional(),
    categoriasPorAno: z.record(z.string(), z.any()).optional(),
    anos: z.array(deputyYearRecordSchema).optional(),
    anosDisponiveis: z.array(z.number()).optional(),
    scoreSuspeicao: z.number().optional(),
    alertas: z.array(z.any()).optional(),
  })
  .passthrough()

export const deputiesCacheSchema = z
  .object({
    // Aceita tanto "deputados" quanto "data" para compatibilidade com diferentes versões do cache
    deputados: z.array(deputyRecordSchema).optional(),
    data: z.array(deputyRecordSchema).optional(),
    metadata: z
      .object({
        totalDeputados: z.number().optional().default(0),
        anosDisponiveis: z.array(z.number()).optional().default([]),
        generatedAt: z.string().optional(),
      })
      .passthrough()
      .default({ totalDeputados: 0, anosDisponiveis: [] }),
  })
  .passthrough()
  .transform((val) => ({
    // Normaliza: se existe "data", usa como "deputados"
    deputados: val.deputados || val.data || [],
    metadata: val.metadata,
  }))

export type DeputiesCacheData = z.infer<typeof deputiesCacheSchema>
export type DeputyRecord = z.infer<typeof deputyRecordSchema>

export type NormalizedDeputado = {
  id: string
  nome: string
  partido: string
  uf: string
  totalGasto: number
  anos: Array<{ ano: number; total: number }>
  anosDisponiveis: number[]
  totalTransacoes: number
  urlFoto?: string
  email?: string
  telefone?: string
  scoreSuspeicao?: number
  alertas?: unknown[]
  transacoesPorAno?: Record<string, number>
  categoriasPorAno?: Record<string, unknown>
  fornecedoresPorAno?: Record<string, number>
}

export function parseDeputiesCache(payload: unknown): DeputiesCacheData {
  return deputiesCacheSchema.parse(payload)
}

export function normalizeDeputado(record: DeputyRecord): NormalizedDeputado {
  const id = record.id?.toString() ?? ''
  const nome = record.nome ?? record.nomeEleitoral ?? 'Sem nome'
  const partido = record.partido ?? record.siglaPartido ?? 'N/I'
  const uf = record.uf ?? record.siglaUf ?? 'N/I'

  const anosAccumulator = new Map<number, number>()
  const appendYear = (ano?: number, total?: number) => {
    if (!Number.isFinite(ano)) {
      return
    }
    const safeAno = Number(ano)
    const safeTotal = Number(total || 0)
    anosAccumulator.set(safeAno, (anosAccumulator.get(safeAno) || 0) + safeTotal)
  }

  if (Array.isArray(record.anos)) {
    record.anos.forEach((entry: { ano: number; total: number }) => appendYear(entry.ano, entry.total))
  }
  Object.entries(record.gastosPorAno || {}).forEach(([ano, total]) => appendYear(Number(ano), total as number))

  const anos = Array.from(anosAccumulator.entries())
    .map(([ano, total]) => ({ ano, total }))
    .sort((a, b) => b.ano - a.ano)

  const totalGasto =
    record.totalGastos ??
    record.totalDespesas ??
    record.total_despesas ??
    anos.reduce((sum, entry) => sum + entry.total, 0)

  const totalTransacoes = (() => {
    if (typeof record.totalTransacoes === 'number') {
      return record.totalTransacoes
    }
    if (typeof record.numeroDespesas === 'number') {
      return record.numeroDespesas
    }
    if (typeof record.numero_despesas === 'number') {
      return record.numero_despesas
    }
    if (record.transacoesPorAno) {
      return Object.values(record.transacoesPorAno).reduce((acc: number, value) =>
        typeof value === 'number' ? acc + value : acc,
      0)
    }
    return 0
  })()

  const anosDisponiveis =
    record.anosDisponiveis && record.anosDisponiveis.length > 0
      ? [...record.anosDisponiveis].map(Number).sort((a, b) => a - b)
      : anos.map(entry => entry.ano).sort((a, b) => a - b)

  const urlFoto =
    record.urlFoto ||
    record.foto ||
    (id ? `https://www.camara.leg.br/internet/deputado/bandep/${id}.jpg` : undefined)

  const email = record.email || record.emailProfissional
  const telefone = record.telefone || record.telefoneGabinete

  return {
    id,
    nome,
    partido,
    uf,
    totalGasto: Number(totalGasto || 0),
    anos,
    anosDisponiveis,
    totalTransacoes,
    urlFoto,
    email: email || undefined,
    telefone: telefone || undefined,
    scoreSuspeicao: record.scoreSuspeicao,
    alertas: record.alertas,
    transacoesPorAno: record.transacoesPorAno,
    categoriasPorAno: record.categoriasPorAno,
    fornecedoresPorAno: record.fornecedoresPorAno,
  }
}

export function buildResumoPartidos(
  deputados: Array<{ partido?: string | null; totalGasto?: number | null }>,
): PartidoResumoItem[] {
  const map = new Map<string, { total: number; count: number }>()
  deputados.forEach(dep => {
    const partido = dep.partido?.trim()
    if (!partido) {
      return
    }
    const entry = map.get(partido) || { total: 0, count: 0 }
    entry.total += typeof dep.totalGasto === 'number' ? dep.totalGasto : 0
    entry.count += 1
    map.set(partido, entry)
  })

  return Array.from(map.entries())
    .map(([partido, valores]) => ({
      partido,
      totalGasto: valores.total,
      numDeputados: valores.count,
      mediaPorDeputado: valores.count > 0 ? valores.total / valores.count : 0,
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto)
}

export function buildResumoUfs(
  deputados: Array<{ uf?: string | null; totalGasto?: number | null }>,
): UfResumoItem[] {
  const map = new Map<string, { total: number; count: number }>()
  deputados.forEach(dep => {
    const uf = dep.uf?.trim()
    if (!uf) {
      return
    }
    const entry = map.get(uf) || { total: 0, count: 0 }
    entry.total += typeof dep.totalGasto === 'number' ? dep.totalGasto : 0
    entry.count += 1
    map.set(uf, entry)
  })

  return Array.from(map.entries())
    .map(([uf, valores]) => ({
      uf,
      totalGasto: valores.total,
      numDeputados: valores.count,
      mediaPorDeputado: valores.count > 0 ? valores.total / valores.count : 0,
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto)
}

// ============================================================================
// CATEGORIES CACHE
// ============================================================================

export const CATEGORIES_CACHE_NAME = 'categories-cache'

const categoryYearDataSchema = z.object({
  total: z.number().nonnegative().default(0),
  transacoes: z.number().int().nonnegative().default(0),
  fornecedores: z.number().int().nonnegative().default(0),
  deputados: z.number().int().nonnegative().default(0),
})

const categoryRecordSchema = z.object({
  categoria: z.string().optional(), // Adicionado para o transform
  totalGeral: z.number().nonnegative().default(0),
  porAno: z.record(z.string(), categoryYearDataSchema).optional().default({}),
  topDeputados: z.array(z.object({
    id: z.string(),
    nome: z.string().optional(),
    nomeEleitoral: z.string().optional(),
    siglaPartido: z.string().nullable().optional(),
    siglaUf: z.string().nullable().optional(),
    totalGasto: z.number().nonnegative(),
    transacoes: z.number().int().nonnegative(),
  })).optional().default([]),
}).passthrough()

export const categoriesCacheSchema = z.object({
  // Aceita tanto estrutura plana quanto aninhada em "data"
  categorias: z.record(z.string(), categoryRecordSchema).optional(),
  data: z.object({
    categorias: z.array(categoryRecordSchema).optional(),
  }).passthrough().optional(),
  metadata: z
    .object({
      totalCategorias: z.number().int().nonnegative().optional().default(0),
      generatedAt: z.string().optional(),
      anosDisponiveis: z.array(z.number()).optional().default([]),
    })
    .passthrough()
    .default({ totalCategorias: 0, anosDisponiveis: [] }),
}).passthrough().transform((val) => {
  // Normaliza: converte array em record por categoria
  let categorias: Record<string, any> = {};
  
  if (val.data?.categorias && Array.isArray(val.data.categorias)) {
    // Cache novo: data.categorias é array
    val.data.categorias.forEach((cat: any) => {
      if (cat.categoria) {
        categorias[cat.categoria] = cat;
      }
    });
  } else if (val.categorias && typeof val.categorias === 'object') {
    // Cache antigo: categorias é record
    categorias = val.categorias;
  }
  
  return {
    categorias,
    metadata: val.metadata,
  };
})

export type CategoriesCacheData = z.infer<typeof categoriesCacheSchema>
export type CategoryRecord = z.infer<typeof categoryRecordSchema>
export type CategoryYearData = z.infer<typeof categoryYearDataSchema>

export type NormalizedCategoria = {
  nome: string
  totalGeral: number
  anosDisponiveis: number[]
  dadosPorAno: Record<string, CategoryYearData>
}

export function parseCategoriesCache(payload: unknown): CategoriesCacheData {
  return categoriesCacheSchema.parse(payload)
}

export function normalizeCategoriaRecord(
  nome: string,
  record: CategoryRecord,
): NormalizedCategoria {
  const anos = Object.keys(record.porAno || {})
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => b - a)

  return {
    nome,
    totalGeral: record.totalGeral,
    anosDisponiveis: anos,
    dadosPorAno: record.porAno || {},
  }
}

// ============================================================================
// RANKINGS CACHE
// ============================================================================

export const RANKINGS_CACHE_NAME = 'rankings-cache'

const rankingEntrySchema = z.object({
  rank: z.number().int().positive(),
  id: z.union([z.string(), z.number()]).transform((v: string | number) => String(v)),
  nome: z.string(),
  valor: z.number().nonnegative(),
  tipo: z.enum(['deputado', 'fornecedor', 'categoria']).optional(),
})

export const rankingsCacheSchema = z.object({
  topDeputados: z.array(rankingEntrySchema).max(100).optional().default([]),
  topFornecedores: z.array(rankingEntrySchema).max(100).optional().default([]),
  topCategorias: z.array(rankingEntrySchema).max(50).optional().default([]),
  metadata: z
    .object({
      generatedAt: z.string().optional(),
      ano: z.number().int().optional(),
      anosDisponiveis: z.array(z.number()).optional().default([]),
    })
    .passthrough()
    .default({}),
}).passthrough()

export type RankingsCacheData = z.infer<typeof rankingsCacheSchema>
export type RankingEntry = z.infer<typeof rankingEntrySchema>

export function parseRankingsCache(payload: unknown): RankingsCacheData {
  return rankingsCacheSchema.parse(payload)
}

// ============================================================================
// DASHBOARD CACHE
// ============================================================================

export const DASHBOARD_CACHE_NAME = 'dashboard-cache'

const partidoSummarySchema = z.object({
  partido: z.string(),
  totalGasto: z.number().nonnegative(),
  numDeputados: z.number().int().nonnegative(),
  mediaPorDeputado: z.number().nonnegative(),
})

const ufSummarySchema = z.object({
  uf: z.string().length(2),
  totalGasto: z.number().nonnegative(),
  numDeputados: z.number().int().nonnegative(),
  mediaPorDeputado: z.number().nonnegative(),
})

const evolucaoAnualSchema = z.object({
  ano: z.number().int().min(2019),
  total: z.number().nonnegative(),
})

export const dashboardCacheSchema = z.object({
  resumoPartidos: z.array(partidoSummarySchema).optional().default([]),
  resumoUFs: z.array(ufSummarySchema).optional().default([]),
  topFornecedores: z.array(fornecedorRecordSchema).max(20).optional().default([]),
  evolucaoAnual: z.array(evolucaoAnualSchema).optional().default([]),
  metadata: z
    .object({
      generatedAt: z.string().optional(),
      anosDisponiveis: z.array(z.number()).optional().default([]),
    })
    .passthrough()
    .default({}),
}).passthrough()

export type DashboardCacheData = z.infer<typeof dashboardCacheSchema>
export type PartidoSummary = z.infer<typeof partidoSummarySchema>
export type UfSummary = z.infer<typeof ufSummarySchema>
export type EvolucaoAnual = z.infer<typeof evolucaoAnualSchema>

export function parseDashboardCache(payload: unknown): DashboardCacheData {
  return dashboardCacheSchema.parse(payload)
}

// ============================================================================
// ANALYSIS CACHE
// ============================================================================

export const ANALYSIS_CACHE_NAME = 'analysis-cache'

const analysisRecordSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v: string | number) => String(v)),
  tipo: z.enum(['deputado', 'fornecedor', 'categoria']).optional(),
  titulo: z.string().optional(),
  descricao: z.string().optional(),
  score: z.number().optional(),
  alertas: z.array(z.any()).optional().default([]),
  metadata: z.record(z.string(), z.any()).optional().default({}),
}).passthrough()

export const analysisCacheSchema = z.object({
  analises: z.array(analysisRecordSchema).optional().default([]),
  metadata: z
    .object({
      totalAnalises: z.number().int().nonnegative().optional().default(0),
      generatedAt: z.string().optional(),
    })
    .passthrough()
    .default({}),
}).passthrough()

export type AnalysisCacheData = z.infer<typeof analysisCacheSchema>
export type AnalysisRecord = z.infer<typeof analysisRecordSchema>

export function parseAnalysisCache(payload: unknown): AnalysisCacheData {
  return analysisCacheSchema.parse(payload)
}

// ============================================================================
// PREMIACOES CACHE
// ============================================================================

export const PREMIACOES_CACHE_NAME = 'premiacoes-cache'

const coroaOuroSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v: string | number) => String(v)),
  nome: z.string(),
  valor: z.number().nonnegative(),
  categoria: z.string().optional(),
  tipo: z.string().optional(),
})

const coroaPrataSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v: string | number) => String(v)),
  nome: z.string(),
  valor: z.number().nonnegative(),
  categoria: z.string().optional(),
  tipo: z.string().optional(),
})

const coroaBronzeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v: string | number) => String(v)),
  nome: z.string(),
  valor: z.number().nonnegative(),
  categoria: z.string().optional(),
  tipo: z.string().optional(),
})

export const premiacoesCacheSchema = z.object({
  coroasOuro: z.array(coroaOuroSchema).optional().default([]),
  coroasPrata: z.array(coroaPrataSchema).optional().default([]),
  coroasBronze: z.array(coroaBronzeSchema).optional().default([]),
  metadata: z
    .object({
      generatedAt: z.string().optional(),
      ano: z.number().int().optional(),
    })
    .passthrough()
    .default({}),
}).passthrough()

export type PremiacoesCacheData = z.infer<typeof premiacoesCacheSchema>
export type CoroaOuro = z.infer<typeof coroaOuroSchema>
export type CoroaPrata = z.infer<typeof coroaPrataSchema>
export type CoroaBronze = z.infer<typeof coroaBronzeSchema>

export function parsePremiacoesCache(payload: unknown): PremiacoesCacheData {
  return premiacoesCacheSchema.parse(payload)
}

// ============================================================================
// TRANSACTIONS INDEX CACHE
// ============================================================================

export const TRANSACTIONS_INDEX_CACHE_NAME = 'transactions-index'

const yearSummarySchema = z.object({
  count: z.number().int().nonnegative(),
  pages: z.number().int().nonnegative(),
})

export const transactionsIndexSchema = z.object({
  // Aceita tanto "entityId" quanto "deputyId" ou "supplierId"
  entityId: z.string().optional(),
  deputyId: z.string().optional(),
  supplierId: z.string().optional(),
  entityType: z.enum(['deputy', 'supplier']).optional(),
  totalTransactions: z.number().int().nonnegative(),
  availableYears: z.array(z.number()).optional().default([]),
  yearSummary: z.record(z.string(), yearSummarySchema).optional().default({}),
  allYears: yearSummarySchema.optional(),
}).passthrough().transform((val) => ({
  // Normaliza: usa deputyId ou supplierId como entityId se entityId não existir
  entityId: val.entityId || val.deputyId || val.supplierId || '',
  entityType: val.entityType || (val.deputyId ? 'deputy' as const : val.supplierId ? 'supplier' as const : undefined),
  totalTransactions: val.totalTransactions,
  availableYears: val.availableYears,
  yearSummary: val.yearSummary,
  allYears: val.allYears,
}))

export type TransactionsIndexData = z.infer<typeof transactionsIndexSchema>
export type YearSummary = z.infer<typeof yearSummarySchema>

export function parseTransactionsIndex(payload: unknown): TransactionsIndexData {
  return transactionsIndexSchema.parse(payload)
}

// ============================================================================
// TRANSACTION PAGE CACHE
// ============================================================================

const transactionSchema = z.object({
  // O campo id pode não existir nos caches ETL - tornar opcional
  id: z.union([z.string(), z.number()]).transform((v: string | number) => String(v)).optional(),
  dataDocumento: z.string().optional(),
  tipoDespesa: z.string().optional(),
  tipoDocumento: z.string().optional(),
  valorDocumento: z.number().optional(),
  valorGlosa: z.number().optional(),
  valorLiquido: z.number().optional(),
  nomeFornecedor: z.string().optional(),
  cnpjCpfFornecedor: z.string().optional(),
  // urlDocumento pode ser null nos dados
  urlDocumento: z.string().nullable().optional(),
  // Campos adicionais que podem existir no cache
  ano: z.number().int().optional(),
  mes: z.number().int().optional(),
  codDocumento: z.number().int().optional(),
  codTipoDocumento: z.number().int().optional(),
  numDocumento: z.string().optional(),
  numRessarcimento: z.string().optional(),
  codLote: z.number().int().optional(),
  parcela: z.number().int().optional(),
}).passthrough()

export const transactionPageSchema = z.object({
  // Aceita tanto "transactions" quanto "items"
  transactions: z.array(transactionSchema).optional(),
  items: z.array(transactionSchema).optional(),
  // Aceita tanto objeto "pagination" quanto campos soltos
  pagination: z.object({
    page: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    totalTransactions: z.number().int().nonnegative(),
  }).optional(),
  page: z.number().int().positive().optional(),
  totalPages: z.number().int().nonnegative().optional(),
  totalItems: z.number().int().nonnegative().optional(),
  metadata: z
    .object({
      entityId: z.string().optional(),
      entityType: z.string().optional(),
      year: z.number().int().optional(),
    })
    .passthrough()
    .default({}),
}).passthrough().transform((val) => {
  // Normaliza: usa "items" se "transactions" não existir
  const transactions = val.transactions || val.items || [];
  
  // Normaliza: constrói "pagination" a partir dos campos se não existir
  const pagination = val.pagination || {
    page: val.page || 1,
    totalPages: val.totalPages || 1,
    totalTransactions: val.totalItems || transactions.length,
  };
  
  return {
    transactions,
    pagination,
    metadata: val.metadata,
  };
})

export type TransactionPageData = z.infer<typeof transactionPageSchema>
export type Transaction = z.infer<typeof transactionSchema>

export function parseTransactionPage(payload: unknown): TransactionPageData {
  return transactionPageSchema.parse(payload)
}
