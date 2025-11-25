'use server';
// ======================================================================================
import { readFile } from 'fs/promises';
import { join } from 'path';
import { cache } from 'react';
import type { DespesaDetalhada } from '../types/gastos';
import type { DeputadoResumo, FornecedorResumo, DeputadoDetalhado } from '../types/deputados';
import { loadSuppliersCache, loadDeputiesCache, loadAnalysisCache, loadPremiacoesCache } from './_cached-loaders'
import { z } from 'zod'
import { parseSuppliersCache, parseDeputiesCache, parseAnalysisCache, parsePremiacoesCache, parseDadosCompletosDeputado } from '@/services/analytics'

interface DeputadoUnificado {
  id: string
  nome: string
  nomeEleitoral: string
  siglaPartido: string
  siglaUf: string
  urlFoto: string
  gastosPorAno: Record<number, number>
  anosDisponiveis: number[]
  transacoesPorAno?: Record<number, number>
  totalTransacoes?: number
  totalDespesasRaw?: number
  scoreSuspeicao?: number
  numAlertas?: number
}

interface FornecedorUnificado {
  id: string
  nome: string
  cnpjCpf: string | null
  totalRecebido: number
  numeroTransacoes: number
  tipoFornecedor: string | null
  tipoDespesaPrincipal: string | null
  anos: Array<{
    ano: number
    total: number
    numeroTransacoes: number
    numeroDeputados: number
  }>
}

// ======================================================================================
// SECTION: Funções de Normalização
// Descrição: Converte os dados brutos e inconsistentes dos arquivos JSON para os
// nossos tipos de dados unificados e previsíveis.
// ======================================================================================

function normalizeDeputado(raw: any): DeputadoUnificado {
  const gastosPorAno: Record<number, number> = {}
  if (raw.anos && Array.isArray(raw.anos)) {
    for (const ano of raw.anos) {
      if (ano && typeof ano.ano === 'number' && typeof ano.total === 'number') {
        gastosPorAno[ano.ano] = ano.total
      }
    }
  } else if (raw.gastosPorAno && typeof raw.gastosPorAno === 'object') {
    for (const ano in raw.gastosPorAno) {
      if (typeof raw.gastosPorAno[ano] === 'number') {
        gastosPorAno[Number(ano)] = raw.gastosPorAno[ano]
      }
    }
  }

  if (Object.keys(gastosPorAno).length === 0) {
    const totalFallback = raw.totalDespesas ?? raw.total_despesas ?? null
    if (typeof totalFallback === 'number') {
      const anoReferencia = raw.anoReferencia ?? raw.ano_referencia ?? new Date().getFullYear()
      gastosPorAno[Number(anoReferencia)] = totalFallback
    }
  }

  const anosDisponiveis = Array.isArray(raw.anosDisponiveis)
    ? raw.anosDisponiveis.sort((a: number, b: number) => a - b)
    : Object.keys(gastosPorAno).map(Number).sort((a, b) => a - b)

  // Transações por ano (se existir nos caches unificados)
  const transacoesPorAno: Record<number, number> | undefined = (() => {
    const src = raw.transacoesPorAno || raw.numeroDespesasPorAno || raw.transacoes_por_ano
    if (src && typeof src === 'object') {
      const out: Record<number, number> = {}
      for (const key of Object.keys(src)) {
        const kNum = Number(key)
        const val = src[key]
        if (!Number.isNaN(kNum) && typeof val === 'number') {
          out[kNum] = val
        }
      }
      // Também cobre formato baseado em array "anos"
      if (Object.keys(out).length > 0) return out
    }
    if (raw.anos && Array.isArray(raw.anos)) {
      const out: Record<number, number> = {}
      for (const a of raw.anos) {
        if (a && typeof a.ano === 'number') {
          const n = a.numeroDespesas || a.numero_despesas || a.transacoes || a.numeroTransacoes
          if (typeof n === 'number') out[a.ano] = n
        }
      }
      if (Object.keys(out).length > 0) return out
    }
    return undefined
  })()

  const totalTransacoes: number | undefined = (() => {
    const explicit = raw.totalTransacoes || raw.numeroDespesas || raw.numero_despesas
    if (typeof explicit === 'number') return explicit
    if (transacoesPorAno) {
      return Object.values(transacoesPorAno).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
    }
    return undefined
  })()

  const totalDespesasRaw = (() => {
    const t = raw.totalDespesas ?? raw.total_despesas
    return typeof t === 'number' ? t : undefined
  })()

  return {
    id: String(raw.id),
    nome: raw.nome || raw.nomeEleitoral || 'Desconhecido',
    nomeEleitoral: raw.nomeEleitoral || raw.nome,
    siglaPartido: raw.siglaPartido || 'N/A',
    siglaUf: raw.siglaUf || 'N/A',
    urlFoto: raw.urlFoto || '',
    gastosPorAno,
    anosDisponiveis,
    transacoesPorAno,
    totalTransacoes,
    totalDespesasRaw,
    scoreSuspeicao: typeof raw.scoreSuspeicao === 'number' ? raw.scoreSuspeicao : undefined,
    numAlertas: Array.isArray(raw.alertas) ? raw.alertas.length : (typeof raw.numAlertas === 'number' ? raw.numAlertas : undefined),
  }
}

