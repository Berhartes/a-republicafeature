import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getDashboardData } from '../actions/data-actions'
import { DashboardClient } from '../dashboards/DashboardClient'

export const metadata: Metadata = {
  title: 'Relatórios • Monitor de Gastos',
  description: 'Relatórios e alertas de gastos parlamentares.',
}

export const revalidate = 3600

interface RelatoriosPageProps {
  searchParams: {
    ano?: string
    partido?: string
    uf?: string
    page?: string
    pageSize?: string
    partidosPage?: string
    tab?: string
  }
}

function RelatoriosLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando relatórios...</span>
    </div>
  )
}

async function RelatoriosContent({ searchParams }: RelatoriosPageProps) {
  const {
    ano = 'all',
    partido = 'TODOS',
    uf = 'TODOS',
    page = '1',
    pageSize = '5',
    partidosPage = '1',
  } = searchParams

  const data = await getDashboardData({
    ano,
    partido,
    uf,
    page: parseInt(page || '1', 10),
    pageSize: parseInt(pageSize || '5', 10),
    partidosPage: parseInt(partidosPage || '1', 10),
  })

  if (!data || !data.aggregates) {
    return <div className="text-red-500 text-center">Falha ao carregar os relatórios.</div>
  }

  return <DashboardClient response={data as any} />
}

export default function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <h1 className="text-4xl font-bold mb-8">Relatórios</h1>
        <Suspense fallback={<RelatoriosLoading />}>
          {/* Reusa o DashboardClient, respeitando a aba via query string */}
          <RelatoriosContent searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}