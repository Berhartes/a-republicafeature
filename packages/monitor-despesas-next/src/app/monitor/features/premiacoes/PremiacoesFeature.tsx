'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPremiacoes } from '@/actions/data-actions'
import { ExibicaoPremiacoes, PremiacoesFilters, PremiacoesRankingList, PremiacoesStats } from './PremiacoesComponents'
import { Skeleton } from '@/components/ui/skeleton'
import { Trophy, Award, Sparkles } from 'lucide-react'

export function PremiacoesFeature() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState<any>(null)
    const [showFilters, setShowFilters] = useState(false)
    const [deputadosExibidos, setDeputadosExibidos] = useState(10)

    const ano = searchParams.get('ano') || undefined
    const categoria = searchParams.get('categoria') || undefined
    const uf = searchParams.get('uf') || undefined

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const result = await getPremiacoes({
                    ano,
                    categoria,
                    uf
                })
                setData(result)
            } catch (error) {
                console.error('Failed to fetch premiacoes:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [searchParams])

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'todos') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        startTransition(() => {
            router.push(`?${params.toString()}`)
        })
    }

    const handleLimparFiltros = () => {
        startTransition(() => {
            router.push('?')
        })
    }

    if (isLoading || !data) {
        return <PremiacoesSkeleton />
    }

    const { premiacoes, rankings, estatisticas, metadata } = data
    const { anosDisponiveis, categoriasDisponiveis, ufsDisponiveis } = metadata || {}

    // Ensure all data has safe defaults
    const safePremiacoes = premiacoes || {
        coroas: [],
        trofeus: [],
        medalhas: [],
        coroasOuro: [],
        trofeusPrata: [],
        medalhasBronze: [],
        badgesEspeciais: [],
        estatisticas: {
            totalPremiacoes: 0,
            totalCoroas: 0,
            totalTrofeus: 0,
            totalMedalhas: 0,
            totalBadgesEspeciais: 0
        }
    }

    const safeRankings = rankings || []
    const safeEstatisticas = estatisticas || { totalDeputados: 0, campeao: '', maiorGasto: 0 }

    return (
        <div className="container mx-auto py-8 space-y-10 animate-in fade-in duration-500">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 border border-primary/10 shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy className="h-64 w-64 text-primary" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/20 rounded-lg backdrop-blur-sm">
                            <Award className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Premiações e Reconhecimento
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                        Destaques positivos e negativos baseados na análise detalhada de dados.
                        Identifique padrões, campeões de gastos e menções honrosas.
                    </p>
                </div>
            </div>

            <PremiacoesStats estatisticas={safeEstatisticas} />

            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-2xl font-bold">Destaques do Período</h2>
                </div>
                <ExibicaoPremiacoes premiacoes={safePremiacoes} />
            </div>

            <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl border border-border/50">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold">Rankings Detalhados</h2>
                            <p className="text-sm text-muted-foreground">Explore os dados completos com filtros avançados</p>
                        </div>
                    </div>

                    <PremiacoesFilters
                        anosDisponiveis={anosDisponiveis || []}
                        categoriasDisponiveis={categoriasDisponiveis || []}
                        ufsDisponiveis={ufsDisponiveis || []}
                        anoSelecionado={ano || ''}
                        categoriaSelecionada={categoria || ''}
                        ufSelecionada={uf || ''}
                        onFilterChange={handleFilterChange}
                        onLimparFiltros={handleLimparFiltros}
                        isPending={isPending}
                        showFilters={showFilters}
                        onToggleFilters={() => setShowFilters(!showFilters)}
                    />

                    <PremiacoesRankingList
                        rankingsFiltrados={safeRankings}
                        deputadosExibidos={deputadosExibidos}
                        onVerMais={() => setDeputadosExibidos(prev => prev + 10)}
                        titulo={categoria ? `Ranking: ${categoria}` : 'Ranking Geral'}
                        anoSelecionado={ano || ''}
                    />
                </div>
            </div>
        </div>
    )
}

function PremiacoesSkeleton() {
    return (
        <div className="container mx-auto py-8 space-y-8">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
        </div>
    )
}