function normalizeFornecedor(raw: any): FornecedorUnificado {
  const anos = (raw.anos || []).map((a: any) => ({
    ano: a.ano,
    total: a.total || 0,
    numeroTransacoes: a.numero_transacoes || a.numeroTransacoes || 0,
    numeroDeputados: a.numero_legisladores || a.numeroDeputados || 0,
  }))

  if (anos.length === 0 && raw.evolucaoAnual) {
    Object.entries(raw.evolucaoAnual).forEach(([ano, val]: [string, any]) => {
      anos.push({
        ano: parseInt(ano),
        total: typeof val?.valor === 'number' ? val.valor : 0,
        numeroTransacoes: typeof val?.transacoes === 'number' ? val.transacoes : 0,
        numeroDeputados: typeof val?.deputados === 'number' ? val.deputados : 0,
      })
    })
  }

  return {
    id: raw.documento || raw.id || raw.cnpj || 'sem-id',
    nome: raw.nome || raw.nomeFornecedor || 'sem-nome',
    cnpjCpf: raw.documento || raw.cnpj || null,
    totalRecebido: raw.total_recebido ?? raw.totalGasto ?? raw.totalRecebido ?? raw.totalTransacionado ?? 0,
    numeroTransacoes: raw.numero_transacoes ?? raw.numTransacoes ?? raw.numeroTransacoes ?? raw.transacoes ?? 0,
    tipoFornecedor: raw.tipo_fornecedor ?? raw.categoria ?? raw.categoriaOriginal ?? null,
    tipoDespesaPrincipal: raw.tipo_despesa_principal ?? (Array.isArray(raw.categorias) ? raw.categorias[0] : null),
    anos,
  }
}

const fornecedoresFiltersSchema = z.object({
  searchTerm: z.string().trim().min(0).max(100).optional(),
  categoria: z.string().trim().min(0).max(60).optional(),
  scoreMinimo: z.number().min(0).max(100).optional(),
  sortBy: z.enum(['nome', 'totalRecebido', 'numeroTransacoes', 'scoreSuspeicao']).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
})
interface GetFornecedoresFilters {
  searchTerm?: string;
  categoria?: string;
  scoreMinimo?: number;
  sortBy?: 'nome' | 'totalRecebido' | 'numeroTransacoes' | 'scoreSuspeicao';
  page?: number;
  pageSize?: number;
}

export async function getFornecedores(
  filters: GetFornecedoresFilters = {}
): Promise<{ fornecedores: FornecedorResumo[]; total: number; }> {
  const parsedFilters = fornecedoresFiltersSchema.safeParse(filters)
  const { searchTerm, categoria, scoreMinimo, sortBy, page, pageSize } = parsedFilters.success
    ? parsedFilters.data
    : { searchTerm: undefined, categoria: undefined, scoreMinimo: undefined, sortBy: undefined, page: 1, pageSize: 50 }

  let rawFornecedores: any[] = []
  try {
    const parsed = parseSuppliersCache(await loadSuppliersCache())
    rawFornecedores = parsed.fornecedores
  } catch (err) {
    console.error('[Zod Validation] suppliers cache invalid, fallback to empty array', err)
  }

  if (rawFornecedores.length === 0) return { fornecedores: [], total: 0 };

  const fornecedoresMapeados = rawFornecedores.map(normalizeFornecedor);

  let fornecedoresFiltrados = fornecedoresMapeados;
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    fornecedoresFiltrados = fornecedoresFiltrados.filter(f =>
      f.nome.toLowerCase().includes(term) ||
      f.cnpjCpf?.includes(term)
    );
  }
  if (categoria) {
    fornecedoresFiltrados = fornecedoresFiltrados.filter(f => f.tipoDespesaPrincipal === categoria);
  }
  // O filtro por scoreMinimo foi removido porque scoreSuspeicao não faz parte do modelo unificado
  // if (scoreMinimo) {
  //   fornecedoresFiltrados = fornecedoresFiltrados.filter(f => (f.scoreSuspeicao || 0) >= scoreMinimo);
  // }

  switch (sortBy) {
    case 'nome':
      fornecedoresFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
      break;
    case 'numeroTransacoes':
      fornecedoresFiltrados.sort((a, b) => b.numeroTransacoes - a.numeroTransacoes);
      break;
    // case 'scoreSuspeicao':
    //   fornecedoresFiltrados.sort((a, b) => (b.scoreSuspeicao || 0) - (a.scoreSuspeicao || 0));
    //   break;
    case 'totalRecebido':
    default:
      fornecedoresFiltrados.sort((a, b) => b.totalRecebido - a.totalRecebido);
      break;
  }

  const total = fornecedoresFiltrados.length;
  const safePage = Math.max(1, Math.min(1000000, page ?? 1))
  const safeSize = Math.max(1, Math.min(200, pageSize ?? 50))
  const start = (safePage - 1) * safeSize;
  const end = start + safeSize;
  const fornecedoresPaginados = fornecedoresFiltrados.slice(start, end);

  const fornecedoresResumo = fornecedoresPaginados.map(f => ({
    ...f,
    numeroDeputados: 0, // Campo não disponível no modelo unificado
    scoreSuspeicao: null, // Campo não disponível no modelo unificado
    ranking: null, // Campo não disponível no modelo unificado
    categorias: [], // Campo não disponível no modelo unificado
  }))

  return { fornecedores: fornecedoresResumo, total };
}

export async function getFornecedorByCnpj(cnpj: string): Promise<FornecedorResumo | undefined> {
  const { fornecedores } = await getFornecedores();
  return fornecedores.find(f => f.cnpjCpf === cnpj);
}

const deputadosFiltersSchema = z.object({
  ano: z.string().regex(/^\d{4}$/).optional(),
  partido: z.string().trim().min(0).max(20).optional(),
  uf: z.string().trim().length(2).optional(),
  searchTerm: z.string().trim().min(0).max(100).optional(),
  sortBy: z.enum(['nome', 'partido', 'uf', 'gasto']).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(200).optional(),
})
interface GetDeputadosFilters {
  ano?: string;
  partido?: string;
  uf?: string;
  searchTerm?: string;
  sortBy?: 'nome' | 'partido' | 'uf' | 'gasto';
  page?: number;
  pageSize?: number;
}

