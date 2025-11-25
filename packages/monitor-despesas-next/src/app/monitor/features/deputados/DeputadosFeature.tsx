'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TrendingUp, User } from 'lucide-react'
import type { DeputadoResumo } from '@/types/deputados'
import { SearchFeature } from '@/features/search/SearchFeature'
import MiniCardStats from '@/components/ui/MiniCardStats'
import { getDeputados } from '@/actions/data-actions'
import { Skeleton } from '@/components/ui/skeleton'

export function DeputadosFeature() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<{
        deputados: DeputadoResumo[]
        total: number
        partidos: string[]
        ufs: string[]
        stats: {
            total: number
            totalGasto: number
            mediaGasto: number
        }
    } | null>(null)

    const currentPage = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = 12

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const params = {
                    partido: searchParams.get('partido') || undefined,
                    uf: searchParams.get('uf') || undefined,
                    searchTerm: searchParams.get('search') || undefined,
                    sortBy: (searchParams.get('sort') || 'gasto') as 'nome' | 'partido' | 'uf' | 'gasto',
                    page: currentPage,
                    pageSize,
                }

                // Normalize 'todos' to undefined for API
                if (params.partido === 'todos') params.partido = undefined
                if (params.uf === 'todos') params.uf = undefined

                const result = await getDeputados(params)
                setData(result)
            } catch (error) {
                console.error('Failed to fetch deputados:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [searchParams, currentPage])

    const updateURL = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (value === null || value === '' || value === 'todos') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })

        // Reset page when filters change (except page navigation itself)
        if (!updates.page && (updates.partido || updates.uf || updates.search !== undefined || updates.sort)) {
            params.delete('page')
        }

        const queryString = params.toString()
        const url = queryString ? `?${queryString}` : '/monitor/features/deputados'

        startTransition(() => {
            router.push(url)
        })
    }

    if (isLoading || !data) {
        return <DeputadosSkeleton />
    }

    const { deputados, total, partidos, ufs, stats } = data

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Lista de Deputados
                </h1>
                <p className="text-gray-600">
                    Visualize e filtre os deputados federais
                </p>
            </div>

            <div className="mb-6" suppressHydrationWarning>
                <MiniCardStats
                    columns={4}
                    items={[
                        { title: 'Deputados filtrados', value: total, variant: 'compact', color: 'blue', icon: User, formatType: 'number' },
                        { title: 'Média de gastos', value: stats.mediaGasto, variant: 'full', color: 'green', icon: TrendingUp, formatType: 'currencyCompactBRL' },
                        { title: 'Total gasto', value: stats.totalGasto, variant: 'full', color: 'purple', icon: TrendingUp, formatType: 'currencyCompactBRL' },
                        { title: 'Total cadastrados', value: stats.total, variant: 'compact', color: 'amber', icon: User, formatType: 'number' },
                    ]}
                />
            </div>

            <SearchFeature mode="deputados" />
        </div>
    )
}

function DeputadosSkeleton() {
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
