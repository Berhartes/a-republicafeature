'use client'

import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { RankingFeature } from './RankingFeature'

function RankingPageSkeleton() {
    return (
        <div className="min-h-screen bg-background container mx-auto py-6 space-y-6">
            <div className="space-y-2 mb-8">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
        </div>
    )
}

export default function RankingPage() {
    return (
        <Suspense fallback={<RankingPageSkeleton />}>
            <RankingFeature />
        </Suspense>
    )
}