export async function getDeputados(
  filters: GetDeputadosFilters = {},
): Promise<{
  deputados: DeputadoResumo[]
  total: number
  partidos: string[]
  ufs: string[]
  stats: {
    total: number
    totalGasto: number
    mediaGasto: number
  }
}> {
  const parsedFilters = deputadosFiltersSchema.safeParse(filters)
  const { ano, partido, uf, searchTerm, sortBy, page, pageSize } = parsedFilters.success
    ? parsedFilters.data
    : { ano: undefined, partido: undefined, uf: undefined, searchTerm: undefined, sortBy: undefined, page: 1, pageSize: 50 }

  let rawDeputados: any[] = []
  try {
    const parsed = parseDeputiesCache(await loadDeputiesCache())
    rawDeputados = parsed.deputados
  } catch (err) {
    console.error('[Zod Validation] deputies cache invalid, fallback to empty array', err)
  }

  if (rawDeputados.length === 0) {
    return { deputados: [], total: 0, partidos: [], ufs: [], stats: { total: 0, totalGasto: 0, mediaGasto: 0 } }
  }

  const allDeputados = rawDeputados.map(normalizeDeputado)

  const partidos = Array.from(new Set(allDeputados.map((d) => d.siglaPartido))).sort()
  const ufs = Array.from(new Set(allDeputados.map((d) => d.siglaUf))).sort()
  const totalGasto = allDeputados.reduce((sum, d) => {
    const anoNum = ano ? parseInt(ano, 10) : undefined
    const gastoDoAno = anoNum ? d.gastosPorAno[anoNum] || 0 : Object.values(d.gastosPorAno).reduce((s, v) => s + v, 0)
    return sum + gastoDoAno
  }, 0)

  let stats = {
    total: 0,
    totalGasto: 0,
    mediaGasto: 0,
  }

  let deputadosFiltrados = allDeputados
  if (partido) {
    deputadosFiltrados = deputadosFiltrados.filter((d) => d.siglaPartido === partido)
  }
  if (uf) {
    deputadosFiltrados = deputadosFiltrados.filter((d) => d.siglaUf === uf)
  }
  if (searchTerm) {
    const term = searchTerm.toLowerCase()
    deputadosFiltrados = deputadosFiltrados.filter((d) => d.nomeEleitoral.toLowerCase().includes(term))
  }

  // Mapeia para um objeto com o total de despesas ANTES de ordenar
  const deputadosComDespesas = deputadosFiltrados.map((d) => {
    const anoNum = ano ? parseInt(ano, 10) : undefined
    const totalDespesas = anoNum
      ? d.gastosPorAno[anoNum] || 0
      : Object.values(d.gastosPorAno).reduce((s, v) => s + v, 0)
    const totalFinal = totalDespesas > 0 ? totalDespesas : (d.totalDespesasRaw ?? 0)
    return { ...d, totalDespesas: totalFinal }
  })

  switch (sortBy) {
    case 'nome':
      deputadosComDespesas.sort((a, b) => a.nomeEleitoral.localeCompare(b.nomeEleitoral))
      break
    case 'partido':
      deputadosComDespesas.sort((a, b) => a.siglaPartido.localeCompare(b.siglaPartido))
      break
    case 'uf':
      deputadosComDespesas.sort((a, b) => a.siglaUf.localeCompare(b.siglaUf))
      break
    case 'gasto':
    default:
      deputadosComDespesas.sort((a, b) => b.totalDespesas - a.totalDespesas)
      break
  }

  // Fallback para stats usando ETL por-deputado quando totalDespesas ficar 0
  let totalGastoStats = 0
  for (const d of deputadosComDespesas) {
    let t = d.totalDespesas
    if (!t || t === 0) {
      try {
        const detalhes = await readTransacoesFile(d.id)
        if (detalhes && Array.isArray(detalhes.despesas)) {
          t = detalhes.despesas.reduce((s, tr) => s + (typeof tr.valorLiquido === 'number' ? tr.valorLiquido : (typeof tr.valorDocumento === 'number' ? tr.valorDocumento : 0)), 0)
        }
      } catch { }
    }
    totalGastoStats += t || 0
  }
  stats = {
    total: deputadosFiltrados.length,
    totalGasto: totalGastoStats,
    mediaGasto: deputadosFiltrados.length > 0 ? totalGastoStats / deputadosFiltrados.length : 0,
  }

  const total = deputadosComDespesas.length
  const safePageD = Math.max(1, Math.min(1000000, page ?? 1))
  const safeSizeD = Math.max(1, Math.min(200, pageSize ?? 50))
  const start = (safePageD - 1) * safeSizeD
  const end = start + safeSizeD
  const deputadosPaginados = deputadosComDespesas.slice(start, end)

  // Mapeia para o tipo de resumo final
  const deputadosResumo: DeputadoResumo[] = []
  for (const d of deputadosPaginados) {
    let totalDespesasComputed = d.totalDespesas
    let numeroDespesasComputed = (() => {
      const anoNum = ano ? parseInt(ano, 10) : undefined
      if (anoNum && d.transacoesPorAno) {
        return d.transacoesPorAno[anoNum] || 0
      }
      if (d.transacoesPorAno) {
        return Object.values(d.transacoesPorAno).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0)
      }
      return typeof d.totalTransacoes === 'number' ? d.totalTransacoes : 0
    })()

    if (!totalDespesasComputed || totalDespesasComputed === 0) {
      try {
        const detalhes = await readTransacoesFile(d.id)
        if (detalhes && Array.isArray(detalhes.despesas)) {
          totalDespesasComputed = detalhes.despesas.reduce((s, t) => s + (typeof t.valorLiquido === 'number' ? t.valorLiquido : (typeof t.valorDocumento === 'number' ? t.valorDocumento : 0)), 0)
          numeroDespesasComputed = detalhes.despesas.length
        }
      } catch { }
    }

    deputadosResumo.push({
      id: d.id,
      nomeEleitoral: d.nomeEleitoral,
      siglaPartido: d.siglaPartido,
      siglaUf: d.siglaUf,
      urlFoto: d.urlFoto,
      totalDespesas: totalDespesasComputed,
      numeroDespesas: numeroDespesasComputed,
      scoreSuspeicao: typeof d.scoreSuspeicao === 'number' ? d.scoreSuspeicao : undefined,
      alertas: typeof d.numAlertas === 'number' ? d.numAlertas : undefined,
    })
  }

  return { deputados: deputadosResumo, total, partidos, ufs, stats }
}

