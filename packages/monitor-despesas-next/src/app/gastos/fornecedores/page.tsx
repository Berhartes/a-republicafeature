import type { Metadata } from 'next'
import { Suspense } from 'react'
import { DataErrorBoundary } from '@/components/error-boundaries/DataErrorBoundary'
import { getFornecedores } from '../actions/data-actions'
import { FornecedoresPageClient } from './FornecedoresPageClient'

export const metadata: Metadata = {
  title: 'Fornecedores • Monitor de Gastos',
  description: 'Lista de fornecedores e seus gastos.',
}

export const revalidate = 3600

// Em Next 15+, searchParams é assíncrono. Tipamos como Promise para evitar
// o aviso "sync dynamic apis" e sempre resolvemos com await.
type NextSearchParams = Promise<Record<string, string | string[]>>

type FornecedoresSearchParams = {
  searchTerm?: string
  categoria?: string
  scoreMinimo?: string
  sortBy?: 'nome' | 'totalRecebido' | 'numeroTransacoes' | 'scoreSuspeicao'
  page?: string
}

interface PageProps {
  searchParams?: NextSearchParams
}

function FornecedoresLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando fornecedores...</span>
    </div>
  )
}

async function FornecedoresContent({ searchParams }: PageProps) {
  const raw = (await (searchParams ?? Promise.resolve({}))) as Record<string, string | string[]>

  // Normaliza possíveis arrays do Next para string
  const normalize = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined

  const resolvedSearchParams: FornecedoresSearchParams = {
    searchTerm: normalize(raw.searchTerm),
    categoria: normalize(raw.categoria),
    scoreMinimo: normalize(raw.scoreMinimo),
    sortBy: normalize(raw.sortBy) as FornecedoresSearchParams['sortBy'],
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

  if (!fornecedores) {
    return <div className="text-red-500 text-center">Falha ao carregar os dados de fornecedores.</div>
  }

  return (
    <FornecedoresPageClient
      fornecedores={fornecedores}
      total={total}
      pageSize={100}
      searchParams={resolvedSearchParams}
    />
  )
}

export default function FornecedoresPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <DataErrorBoundary>
          <Suspense fallback={<FornecedoresLoading />}>
            <FornecedoresContent searchParams={searchParams} />
          </Suspense>
        </DataErrorBoundary>
      </main>
    </div>
  )
}
