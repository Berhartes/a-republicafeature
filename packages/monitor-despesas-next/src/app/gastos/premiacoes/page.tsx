import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPremiacoes } from '../actions/data-actions'
import { formatDateTimeLabel } from '@/lib/formatters'
import { PremiacoesPageClient } from './PremiacoesPageClient'

export const metadata: Metadata = {
  title: 'Premiações • Monitor de Gastos',
  description: 'Sistema de rankings e premiações com estatísticas detalhadas.',
}

export const revalidate = 3600

interface PageProps {
  searchParams: Promise<{
    ano?: string
    categoria?: string
    uf?: string
  }>
}

function normalizeSearchParams(params: Record<string, string | string[] | undefined>) {
  const entries = Object.entries(params)
    .filter(([, value]) => typeof value === 'string')
    .map(([key, value]) => [key, value as string])

  return Object.fromEntries(entries) as { ano?: string; categoria?: string; uf?: string }
}

function PremiacoesLoading() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando premiações...</span>
    </div>
  )
}

export default async function PremiacoesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = normalizeSearchParams(await searchParams)
  const premiacoesData = await getPremiacoes(resolvedSearchParams)
  const lastUpdateLabel = getLastUpdateLabel(premiacoesData.metadata?.lastUpdate)

  const shouldShowFilters = Boolean(
    resolvedSearchParams.ano ||
      resolvedSearchParams.categoria ||
      resolvedSearchParams.uf,
  )

  return (
    <Suspense fallback={<PremiacoesLoading />}>
      <PremiacoesPageClient 
        premiacoesData={premiacoesData}
        defaultShowFilters={shouldShowFilters}
        lastUpdateLabel={lastUpdateLabel}
      />
    </Suspense>
  )
}
function getLastUpdateLabel(lastUpdate?: string) {
  return formatDateTimeLabel(lastUpdate)
}
