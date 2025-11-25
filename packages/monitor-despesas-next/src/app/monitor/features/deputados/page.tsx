'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { DeputadosFeature } from './DeputadosFeature'

function DeputadosPageSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-96" />
        </div>
    )
}

export default function DeputadosPage() {
    return (
        <Suspense fallback={<DeputadosPageSkeleton />}>
            <DeputadosFeature />
        </Suspense>
    )
}