const readTransacoesFile = cache(async (deputadoId: string): Promise<DeputadoDetalhado | null> => {
  // Suporta duas convenções para ETL_OUTPUT_DIR:
  // 1) ETL_OUTPUT_DIR aponta para ".../congressoNacional"
  // 2) ETL_OUTPUT_DIR aponta para ".../congressoNacional/cache" (neste caso subimos um nível)
  const ENV_ETL_DIR = process.env.ETL_OUTPUT_DIR
  const etlRoot = (() => {
    if (!ENV_ETL_DIR) return null
    const parts = ENV_ETL_DIR.replace(/\\/g, '/').split('/')
    if (parts[parts.length - 1] === 'cache') {
      return parts.slice(0, -1).join('/')
    }
    return ENV_ETL_DIR
  })()

  const canonicalRoot = join(
    process.cwd(),
    '..',
    '..',
    'bancoDados',
    'monitordespesas',
    'congressoNacional'
  )

  const baseCandidates = [etlRoot, canonicalRoot].filter(Boolean) as string[]
  const relativeDeputadoPath = ['camaraDeputados', 'deputadosFederais', 'idDeputados', deputadoId, 'dados_completos.json']

  for (const base of baseCandidates) {
    const etlFilePath = join(base, ...relativeDeputadoPath)
    try {
      const fileContent = await readFile(etlFilePath, 'utf-8')
      const json = JSON.parse(fileContent)
      try {
        const parsed = parseDadosCompletosDeputado(json)
        return { ...json, despesas: parsed.despesas } as DeputadoDetalhado
      } catch (zerr) {
        console.error('[Zod Validation] dados_completos invalid, returning raw JSON', zerr)
        return json as DeputadoDetalhado
      }
    } catch { }
  }

  console.error(`[Server Action Error] Failed to read ETL per-deputado file for ${deputadoId} from candidates: ${baseCandidates.join(' | ')}`)
  return null
});

export async function getDeputadoById(id: string): Promise<DeputadoResumo | undefined> {
  let rawDeputados: any[] = []
  try {
    const parsed = parseDeputiesCache(await loadDeputiesCache())
    rawDeputados = parsed.deputados
  } catch (err) {
    console.error('[Zod Validation] deputies cache invalid, fallback to empty array', err)
  }

  let rawDeputado = rawDeputados.find((d) => String(d.id) === id)

  // Fallback: try to load from individual file if not in cache
  if (!rawDeputado) {
    try {
      const detalhes = await readTransacoesFile(id)
      if (detalhes) {
        rawDeputado = detalhes
      }
    } catch (err) {
      console.error(`Failed to load individual deputy file for ${id}`, err)
    }
  }

  if (!rawDeputado) return undefined

  const deputado = normalizeDeputado(rawDeputado)
  const totalDespesas = Object.values(deputado.gastosPorAno).reduce((s, v) => s + v, 0)

  return {
    id: deputado.id,
    nomeEleitoral: deputado.nomeEleitoral,
    siglaPartido: deputado.siglaPartido,
    siglaUf: deputado.siglaUf,
    urlFoto: deputado.urlFoto,
    totalDespesas,
    numeroDespesas: 0,
  }
}

