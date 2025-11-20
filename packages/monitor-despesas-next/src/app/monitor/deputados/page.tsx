import type { Metadata } from 'next'
import { getDeputados } from '@/app/gastos/actions/data-actions'
import { DeputadosClient } from '@/app/gastos/deputados/DeputadosClient'

export const metadata: Metadata = {
  title: 'Monitor • Deputados',
  description: 'Painel dos deputados com filtros e estatísticas',
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

type DeputadosSearchParams = {
  partido?: string
  uf?: string
  page?: string
  search?: string
  sort?: string
}

interface PageProps {
  searchParams?: DeputadosSearchParams | URLSearchParams | Promise<DeputadosSearchParams | URLSearchParams>
}

function isURLSearchParamsLike(value: unknown): value is URLSearchParams {
  return typeof value === 'object' && value !== null && typeof (value as URLSearchParams).get === 'function'
}

async function resolveSearchParams(input: PageProps['searchParams']): Promise<DeputadosSearchParams> {
  const resolved = await Promise.resolve(input ?? {})
  if (isURLSearchParamsLike(resolved)) {
    const entries = Object.fromEntries(resolved.entries()) as Record<string, string>
    return {
      partido: entries.partido,
      uf: entries.uf,
      page: entries.page,
      search: entries.search,
      sort: entries.sort,
    }
  }
  return resolved
}

export default async function MonitorDeputadosPage({ searchParams }: PageProps) {
  const params = await resolveSearchParams(searchParams)
  const page = parseInt(params.page || '1', 10)
  const pageSize = 12
  const sortBy = (params.sort || 'gasto') as 'nome' | 'partido' | 'uf' | 'gasto'

  const { deputados, total, partidos, ufs, stats } = await getDeputados({
    partido: params.partido && params.partido !== 'todos' ? params.partido : undefined,
    uf: params.uf && params.uf !== 'todos' ? params.uf : undefined,
    searchTerm: params.search,
    sortBy,
    page,
    pageSize,
  })

  return (
    <DeputadosClient
      deputados={deputados}
      total={total}
      partidos={partidos}
      ufs={ufs}
      stats={stats}
      currentPage={page}
      pageSize={pageSize}
    />
  )
}

