import type BetterSqliteDatabase from 'better-sqlite3';
import type { ParsedQs } from 'qs';
import { env } from '../config/env.js';
import { openReadOnlyDatabase, DatabaseUnavailableError } from '../db/database.js';
import type {
  FornecedorResumo,
  FornecedoresMetadata,
  FornecedoresQueryParams,
  FornecedoresResponse,
  FornecedoresStatsResponse,
  FornecedorCategoria,
  FornecedorOrder,
  FornecedorAnoResumo,
  TopFornecedorResumo
} from '@a-republica/shared';

export interface NormalizedFornecedoresQuery {
  page: number;
  perPage: number;
  categoria?: string;
  search?: string;
  scoreMin?: number;
  scoreMax?: number;
  order: FornecedorOrder;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 25;
const DEFAULT_ORDER: FornecedorOrder = 'volume';

export function normalizeFornecedoresQuery(query: ParsedQs): NormalizedFornecedoresQuery {
  const coerceNumber = (value: ParsedQs[string] | string | undefined): number | undefined => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
      return coerceNumber(value[0]);
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const coerceString = (value: ParsedQs[string] | string | undefined): string | undefined => {
    if (value === undefined) return undefined;
    if (Array.isArray(value)) {
      return coerceString(value[0]);
    }

    const stringified = String(value).trim();
    return stringified.length > 0 ? stringified : undefined;
  };

  const order = coerceString(query.order) as FornecedorOrder | undefined;
  const normalizedOrder: FornecedorOrder = order && ['volume', 'transacoes', 'nome', 'score', 'ranking'].includes(order) ? order : DEFAULT_ORDER;

  const scoringMin = coerceNumber(query.scoreMin ?? query.score_min);
  const scoringMax = coerceNumber(query.scoreMax ?? query.score_max);

  const rawPage = coerceNumber(query.page) ?? DEFAULT_PAGE;
  const rawPerPage = coerceNumber(query.perPage ?? query.limit) ?? DEFAULT_PER_PAGE;

  return {
    page: rawPage > 0 ? rawPage : DEFAULT_PAGE,
    perPage: Math.min(100, rawPerPage > 0 ? rawPerPage : DEFAULT_PER_PAGE),
    categoria: coerceString(query.categoria ?? query.category),
    search: coerceString(query.search ?? query.q),
    scoreMin: scoringMin,
    scoreMax: scoringMax,
    order: normalizedOrder
  };
}

interface SqlFragments {
  whereClause: string;
  parameters: Record<string, unknown>;
}

function buildWhereClause(filters: NormalizedFornecedoresQuery): SqlFragments {
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.categoria) {
    clauses.push('LOWER(categorias) LIKE @categoria');
    params.categoria = `%"${filters.categoria.toLowerCase()}"%`;
  }

  if (filters.search) {
    clauses.push('(LOWER(nome) LIKE @searchName OR REPLACE(REPLACE(REPLACE(REPLACE(cnpj_cpf, ".", ""), "-", ""), "/", ""), " ", "") LIKE @searchDoc)');
    params.searchName = `%${filters.search.toLowerCase()}%`;
    params.searchDoc = `%${filters.search.replace(/\D/g, '')}%`;
  }

  if (filters.scoreMin !== undefined) {
    clauses.push('score_suspeicao >= @scoreMin');
    params.scoreMin = filters.scoreMin;
  }

  if (filters.scoreMax !== undefined) {
    clauses.push('score_suspeicao <= @scoreMax');
    params.scoreMax = filters.scoreMax;
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

  return { whereClause, parameters: params };
}

function resolveOrder(order: FornecedorOrder): string {
  switch (order) {
    case 'transacoes':
      return 'numero_transacoes DESC, total_recebido DESC';
    case 'nome':
      return 'nome ASC';
    case 'score':
      return 'score_suspeicao ASC NULLS LAST';
    case 'ranking':
      return 'ranking ASC NULLS LAST';
    case 'volume':
    default:
      return 'total_recebido DESC';
  }
}

interface RawFornecedorRow {
  id: number | string;
  nome: string;
  cnpj_cpf: string | null;
  tipo_fornecedor: string | null;
  tipo_despesa_principal: string | null;
  total_recebido: number | null;
  numero_transacoes: number | null;
  numero_deputados: number | null;
  score_suspeicao: number | null;
  categorias: string | null;
  anos: string | null;
  ranking: number | null;
  created_at?: string | null;
}

function parseCategorias(raw: string | null | undefined): FornecedorCategoria[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed
      .map(entry => {
        const categoria = typeof entry.categoria === 'string' ? entry.categoria : typeof entry.nome === 'string' ? entry.nome : undefined;
        const total = typeof entry.total === 'number' ? entry.total : typeof entry.valor === 'number' ? entry.valor : undefined;
        const percentual = typeof entry.percentual === 'number' ? entry.percentual : undefined;

        if (!categoria || total === undefined) {
          return undefined;
        }

        return { categoria, total, percentual } satisfies FornecedorCategoria;
      })
      .filter((entry): entry is FornecedorCategoria => Boolean(entry));
  } catch (error) {
    console.warn('[fornecedores] Falha ao parsear categorias', error);
    return [];
  }
}