export async function getTransacoesDeputado({
  deputadoId,
  page = 1,
  pageSize = 50,
  ano,
  mes,
  categoria,
  busca,
  ordenacao = 'data-desc',
}: {
  deputadoId: string;
  page?: number;
  pageSize?: number;
  ano?: string;
  mes?: string;
  categoria?: string;
  busca?: string;
  ordenacao?: 'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc' | 'fornecedor';
}): Promise<{ transacoes: DespesaDetalhada[]; total: number }> {
  const data = await readTransacoesFile(deputadoId);

  if (!data) {
    return { transacoes: [], total: 0 };
  }

  let allTransactions = data.despesas || [];

  if (ano && ano !== 'all') {
    const anoNum = parseInt(ano);
    allTransactions = allTransactions.filter(t => {
      const year = t.dataDocumento ? new Date(t.dataDocumento).getFullYear() : 0;
      return year === anoNum;
    });
  }

  if (mes && mes !== 'todos') {
    const mesNum = parseInt(mes);
    allTransactions = allTransactions.filter(t => {
      const month = t.dataDocumento ? new Date(t.dataDocumento).getMonth() + 1 : 0;
      return month === mesNum;
    });
  }

  if (categoria && categoria !== 'todas') {
    allTransactions = allTransactions.filter(t =>
      t.tipoDespesa?.toLowerCase().includes(categoria.toLowerCase())
    );
  }

  if (busca && busca.trim()) {
    const termo = busca.toLowerCase();
    allTransactions = allTransactions.filter(t =>
      t.nomeFornecedor?.toLowerCase().includes(termo) ||
      t.tipoDespesa?.toLowerCase().includes(termo)
    );
  }

  switch (ordenacao) {
    case 'data-desc':
      allTransactions.sort((a, b) => new Date(b.dataDocumento || 0).getTime() - new Date(a.dataDocumento || 0).getTime());
      break;
    case 'data-asc':
      allTransactions.sort((a, b) => new Date(a.dataDocumento || 0).getTime() - new Date(b.dataDocumento || 0).getTime());
      break;
    case 'valor-desc':
      allTransactions.sort((a, b) => (b.valorLiquido || 0) - (a.valorLiquido || 0));
      break;
    case 'valor-asc':
      allTransactions.sort((a, b) => (a.valorLiquido || 0) - (b.valorLiquido || 0));
      break;
    case 'fornecedor':
      allTransactions.sort((a, b) => (a.nomeFornecedor || '').localeCompare(b.nomeFornecedor || ''));
      break;
    default:
      allTransactions.sort((a, b) => new Date(b.dataDocumento || 0).getTime() - new Date(a.dataDocumento || 0).getTime());
  }

  const total = allTransactions.length;
  const safePage = Math.max(1, Math.min(1000000, page))
  const safeSize = Math.max(1, Math.min(200, pageSize))
  const start = (safePage - 1) * safeSize
  const end = start + safeSize
  const transacoes = allTransactions.slice(start, end);

  return { transacoes, total };
}


export async function getAnalisesSuspeitas() {
  try {
    const parsed = parseAnalysisCache(await loadAnalysisCache())
    return {
      alertas: parsed.alertas,
      fornecedoresSuspeitos: parsed.fornecedoresSuspeitos,
    }
  } catch (err) {
    console.error('[Zod Validation] analysis cache invalid, fallback to empty arrays', err)
    return { alertas: [], fornecedoresSuspeitos: [] }
  }
}

/**
 * Busca premiações globais do cache materialize.
 */
export async function getPremiacoesGlobais() {
  try {
    const parsed = parsePremiacoesCache(await loadPremiacoesCache())
    return parsed.premiacoes
  } catch (err) {
    console.error('[Zod Validation] premiacoes cache invalid, fallback to empty arrays', err)
    return { coroas: [], trofeus: [], medalhas: [] }
  }
}

// Helper function to convert DeputadoUnificado to DeputadoProcessado
function convertToDeputadoProcessado(deputado: DeputadoUnificado): any {
  const totalGastos = Object.values(deputado.gastosPorAno).reduce((s, v) => s + v, 0);
  const totalTransacoes = deputado.totalTransacoes || 0;

  return {
    id: deputado.id,
    nomeEleitoral: deputado.nomeEleitoral,
    nome: deputado.nome,
    nomeCivil: deputado.nome,
    siglaPartido: deputado.siglaPartido,
    partido: deputado.siglaPartido,
    siglaUf: deputado.siglaUf,
    uf: deputado.siglaUf,
    foto: deputado.urlFoto,
    totalGastos,
    totalTransacoes,
    mediaTransacao: totalTransacoes > 0 ? totalGastos / totalTransacoes : 0,
    gastosPorAno: deputado.gastosPorAno,
    transacoesPorAno: deputado.transacoesPorAno || {},
    topCategorias: [], // Will be populated if needed
    topFornecedores: [],
    scoreSuspeicao: 0,
    classificacaoRisco: 'Baixo' as const,
    alertas: [],
    ultimaAtualizacao: new Date().toISOString(),
    anosDisponiveis: deputado.anosDisponiveis,
    dadosCompletos: true,
    fornecedoresIdentificados: 0,

  };
}

