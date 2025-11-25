'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ChevronLeft, ChevronRight, Filter, X, Building2, User, AlertTriangle } from 'lucide-react'
import { getFornecedores, getDeputados } from '@/actions/data-actions'
import CardParlamentar from '@/components/domain/parlamentar/CardParlamentar'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import type { FornecedorResumo, DeputadoResumo } from '@a-republica/shared'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Types
type SearchMode = 'deputados' | 'fornecedores' | 'global'

interface SearchFeatureProps {
    mode: SearchMode
    title?: string
    description?: string
    className?: string
    initialFilters?: Record<string, string>
}

interface SearchState {
    items: any[]
    // Global mode specific
    deputadosItems?: any[]
    fornecedoresItems?: any[]
    total: number
    page: number
    pageSize: number
    isLoading: boolean
}

// Constants
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const PARTIDOS = ['PT', 'PL', 'PP', 'UNIÃO', 'PSD', 'REPUBLICANOS', 'MDB', 'PSDB', 'PDT', 'PODE', 'PSOL', 'PCdoB', 'NOVO', 'PSB'] // Simplified list
const CATEGORIAS = [
    'COMBUSTÍVEIS E LUBRIFICANTES',
    'PASSAGENS AÉREAS',
    'ALIMENTAÇÃO',
    'HOSPEDAGEM',
    'DIVULGAÇÃO',
    'TELEFONIA',
    'CONSULTORIAS',
    'LOCAÇÃO DE VEÍCULOS'
]

