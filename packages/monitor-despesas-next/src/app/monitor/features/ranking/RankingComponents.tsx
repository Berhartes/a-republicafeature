'use client'

import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Filter, TrendingUp, TrendingDown, Building2, User } from 'lucide-react'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { ReactNode } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Area,
    AreaChart
} from 'recharts'

// --- Types ---

export interface PaginationInfo {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
}

export interface DashboardDeputadoItem {
    id: string
    nome: string
    partido: string
    uf: string
    totalGasto: number
    posicao: number
}

export interface DashboardFornecedorItem {
    id?: string
    nome: string
    cnpj: string
    valor: number
    scoreSuspeicao: number
    numTransacoes: number
}

export interface PartidoComparativoItem {
    partido: string
    totalGasto: number
    numDeputados: number
    mediaPorDeputado: number
}

export interface UfComparativoItem {
    uf: string
    totalGasto: number
    numDeputados: number
    mediaPorDeputado: number
}

// --- Helper Components ---

const SectionSkeleton = ({ rows = 4 }: { rows?: number }) => (
    <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[150px]" />
                </div>
                <Skeleton className="h-4 w-[100px]" />
            </div>
        ))}
    </div>
)

// --- Components ---

export function StatCard({
    icon,
    title,
    value,
    loading,
    trend,
    trendValue
}: {
    icon: ReactNode
    title: string
    value: string
    loading?: boolean
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
}) {
    return (
        <Card className="overflow-hidden border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full text-primary">{icon}</div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-8 w-32" />
                ) : (
                    <div className="space-y-1">
                        <div className="text-2xl font-bold tracking-tight">{value}</div>
                        {trend && trendValue && (
                            <div className={`flex items-center text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                {trend === 'up' ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                                {trendValue}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface RankingFiltersProps {
    appliedAno: string
    appliedPartido: string
    appliedUf: string
    anosDisponiveis: number[]
    partidosDisponiveis: string[]
    ufsDisponiveis: string[]
    onFilterChange: (key: 'ano' | 'partido' | 'uf', value: string) => void
}

export function RankingFilters({
    appliedAno,
    appliedPartido,
    appliedUf,
    anosDisponiveis,
    partidosDisponiveis,
    ufsDisponiveis,
    onFilterChange,
}: RankingFiltersProps) {
    return (
        <Card className="bg-muted/30 border-none shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Filter className="h-4 w-4 text-primary" />
                    Filtros de Análise
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Ano de Referência</label>
                        <Select value={appliedAno} onValueChange={(value) => onFilterChange('ano', value)}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Ano" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os anos</SelectItem>
                                {anosDisponiveis.map((ano) => (
                                    <SelectItem key={ano} value={ano.toString()}>
                                        {ano}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Partido Político</label>
                        <Select
                            value={appliedPartido}
                            onValueChange={(value) => onFilterChange('partido', value)}
                        >
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Partido" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos os partidos</SelectItem>
                                {partidosDisponiveis.map((partido) => (
                                    <SelectItem key={partido} value={partido}>
                                        {partido}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Estado (UF)</label>
                        <Select value={appliedUf} onValueChange={(value) => onFilterChange('uf', value)}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TODOS">Todos os estados</SelectItem>
                                {ufsDisponiveis.map((uf) => (
                                    <SelectItem key={uf} value={uf}>
                                        {uf}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface DeputiesRankingProps {
    isPending: boolean
    deputados: DashboardDeputadoItem[]
    pagination: PaginationInfo
    mediaPorDeputado: number
    onPageChange: (direction: 'prev' | 'next') => void
}

export function DeputiesRanking({
    isPending,
    deputados,
    pagination,
    mediaPorDeputado,
    onPageChange,
}: DeputiesRankingProps) {
    const maxVal = deputados.length > 0 ? deputados[0].totalGasto : 0

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Ranking de Deputados
                    </CardTitle>
                    <CardDescription>
                        Maiores gastos no período selecionado
                    </CardDescription>
                </div>
                <Badge variant="secondary" className="font-mono">
                    Média: {formatCurrencyBRL(mediaPorDeputado)}
                </Badge>
            </CardHeader>
            <CardContent className="flex-1">
                {isPending ? (
                    <SectionSkeleton rows={pagination.pageSize} />
                ) : (
                    <div className="space-y-4">
                        {deputados.map((dep, index) => {
                            const percent = maxVal > 0 ? (dep.totalGasto / maxVal) * 100 : 0
                            const rankColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-600' : 'text-muted-foreground'

                            return (
                                <div key={dep.id} className="group flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <div className={`font-bold text-lg w-8 text-center ${rankColor}`}>
                                        #{dep.posicao}
                                    </div>
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                                        <AvatarImage src={`https://www.camara.leg.br/internet/deputado/bandep/${dep.id}.jpg`} alt={dep.nome} />
                                        <AvatarFallback>{dep.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <p className="font-medium truncate pr-2">{dep.nome}</p>
                                            <span className="font-bold text-sm">{formatCurrencyBRL(dep.totalGasto)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1">{dep.partido}</Badge>
                                            <span>{dep.uf}</span>
                                        </div>
                                        <Progress value={percent} className="h-1.5" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-4">
                <div className="text-xs text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pagination.page === 1 || isPending}
                        onClick={() => onPageChange('prev')}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={pagination.page === pagination.totalPages || isPending}
                        onClick={() => onPageChange('next')}
                    >
                        Próxima <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    )
}

interface SuppliersRankingProps {
    isPending: boolean
    topFornecedores: {
        items: DashboardFornecedorItem[]
        pagination: PaginationInfo
    }
}

export function SuppliersRanking({
    isPending,
    topFornecedores,
}: SuppliersRankingProps) {
    const maxVal = topFornecedores.items.length > 0 ? topFornecedores.items[0].valor : 0

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    Top Fornecedores
                </CardTitle>
                <CardDescription>
                    Empresas com maior volume de recebimentos
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {isPending ? (
                    <SectionSkeleton rows={topFornecedores.pagination.pageSize} />
                ) : (
                    <div className="space-y-4">
                        {topFornecedores.items.map((fornecedor, index) => {
                            const percent = maxVal > 0 ? (fornecedor.valor / maxVal) * 100 : 0

                            return (
                                <div key={fornecedor.id || `supplier-${index}`} className="group p-3 rounded-lg border hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-start gap-3 overflow-hidden">
                                            <div className="bg-primary/10 p-2 rounded-full mt-1">
                                                <Building2 className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-medium truncate text-sm" title={fornecedor.nome}>{fornecedor.nome}</p>
                                                <p className="text-xs text-muted-foreground font-mono mt-0.5">{fornecedor.cnpj}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-2">
                                            <p className="font-bold text-sm">{formatCurrencyBRL(fornecedor.valor)}</p>
                                            <p className="text-[10px] text-muted-foreground">{fornecedor.numTransacoes} transações</p>
                                        </div>
                                    </div>
                                    <Progress value={percent} className="h-1.5" />
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface PartiesComparisonProps {
    isPending: boolean
    partidos: {
        items: PartidoComparativoItem[]
        pagination: PaginationInfo
    }
    appliedPartido: string
    onPageChange: (direction: 'prev' | 'next') => void
}

export function PartiesComparison({
    isPending,
    partidos,
    appliedPartido,
    onPageChange,
}: PartiesComparisonProps) {
    const maxVal = partidos.items.length > 0 ? partidos.items[0].totalGasto : 0

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                <div>
                    <CardTitle className="text-lg font-bold">Gastos por Partido</CardTitle>
                    <CardDescription>Comparativo de volume total</CardDescription>
                </div>
                <Badge variant="outline" className="font-normal">
                    {partidos.pagination.totalItems} partidos
                </Badge>
            </CardHeader>
            <CardContent className="flex-1">
                {isPending ? (
                    <SectionSkeleton rows={partidos.pagination.pageSize} />
                ) : partidos.items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Sem dados disponíveis.</div>
                ) : (
                    <div className="space-y-4">
                        {partidos.items.map((item) => {
                            const percent = maxVal > 0 ? (item.totalGasto / maxVal) * 100 : 0
                            const isSelected = item.partido === appliedPartido

                            return (
                                <div
                                    key={item.partido}
                                    className={`relative p-3 rounded-lg border transition-all ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={isSelected ? "default" : "secondary"} className="w-16 justify-center">
                                                {item.partido}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{item.numDeputados} deps.</span>
                                        </div>
                                        <span className="font-bold text-sm">{formatCurrencyBRL(item.totalGasto)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Progress value={percent} className="h-1.5 flex-1" />
                                        <span className="text-[10px] text-muted-foreground w-16 text-right">
                                            Média: {formatCurrencyBRL(item.mediaPorDeputado)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex items-center justify-end gap-2 border-t pt-4">
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={partidos.pagination.page === 1 || isPending}
                    onClick={() => onPageChange('prev')}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={partidos.pagination.page === partidos.pagination.totalPages || isPending}
                    onClick={() => onPageChange('next')}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    )
}

interface UfsComparisonProps {
    isPending: boolean
    ufs: {
        items: UfComparativoItem[]
    }
}

export function UfsComparison({ isPending, ufs }: UfsComparisonProps) {
    const maxVal = ufs.items.length > 0 ? ufs.items[0].totalGasto : 0

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Gastos por Estado (UF)</CardTitle>
                <CardDescription>Distribuição geográfica dos gastos</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
                {isPending ? (
                    <SectionSkeleton rows={ufs.items.length} />
                ) : (
                    <div className="space-y-3">
                        {ufs.items.map((item) => {
                            const percent = maxVal > 0 ? (item.totalGasto / maxVal) * 100 : 0

                            return (
                                <div key={item.uf} className="flex items-center gap-3 text-sm">
                                    <div className="w-8 font-bold text-muted-foreground">{item.uf}</div>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs text-muted-foreground">{item.numDeputados} deps.</span>
                                            <span className="font-medium">{formatCurrencyBRL(item.totalGasto)}</span>
                                        </div>
                                        <Progress value={percent} className="h-1.5" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

interface AnnualTrendChartProps {
    isPending: boolean
    serieAnual: Array<{ ano: number; total: number }>
    lastUpdate?: string
}

export function AnnualTrendChart({
    isPending,
    serieAnual,
    lastUpdate,
}: AnnualTrendChartProps) {
    return (
        <Card className="overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolução Temporal
                </CardTitle>
                <CardDescription>
                    Histórico de gastos acumulados por ano
                    {lastUpdate && <span className="block text-xs mt-1">Atualizado em {new Date(lastUpdate).toLocaleDateString()}</span>}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isPending ? (
                    <Skeleton className="h-[300px] w-full" />
                ) : serieAnual.length > 0 ? (
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={serieAnual} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="ano"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(0)}M`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                    formatter={(value: number) => [formatCurrencyBRL(value), 'Total Gasto']}
                                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorTotal)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                        Sem dados suficientes para plotar a série histórica.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
