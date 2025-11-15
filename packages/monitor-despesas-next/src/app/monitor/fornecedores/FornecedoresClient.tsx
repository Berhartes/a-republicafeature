'use client'

import BuscarFornecedores from '@/components/monitor/BuscarFornecedores'
import { useSearchParams, useRouter } from 'next/navigation'
import type { FornecedorResumo } from '@a-republica/shared'
import { useFilter } from '@/contexts/FilterContext'

export default function FornecedoresClient({
  categorias,
  ufs,
  fornecedores,
  total,
  pageSize,
}: {
  categorias: string[]
  ufs: string[]
  fornecedores: FornecedorResumo[]
  total: number
  pageSize: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedCategory, setSelectedCategory } = useFilter()
  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'todos' || value === 'todas') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    if (!updates.page && (updates.categoria || updates.uf || updates.search !== undefined || updates.sort)) {
      params.delete('page')
    }
    const searchValue = updates.search ?? (params.get('search') || null)
    if (searchValue === null) {
      params.delete('searchTerm')
      params.delete('search')
    } else if (typeof searchValue === 'string') {
      params.set('searchTerm', searchValue)
      params.set('search', searchValue)
    }
    const sortValue = updates.sort ?? (params.get('sort') || null)
    if (sortValue === null) {
      params.delete('sortBy')
      params.delete('sort')
    } else if (typeof sortValue === 'string') {
      const mapped = sortValue === 'gasto' ? 'totalRecebido' : sortValue === 'nome' ? 'nome' : sortValue
      params.set('sortBy', mapped)
      params.set('sort', sortValue)
    }
    // Categoria: gerenciada internamente, não alterar URL
    if (typeof updates.categoria === 'string') {
      setSelectedCategory(updates.categoria === 'todas' ? undefined : updates.categoria)
      params.delete('categoria')
    }
    const queryString = params.toString()
    const url = queryString ? `?${queryString}` : '/monitor/fornecedores'
    router.push(url)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <BuscarFornecedores
        categorias={categorias}
        ufs={ufs}
        values={{
          search: searchParams.get('search') || searchParams.get('searchTerm') || undefined,
          categoria: selectedCategory || undefined,
          uf: searchParams.get('uf') || undefined,
          sort: searchParams.get('sort') || undefined,
          page: searchParams.get('page') || undefined,
        }}
        onUpdate={(updates) => updateURL(updates)}
        onSearch={(term) => updateURL({ search: term || null })}
        onClear={() => router.push('/monitor/fornecedores')}
        isPending={false}
        fornecedores={(selectedCategory
          ? fornecedores.filter((f) => {
              const principal = (f.tipoDespesaPrincipal || '').trim()
              const categorias = Array.isArray((f as any).categorias) ? ((f as any).categorias as string[]) : []
              return principal === selectedCategory || categorias.includes(selectedCategory)
            })
          : fornecedores
        )}
        total={total}
        pageSize={pageSize}
        searchParams={{
          searchTerm: searchParams.get('searchTerm') || searchParams.get('search') || undefined,
          categoria: selectedCategory || undefined,
          scoreMinimo: searchParams.get('scoreMinimo') || undefined,
          sortBy: (searchParams.get('sortBy') || undefined) as any,
          page: searchParams.get('page') || undefined,
        }}
        dataSource={fornecedores.length > 0 ? 'etl' : 'empty'}
      />
    </div>
  )
}
