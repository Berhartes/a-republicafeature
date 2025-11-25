'use server'
// packages/monitor-despesas-next/src/app/monitor/fornecedores/data.ts
import { loadSuppliersCache } from '@/actions/_cached-loaders'
import { parseSuppliersCache } from '@/services/analytics'

// Essas interfaces foram copiadas de page.tsx. O ideal é que elas venham do package 'shared'.
interface Fornecedor {
  id: string;
  nome: string;
  cnpj_cpf: string;
  total_recebido: number;
  numero_transacoes: number;
  tipo_despesa_principal: string;
  ranking: number;
}

interface Categoria {
  categoria: string;
  total: number;
  percentual: string;
}

export interface SuppliersCacheData {
  metadata: {
    totalFornecedores: number;
    totalValor: number;
  };
  ranking: Fornecedor[];
  categorias: Categoria[];
}
// Utilitários para unificar campos do cache
function getTotalRecebido(record: any): number {
  return Number(
    record?.totalRecebido ??
    record?.totalTransacionado ??
    record?.total_recebido ??
    record?.totalGasto ??
    0
  )
}

function getNumeroTransacoes(record: any): number {
  const r = record || {}
  if (typeof r.numeroTransacoes === 'number') return r.numeroTransacoes
  if (typeof r.transacoes === 'number') return r.transacoes
  if (typeof r.numTransacoes === 'number') return r.numTransacoes
  if (typeof r.numero_transacoes === 'number') return r.numero_transacoes
  return 0
}

function getCategoriaPrincipal(record: any): string {
  return (
    record?.tipoDespesaPrincipal ||
    record?.tipo_despesa_principal ||
    record?.categoria ||
    'SEM_CATEGORIA'
  )
}

export async function getSuppliersData(): Promise<SuppliersCacheData | null> {
  try {
    const payload = await loadSuppliersCache()
    if (!payload) {
      // Sem dados: retornar estrutura vazia para não quebrar build
      return {
        metadata: { totalFornecedores: 0, totalValor: 0 },
        ranking: [],
        categorias: [],
      }
    }

    const { fornecedores } = parseSuppliersCache(payload)
    const list = Array.isArray(fornecedores) ? fornecedores : []

    // Monta ranking por total recebido (desc)
    const ranking: Fornecedor[] = list
      .map((f: any) => ({
        id: String(f?.id ?? f?.nome ?? ''),
        nome: String(f?.nome ?? ''),
        cnpj_cpf: String((f?.cnpj || f?.documento || '') ?? ''),
        total_recebido: getTotalRecebido(f),
        numero_transacoes: getNumeroTransacoes(f),
        tipo_despesa_principal: getCategoriaPrincipal(f),
        ranking: 0, // será atribuído após sort
      }))
      .sort((a, b) => b.total_recebido - a.total_recebido)
      .map((f, idx) => ({ ...f, ranking: idx + 1 }))

    // Agrega categorias
    const totalValor = ranking.reduce((sum, r) => sum + (r.total_recebido || 0), 0)
    const categoriasMap = new Map<string, number>()
    for (const r of ranking) {
      const key = r.tipo_despesa_principal || 'SEM_CATEGORIA'
      categoriasMap.set(key, (categoriasMap.get(key) || 0) + (r.total_recebido || 0))
    }
    const categorias: Categoria[] = Array.from(categoriasMap.entries()).map(([categoria, total]) => ({
      categoria,
      total,
      percentual: totalValor > 0 ? `${((total / totalValor) * 100).toFixed(2)}%` : '0%'
    }))

    return {
      metadata: {
        totalFornecedores: ranking.length,
        totalValor,
      },
      ranking,
      categorias,
    }
  } catch (error) {
    // Não loga erro de rede durante build; retorna estrutura segura
    return {
      metadata: { totalFornecedores: 0, totalValor: 0 },
      ranking: [],
      categorias: [],
    }
  }
}


