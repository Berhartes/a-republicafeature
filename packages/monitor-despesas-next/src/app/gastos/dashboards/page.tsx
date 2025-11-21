import { Suspense } from 'react'
import { getDashboardData } from '../actions/data-actions'
import { DashboardClient } from './DashboardClient'
import type { Metadata } from 'next'
import { DataErrorBoundary } from '@/components/error-boundaries/DataErrorBoundary'

export const metadata: Metadata = {
  title: 'Dashboard • Monitor de Gastos',
  description: 'Visão geral e estatísticas dos gastos parlamentares.',
}

export const revalidate = 3600 // Revalida a cada hora

interface DashboardPageProps {
  searchParams: {
    ano?: string
    partido?: string
    uf?: string
    page?: string
    pageSize?: string
    partidosPage?: string
  }
}

function DashboardLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando dados do dashboard...</span>
    </div>
  )
}

async function DashboardContent({ searchParams }: DashboardPageProps) {
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
    return <div className="text-red-500 text-center">Falha ao carregar os dados do dashboard.</div>
  }

  return <DashboardClient response={data as any} />
}

export default function DashboardPage({ searchParams }: DashboardPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <h1 className="text-4xl font-bold mb-8">Dashboard Geral</h1>
        <DataErrorBoundary>
          <Suspense fallback={<DashboardLoading />}>
            <DashboardContent searchParams={searchParams} />
          </Suspense>
        </DataErrorBoundary>
      </main>
    </div>
  )
}
