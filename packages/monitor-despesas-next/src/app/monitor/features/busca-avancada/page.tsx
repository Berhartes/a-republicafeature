'use client'

import { Suspense } from 'react'
import { SearchFeature } from '@/features/search/SearchFeature'

export default function BuscaAvancadaPage() {
  return (
    <Suspense fallback={<div className="p-8">Carregando...</div>}>
      <SearchFeature mode="global" title="Busca Avançada" description="Pesquise deputados e fornecedores simultaneamente" />
    </Suspense>
  )
}