export function SearchFeature({
    mode,
    title,
    description,
    className
}: SearchFeatureProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    // Local state for immediate UI feedback
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || searchParams.get('searchTerm') || '')

    // Data state
    const [data, setData] = useState<SearchState>({
        items: [],
        deputadosItems: [],
        fornecedoresItems: [],
        total: 0,
        page: 1,
        pageSize: 12,
        isLoading: true
    })

    // Sync URL params to local state on load
    useEffect(() => {
        setSearchTerm(searchParams.get('search') || searchParams.get('searchTerm') || '')
    }, [searchParams])

    // Fetch data
    const fetchData = useCallback(async () => {
        setData(prev => ({ ...prev, isLoading: true }))

        try {
            const page = parseInt(searchParams.get('page') || '1', 10)
            const term = searchParams.get('search') || searchParams.get('searchTerm')
            const uf = searchParams.get('uf')
            const partido = searchParams.get('partido')
            const categoria = searchParams.get('categoria')
            const sort = searchParams.get('sort')

            let result: any = { items: [], total: 0 }
            let deputadosRes: any = { deputados: [], total: 0 }
            let fornecedoresRes: any = { fornecedores: [], total: 0 }

            if (mode === 'deputados') {
                const res = await getDeputados({
                    page,
                    pageSize: 12,
                    searchTerm: term || undefined,
                    uf: uf === 'todos' ? undefined : uf || undefined,
                    partido: partido === 'todos' ? undefined : partido || undefined,
                    sortBy: sort as any
                })
                result = { items: res.deputados, total: res.total }
            } else if (mode === 'fornecedores') {
                const res = await getFornecedores({
                    page,
                    pageSize: 12,
                    searchTerm: term || undefined,
                    categoria: categoria === 'todas' ? undefined : categoria || undefined,
                    sortBy: sort as any
                })
                result = { items: res.fornecedores, total: res.total }
            } else if (mode === 'global') {
                // Fetch both for global search
                const [depRes, fornRes] = await Promise.all([
                    getDeputados({
                        page,
                        pageSize: 12,
                        searchTerm: term || undefined,
                        uf: uf === 'todos' ? undefined : uf || undefined,
                        partido: partido === 'todos' ? undefined : partido || undefined,
                    }),
                    getFornecedores({
                        page,
                        pageSize: 12,
                        searchTerm: term || undefined,
                        categoria: categoria === 'todas' ? undefined : categoria || undefined,
                    })
                ])
                deputadosRes = depRes
                fornecedoresRes = fornRes
                result = { items: [], total: depRes.total + fornRes.total } // Total combined for now
            }

            setData({
                items: result.items || [],
                deputadosItems: deputadosRes.deputados || [],
                fornecedoresItems: fornecedoresRes.fornecedores || [],
                total: result.total || 0,
                page,
                pageSize: 12,
                isLoading: false
            })
        } catch (error) {
            console.error('Search failed:', error)
            setData(prev => ({ ...prev, isLoading: false }))
        }
    }, [searchParams, mode])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // URL Updates
    const updateFilter = (key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'todos' && value !== 'todas') {
            params.set(key, value)
        } else {
            params.delete(key)
        }

        // Reset page on filter change
        if (key !== 'page') {
            params.delete('page')
        }

        startTransition(() => {
            router.push(`?${params.toString()}`)
        })
    }

    const handleSearch = () => {
        updateFilter('search', searchTerm)
    }

    const handleClear = () => {
        setSearchTerm('')
        router.push(window.location.pathname)
    }

    // Renderers
    const renderFornecedorItem = (fornecedor: FornecedorResumo, index: number) => {
        const rank = ((data.page - 1) * data.pageSize) + index + 1
        const score = (fornecedor as any).scoreSuspeicao as number | undefined
        const scoreColor = score && score > 70 ? 'bg-red-500' : score && score > 30 ? 'bg-yellow-500' : 'bg-green-500'
        const scoreLabel = score && score > 70 ? 'Alto Risco' : score && score > 30 ? 'Risco Médio' : 'Baixo Risco'

        return (
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                <div className="flex-1 w-full">
                    <div className="flex items-start gap-3">
                        <span className="text-sm text-muted-foreground font-mono mt-1">#{rank.toString().padStart(3, '0')}</span>
                        <div>
                            <h3 className="font-medium text-lg">{fornecedor.nome}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <Badge variant="outline" className="font-mono text-xs">CNPJ: {fornecedor.cnpjCpf}</Badge>
                                <Badge variant="secondary" className="text-xs">{(fornecedor.tipoDespesaPrincipal || '').trim() || 'DIVERSOS'}</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrencyBRL(fornecedor.totalRecebido)}</p>
                        <p className="text-xs text-muted-foreground">{formatNumberBR(fornecedor.numeroTransacoes)} transações</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 min-w-[80px]">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${scoreColor}`}></div>
                            <span className="text-sm font-bold">{typeof score === 'number' ? score.toFixed(0) : '-'}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{scoreLabel}</span>
                    </div>
                </div>
            </div>
        )
    }

    const renderPagination = () => {
        const totalPages = Math.ceil(data.total / data.pageSize)
        if (totalPages <= 1) return null

        return (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                    Mostrando {((data.page - 1) * data.pageSize) + 1} a {Math.min(data.page * data.pageSize, data.total)} de {data.total} resultados
                </p>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFilter('page', String(data.page - 1))}
                        disabled={data.page <= 1 || isPending || data.isLoading}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFilter('page', String(data.page + 1))}
                        disabled={data.page >= totalPages || isPending || data.isLoading}
                    >
                        Próxima <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            </div>
        )
    }

    // Default Titles
    const defaultTitle = title || (mode === 'deputados' ? 'Busca de Parlamentares' : mode === 'fornecedores' ? 'Busca de Fornecedores' : 'Busca Global')
    const defaultDesc = description || (mode === 'deputados' ? 'Encontre deputados por nome, partido ou estado' : mode === 'fornecedores' ? 'Encontre fornecedores e analise seus contratos' : 'Pesquise em toda a base de dados')

    return (
        <div className={`space-y-6 ${className}`}>
            <Card className="border-none shadow-sm bg-card/50">
                <CardHeader className="px-0 pt-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                {mode === 'deputados' ? <User className="h-6 w-6" /> : mode === 'fornecedores' ? <Building2 className="h-6 w-6" /> : <Search className="h-6 w-6" />}
                                {defaultTitle}
                            </CardTitle>
                            <CardDescription className="mt-1">{defaultDesc}</CardDescription>
                        </div>
                        {(searchParams.toString().length > 0 && searchParams.get('page') !== '1') && (
                            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-destructive">
                                <X className="h-4 w-4 mr-2" /> Limpar filtros
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="px-0 space-y-4">
                    {/* Search Bar & Filters Row */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={mode === 'deputados' ? "Buscar por nome do deputado..." : mode === 'fornecedores' ? "Buscar por Razão Social ou CNPJ..." : "Buscar deputados ou fornecedores..."}
                                className="pl-10 h-11"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>

                        {/* Dynamic Filters based on Mode */}
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <Select
                                value={searchParams.get('uf') || 'todos'}
                                onValueChange={(v) => updateFilter('uf', v)}
                            >
                                <SelectTrigger className="w-[100px] h-11">
                                    <SelectValue placeholder="UF" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">Todos</SelectItem>
                                    {UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            {(mode === 'deputados' || mode === 'global') && (
                                <Select
                                    value={searchParams.get('partido') || 'todos'}
                                    onValueChange={(v) => updateFilter('partido', v)}
                                >
                                    <SelectTrigger className="w-[140px] h-11">
                                        <SelectValue placeholder="Partido" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        {PARTIDOS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            {(mode === 'fornecedores' || mode === 'global') && (
                                <Select
                                    value={searchParams.get('categoria') || 'todas'}
                                    onValueChange={(v) => updateFilter('categoria', v)}
                                >
                                    <SelectTrigger className="w-[180px] h-11">
                                        <SelectValue placeholder="Categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todas">Todas</SelectItem>
                                        {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}

                            <Button size="icon" variant="outline" className="h-11 w-11 shrink-0" onClick={handleSearch}>
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Area */}
            <div className="min-h-[400px]">
                {data.isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
                        ))}
                    </div>
                ) : (mode === 'global' && data.deputadosItems && data.fornecedoresItems) ? (
                    <Tabs defaultValue="deputados" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                            <TabsTrigger value="deputados" className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Deputados
                                <Badge variant="secondary" className="ml-1">{data.deputadosItems.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="fornecedores" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Fornecedores
                                <Badge variant="secondary" className="ml-1">{data.fornecedoresItems.length}</Badge>
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="deputados">
                            {data.deputadosItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">Nenhum deputado encontrado.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {data.deputadosItems.map(item => <CardParlamentar key={item.id} deputado={item} />)}
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="fornecedores">
                            {data.fornecedoresItems.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">Nenhum fornecedor encontrado.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {data.fornecedoresItems.map((item, index) => (
                                        <div key={item.cnpjCpf || `fornecedor-${index}`}>
                                            {renderFornecedorItem(item, index)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                ) : data.items.length === 0 ? (
                    <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                        <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
                        <p className="text-muted-foreground">Tente ajustar seus termos de busca ou filtros.</p>
                        <Button variant="link" onClick={handleClear} className="mt-2">Limpar tudo</Button>
                    </div>
                ) : (
                    <>
                        <div className={mode === 'deputados' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "grid grid-cols-1 gap-4"}>
                            {data.items.map((item, index) => (
                                mode === 'deputados'
                                    ? <CardParlamentar key={item.id} deputado={item} />
                                    : <div key={item.cnpjCpf || `item-${index}`}>{renderFornecedorItem(item, index)}</div>
                            ))}
                        </div>
                        {renderPagination()}
                    </>
                )}
            </div>
        </div>
    )
}
