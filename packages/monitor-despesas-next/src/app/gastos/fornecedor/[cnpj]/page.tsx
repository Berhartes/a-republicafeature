import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getFornecedorByCnpj } from '../../actions/data-actions'
import { FornecedorPageClient } from './FornecedorPageClient'
import type { Metadata } from 'next'

export const revalidate = 3600

interface PageProps {
  params: { cnpj: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { cnpj } = await params
    const fornecedor = await getFornecedorByCnpj(cnpj)
    return {
      title: `${fornecedor?.nome || 'Fornecedor'} • Monitor de Gastos`,
    }
  } catch {
    return { title: 'Fornecedor • Monitor de Gastos' }
  }
}

function FornecedorLoading() {
  return (
    <div className="flex h-96 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      <span className="ml-2">Carregando dados do fornecedor...</span>
    </div>
  )
}

async function FornecedorContent({ params }: PageProps) {
  const { cnpj } = await params
  const fornecedor = await getFornecedorByCnpj(cnpj)

  if (!fornecedor) {
    notFound()
  }

  return <FornecedorPageClient fornecedor={fornecedor} />
}

export default function FornecedorPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6">
        <Suspense fallback={<FornecedorLoading />}>
          <FornecedorContent params={params} />
        </Suspense>
      </main>
    </div>
  )
}
