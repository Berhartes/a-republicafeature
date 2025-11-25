'use client'

import { useState, useTransition, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSuppliersData } from './data'
import { Top5Fornecedores } from '@/features/Top5Fornecedores'
import DistribuicaoGastosPorCategoria from '@/features/DistribuicaoGastosPorCategoria'
import MiniCardStats from '@/components/ui/MiniCardStats'
import { SearchFeature } from '@/features/search/SearchFeature'
import { FilterProvider } from '@/contexts/FilterContext'
import { Skeleton } from '@/components/ui/skeleton'
import type { FornecedorResumo } from '@a-republica/shared'
import { Building2, TrendingUp } from 'lucide-react'

function MonitorFornecedoresContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<{
    suppliersData: any
  } | null>(null)

  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined)

  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 100
  const sortBy = (searchParams.get('sort') || undefined) as any

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const params = {
          searchTerm: searchParams.get('searchTerm') || searchParams.get('search') || undefined,
          categoria: searchParams.get('categoria') || undefined,
          scoreMinimo: searchParams.get('scoreMinimo') ? parseInt(searchParams.get('scoreMinimo')!, 10) : undefined,
          sortBy: (searchParams.get('sortBy') || (searchParams.get('sort') === 'gasto' ? 'totalRecebido' : searchParams.get('sort') === 'nome' ? 'nome' : undefined)) as any,
          page,
          pageSize,
        }

        // Fetch aggregate data
        const suppliersData = await getSuppliersData()

        setData({
          suppliersData
        })

        if (params.categoria) {
          setSelectedCategory(params.categoria)
        }
      } catch (error) {
        console.error('Failed to fetch fornecedores:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [searchParams, page])



  if (isLoading || !data) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl mt-6 flex flex-col gap-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  const { suppliersData } = data
  const suppliers = suppliersData

  const statsItems = [
    {
      title: 'Total de Fornecedores',
      value: suppliers?.metadata?.totalFornecedores || 0,
      formatType: 'number' as const,
      variant: 'compact' as const,
      color: 'blue' as const,
      icon: Building2
    },
    {
      title: 'Total Transacionado',
      value: suppliers?.metadata?.totalValor || 0,
      formatType: 'currencyCompactBRL' as const,
      variant: 'full' as const,
      color: 'green' as const,
      icon: TrendingUp
    },
  ]

  const topItems = (suppliers?.ranking || []).map((item: any) => ({
    nome: item.nome,
    cnpj: item.cnpj_cpf,
    valor: item.total_recebido,
    numeroTransacoes: item.numero_transacoes,
    categoriaPrincipal: item.tipo_despesa_principal,
  }))

  const categoriasData = (suppliers?.categorias || []).map((c: any) => ({
    categoria: c.categoria,
    valor: c.total,
    percentual: c.percentual,
  }))

  const categorias = (suppliers?.categorias || []).map((c: any) => c.categoria)
  const ufs: string[] = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  return (
    <FilterProvider initialCategory={selectedCategory}>
      <div className="container mx-auto px-4 py-6 max-w-7xl mt-6 flex flex-col gap-6">
        <MiniCardStats items={statsItems} columns={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Top5Fornecedores
            items={topItems}
            categorias={categorias as string[]}
            categoriaSelecionada={selectedCategory || 'TODAS'}
            categorySelectMode="dropdown"
          />
          <DistribuicaoGastosPorCategoria data={categoriasData} />
        </div>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <SearchFeature mode="fornecedores" />
        </div>
      </div>
    </FilterProvider>
  )
}

function MonitorFornecedoresSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl mt-6 flex flex-col gap-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-96" />
    </div>
  )
}

export default function MonitorFornecedoresPage() {
  return (
    <Suspense fallback={<MonitorFornecedoresSkeleton />}>
      <MonitorFornecedoresContent />
    </Suspense>
  )
}


