import type { Metadata } from 'next'
import { CACHE_KEYS } from '@/constants/cache'
import { CacheService } from '@/services/cache-service'
import FornecedoresClient from './FornecedoresClient'
import { Top5Fornecedores } from '@/components/monitor/Top5Fornecedores'
import DistribuicaoGastosPorCategoria from '@/components/monitor/DistribuicaoGastosPorCategoria'
import { MiniCardStats } from '@/components/monitor/MiniCardStats'
import { getSuppliersData } from './data'
import { getFornecedores } from '@/app/gastos/actions/data-actions'
import { FilterProvider } from '@/contexts/FilterContext'

export const metadata: Metadata = {
  title: 'Monitor • Fornecedores',
  description: 'Busca e filtros de fornecedores',
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

type NextSearchParams = Promise<Record<string, string | string[]>>

interface PageProps {
  searchParams?: NextSearchParams
}

export default async function MonitorFornecedoresPage({ searchParams }: PageProps) {
  const cacheService = CacheService.getInstance()
  const categoriesPayload = await cacheService.getFromSources<{ categorias?: Record<string, unknown> }>(CACHE_KEYS.CATEGORIES)

  const suppliers = await getSuppliersData()
  const categoriasFromSuppliers = suppliers?.categorias?.map(c => c.categoria) || []
  const categorias = categoriasFromSuppliers.length > 0
    ? categoriasFromSuppliers
    : categoriesPayload?.categorias
      ? Object.keys(categoriesPayload.categorias)
      : []

  const ufs: string[] = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
  ]

  const statsItems = [
    { title: 'Total de Fornecedores', value: suppliers?.metadata?.totalFornecedores || 0, formatType: 'number' as const },
    { title: 'Total Transacionado', value: suppliers?.metadata?.totalValor || 0, formatType: 'currencyBRL' as const },
  ]

  const topItems = (suppliers?.ranking || []).map(item => ({
    nome: item.nome,
    cnpj: item.cnpj_cpf,
    valor: item.total_recebido,
    numeroTransacoes: item.numero_transacoes,
    categoriaPrincipal: item.tipo_despesa_principal,
  }))

  const categoriasData = (suppliers?.categorias || []).map(c => ({
    categoria: c.categoria,
    valor: c.total,
    percentual: c.percentual,
  }))

  const raw = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>
  const normalize = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined
  const resolvedSearchParams = {
    searchTerm: normalize(raw.searchTerm) || normalize(raw.search) || undefined,
    categoria: normalize(raw.categoria),
    scoreMinimo: normalize(raw.scoreMinimo),
    sortBy: (normalize(raw.sortBy) || (normalize(raw.sort) === 'gasto' ? 'totalRecebido' : normalize(raw.sort) === 'nome' ? 'nome' : undefined)) as 'nome' | 'totalRecebido' | 'numeroTransacoes' | 'scoreSuspeicao' | undefined,
    page: normalize(raw.page),
  }

  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const scoreMinimo = resolvedSearchParams.scoreMinimo ? parseInt(resolvedSearchParams.scoreMinimo, 10) : undefined
  const { fornecedores, total } = await getFornecedores({
    searchTerm: resolvedSearchParams.searchTerm,
    categoria: resolvedSearchParams.categoria,
    scoreMinimo,
    sortBy: resolvedSearchParams.sortBy,
    page,
    pageSize: 100,
  })

  return (
    <FilterProvider initialCategory={(resolvedSearchParams.categoria as string) || undefined}>
      <div className="container mx-auto px-4 py-6 max-w-7xl mt-6 flex flex-col gap-6">
        <MiniCardStats items={statsItems} columns={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Top5Fornecedores
            items={topItems}
            categorias={categorias as string[]}
            categoriaSelecionada={(resolvedSearchParams.categoria as string) || 'TODAS'}
            categorySelectMode="dropdown"
          />
          <DistribuicaoGastosPorCategoria data={categoriasData} />
        </div>
      </div>
      <FornecedoresClient categorias={categorias} ufs={ufs} fornecedores={fornecedores || []} total={total || 0} pageSize={100} />
    </FilterProvider>
  )
}
