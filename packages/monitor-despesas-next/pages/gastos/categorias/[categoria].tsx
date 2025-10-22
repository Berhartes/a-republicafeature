import { useEffect, useMemo } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import { FornecedoresDataProvider } from '@/contexts/FornecedoresDataContext'
import { CategoriasFornecedores } from '@/client/pages/CategoriasFornecedores'
import { categoryToSlug, slugToCategory } from '@/lib/category-slugs'

export default function CategoriaPage() {
  const router = useRouter()
  const categoriaParam = useMemo(() => {
    const { categoria } = router.query
    return typeof categoria === 'string' ? categoria : ''
  }, [router.query])

  useEffect(() => {
    if (!router.isReady) return
    if (!categoriaParam) return

    const categoryFromSlug = slugToCategory(categoriaParam)

    if (!categoryFromSlug) {
      const newSlug = categoryToSlug(categoriaParam)
      if (newSlug && newSlug !== categoriaParam && newSlug !== 'categoria') {
        router.replace(`/gastos/categorias/${newSlug}`)
      }
    }
  }, [categoriaParam, router])

  const title = categoriaParam
    ? `Categoria • ${categoriaParam.replace(/-/g, ' ')} • Monitor de Gastos`
    : 'Categorias de Fornecedores • Monitor de Gastos'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <FornecedoresDataProvider autoLoad={false}>
            <CategoriasFornecedores />
          </FornecedoresDataProvider>
        </main>
      </div>
    </>
  )
}
