import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
    Filter,
    Calendar,
    Trophy,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Crown,
    Medal,
    Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import type { PremiacoesProcessadas } from '@/types/etl-deputados.types'
import type { Deputado } from './types/types'

// --- PremiacoesStats Component ---

interface PremiacoesStatsProps {
    estatisticas: {
        totalDeputados: number
        campeao: string
        maiorGasto: number
    }
}

export function PremiacoesStats({ estatisticas }: PremiacoesStatsProps) {
    return (
        <>
            {/* Hero destaque do campeão atual */}
            <Card className="relative overflow-hidden border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/5 to-transparent" />
                <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Crown className="h-6 w-6 text-primary" />
                        </div>
                        Campeão Atual
                    </CardTitle>
                    <div className="text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                        Maior gasto identificado
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-lg font-bold text-yellow-700 border-2 border-yellow-200 shadow-sm">
                            1º
                        </div>
                        <div>
                            <div className="text-xl font-bold text-foreground">{estatisticas.campeao}</div>
                            <div className="text-sm text-muted-foreground">Top do ranking geral</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-extrabold text-primary">{formatCurrencyBRL(estatisticas.maiorGasto)}</div>
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">somatório total</div>
                    </div>
                </CardContent>
            </Card>

            <section className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-all border-l-4 border-l-blue-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Deputados analisados</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatNumberBR(estatisticas.totalDeputados)}</p>
                        <p className="text-xs text-muted-foreground mt-1">participantes avaliados no ranking</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all border-l-4 border-l-yellow-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Campeão atual</CardTitle>
                        <div className="p-2 bg-yellow-100 rounded-full">
                            <Crown className="h-4 w-4 text-yellow-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold truncate" title={estatisticas.campeao}>{estatisticas.campeao}</p>
                        <p className="text-xs text-muted-foreground mt-1">maior desempenho no período</p>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-md transition-all border-l-4 border-l-green-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Maior gasto</CardTitle>
                        <div className="p-2 bg-green-100 rounded-full">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{formatCurrencyBRL(estatisticas.maiorGasto)}</p>
                        <p className="text-xs text-muted-foreground mt-1">somatório do campeão</p>
                    </CardContent>
                </Card>
            </section>
        </>
    )
}

// --- ExibicaoPremiacoes Component ---

interface ExibicaoPremiacoesProps {
    premiacoes: PremiacoesProcessadas
    loading?: boolean
}