export async function getPremiacoes(filters: { ano?: string; categoria?: string; uf?: string } = {}) {
  // Import utility functions
  const { getRankingGeral, getRankingPorAno, getRankingPorCategoria, getRankingFiltrado, calcularEstatisticasRanking } = await import('../features/premiacoes/services/unified-ranking-service');
  const { processarPremiacoes, identificarCampeaoGeral } = await import('../features/premiacoes/services/premiacao-unificada');

  const rawCacheData = await loadDeputiesCache()

  if (!rawCacheData || !Array.isArray(rawCacheData.deputados)) {
    return {
      rankingsFiltrados: [],
      estatisticas: { totalDeputados: 0, campeao: 'N/A', maiorGasto: 0 },
      metadata: {
        anosDisponiveis: [],
        categoriasDisponiveis: [],
        ufsDisponiveis: [],
        lastUpdate: new Date().toISOString(),
        totalPremiacoes: 0,
      },
      premiacoes: {
        coroas: [],
        trofeus: [],
        medalhas: [],
      },
    };
  }

  // Normalize deputados data
  const deputadosUnificados = rawCacheData.deputados.map(normalizeDeputado);
  const allDeputados = deputadosUnificados.map(convertToDeputadoProcessado);

  // Extract metadata
  const anosSet = new Set<number>();
  deputadosUnificados.forEach(dep => dep.anosDisponiveis.forEach(a => anosSet.add(a)));
  const anosDisponiveis = Array.from(anosSet).sort((a, b) => b - a);

  // Extract categories from raw data if available
  const categoriasSet = new Set<string>();
  rawCacheData.deputados.forEach((dep: any) => {
    if (dep.topCategorias && Array.isArray(dep.topCategorias)) {
      dep.topCategorias.forEach((cat: any) => {
        if (cat.categoria) categoriasSet.add(cat.categoria);
      });
    }
  });
  const categoriasDisponiveis = Array.from(categoriasSet).sort();

  const ufsSet = new Set(allDeputados.map(d => d.siglaUf).filter(Boolean));
  const ufsDisponiveis = Array.from(ufsSet).sort();

  // Apply filters using utility functions
  const filtrosRanking = {
    ano: filters.ano && filters.ano !== 'todos' ? parseInt(filters.ano) : 'todos' as const,
    categoria: filters.categoria || 'TODAS' as const,
    uf: filters.uf || 'TODAS' as const,
  };

  const rankingFiltrado = getRankingFiltrado(allDeputados, filtrosRanking);

  // Compute all rankings for premiações
  const rankingGeral = getRankingGeral(allDeputados);

  const porCategoria: Record<string, typeof allDeputados> = {};
  categoriasDisponiveis.forEach(categoria => {
    porCategoria[categoria] = getRankingPorCategoria(allDeputados, categoria);
  });

  const porAno: Record<number, typeof allDeputados> = {};
  anosDisponiveis.forEach(ano => {
    porAno[ano] = getRankingPorAno(allDeputados, ano);
  });

  const estatisticasGerais = calcularEstatisticasRanking(rankingGeral);

  const rankings = {
    geral: rankingGeral,
    porCategoria,
    porAno,
    estatisticas: {
      ...estatisticasGerais,
      medianaGastos: 0, // TODO: implement if needed
    },
  };

  // Process premiações using utility functions
  const premiacoesProcessadas = processarPremiacoes(allDeputados, rankings);
  const campeaoGeral = identificarCampeaoGeral(allDeputados);

  // Map filtered ranking to expected format
  const rankingsFiltrados = rankingFiltrado.map((d, index) => ({
    id: String(d.id),
    nome: d.nomeEleitoral,
    partido: d.siglaPartido,
    uf: d.siglaUf,
    totalDespesas: d.totalGastos,
    numeroDespesas: d.totalTransacoes,
    fornecedoresIdentificados: d.fornecedoresIdentificados,
    posicao: index + 1,
    porAno: d.gastosPorAno,
  }));

  return {
    rankingsFiltrados,
    estatisticas: {
      totalDeputados: rankingsFiltrados.length,
      campeao: campeaoGeral?.nomeEleitoral || 'N/A',
      maiorGasto: campeaoGeral?.valorTotal || 0,
    },
    metadata: {
      anosDisponiveis,
      categoriasDisponiveis,
      ufsDisponiveis,
      lastUpdate: new Date().toISOString(),
      totalPremiacoes: premiacoesProcessadas.estatisticas.totalPremiacoes,
    },
    premiacoes: {
      coroas: premiacoesProcessadas.coroas,
      trofeus: premiacoesProcessadas.trofeus,
      medalhas: premiacoesProcessadas.medalhas,
    },
  };
}

export async function getDeputadosByIds(ids: string[]): Promise<DeputadoResumo[]> {
  if (ids.length === 0) return [];

  const rawCacheData = await loadDeputiesCache()
  if (!rawCacheData) return []

  let rawDeputados: any[] = []
  if (Array.isArray(rawCacheData)) {
    rawDeputados = rawCacheData as any[]
  } else if (Array.isArray((rawCacheData as any).deputados)) {
    rawDeputados = (rawCacheData as any).deputados
  } else if (typeof (rawCacheData as any).data === 'object' && Array.isArray((rawCacheData as any).data.deputados)) {
    rawDeputados = (rawCacheData as any).data.deputados
  }

  if (!Array.isArray(rawDeputados) || rawDeputados.length === 0) return []

  const allDeputados = rawDeputados.map(normalizeDeputado)
  const idSet = new Set(ids);

  const deputados = allDeputados
    .filter(d => idSet.has(d.id))
    .map(d => {
      const totalDespesas = Object.values(d.gastosPorAno).reduce((s, v) => s + v, 0);
      return {
        id: d.id,
        nomeEleitoral: d.nomeEleitoral,
        siglaPartido: d.siglaPartido,
        siglaUf: d.siglaUf,
        urlFoto: d.urlFoto,
        totalDespesas,
        numeroDespesas: 0,
      };
    });

  return deputados;
}

export async function getComparisonData(ids: string[]): Promise<any[]> {
  if (ids.length === 0) return [];

  const rawCacheData = await loadDeputiesCache()
  if (!rawCacheData) return []

  let rawDeputados: any[] = []
  if (Array.isArray(rawCacheData)) {
    rawDeputados = rawCacheData as any[]
  } else if (Array.isArray((rawCacheData as any).deputados)) {
    rawDeputados = (rawCacheData as any).deputados
  } else if (typeof (rawCacheData as any).data === 'object' && Array.isArray((rawCacheData as any).data.deputados)) {
    rawDeputados = (rawCacheData as any).data.deputados
  }

  if (!Array.isArray(rawDeputados) || rawDeputados.length === 0) return []

  const allDeputados = rawDeputados.map(normalizeDeputado)
  const idSet = new Set(ids);

  return allDeputados.filter(d => idSet.has(d.id))
}

