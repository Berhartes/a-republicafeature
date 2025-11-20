'use client'

import { useMemo, useTransition, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Filter, Crown, Award, Calendar, Trophy, ChevronDown, ChevronUp } from 'lucide-react'
import { getCategoriaIconJSX } from '@/lib/categoria-icons'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { formatCurrencyBRL, formatNumberBR, formatDateTimeLabel } from '@/lib/formatters'

interface Deputado {
  id: string
  nome: string
  partido: string
  uf: string
  totalDespesas: number
  numeroDespesas: number
  fornecedoresIdentificados?: number
  posicao?: number
  porAno?: {
    [ano: string]: number
  }
}

interface PremiacoesData {
  rankingsFiltrados: Deputado[]
  estatisticas: {
    totalDeputados: number
    campeao: string
    maiorGasto: number
  }
  metadata: {
    anosDisponiveis: number[]
    categoriasDisponiveis: string[]
    ufsDisponiveis: string[]
    lastUpdate: string
    totalPremiacoes?: number
  }
  premiacoes?: {
    coroas?: Array<any>
    trofeus?: Array<any>
    medalhas?: Array<any>
  }
}

interface PremiacoesPageClientProps {
  premiacoesData: PremiacoesData
  defaultShowFilters?: boolean
  lastUpdateLabel?: string
}