function parseAnos(raw: string | null | undefined): FornecedorAnoResumo[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>> | Record<string, unknown>;

    if (Array.isArray(parsed)) {
      return parsed
        .map(entry => {
          const ano = typeof entry.ano === 'number' ? entry.ano : typeof entry.year === 'number' ? entry.year : undefined;
          const total = typeof entry.total === 'number' ? entry.total : typeof entry.valor === 'number' ? entry.valor : undefined;
          const numeroTransacoes = typeof entry.numeroTransacoes === 'number' ? entry.numeroTransacoes : typeof entry.transacoes === 'number' ? entry.transacoes : undefined;
          const numeroDeputados = typeof entry.numeroDeputados === 'number' ? entry.numeroDeputados : undefined;

          if (ano === undefined || total === undefined) return undefined;
          return { ano, total, numeroTransacoes, numeroDeputados } satisfies FornecedorAnoResumo;
        })
        .filter((entry): entry is FornecedorAnoResumo => Boolean(entry));
    }

    const entries: FornecedorAnoResumo[] = [];
    for (const [key, value] of Object.entries(parsed)) {
      const ano = Number(key);
      if (!Number.isFinite(ano)) continue;
      if (typeof value === 'number') {
        entries.push({ ano, total: value });
      } else if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>;
        const total = typeof obj.total === 'number' ? obj.total : typeof obj.valor === 'number' ? obj.valor : undefined;
        const numeroTransacoes = typeof obj.numeroTransacoes === 'number' ? obj.numeroTransacoes : typeof obj.transacoes === 'number' ? obj.transacoes : undefined;
        const numeroDeputados = typeof obj.numeroDeputados === 'number' ? obj.numeroDeputados : undefined;
        if (total !== undefined) {
          entries.push({ ano, total, numeroTransacoes, numeroDeputados });
        }
      }
    }

    return entries;
  } catch (error) {
    console.warn('[fornecedores] Falha ao parsear anos', error);
    return [];
  }
}

function mapRowToFornecedor(row: RawFornecedorRow): FornecedorResumo {
  return {
    id: row.id,
    nome: row.nome,
    cnpjCpf: row.cnpj_cpf,
    tipoFornecedor: row.tipo_fornecedor,
    tipoDespesaPrincipal: row.tipo_despesa_principal,
    totalRecebido: Number(row.total_recebido ?? 0),
    numeroTransacoes: Number(row.numero_transacoes ?? 0),
    numeroDeputados: Number(row.numero_deputados ?? 0),
    scoreSuspeicao: row.score_suspeicao === null || row.score_suspeicao === undefined ? null : Number(row.score_suspeicao),
    ranking: row.ranking === null || row.ranking === undefined ? null : Number(row.ranking),
    categorias: parseCategorias(row.categorias),
    anos: parseAnos(row.anos),
    createdAt: row.created_at ?? null
  };
}

interface AggregateRow {
  total: number;
  totalVolume: number | null;
  totalTransacoes: number | null;
  avgScore: number | null;
  fornecedoresComDeputados: number | null;
}

function computeAggregates(summary: AggregateRow): FornecedoresMetadata['totals'] {
  const totalVolume = Number(summary.totalVolume ?? 0);
  const totalTransacoes = Number(summary.totalTransacoes ?? 0);
  const fornecedoresComDeputados = Number(summary.fornecedoresComDeputados ?? 0);
  const mediaIndice = summary.avgScore === null || summary.avgScore === undefined ? null : Number((100 - summary.avgScore).toFixed(2));

  return { totalVolume, totalTransacoes, fornecedoresComDeputados, mediaIndice };
}

type RowWithCategorias = { categorias: string | null };

function collectCategorias(rows: RowWithCategorias[]): FornecedorCategoria[] {
  const accumulator = new Map<string, number>();

  for (const row of rows) {
    const categorias = parseCategorias(row.categorias);
    for (const categoria of categorias) {
      const key = categoria.categoria;
      const current = accumulator.get(key) ?? 0;
      accumulator.set(key, current + categoria.total);
    }
  }

  const entries = Array.from(accumulator.entries()).map(([categoria, total]) => ({ categoria, total }));
  const totalVolume = entries.reduce((acc, item) => acc + item.total, 0);

  return entries
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(entry => {
      const percentual = totalVolume > 0 ? Number(((entry.total / totalVolume) * 100).toFixed(2)) : undefined;
      return { categoria: entry.categoria, total: entry.total, percentual } satisfies FornecedorCategoria;
    });
}

type RowWithAnos = { anos: string | null };

function collectAnos(rows: RowWithAnos[]): number[] {
  const anos = new Set<number>();
  for (const row of rows) {
    for (const entry of parseAnos(row.anos)) {
      anos.add(entry.ano);
    }
  }
  return Array.from(anos.values()).sort((a, b) => a - b);
}

