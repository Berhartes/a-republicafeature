'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CompararFeature } from './CompararFeature'

function CompararPageSkeleton() {
  return (
    <div className="min-h-screen bg-background container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  )
}

export default function CompararPage() {
  return (
    <Suspense fallback={<CompararPageSkeleton />}>
      <CompararFeature />
    </Suspense>
  )
}