export function ExibicaoPremiacoes({ premiacoes, loading }: ExibicaoPremiacoesProps) {
    const totalCoroas = premiacoes.coroas?.length || 0
    const totalTrofeus = premiacoes.trofeus?.length || 0
    const totalMedalhas = premiacoes.medalhas?.length || 0

    return (
        <Tabs defaultValue="coroas" className="w-full">
            <div className="flex justify-center mb-6">
                <TabsList className="grid w-full max-w-2xl grid-cols-3 p-1 bg-muted/50 rounded-xl">
                    <TabsTrigger
                        value="coroas"
                        disabled={totalCoroas === 0}
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2"
                    >
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium">Coroas ({totalCoroas})</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="trofeus"
                        disabled={totalTrofeus === 0}
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2"
                    >
                        <Trophy className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Troféus ({totalTrofeus})</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="medalhas"
                        disabled={totalMedalhas === 0}
                        className="flex items-center gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-2"
                    >
                        <Medal className="h-4 w-4 text-orange-600" />
                        <span className="font-medium">Medalhas ({totalMedalhas})</span>
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="coroas" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Crown className="h-5 w-5 text-yellow-600" />
                            </div>
                            Campeões históricos
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        {totalCoroas === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <Crown className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhuma coroa disponível</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {premiacoes.coroas.map((coroa, index) => (
                                    <Card
                                        key={`coroa-${index}`}
                                        className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <CardHeader className="pb-3 border-b border-yellow-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <CardTitle className="text-base font-bold text-yellow-900 truncate" title={coroa.nomeEleitoral || coroa.titulo}>
                                                        {coroa.nomeEleitoral || coroa.titulo}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="bg-white/50 border-yellow-200 text-yellow-800 text-[10px] px-1.5 py-0 h-5">
                                                            {coroa.siglaPartido}
                                                        </Badge>
                                                        <span className="text-xs font-medium text-yellow-700">{coroa.siglaUf}</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-yellow-100 rounded-full shrink-0">
                                                    <Crown className="h-5 w-5 text-yellow-600" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs font-medium border-none">
                                                    {coroa.categoria}
                                                </Badge>
                                                {coroa.ano && (
                                                    <Badge variant="outline" className="border-yellow-300 text-yellow-700 text-xs">
                                                        {coroa.ano}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-yellow-600 uppercase font-semibold tracking-wider mb-0.5">Valor Total</p>
                                                <p className="text-xl font-extrabold text-yellow-900">
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL'
                                                    }).format(coroa.valor)}
                                                </p>
                                            </div>
                                            {coroa.descricao && (
                                                <p className="text-xs text-yellow-800/80 line-clamp-2 bg-yellow-100/50 p-2 rounded-md italic">
                                                    "{coroa.descricao}"
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="trofeus" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Trophy className="h-5 w-5 text-blue-600" />
                            </div>
                            Campeões anuais
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        {totalTrofeus === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <Trophy className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhum troféu disponível</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {premiacoes.trofeus.map((trofeu, index) => (
                                    <Card
                                        key={`trofeu-${index}`}
                                        className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <CardHeader className="pb-3 border-b border-blue-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <CardTitle className="text-base font-bold text-blue-900 truncate" title={trofeu.nomeEleitoral || trofeu.titulo}>
                                                        {trofeu.nomeEleitoral || trofeu.titulo}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="bg-white/50 border-blue-200 text-blue-800 text-[10px] px-1.5 py-0 h-5">
                                                            {trofeu.siglaPartido}
                                                        </Badge>
                                                        <span className="text-xs font-medium text-blue-700">{trofeu.siglaUf}</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-blue-100 rounded-full shrink-0">
                                                    <Trophy className="h-5 w-5 text-blue-600" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs font-medium border-none">
                                                    {trofeu.categoria}
                                                </Badge>
                                                {trofeu.ano && (
                                                    <Badge variant="outline" className="border-blue-300 text-blue-700 text-xs">
                                                        {trofeu.ano}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-blue-600 uppercase font-semibold tracking-wider mb-0.5">Valor Total</p>
                                                <p className="text-xl font-extrabold text-blue-900">
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL'
                                                    }).format(trofeu.valor)}
                                                </p>
                                            </div>
                                            {trofeu.descricao && (
                                                <p className="text-xs text-blue-800/80 line-clamp-2 bg-blue-100/50 p-2 rounded-md italic">
                                                    "{trofeu.descricao}"
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="medalhas" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="border-none shadow-none bg-transparent">
                    <CardHeader className="px-0 pt-0">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Medal className="h-5 w-5 text-orange-600" />
                            </div>
                            Menções honrosas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-0">
                        {totalMedalhas === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <Medal className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground font-medium">Nenhuma medalha disponível</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {premiacoes.medalhas.map((medalha, index) => (
                                    <Card
                                        key={`medalha-${index}`}
                                        className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                    >
                                        <CardHeader className="pb-3 border-b border-orange-100">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0 pr-2">
                                                    <CardTitle className="text-base font-bold text-orange-900 truncate" title={medalha.nomeEleitoral || medalha.titulo}>
                                                        {medalha.nomeEleitoral || medalha.titulo}
                                                    </CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="outline" className="bg-white/50 border-orange-200 text-orange-800 text-[10px] px-1.5 py-0 h-5">
                                                            {medalha.siglaPartido}
                                                        </Badge>
                                                        <span className="text-xs font-medium text-orange-700">{medalha.siglaUf}</span>
                                                    </div>
                                                </div>
                                                <div className="p-2 bg-orange-100 rounded-full shrink-0">
                                                    <Medal className="h-5 w-5 text-orange-600" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-4 space-y-3">
                                            <div className="flex gap-2 flex-wrap">
                                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 text-xs font-medium border-none">
                                                    {medalha.categoria}
                                                </Badge>
                                                {medalha.ano && (
                                                    <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs">
                                                        {medalha.ano}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs text-orange-600 uppercase font-semibold tracking-wider mb-0.5">Valor Total</p>
                                                <p className="text-xl font-extrabold text-orange-900">
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL'
                                                    }).format(medalha.valor)}
                                                </p>
                                            </div>
                                            {medalha.descricao && (
                                                <p className="text-xs text-orange-800/80 line-clamp-2 bg-orange-100/50 p-2 rounded-md italic">
                                                    "{medalha.descricao}"
                                                </p>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    )
}

// --- PremiacoesFilters Component ---

interface PremiacoesFiltersProps {
    anosDisponiveis: number[]
    categoriasDisponiveis: string[]
    ufsDisponiveis: string[]
    anoSelecionado: string
    categoriaSelecionada: string
    ufSelecionada: string
    onFilterChange: (key: 'ano' | 'categoria' | 'uf', value: string) => void
    onLimparFiltros: () => void
    isPending: boolean
    showFilters: boolean
    onToggleFilters: () => void
}

export function PremiacoesFilters({
    anosDisponiveis,
    categoriasDisponiveis,
    ufsDisponiveis,
    anoSelecionado,
    categoriaSelecionada,
    ufSelecionada,
    onFilterChange,
    onLimparFiltros,
    isPending,
    showFilters,
    onToggleFilters
}: PremiacoesFiltersProps) {
    const [showCategoriaSelection, setShowCategoriaSelection] = useState(false)

    return (
        <Card className="bg-muted/30 border-none shadow-sm">
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                        <Filter className="h-4 w-4 text-primary" />
                    </div>
                    Filtrar rankings
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Ajuste ano e categoria para refinar os resultados.
                    <Button variant="ghost" size="sm" onClick={onToggleFilters} className="ml-2">
                        {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className={cn('flex flex-col gap-4 pt-2', showFilters ? 'block' : 'hidden')} aria-hidden={!showFilters}>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border shadow-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Select
                            value={anoSelecionado}
                            onValueChange={value => onFilterChange('ano', value)}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-48 bg-background">
                                <SelectValue placeholder="Todos os anos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os anos</SelectItem>
                                {anosDisponiveis.map(ano => (
                                    <SelectItem key={ano} value={ano.toString()}>
                                        {ano}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-3 w-full">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border shadow-sm">
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowCategoriaSelection(prev => !prev)}
                                disabled={isPending}
                                className="w-full sm:w-80 justify-between bg-background"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    {categoriaSelecionada !== 'TODAS' && <Trophy className="h-3.5 w-3.5 text-primary" />}
                                    <span className="truncate">{categoriaSelecionada === 'TODAS' ? 'Escolher uma categoria' : categoriaSelecionada}</span>
                                </span>
                                {showCategoriaSelection ? <ChevronUp className="h-4 w-4 opacity-50" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                            </Button>
                        </div>

                        {showCategoriaSelection && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4 border rounded-lg bg-background shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                <Button
                                    variant={categoriaSelecionada === 'TODAS' ? 'default' : 'ghost'}
                                    onClick={() => {
                                        onFilterChange('categoria', 'TODAS')
                                        setShowCategoriaSelection(false)
                                    }}
                                    disabled={isPending}
                                    className="justify-start h-auto py-2.5 px-3"
                                >
                                    <div className="flex items-center gap-2 w-full">
                                        <Filter className="h-3.5 w-3.5 flex-shrink-0" />
                                        <span className="text-xs font-medium leading-tight break-words text-left">Todas as categorias</span>
                                    </div>
                                </Button>
                                {categoriasDisponiveis.map(categoria => (
                                    <Button
                                        key={categoria}
                                        variant={categoriaSelecionada === categoria ? 'default' : 'ghost'}
                                        onClick={() => {
                                            onFilterChange('categoria', categoria)
                                            setShowCategoriaSelection(false)
                                        }}
                                        disabled={isPending}
                                        className="justify-start h-auto py-2.5 px-3"
                                    >
                                        <div className="flex items-center gap-2 w-full">
                                            <Trophy className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                                            <span className="text-xs font-medium leading-tight break-words text-left">{categoria}</span>
                                        </div>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border shadow-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Select
                            value={ufSelecionada}
                            onValueChange={value => onFilterChange('uf', value)}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-32 bg-background">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODAS">Todos</SelectItem>
                                {ufsDisponiveis.map(uf => (
                                    <SelectItem key={uf} value={uf}>
                                        {uf}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {(anoSelecionado !== 'todos' || categoriaSelecionada !== 'TODAS' || ufSelecionada !== 'TODAS') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onLimparFiltros}
                            disabled={isPending}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            Limpar Filtros
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// --- PremiacoesRankingList Component ---

interface PremiacoesRankingListProps {
    rankingsFiltrados: Deputado[]
    deputadosExibidos: number
    onVerMais: () => void
    titulo: string
    anoSelecionado: string
}

export function PremiacoesRankingList({
    rankingsFiltrados,
    deputadosExibidos,
    onVerMais,
    titulo,
    anoSelecionado
}: PremiacoesRankingListProps) {
    return (
        <Card className="mt-8 border-none shadow-none bg-transparent">
            <CardHeader className="space-y-1 px-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold">{titulo}</CardTitle>
                    <Badge variant="outline" className="font-normal">
                        {rankingsFiltrados.length} resultados
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    Exibindo {Math.min(deputadosExibidos, rankingsFiltrados.length)} de {rankingsFiltrados.length} deputados conforme filtros aplicados.
                </p>
            </CardHeader>
            <CardContent className="px-0">
                {rankingsFiltrados.length > 0 ? (
                    <>
                        <div className="space-y-3">
                            {rankingsFiltrados.slice(0, deputadosExibidos).map((deputado, index) => {
                                const posicao = deputado.posicao ?? index + 1
                                const medalClass = posicao === 1
                                    ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-sm'
                                    : posicao === 2
                                        ? 'bg-gradient-to-r from-gray-50 to-white border-gray-200 shadow-sm'
                                        : posicao === 3
                                            ? 'bg-gradient-to-r from-amber-50 to-white border-amber-200 shadow-sm'
                                            : 'bg-white hover:bg-gray-50/50'

                                const rankBadgeColor = posicao === 1
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : posicao === 2
                                        ? 'bg-gray-100 text-gray-700'
                                        : posicao === 3
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'bg-primary/5 text-primary'

                                return (
                                    <div
                                        key={deputado.id}
                                        className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition-all', medalClass)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold", rankBadgeColor)}>
                                                {posicao}º
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-semibold leading-none text-lg">{deputado.nome}</p>
                                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{deputado.partido}</Badge>
                                                    <span>•</span>
                                                    <span className="font-medium">{deputado.uf}</span>
                                                    <span>•</span>
                                                    <span>{deputado.numeroDespesas} despesas</span>
                                                </div>
                                                {typeof deputado.fornecedoresIdentificados === 'number' && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {deputado.fornecedoresIdentificados} fornecedores analisados
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right pl-14 sm:pl-0">
                                            <p className="text-lg font-bold text-primary">
                                                {formatCurrencyBRL(deputado.totalDespesas)}
                                            </p>
                                            {deputado.porAno && anoSelecionado !== 'todos' && deputado.porAno[anoSelecionado] != null && (
                                                <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full inline-block mt-1">
                                                    {formatCurrencyBRL(deputado.porAno[anoSelecionado]!)} em {anoSelecionado}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {deputadosExibidos < rankingsFiltrados.length && (
                            <div className="mt-8 flex justify-center">
                                <Button
                                    onClick={onVerMais}
                                    variant="outline"
                                    size="lg"
                                    className="min-w-[200px] shadow-sm hover:bg-primary hover:text-primary-foreground transition-all"
                                >
                                    Ver mais +10 deputados
                                    <span className="ml-2 text-xs opacity-70">({rankingsFiltrados.length - deputadosExibidos} restantes)</span>
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="py-16 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                            <Filter className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">Nenhum resultado encontrado</h3>
                        <p className="text-muted-foreground mt-1 max-w-xs mx-auto">
                            Tente ajustar os filtros de ano, categoria ou estado para encontrar registros.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