function collectTopFornecedores(rows: RawFornecedorRow[]): TopFornecedorResumo[] {
  return rows
    .map(row => ({
      id: row.id,
      nome: row.nome,
      cnpjCpf: row.cnpj_cpf,
      totalRecebido: Number(row.total_recebido ?? 0),
      numeroTransacoes: Number(row.numero_transacoes ?? 0),
      numeroDeputados: Number(row.numero_deputados ?? 0),
      scoreSuspeicao: row.score_suspeicao === null || row.score_suspeicao === undefined ? null : Number(row.score_suspeicao),
      ranking: row.ranking === null || row.ranking === undefined ? null : Number(row.ranking)
    }))
    .sort((a, b) => b.totalRecebido - a.totalRecebido)
    .slice(0, 5);
}

function runWithDatabase<T>(handler: (db: BetterSqliteDatabase) => T): T {
  const db = openReadOnlyDatabase(env.sqliteDbPath);
  try {
    return handler(db);
  } finally {
    db.close();
  }
}

export function getFornecedores(query: NormalizedFornecedoresQuery): FornecedoresResponse {
  return runWithDatabase(db => {
    const { whereClause, parameters } = buildWhereClause(query);
    const orderClause = resolveOrder(query.order);

    const aggregateStatement = db.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(total_recebido) as totalVolume,
        SUM(numero_transacoes) as totalTransacoes,
        AVG(score_suspeicao) as avgScore,
        SUM(CASE WHEN numero_deputados > 0 THEN 1 ELSE 0 END) as fornecedoresComDeputados
      FROM fornecedores
      ${whereClause}`
    );

    const baseSelect = `SELECT
        id,
        nome,
        cnpj_cpf,
        tipo_fornecedor,
        tipo_despesa_principal,
        total_recebido,
        numero_transacoes,
        numero_deputados,
        score_suspeicao,
        categorias,
        anos,
        ranking,
        created_at
      FROM fornecedores
      ${whereClause}`;

    const fullDatasetStatement = db.prepare(baseSelect);

    const paginatedStatement = db.prepare(
      `${baseSelect}
       ORDER BY ${orderClause}
       LIMIT @limit OFFSET @offset`
    );

    const offset = Math.max(0, (query.page - 1) * query.perPage);

    const summary = aggregateStatement.get(parameters) as AggregateRow;
    const allRows = fullDatasetStatement.all(parameters) as RawFornecedorRow[];

    const paginatedRows = paginatedStatement.all({ ...parameters, limit: query.perPage, offset }) as RawFornecedorRow[];

    const fornecedores = paginatedRows.map(mapRowToFornecedor);

    const metadata: FornecedoresMetadata = {
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total: Number(summary.total ?? 0),
        pageCount: Math.max(1, Math.ceil((Number(summary.total ?? 0) || 0) / query.perPage))
      },
      totals: computeAggregates(summary),
      categories: collectCategorias(allRows),
      topFornecedores: collectTopFornecedores(allRows),
      filters: sanitizeFilters(query),
      processedAt: new Date().toISOString()
    };

    return { data: fornecedores, metadata };
  });
}

export function getFornecedoresStats(query: NormalizedFornecedoresQuery): FornecedoresStatsResponse {
  return runWithDatabase(db => {
    const { whereClause, parameters } = buildWhereClause(query);

    const statement = db.prepare(
      `SELECT
        COUNT(*) as total,
        SUM(total_recebido) as totalVolume,
        SUM(numero_transacoes) as totalTransacoes,
        AVG(score_suspeicao) as avgScore,
        SUM(CASE WHEN numero_deputados > 0 THEN 1 ELSE 0 END) as fornecedoresComDeputados
      FROM fornecedores
      ${whereClause}`
    );

    const allRowsStatement = db.prepare(
      `SELECT anos, categorias, total_recebido
       FROM fornecedores
       ${whereClause}`
    );

    const summary = statement.get(parameters) as AggregateRow;
    const allRows = allRowsStatement.all(parameters) as Array<RowWithCategorias & RowWithAnos>;

    const categories = collectCategorias(allRows);
    const anosUnicos = collectAnos(allRows);

    return {
      data: {
        totalFornecedores: Number(summary.total ?? 0),
        valorTotalRecebido: Number(summary.totalVolume ?? 0),
        totalTransacoes: Number(summary.totalTransacoes ?? 0),
        scoreMedio: summary.avgScore === null || summary.avgScore === undefined ? null : Number(summary.avgScore.toFixed(2)),
        anosUnicos,
        topCategorias: categories
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        source: 'sqlite',
        filters: sanitizeFilters(query)
      }
    };
  });
}

function sanitizeFilters(query: NormalizedFornecedoresQuery): FornecedoresQueryParams {
  const filters: FornecedoresQueryParams = {};

  if (query.categoria) filters.categoria = query.categoria;
  if (query.search) filters.search = query.search;
  if (query.scoreMin !== undefined) filters.scoreMin = query.scoreMin;
  if (query.scoreMax !== undefined) filters.scoreMax = query.scoreMax;
  if (query.page) filters.page = query.page;
  if (query.perPage) filters.perPage = query.perPage;
  if (query.order) filters.order = query.order;

  return filters;
}

export { DatabaseUnavailableError } from '../db/database.js';