export async function getTopDeputadosPorCategoria(categoria: string, limit: number = 10): Promise<{
  ranking: Array<{ deputadoId: string; nomeEleitoral: string; foto?: string; numeroTransacoes: number; totalGasto: number; fornecedorTopNome?: string }>
}> {
  if (!categoria || categoria.trim() === '') return { ranking: [] }
  const rawCacheData = await loadDeputiesCache()
  if (!rawCacheData || !Array.isArray((rawCacheData as any).deputados)) return { ranking: [] }

  const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
  const target = norm(categoria)

  const ranking: Array<{ deputadoId: string; nomeEleitoral: string; foto?: string; numeroTransacoes: number; totalGasto: number; fornecedorTopNome?: string }> = []

    ; ((rawCacheData as any).deputados as any[]).forEach((dep: any) => {
      const nomeEleitoral: string = dep?.nomeEleitoral || dep?.nome || ''
      const deputadoId: string = String(dep?.id || dep?.codigo || dep?.codigoDeputado || dep?.deputadoId || '')
      const foto: string | undefined = dep?.urlFoto || dep?.foto || undefined

      let totalGasto = 0
      let numeroTransacoes = 0
      let fornecedorTopNome: string | undefined = undefined

      // Tentativa 1: usar topo de categorias do deputado
      if (Array.isArray(dep?.topCategorias)) {
        const match = dep.topCategorias.find((c: any) => norm(c?.categoria || '') === target)
        if (match) {
          totalGasto = Number(match?.valor || match?.total || 0)
          numeroTransacoes = Number(match?.transacoes || match?.numeroTransacoes || 0)
        }
      }

      // Tentativa 2: fallback procurando listas por categoria em outras estruturas
      if (totalGasto === 0 && Array.isArray(dep?.categorias)) {
        const match2 = dep.categorias.find((c: any) => norm(c?.categoria || '') === target)
        if (match2) {
          totalGasto = Number(match2?.valor || match2?.total || 0)
          numeroTransacoes = Number(match2?.transacoes || match2?.numeroTransacoes || 0)
        }
      }

      // Fornecedor mais gasto (melhor esforço)
      if (Array.isArray(dep?.topFornecedores) && dep.topFornecedores.length > 0) {
        const sorted = [...dep.topFornecedores].sort((a: any, b: any) => Number(b?.valor || b?.total || 0) - Number(a?.valor || a?.total || 0))
        fornecedorTopNome = sorted[0]?.nome || sorted[0]?.fornecedor || undefined
      }

      if (totalGasto > 0) {
        ranking.push({ deputadoId, nomeEleitoral, foto, numeroTransacoes, totalGasto, fornecedorTopNome })
      }
    })

  ranking.sort((a, b) => b.totalGasto - a.totalGasto)
  const limited = ranking.slice(0, Math.max(1, Math.min(limit, 50)))
  return { ranking: limited }
}