export function PremiacoesPageClient({
  premiacoesData,
  defaultShowFilters = false,
  lastUpdateLabel,
}: PremiacoesPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showFilters, setShowFilters] = useState(defaultShowFilters)
  const [showCategoriaSelection, setShowCategoriaSelection] = useState(false)
  const [deputadosExibidos, setDeputadosExibidos] = useState(50)

  const { rankingsFiltrados, estatisticas, metadata } = premiacoesData
  const coroas = premiacoesData.premiacoes?.coroas ?? []
  const trofeus = premiacoesData.premiacoes?.trofeus ?? []
  const medalhas = premiacoesData.premiacoes?.medalhas ?? []
  const { anosDisponiveis, categoriasDisponiveis, ufsDisponiveis } = metadata

  const anoSelecionado = searchParams.get('ano') || 'todos'
  const categoriaSelecionada = searchParams.get('categoria') || 'TODAS'
  const ufSelecionada = searchParams.get('uf') || 'TODAS'

  const tituloRanking = useMemo(() => {
    const partes = [`Top ${Math.min(deputadosExibidos, rankingsFiltrados.length)} Deputados`]
    if (categoriaSelecionada !== 'TODAS') {
      partes.push(categoriaSelecionada)
    }
    if (ufSelecionada !== 'TODAS') {
      partes.push(ufSelecionada)
    }
    if (anoSelecionado !== 'todos') {
      partes.push(anoSelecionado)
    }
    return partes.join(' • ')
  }, [categoriaSelecionada, anoSelecionado, ufSelecionada, deputadosExibidos, rankingsFiltrados.length])

  const ultimaAtualizacao = useMemo(() => {
    if (lastUpdateLabel) {
      return lastUpdateLabel
    }
    return formatDateTimeLabel(metadata.lastUpdate)
  }, [lastUpdateLabel, metadata.lastUpdate])

  // Helper function to update URL with new search params
  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'todos' || value === 'TODAS') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reset exibição ao mudar filtros
    setDeputadosExibidos(50)

    const queryString = params.toString()
    const url = queryString ? `${pathname}?${queryString}` : pathname
    
    startTransition(() => {
      router.push(url)
    })
  }

  const handleFilterChange = (key: 'ano' | 'categoria' | 'uf', value: string) => {
    updateURL({ [key]: value })
  }

  const handleLimparFiltros = () => {
    updateURL({ ano: null, categoria: null, uf: null })
  }

  const handleVerMais = () => {
    setDeputadosExibidos(prev => Math.min(prev + 50, rankingsFiltrados.length))
  }

  return (
    <div className="container mx-auto max-w-7xl space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Premiações e Rankings</h1>
          <p className="text-sm text-muted-foreground">
            Última atualização: {ultimaAtualizacao}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {typeof metadata.totalPremiacoes === 'number' && (
            <Badge variant="secondary" className="text-sm">
              <Award className="mr-1 h-4 w-4" />
              {metadata.totalPremiacoes} premiações
            </Badge>
          )}
          {isPending && (
            <Badge className="animate-pulse text-sm">
              Atualizando filtros...
            </Badge>
          )}
        </div>
      </header>

      {/* Hero destaque do campeão atual, inspirado no visual do backup */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-primary" />
            Campeão Atual
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Maior gasto identificado
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              1º
            </div>
            <div>
              <div className="text-lg font-semibold">{estatisticas.campeao}</div>
              <div className="text-xs text-muted-foreground">Top do ranking geral</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatCurrencyBRL(estatisticas.maiorGasto)}</div>
            <div className="text-xs text-muted-foreground">somatório total</div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deputados analisados</CardTitle>
            <Trophy className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatNumberBR(estatisticas.totalDeputados)}</p>
            <p className="text-xs text-muted-foreground">participantes avaliados no ranking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campeão atual</CardTitle>
            <Crown className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{estatisticas.campeao}</p>
            <p className="text-xs text-muted-foreground">maior desempenho no período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maior gasto identificado</CardTitle>
            <TrendingUp className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrencyBRL(estatisticas.maiorGasto)}</p>
            <p className="text-xs text-muted-foreground">somatório do campeão no recorte atual</p>
          </CardContent>
        </Card>
      </section>

      {/* Abas principais para coroas, troféus e ranking */}
      <Tabs defaultValue={coroas.length > 0 ? 'coroas' : trofeus.length > 0 ? 'trofeus' : 'ranking'}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="coroas" disabled={coroas.length === 0}>
              <span className="flex items-center gap-2"><Crown className="h-4 w-4" /> Coroas</span>
            </TabsTrigger>
            <TabsTrigger value="trofeus" disabled={trofeus.length === 0}>
              <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Troféus</span>
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Ranking</span>
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            {coroas.length > 0 && (<Badge variant="outline" className="text-xs">{coroas.length} coroas</Badge>)}
            {trofeus.length > 0 && (<Badge variant="outline" className="text-xs">{trofeus.length} troféus</Badge>)}
          </div>
        </div>

        <TabsContent value="coroas">
          {coroas.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Campeões históricos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {coroas.map((item: any) => {
                    const itemKey = `${String(item.id)}-${item.tipo ?? ''}-${item.ano ?? 'all'}-${item.categoria ?? ''}`
                    return (
                      <div key={itemKey} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">
                            {item.nome}
                          </div>
                          <Crown className="h-4 w-4 text-primary" />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {(item.siglaPartido || 'N/A')} • {(item.siglaUf || 'N/A')}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {item.tipo && (
                            <Badge variant="outline" className="text-xs">
                              {item.tipo === 'categoria' ? (item.categoria || 'Categoria') : `UF ${(item.uf || '')}`}
                            </Badge>
                          )}
                          {typeof item.ano === 'number' && (
                            <Badge variant="outline" className="text-xs">{item.ano}</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-sm font-semibold">
                          {formatCurrencyBRL(item.total ?? item.totalGasto ?? 0)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma coroa disponível.</div>
          )}
        </TabsContent>

        <TabsContent value="trofeus">
          {trofeus.length > 0 ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Campeões anuais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {trofeus.map((item: any) => {
                    const itemKey = `${String(item.id)}-${item.tipo ?? ''}-${item.ano ?? 'all'}-${item.categoria ?? ''}`
                    return (
                      <div key={itemKey} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold">
                            {item.nome}
                          </div>
                          <Trophy className="h-4 w-4 text-primary" />
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {(item.siglaPartido || 'N/A')} • {(item.siglaUf || 'N/A')}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {item.tipo && (
                            <Badge variant="outline" className="text-xs">
                              {item.tipo === 'categoria' ? (item.categoria || 'Categoria') : `UF ${(item.uf || '')}`}
                            </Badge>
                          )}
                          {typeof item.ano === 'number' && (
                            <Badge variant="outline" className="text-xs">{item.ano}</Badge>
                          )}
                        </div>
                        <div className="mt-2 text-sm font-semibold">
                          {formatCurrencyBRL(item.total ?? item.totalGasto ?? 0)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum troféu disponível.</div>
          )}
        </TabsContent>

        <TabsContent value="ranking">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filtrar rankings
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                Ajuste ano e categoria para refinar os resultados.
                <Button variant="ghost" size="sm" onClick={() => setShowFilters(prev => !prev)}>
                  {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className={cn('flex flex-col gap-4', showFilters ? 'block' : 'hidden')} aria-hidden={!showFilters}>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Select
                    value={anoSelecionado}
                    onValueChange={value => handleFilterChange('ano', value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-48">
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
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <Button
                      variant="outline"
                      onClick={() => setShowCategoriaSelection(prev => !prev)}
                      disabled={isPending}
                      className="w-80 justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {categoriaSelecionada !== 'TODAS' && getCategoriaIconJSX(categoriaSelecionada, 'h-4 w-4')}
                        {categoriaSelecionada === 'TODAS' ? 'Escolher uma categoria' : categoriaSelecionada}
                      </span>
                      {showCategoriaSelection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>

                  {showCategoriaSelection && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-4 border rounded-lg bg-muted/50">
                      <Button
                        variant={categoriaSelecionada === 'TODAS' ? 'default' : 'outline'}
                        onClick={() => {
                          handleFilterChange('categoria', 'TODAS')
                          setShowCategoriaSelection(false)
                        }}
                        disabled={isPending}
                        className="justify-start h-auto py-3"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Filter className="h-4 w-4 flex-shrink-0" />
                          <span className="text-xs leading-tight break-words text-left">Todas as categorias</span>
                        </div>
                      </Button>
                      {categoriasDisponiveis.map(categoria => (
                        <Button
                          key={categoria}
                          variant={categoriaSelecionada === categoria ? 'default' : 'outline'}
                          onClick={() => {
                            handleFilterChange('categoria', categoria)
                            setShowCategoriaSelection(false)
                          }}
                          disabled={isPending}
                          className="justify-start h-auto py-3"
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex-shrink-0">
                              {getCategoriaIconJSX(categoria, 'h-4 w-4')}
                            </div>
                            <span className="text-xs leading-tight break-words text-left">{categoria}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  <Select
                    value={ufSelecionada}
                    onValueChange={value => handleFilterChange('uf', value)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Todos os estados" />
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
                    variant="outline"
                    size="sm"
                    onClick={handleLimparFiltros}
                    disabled={isPending}
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

            <Card className="mt-4">
              <CardHeader className="space-y-1">
                <CardTitle>{tituloRanking}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Exibindo {Math.min(deputadosExibidos, rankingsFiltrados.length)} de {rankingsFiltrados.length} deputados conforme filtros aplicados.
                </p>
              </CardHeader>
              <CardContent>
                {rankingsFiltrados.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {rankingsFiltrados.slice(0, deputadosExibidos).map((deputado, index) => {
                        const posicao = deputado.posicao ?? index + 1
                        const medalClass = posicao === 1
                          ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                          : posicao === 2
                          ? 'bg-gray-100 text-gray-700 border-gray-200'
                          : posicao === 3
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'hover:bg-accent/50'
                        return (
                          <div
                            key={deputado.id}
                            className={cn('flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors', medalClass)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                {posicao}º
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold leading-none">{deputado.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {deputado.partido} • {deputado.uf} • {deputado.numeroDespesas} despesas
                                </p>
                                {typeof deputado.fornecedoresIdentificados === 'number' && (
                                  <p className="text-xs text-muted-foreground">
                                    {deputado.fornecedoresIdentificados} fornecedores analisados
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-base font-semibold">
                                {formatCurrencyBRL(deputado.totalDespesas)}
                              </p>
                              {deputado.porAno && anoSelecionado !== 'todos' && deputado.porAno[anoSelecionado] != null && (
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrencyBRL(deputado.porAno[anoSelecionado]!)} no ano filtrado
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {deputadosExibidos < rankingsFiltrados.length && (
                      <div className="mt-6 flex justify-center">
                        <Button 
                          onClick={handleVerMais}
                          variant="outline"
                          size="lg"
                        >
                          Ver mais +50 deputados ({rankingsFiltrados.length - deputadosExibidos} restantes)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Nenhum registro disponível para esta combinação de filtros.
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* Removido bloco duplicado de filtros e ranking fora das abas */}
    </div>
  )
}
