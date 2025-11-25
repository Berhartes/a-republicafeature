'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { PremiacoesFeature } from './PremiacoesFeature'

function PremiacoesPageSkeleton() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-48" />
      <Skeleton className="h-96" />
    </div>
  )
}

export default function PremiacoesPage() {
  return (
    <Suspense fallback={<PremiacoesPageSkeleton />}>
      <PremiacoesFeature />
    </Suspense>
  )
}



