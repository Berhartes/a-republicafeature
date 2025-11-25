'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { getDeputados } from '@/actions/data-actions'
import { getDetailedComparisonData, getCategoriasDisponiveis, compareEstados, comparePartidos } from '@/actions/comparison-actions'
import ModernDeputadoSelector from './components/ModernDeputadoSelector'
import ComparisonSummary from './components/ComparisonSummary'
import ComparisonChart from './components/ComparisonChart'
import CategoryComparison from './components/CategoryComparison'
import MonthlyComparison from './components/MonthlyComparison'
import SuppliersComparison from './components/SuppliersComparison'
import StatesComparison from './components/StatesComparison'
import PartiesComparison from './components/PartiesComparison'
import { GitCompare, Users, Info, Filter, MapPin, Building2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

type ComparisonMode = 'deputados' | 'estados' | 'partidos'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const PARTIDOS = ['PT', 'PL', 'PP', 'UNIÃO', 'PSD', 'REPUBLICANOS', 'MDB', 'PSDB', 'PDT', 'PODE', 'PSOL', 'PCdoB', 'NOVO', 'PSB', 'CIDADANIA', 'AVANTE', 'SOLIDARIEDADE', 'PATRIOTA']

export function CompararFeature() {
    const [mode, setMode] = useState<ComparisonMode>('deputados')
    const [isLoadingDeputados, setIsLoadingDeputados] = useState(true)
    const [isLoadingComparison, setIsLoadingComparison] = useState(false)
    const [todosDeputados, setTodosDeputados] = useState<any[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [deputadosComparados, setDeputadosComparados] = useState<any[]>([])
    const [estadosComparados, setEstadosComparados] = useState<any[]>([])
    const [partidosComparados, setPartidosComparados] = useState<any[]>([])
    const [categorias, setCategorias] = useState<string[]>([])
    const [error, setError] = useState<string | null>(null)

    // Seleções para estados e partidos
    const [selectedUfs, setSelectedUfs] = useState<string[]>([])
    const [selectedPartidos, setSelectedPartidos] = useState<string[]>([])

    // Filtros
    const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')
    const [anoFiltro, setAnoFiltro] = useState<string>('todos')

    // Load all deputies and categories on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingDeputados(true)
            setError(null)
            try {
                const [deputadosResult, categoriasResult] = await Promise.all([
                    getDeputados({ pageSize: 1000 }),
                    getCategoriasDisponiveis()
                ])
                setTodosDeputados(deputadosResult.deputados)
                setCategorias(categoriasResult)
            } catch (err) {
                console.error('Failed to fetch initial data:', err)
                setError('Erro ao carregar dados iniciais')
            } finally {
                setIsLoadingDeputados(false)
            }
        }

        fetchInitialData()
    }, [])

    // Load comparison data based on mode
    useEffect(() => {
        const fetchComparisonData = async () => {
            if (mode === 'deputados' && selectedIds.length === 0) {
                setDeputadosComparados([])
                return
            }
            if (mode === 'estados' && selectedUfs.length === 0) {
                setEstadosComparados([])
                return
            }
            if (mode === 'partidos' && selectedPartidos.length === 0) {
                setPartidosComparados([])
                return
            }

            setIsLoadingComparison(true)
            setError(null)
            try {
                if (mode === 'deputados') {
                    const filters: any = {}
                    if (categoriaFiltro && categoriaFiltro !== 'todas') {
                        filters.categoria = categoriaFiltro
                    }
                    if (anoFiltro && anoFiltro !== 'todos') {
                        filters.ano = parseInt(anoFiltro)
                    }

                    const data = await getDetailedComparisonData(selectedIds, filters)
                    const transformedData = data.map(dep => ({
                        ...dep,
                        partido: dep.siglaPartido,
                        uf: dep.siglaUf,
                        anos: Object.entries(dep.gastosPorAno).map(([ano, total]) => ({
                            ano: Number(ano),
                            total: total as number
                        }))
                    }))
                    setDeputadosComparados(transformedData)
                } else if (mode === 'estados') {
                    const data = await compareEstados(selectedUfs)
                    setEstadosComparados(data)
                } else if (mode === 'partidos') {
                    const data = await comparePartidos(selectedPartidos)
                    setPartidosComparados(data)
                }
            } catch (err) {
                console.error('Failed to fetch comparison data:', err)
                setError('Erro ao carregar dados de comparação')
            } finally {
                setIsLoadingComparison(false)
            }
        }

        fetchComparisonData()
    }, [mode, selectedIds, selectedUfs, selectedPartidos, categoriaFiltro, anoFiltro])

    const handleSelect = useCallback((id: string) => {
        if (selectedIds.includes(id)) return
        if (selectedIds.length >= 4) {
            setError('Você pode comparar no máximo 4 deputados')
            return
        }
        setSelectedIds(prev => [...prev, id])
        setError(null)
    }, [selectedIds])

    const handleRemove = useCallback((id: string) => {
        setSelectedIds(prev => prev.filter(existingId => existingId !== id))
        setError(null)
    }, [])

    const handleToggleUf = (uf: string) => {
        setSelectedUfs(prev =>
            prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
        )
    }

    const handleTogglePartido = (partido: string) => {
        setSelectedPartidos(prev =>
            prev.includes(partido) ? prev.filter(p => p !== partido) : [...prev, partido]
        )
    }

    // Extract available years from selected deputies
    const anosDisponiveis = Array.from(
        new Set(
            deputadosComparados.flatMap(dep =>
                Object.keys(dep.gastosPorAno || {}).map(Number)
            )
        )
    ).sort((a, b) => b - a)

    if (isLoadingDeputados) {
        return <CompararSkeleton />
    }

    return (
        <div className="min-h-screen bg-background space-y-8 animate-in fade-in duration-500">
            <div className="container mx-auto py-8">
                <div className="flex flex-col gap-2 mb-8">
                    <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3">
                        <GitCompare className="h-10 w-10 text-primary" />
                        Comparador Avançado de Gastos
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Compare deputados, estados ou partidos por categoria, período e muito mais
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <Info className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-8">
                    {/* Seleção de Modo */}
                    <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                        <CardHeader>
                            <CardTitle>Tipo de Comparação</CardTitle>
                            <CardDescription>Escolha o que deseja comparar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Button
                                    variant={mode === 'deputados' ? 'default' : 'outline'}
                                    className="h-auto py-6 flex-col gap-2"
                                    onClick={() => setMode('deputados')}
                                >
                                    <Users className="h-6 w-6" />
                                    <div>
                                        <div className="font-semibold">Deputados</div>
                                        <div className="text-xs opacity-80">Compare até 4 deputados</div>
                                    </div>
                                </Button>
                                <Button
                                    variant={mode === 'estados' ? 'default' : 'outline'}
                                    className="h-auto py-6 flex-col gap-2"
                                    onClick={() => setMode('estados')}
                                >
                                    <MapPin className="h-6 w-6" />
                                    <div>
                                        <div className="font-semibold">Estados</div>
                                        <div className="text-xs opacity-80">Compare estados (UF)</div>
                                    </div>
                                </Button>
                                <Button
                                    variant={mode === 'partidos' ? 'default' : 'outline'}
                                    className="h-auto py-6 flex-col gap-2"
                                    onClick={() => setMode('partidos')}
                                >
                                    <Building2 className="h-6 w-6" />
                                    <div>
                                        <div className="font-semibold">Partidos</div>
                                        <div className="text-xs opacity-80">Compare partidos políticos</div>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seleção baseada no modo */}
                    {mode === 'deputados' && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Users className="h-5 w-5 text-primary" />
                                    Deputados Selecionados ({selectedIds.length}/4)
                                </CardTitle>
                                <CardDescription>
                                    Selecione de 2 a 4 deputados para comparar
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ModernDeputadoSelector
                                    todosDeputados={todosDeputados}
                                    selectedIds={selectedIds}
                                    onSelect={handleSelect}
                                    onRemove={handleRemove}
                                />
                            </CardContent>
                        </Card>
                    )}

                    {mode === 'estados' && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <MapPin className="h-5 w-5 text-primary" />
                                    Estados Selecionados ({selectedUfs.length})
                                </CardTitle>
                                <CardDescription>
                                    Selecione os estados que deseja comparar
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {UFS.map(uf => (
                                        <Badge
                                            key={uf}
                                            variant={selectedUfs.includes(uf) ? 'default' : 'outline'}
                                            className="cursor-pointer hover:bg-primary/80"
                                            onClick={() => handleToggleUf(uf)}
                                        >
                                            {uf}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {mode === 'partidos' && (
                        <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/20">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    Partidos Selecionados ({selectedPartidos.length})
                                </CardTitle>
                                <CardDescription>
                                    Selecione os partidos que deseja comparar
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {PARTIDOS.map(partido => (
                                        <Badge
                                            key={partido}
                                            variant={selectedPartidos.includes(partido) ? 'default' : 'outline'}
                                            className="cursor-pointer hover:bg-primary/80"
                                            onClick={() => handleTogglePartido(partido)}
                                        >
                                            {partido}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Filtros (apenas para deputados) */}
                    {mode === 'deputados' && selectedIds.length > 0 && (
                        <Card className="border-none shadow-md">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Filter className="h-5 w-5 text-primary" />
                                    Filtros de Análise
                                </CardTitle>
                                <CardDescription>
                                    Refine a comparação por categoria ou período
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="categoria">Categoria de Despesa</Label>
                                        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
                                            <SelectTrigger id="categoria">
                                                <SelectValue placeholder="Todas as categorias" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todas">Todas as categorias</SelectItem>
                                                {categorias.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="ano">Ano</Label>
                                        <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                                            <SelectTrigger id="ano">
                                                <SelectValue placeholder="Todos os anos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="todos">Todos os anos</SelectItem>
                                                {anosDisponiveis.map(ano => (
                                                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {(categoriaFiltro !== 'todas' || anoFiltro !== 'todos') && (
                                    <div className="flex gap-2 mt-4">
                                        {categoriaFiltro !== 'todas' && (
                                            <Badge variant="secondary">Categoria: {categoriaFiltro}</Badge>
                                        )}
                                        {anoFiltro !== 'todos' && (
                                            <Badge variant="secondary">Ano: {anoFiltro}</Badge>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Resultados */}
                    {isLoadingComparison ? (
                        <div className="space-y-6">
                            <Skeleton className="h-[400px] w-full rounded-xl" />
                            <Skeleton className="h-[400px] w-full rounded-xl" />
                        </div>
                    ) : (
                        <>
                            {mode === 'deputados' && deputadosComparados.length > 0 && selectedIds.length >= 2 && (
                                <Tabs defaultValue="resumo" className="w-full">
                                    <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                                        <TabsTrigger value="resumo">Resumo</TabsTrigger>
                                        <TabsTrigger value="evolucao">Evolução</TabsTrigger>
                                        <TabsTrigger value="categorias">Categorias</TabsTrigger>
                                        <TabsTrigger value="mensal">Mensal</TabsTrigger>
                                        <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="resumo" className="mt-6">
                                        <ComparisonSummary deputados={deputadosComparados} />
                                    </TabsContent>

                                    <TabsContent value="evolucao" className="mt-6">
                                        <ComparisonChart deputados={deputadosComparados} />
                                    </TabsContent>

                                    <TabsContent value="categorias" className="mt-6">
                                        <CategoryComparison deputados={deputadosComparados} />
                                    </TabsContent>

                                    <TabsContent value="mensal" className="mt-6">
                                        <MonthlyComparison deputados={deputadosComparados} />
                                    </TabsContent>

                                    <TabsContent value="fornecedores" className="mt-6">
                                        <SuppliersComparison deputados={deputadosComparados} />
                                    </TabsContent>
                                </Tabs>
                            )}

                            {mode === 'estados' && estadosComparados.length > 0 && (
                                <StatesComparison data={estadosComparados} />
                            )}

                            {mode === 'partidos' && partidosComparados.length > 0 && (
                                <PartiesComparison data={partidosComparados} />
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function CompararSkeleton() {
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
