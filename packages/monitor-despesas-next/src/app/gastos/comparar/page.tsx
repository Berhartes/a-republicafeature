import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getDeputados, getDeputadosByIds } from '../actions/data-actions'
import { CompararPageClient } from './CompararPageClient'

export const metadata: Metadata = {
  title: 'Comparar Deputados • Monitor de Gastos',
  description: 'Compare indicadores de gastos entre deputados com visualizações e filtros avançados.',
}

export const revalidate = 3600

interface PageProps {
  searchParams: {
    deputados?: string // IDs separados por vírgula
  }
}

function CompararLoading() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          <span className="ml-2">Carregando comparação...</span>
        </div>
      </main>
    </div>
  )
}

async function CompararContent({ searchParams }: PageProps) {
  // Pega os IDs da URL, garantindo que sejam sempre um array
  const deputadoIds = searchParams.deputados ? searchParams.deputados.split(',') : []

  // Busca os dados em paralelo
  const [todosDeputadosResult, deputadosSelecionados] = await Promise.all([
    getDeputados({}), // Busca todos para os seletores
    getDeputadosByIds(deputadoIds), // Busca apenas os selecionados
  ])

  const todosDeputados = todosDeputadosResult.deputados

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <h1 className="text-4xl font-bold mb-8">Comparar Deputados</h1>
        <CompararPageClient 
          todosDeputados={todosDeputados}
          deputadosSelecionados={deputadosSelecionados}
          deputadoIds={deputadoIds}
        />
      </main>
    </div>
  )
}

export default function CompararPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={<CompararLoading />}>
      <CompararContent searchParams={searchParams} />
    </Suspense>
  )
}
