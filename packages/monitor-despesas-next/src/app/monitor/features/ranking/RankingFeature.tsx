'use client'

import { useState, useEffect, useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Users,
    Building2,
    DollarSign,
    Receipt,
    BarChart3,
    LayoutDashboard
} from 'lucide-react'
import { formatCompactCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import { getDashboardData } from '@/actions/data-actions'

// Components imports
import {
    StatCard,
    RankingFilters,
    AnnualTrendChart,
    DeputiesRanking,
    SuppliersRanking,
    PartiesComparison,
    UfsComparison
} from './RankingComponents'
import {
    GastosPorDeputado,
    GastosPorPartido,
    GastosPorEstado,
    EvolucaoTemporal,
    TopFornecedores
} from './RankingCharts'

// Types
interface PaginationInfo {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
}

interface DashboardDeputadoItem {
    id: string
    nome: string
    partido: string
    uf: string
    totalGasto: number
    posicao: number
}

interface DashboardFornecedorItem {
    id?: string
    nome: string
    cnpj: string
    valor: number
    scoreSuspeicao: number
    numTransacoes: number
}

interface PartidoComparativoItem {
    partido: string
    totalGasto: number
    numDeputados: number
    mediaPorDeputado: number
}

interface UfComparativoItem {
    uf: string
    totalGasto: number
    numDeputados: number
    mediaPorDeputado: number
}

interface DashboardAggregatesResponse {
    stats: {
        totalDeputados: number
        totalFornecedores: number
        totalGasto: number
        totalTransacoes: number
        mediaPorDeputado: number
    }
    topFornecedores: {
        items: DashboardFornecedorItem[]
        pagination: PaginationInfo
    }
    partidos: {
        items: PartidoComparativoItem[]
        pagination: PaginationInfo
    }
    ufs: {
        items: UfComparativoItem[]
        pagination: PaginationInfo
    }
    resumoAnual: Array<{ ano: number; total: number }>
}

interface DashboardResponse {
    data: DashboardDeputadoItem[]
    pagination: PaginationInfo
    aggregates: DashboardAggregatesResponse
    metadata?: {
        availableFilters?: {
            anos?: number[]
            partidos?: string[]
            ufs?: string[]
        }
        lastUpdate?: string
    }
    appliedFilters?: {
        ano?: string
        partido?: string
        uf?: string
        page?: number
        pageSize?: number
        partidosPage?: number
    }
}

export function RankingFeature() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [data, setData] = useState<DashboardResponse | null>(null)
    const [activeTab, setActiveTab] = useState<'geral' | 'graficos'>('geral')

    // Fetch data effect
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingData(true)
            try {
                const params = {
                    ano: searchParams.get('ano') || 'all',
                    partido: searchParams.get('partido') || 'TODOS',
                    uf: searchParams.get('uf') || 'TODOS',
                    page: parseInt(searchParams.get('page') || '1', 10),
                    pageSize: parseInt(searchParams.get('pageSize') || '10', 10),
                    partidosPage: parseInt(searchParams.get('partidosPage') || '1', 10),
                }

                const response = await getDashboardData(params)
                setData(response as any)
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
            } finally {
                setIsLoadingData(false)
            }
        }

        fetchData()
    }, [searchParams])

    const updateParams = (mutator: (params: URLSearchParams) => void) => {
        const params = new URLSearchParams(searchParams?.toString() || '')
        mutator(params)
        startTransition(() => {
            const query = params.toString()
            router.push(query ? `${pathname}?${query}` : pathname)
        })
    }

    const handleFilterChange = (key: 'ano' | 'partido' | 'uf', value: string) => {
        updateParams(params => {
            const normalized = value === 'all' || value === 'TODOS' ? '' : value
            if (normalized) {
                params.set(key, value)
            } else {
                params.delete(key)
            }
            params.set('page', '1')
            if (key === 'partido') {
                params.set('partidosPage', '1')
            }
        })
    }

    const handleRankingPageChange = (direction: 'prev' | 'next') => {
        if (!data) return
        const delta = direction === 'prev' ? -1 : 1
        const next = Math.min(Math.max(data.pagination.page + delta, 1), data.pagination.totalPages)
        if (next === data.pagination.page) return
        updateParams(params => {
            params.set('page', next.toString())
        })
    }

    const handlePartidosPageChange = (direction: 'prev' | 'next') => {
        if (!data) return
        const delta = direction === 'prev' ? -1 : 1
        const next = Math.min(
            Math.max((data.appliedFilters?.partidosPage || data.aggregates.partidos.pagination.page) + delta, 1),
            data.aggregates.partidos.pagination.totalPages,
        )
        if (next === data.aggregates.partidos.pagination.page) return
        updateParams(params => {
            params.set('partidosPage', next.toString())
        })
    }

    if (isLoadingData || !data) {
        return <RankingSkeleton />
    }

    const { data: deputados, pagination, aggregates, metadata, appliedFilters } = data
    const { stats, resumoAnual, topFornecedores, partidos, ufs } = aggregates

    const anosDisponiveis = metadata?.availableFilters?.anos || []
    const partidosDisponiveis = metadata?.availableFilters?.partidos || []
    const ufsDisponiveis = metadata?.availableFilters?.ufs || []

    const appliedAno = appliedFilters?.ano || 'all'
    const appliedPartido = appliedFilters?.partido || 'TODOS'
    const appliedUf = appliedFilters?.uf || 'TODOS'

    const serieAnual = [...resumoAnual].sort((a, b) => a.ano - b.ano)

    // Data mapping for GraficosEspecializados
    const gastosPorDeputadoData = deputados.map(d => ({
        nome: d.nome,
        valorTotal: d.totalGasto,
        partido: d.partido,
        uf: d.uf
    }))

    const gastosPorPartidoData = partidos.items.map(p => ({
        partido: p.partido,
        valorTotal: p.totalGasto,
        deputados: p.numDeputados
    }))

    const gastosPorEstadoData = ufs.items.map(u => ({
        uf: u.uf,
        valorTotal: u.totalGasto,
        deputados: u.numDeputados
    }))

    const evolucaoTemporalData = serieAnual.map(a => ({
        periodo: a.ano.toString(),
        valor: a.total
    }))

    const topFornecedoresData = topFornecedores.items.map(f => ({
        nome: f.nome,
        valorTotal: f.valor,
        totalTransacoes: f.numTransacoes
    }))

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Header Section */}
            <div className="bg-muted/30 border-b mb-8">
                <div className="container mx-auto py-12">
                    <div className="max-w-4xl">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Ranking de Gastos
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Análise detalhada e comparativa dos gastos parlamentares.
                            Explore dados por deputado, partido e estado com transparência total.
                        </p>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4">
                <div className="space-y-8" aria-busy={isPending}>
                    {/* Filters Section */}
                    <RankingFilters
                        appliedAno={appliedAno}
                        appliedPartido={appliedPartido}
                        appliedUf={appliedUf}
                        anosDisponiveis={anosDisponiveis}
                        partidosDisponiveis={partidosDisponiveis}
                        ufsDisponiveis={ufsDisponiveis}
                        onFilterChange={handleFilterChange}
                    />

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            icon={<Users className="h-4 w-4" />}
                            title="Deputados"
                            value={formatNumberBR(stats.totalDeputados)}
                            loading={isPending}
                        />
                        <StatCard
                            icon={<Building2 className="h-4 w-4" />}
                            title="Fornecedores"
                            value={formatNumberBR(stats.totalFornecedores)}
                            loading={isPending}
                        />
                        <StatCard
                            icon={<DollarSign className="h-4 w-4" />}
                            title="Gasto Total"
                            value={formatCompactCurrencyBRL(stats.totalGasto)}
                            loading={isPending}
                        />
                        <StatCard
                            icon={<Receipt className="h-4 w-4" />}
                            title="Transações"
                            value={formatNumberBR(stats.totalTransacoes)}
                            loading={isPending}
                        />
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-lg w-fit">
                        <Button
                            variant={activeTab === 'geral' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('geral')}
                            className="gap-2"
                        >
                            <LayoutDashboard className="h-4 w-4" />
                            Visão Geral
                        </Button>
                        <Button
                            variant={activeTab === 'graficos' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('graficos')}
                            className="gap-2"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Análise Gráfica
                        </Button>
                    </div>

                    {/* Content Area */}
                    {activeTab === 'geral' ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Main Chart */}
                            <AnnualTrendChart
                                isPending={isPending}
                                serieAnual={serieAnual}
                                lastUpdate={metadata?.lastUpdate}
                            />

                            {/* Rankings Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <DeputiesRanking
                                    isPending={isPending}
                                    deputados={deputados}
                                    pagination={pagination}
                                    mediaPorDeputado={stats.mediaPorDeputado}
                                    onPageChange={handleRankingPageChange}
                                />

                                <SuppliersRanking isPending={isPending} topFornecedores={topFornecedores} />
                            </div>

                            {/* Comparisons Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <PartiesComparison
                                    isPending={isPending}
                                    partidos={partidos}
                                    appliedPartido={appliedPartido}
                                    onPageChange={handlePartidosPageChange}
                                />

                                <UfsComparison isPending={isPending} ufs={ufs} />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <GastosPorDeputado deputados={gastosPorDeputadoData} />
                                <EvolucaoTemporal evolucao={evolucaoTemporalData} tipo="area" />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <GastosPorPartido partidos={gastosPorPartidoData} />
                                <GastosPorEstado estados={gastosPorEstadoData} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <TopFornecedores fornecedores={topFornecedoresData} />
                                {/* Placeholder for ScoreSuspeicao if needed */}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

function RankingSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            <div className="bg-muted/30 border-b mb-8 h-48 flex items-center">
                <div className="container mx-auto">
                    <Skeleton className="h-12 w-64 mb-4" />
                    <Skeleton className="h-6 w-96" />
                </div>
            </div>
            <div className="container mx-auto px-4 space-y-8">
                <Skeleton className="h-32 w-full" />
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-96" />
            </div>
        </div>
    )
}
