import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
  getComparativoCategoriasDeputado,
  getDeputadoById,
  getRedeRelacionamentosDeputado,
  getTransacoesDeputado,
} from '../../actions/data-actions'
import { PerfilDeputadoClient } from '../../deputados/[id]/PerfilDeputadoClient'
import type { Metadata } from 'next'

export const revalidate = 3600

interface PageProps {
  params: { id: string }
  searchParams: {
    page?: string
    ano?: string
    mes?: string
    categoria?: string
    busca?: string
    ordenacao?: 'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc' | 'fornecedor'
    tab?: string
  }
}

// Gera o título da página dinamicamente
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params
    const deputado = await getDeputadoById(id)
    return {
      title: `${deputado?.nomeEleitoral || 'Perfil'} • Monitor de Gastos`,
    }
  } catch {
    return { title: 'Perfil • Monitor de Gastos' }
  }
}

function PerfilLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando perfil do deputado...</span>
    </div>
  )
}

async function PerfilContent({ params, searchParams }: PageProps) {
  const { id } = await params
  const {
    page: pageParam,
    ano: anoParam,
    mes: mesParam,
    categoria: categoriaParam,
    busca: buscaParam,
    ordenacao: ordenacaoParam,
    tab: tabParam,
  } = await searchParams
  const page = parseInt(pageParam || '1')
  const filters = {
    ano: anoParam ?? 'all',
    mes: mesParam ?? 'todos',
    categoria: categoriaParam ?? 'todas',
    busca: buscaParam ?? '',
    ordenacao: ordenacaoParam ?? 'data-desc',
    tab: tabParam ?? 'visao-geral',
  }

  const deputado = await getDeputadoById(id)
  if (!deputado) {
    notFound()
  }

  const [transacoesData, comparativoData, redePoliticaData] = await Promise.all([
    getTransacoesDeputado({
      deputadoId: id,
      page,
      ano: filters.ano,
      mes: filters.mes,
      categoria: filters.categoria,
      busca: filters.busca,
      ordenacao: filters.ordenacao,
    }),
    getComparativoCategoriasDeputado(id),
    filters.tab === 'relacoes' ? getRedeRelacionamentosDeputado(id, { deputado }) : Promise.resolve(null),
  ])

  return (
    <PerfilDeputadoClient
      deputado={deputado}
      transacoesData={transacoesData}
      comparativoData={comparativoData}
      redePoliticaData={redePoliticaData || undefined}
      initialFilters={filters}
      initialTab={filters.tab}
    />
  )
}

export default function PerfilPage({ params, searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <Suspense fallback={<PerfilLoading />}>
          <PerfilContent params={params} searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  )
}