export async function getDashboardData(filters: {
  ano?: string;
  partido?: string;
  uf?: string;
  page?: number;
  pageSize?: number;
  partidosPage?: number;
}) {
  const { ano, partido, uf, page = 1, pageSize = 5, partidosPage = 1 } = filters;

  const rawDeputadosData = await loadDeputiesCache()
  const { fornecedores: allFornecedores, total: totalFornecedores } = await getFornecedores();

  if (!rawDeputadosData || !rawDeputadosData.deputados) {
    return null;
  }

  const allDeputados = rawDeputadosData.deputados.map(normalizeDeputado);

  let deputadosFiltrados = allDeputados;
  if (partido && partido !== 'TODOS') {
    deputadosFiltrados = deputadosFiltrados.filter(d => d.siglaPartido === partido);
  }
  if (uf && uf !== 'TODOS') {
    deputadosFiltrados = deputadosFiltrados.filter(d => d.siglaUf === uf);
  }

  const getGastoTotal = (dep: DeputadoUnificado, ano?: number) => {
    if (ano) {
      return dep.gastosPorAno[ano] || 0;
    }
    return Object.values(dep.gastosPorAno).reduce((sum, val) => sum + val, 0);
  };

  const getTransacoesTotal = (dep: DeputadoUnificado, ano?: number) => {
    if (ano && dep.transacoesPorAno) {
      return dep.transacoesPorAno[ano] || 0;
    }
    return dep.totalTransacoes || 0;
  };

  const anoNum = ano && ano !== 'all' ? parseInt(ano) : undefined;

  const totalGasto = deputadosFiltrados.reduce((sum, d) => sum + getGastoTotal(d, anoNum), 0);
  const totalTransacoes = deputadosFiltrados.reduce((sum, d) => sum + getTransacoesTotal(d, anoNum), 0);
  const totalDeputados = deputadosFiltrados.length;
  const mediaGastoPorDeputado = totalDeputados > 0 ? totalGasto / totalDeputados : 0;

  const topDeputados = deputadosFiltrados
    .map(d => ({
      id: d.id,
      nome: d.nomeEleitoral,
      partido: d.siglaPartido,
      uf: d.siglaUf,
      totalGasto: getGastoTotal(d, anoNum),
      posicao: 0, // Will be set after sorting
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto)
    .map((d, i) => ({ ...d, posicao: i + 1 }))
    .slice((page - 1) * pageSize, page * pageSize);

  const topFornecedoresItems = allFornecedores
    .map(f => ({
      id: f.id,
      nome: f.nome,
      cnpj: f.cnpjCpf || '',
      valor: anoNum
        ? f.anos?.find(a => a.ano === anoNum)?.total || 0
        : f.totalRecebido,
      scoreSuspeicao: 0,
      numTransacoes: anoNum
        ? f.anos?.find(a => a.ano === anoNum)?.numeroTransacoes || 0
        : f.numeroTransacoes,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);

  const gastosPorPartidoMap = new Map<string, { total: number; count: number }>();
  deputadosFiltrados.forEach(d => {
    const p = d.siglaPartido;
    const gasto = getGastoTotal(d, anoNum);
    const current = gastosPorPartidoMap.get(p) || { total: 0, count: 0 };
    gastosPorPartidoMap.set(p, { total: current.total + gasto, count: current.count + 1 });
  });

  const gastosPorPartido = Array.from(gastosPorPartidoMap.entries())
    .map(([partido, { total, count }]) => ({
      partido,
      totalGasto: total,
      numDeputados: count,
      mediaPorDeputado: count > 0 ? total / count : 0
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto);

  const paginatedPartidos = gastosPorPartido.slice((partidosPage - 1) * 10, partidosPage * 10);

  const gastosPorUFMap = new Map<string, { total: number; count: number }>();
  deputadosFiltrados.forEach(d => {
    const u = d.siglaUf;
    const gasto = getGastoTotal(d, anoNum);
    const current = gastosPorUFMap.get(u) || { total: 0, count: 0 };
    gastosPorUFMap.set(u, { total: current.total + gasto, count: current.count + 1 });
  });

  const gastosPorUF = Array.from(gastosPorUFMap.entries())
    .map(([uf, { total, count }]) => ({
      uf,
      totalGasto: total,
      numDeputados: count,
      mediaPorDeputado: count > 0 ? total / count : 0
    }))
    .sort((a, b) => b.totalGasto - a.totalGasto);

  const anosSet = new Set<number>();
  allDeputados.forEach(d => {
    d.anosDisponiveis.forEach(a => anosSet.add(a));
  });

  const resumoAnual = Array.from(anosSet)
    .sort((a, b) => a - b)
    .map(a => ({
      ano: a,
      total: deputadosFiltrados.reduce((sum, d) => sum + getGastoTotal(d, a), 0),
    }));

  return {
    data: topDeputados,
    pagination: {
      page,
      pageSize,
      totalItems: totalDeputados,
      totalPages: Math.ceil(totalDeputados / pageSize),
    },
    aggregates: {
      stats: {
        totalDeputados,
        totalFornecedores,
        totalGasto,
        totalTransacoes,
        mediaPorDeputado: mediaGastoPorDeputado,
      },
      resumoAnual,
      topFornecedores: {
        items: topFornecedoresItems,
        pagination: {
          page: 1,
          pageSize: 10,
          totalItems: 10,
          totalPages: 1
        }
      },
      partidos: {
        items: paginatedPartidos,
        pagination: {
          page: partidosPage,
          pageSize: 10,
          totalItems: gastosPorPartido.length,
          totalPages: Math.ceil(gastosPorPartido.length / 10)
        }
      },
      ufs: {
        items: gastosPorUF,
        pagination: {
          page: 1,
          pageSize: 27,
          totalItems: gastosPorUF.length,
          totalPages: 1
        }
      }
    },
    metadata: {
      availableFilters: {
        anos: Array.from(anosSet).sort((a, b) => b - a),
        partidos: Array.from(gastosPorPartidoMap.keys()).sort(),
        ufs: Array.from(gastosPorUFMap.keys()).sort()
      },
      lastUpdate: new Date().toISOString()
    },
    appliedFilters: {
      ano,
      partido,
      uf,
      page,
      pageSize,
      partidosPage
    }
  };
}

export async function getComparativoCategoriasDeputado(deputadoId: string) {
  const data = await readTransacoesFile(deputadoId);

  if (!data || !data.despesas) {
    return {
      categorias: [],
      totalGasto: 0,
    };
  }

  const categoriasMap = new Map<string, number>();

  data.despesas.forEach(despesa => {
    const categoria = despesa.tipoDespesa || 'Outros';
    const valor = despesa.valorLiquido || 0;
    categoriasMap.set(categoria, (categoriasMap.get(categoria) || 0) + valor);
  });

  const categorias = Array.from(categoriasMap.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);

  const totalGasto = categorias.reduce((sum, c) => sum + c.total, 0);

  return {
    categorias,
    totalGasto,
  };
}

export async function getRedeRelacionamentosDeputado(
  deputadoId: string,
  options?: { deputado?: DeputadoResumo }
) {
  const data = await readTransacoesFile(deputadoId);

  if (!data || !data.despesas) {
    return {
      nodes: [],
      links: [],
    };
  }

  const deputadoNode = {
    id: deputadoId,
    name: options?.deputado?.nomeEleitoral || data.metadata?.legislador?.nomeEleitoral || data.metadata?.legislador?.nome || 'Deputado',
    type: 'deputado' as const,
    value: data.despesas.reduce((sum, d) => sum + (d.valorLiquido || 0), 0),
  };

  const fornecedoresMap = new Map<string, { nome: string; total: number; count: number }>();

  data.despesas.forEach(despesa => {
    const cnpj = despesa.cnpjCpfFornecedor || 'sem-cnpj';
    const nome = despesa.nomeFornecedor || 'Fornecedor Desconhecido';
    const valor = despesa.valorLiquido || 0;

    if (!fornecedoresMap.has(cnpj)) {
      fornecedoresMap.set(cnpj, { nome, total: 0, count: 0 });
    }

    const fornecedor = fornecedoresMap.get(cnpj)!;
    fornecedor.total += valor;
    fornecedor.count += 1;
  });

  const topFornecedores = Array.from(fornecedoresMap.entries())
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 20);

  const fornecedorNodes = topFornecedores.map(([cnpj, info]) => ({
    id: cnpj,
    name: info.nome,
    type: 'fornecedor' as const,
    value: info.total,
    count: info.count,
  }));

  const links = topFornecedores.map(([cnpj, info]) => ({
    source: deputadoId,
    target: cnpj,
    value: info.total,
  }));

  return {
    nodes: [deputadoNode, ...fornecedorNodes],
    links,
  };
}


