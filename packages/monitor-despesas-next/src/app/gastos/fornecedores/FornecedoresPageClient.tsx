'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Building2,
  RefreshCw,
  Database,
  Eye,
  AlertTriangle,
  TrendingUp,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
} from 'lucide-react'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import type { FornecedorResumo } from '@a-republica/shared'
import Top5FornecedoresRanking from '@/components/fornecedores/Top5FornecedoresRanking'
import CategoryDistributionChart from '@/components/category'
import { GastosPorCategoria } from '@/components/graficos'

interface FornecedoresPageClientProps {
  fornecedores: FornecedorResumo[]
  total: number
  pageSize: number
  dataSource?: 'etl' | 'test' | 'backup' | 'api' | 'cdn' | 'empty'
  searchParams: {
    searchTerm?: string;
    categoria?: string;
    scoreMinimo?: string;
    sortBy?: 'nome' | 'totalRecebido' | 'numeroTransacoes' | 'scoreSuspeicao';
    page?: string;
  }
}

export function FornecedoresPageClient({
  fornecedores,
  total,
  pageSize,
  dataSource = 'empty',
  searchParams,
}: FornecedoresPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const hasProcessedData = fornecedores && fornecedores.length > 0

  const [busca, setBusca] = useState(searchParams.searchTerm || '')
  const [filtroCategoria, setFiltroCategoria] = useState(searchParams.categoria || '')
  const [filtroScore, setFiltroScore] = useState(searchParams.scoreMinimo || '')

  const handleFilterChange = () => {
    const params = new URLSearchParams(window.location.search)
    if (busca) params.set('searchTerm', busca)
    else params.delete('searchTerm')

    if (filtroCategoria) params.set('categoria', filtroCategoria)
    else params.delete('categoria')

    if (filtroScore) params.set('scoreMinimo', filtroScore)
    else params.delete('scoreMinimo')

    params.set('page', '1') // Reset page on filter change

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const limparFiltros = () => {
    setBusca('')
    setFiltroCategoria('')
    setFiltroScore('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const paginaAtual = parseInt(searchParams.page || '1', 10)

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search)
    params.set('page', String(newPage))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const recarregar = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  // Dados agregados para componentes visuais (calculados no cliente com os dados da página atual)
  const totalGeralPagina = useMemo(() => {
    return fornecedores.reduce((sum, f) => sum + (f.totalRecebido || 0), 0)
  }, [fornecedores])

  const categoriasDisponiveis = useMemo(() => {
    const mapa: Record<string, number> = {}
    fornecedores.forEach(f => {
      const principal = (f.tipoDespesaPrincipal || '').trim()
      const categoria = principal || 'SEM_CATEGORIA'
      mapa[categoria] = (mapa[categoria] || 0) + (f.totalRecebido || 0)
    })
    return Object.keys(mapa)
      .filter(Boolean)
      .sort((a, b) => mapa[b] - mapa[a])
  }, [fornecedores])

  const dadosDistribuicaoCategoria = useMemo(() => {
    const mapaValor: Record<string, number> = {}
    const mapaCount: Record<string, number> = {}
    fornecedores.forEach(f => {
      const principal = (f.tipoDespesaPrincipal || '').trim()
      const categoria = principal || 'SEM_CATEGORIA'
      mapaValor[categoria] = (mapaValor[categoria] || 0) + (f.totalRecebido || 0)
      mapaCount[categoria] = (mapaCount[categoria] || 0) + 1
    })
    const total = Object.values(mapaValor).reduce((s, v) => s + v, 0) || 1
    return Object.entries(mapaValor).map(([categoria, valor]) => ({
      categoria,
      valor,
      percentual: `${((valor / total) * 100).toFixed(1)}%`,
      count: mapaCount[categoria] || 0
    }))
  }, [fornecedores])

  const dadosTop5Ranking = useMemo(() => {
    return fornecedores.slice(0, 5).map(f => ({
      nome: f.nome,
      cnpj: f.cnpjCpf || undefined,
      valor: f.totalRecebido || 0,
      numeroTransacoes: f.numeroTransacoes || 0,
      categoriaPrincipal: (f.tipoDespesaPrincipal || 'SEM_CATEGORIA'),
      categorias: Array.isArray(f.categorias)
        ? (f.categorias as any[]).map((c: any) => typeof c === 'string' ? c : (c?.categoria || '')).filter(Boolean)
        : ((f.tipoDespesaPrincipal && [f.tipoDespesaPrincipal]) || []),
      deputadosAtendidos: undefined,
    }))
  }, [fornecedores])

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">Análise de fornecedores e suas transações com deputados</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
          <Button onClick={recarregar} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {!hasProcessedData && (
            <Button onClick={() => router.push('/gastos/dashboards')} variant="default" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Verificar Cache ETL
            </Button>
          )}
          <Button onClick={() => router.push('/gastos/dashboards')} variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Status do Cache
          </Button>
        </div>
      </div>

      {/* Informação sobre FONTE DE DADOS */}
      <Card className={hasProcessedData ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardContent className="flex items-start gap-3 p-4">
          <FileText className="h-4 w-4" />
          <div>
            {hasProcessedData ? (
              <div>
                <span className="font-medium text-green-800">✅ FONTE DE DADOS:</span>{' '}
                {dataSource === 'etl' && 'Dados carregados do cache ETL.'}
                {dataSource === 'api' && 'Dados carregados do servidor (API local).'}
                {dataSource === 'cdn' && 'Dados carregados do servidor/CDN oficial.'}
                {dataSource === 'backup' && 'Dados carregados do backup público (legado).'}
                {dataSource === 'test' && 'Dados de teste (somente ambiente de desenvolvimento).'}
                {dataSource === 'empty' && 'Nenhuma fonte encontrada (estrutura vazia).'}
                <button onClick={() => router.push('/gastos/dashboards')} className="text-green-700 hover:underline font-medium ml-1">
                  Verificar status do cache →
                </button>
              </div>
            ) : (
              <div>
                <span className="font-medium text-red-800">❌ CACHE ETL NÃO ENCONTRADO:</span> Nenhum cache encontrado.
                <button onClick={() => router.push('/gastos/dashboards')} className="text-red-700 hover:underline font-medium ml-1">
                  Verificar cache ETL →
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Análise */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        <Card className="flex flex-col">
          <Top5FornecedoresRanking
            fornecedores={dadosTop5Ranking}
            loading={isPending}
            context="fornecedores-page"
            totalReferencia={totalGeralPagina}
            labelPercentual="do total da página"
            categorias={categoriasDisponiveis}
            categoriaSelecionada={filtroCategoria}
            onCategoriaChange={setFiltroCategoria}
            categorySelectMode="dropdown"
            showDeputadosCount={true}
            monetaryFormat="without-cents"
            title="Top 5 Fornecedores (Página Atual)"
            description="Fornecedores com maior volume na página atual"
          />
        </Card>

        <CategoryDistributionChart
          data={dadosDistribuicaoCategoria}
          loading={isPending}
          context="fornecedores-page"
          maxHeight={420}
          showPieChart={false}
          onTogglePieChart={() => {}}
          emptyMessage="Nenhuma categoria encontrada para os dados atuais"
          title="Distribuição de Gastos por Categoria (Página Atual)"
          description="Volume transacionado por categoria na página atual"
          className="flex flex-col"
          onCategoryClick={(categoria) => setFiltroCategoria(categoria)}
          countLabel="fornecedores"
          showAverage={true}
          showCount={true}
          showComparison={false}
          useSimpleLayout={true}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>Filtre e busque fornecedores específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="busca-fornecedores" className="text-sm font-medium">Busca</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="busca-fornecedores" placeholder="Nome ou CNPJ..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-8" />
              </div>
              <span className="font-medium text-green-800">✅ FONTE DE DADOS:</span> Dados carregados do cache ETL.
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <select value={filtroCategoria ?? ''} onChange={(e) => setFiltroCategoria(e.target.value || '')} className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm">
                <option value="">Todas as categorias</option>
                {categoriasDisponiveis.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Score de Suspeição</label>
              <select value={filtroScore} onChange={(e) => setFiltroScore(e.target.value)} className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm">
                <option value="">Todos os scores</option>
                <option value="70">Alto Risco (&gt; 70)</option>
                <option value="30">Risco Médio (30-70)</option>
              </select>
            </div>

            <div className="space-y-2 flex items-end gap-2">
              <Button onClick={handleFilterChange} className="w-full" disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                Aplicar
              </Button>
              <Button onClick={limparFiltros} variant="outline" className="w-full" disabled={isPending}>Limpar</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Fornecedores
            <Badge variant="secondary">{formatNumberBR(total)}</Badge>
          </CardTitle>
          <CardDescription>Fornecedores ordenados por valor total transacionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`space-y-3 ${isPending ? 'opacity-50' : ''}`}>
            {fornecedores.map((fornecedor, index) => {
              const rank = ((paginaAtual - 1) * pageSize) + index + 1;
              const score = (fornecedor as any).scoreSuspeicao as number | undefined
              const scoreColor = score && score > 70 ? 'bg-red-500' : score && score > 30 ? 'bg-yellow-500' : 'bg-green-500'
              const scoreLabel = score && score > 70 ? 'Alto Risco' : score && score > 30 ? 'Risco Médio' : 'Baixo Risco'
              return (
                <div key={`${fornecedor.cnpjCpf}-${rank}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-mono">#{rank.toString().padStart(3, '0')}</span>
                      <div>
                        <h3 className="font-medium">{fornecedor.nome}</h3>
                        <p className="text-sm text-muted-foreground">CNPJ: {fornecedor.cnpjCpf} • {(fornecedor.tipoDespesaPrincipal || '').trim() || 'SEM_CATEGORIA'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrencyBRL(fornecedor.totalRecebido)}</p>
                      <p className="text-sm text-muted-foreground">{formatNumberBR(fornecedor.numeroTransacoes)} transações</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${scoreColor}`}></div>
                      <span className="text-sm font-medium">{typeof score === 'number' ? score.toFixed(0) : '-'}</span>
                      <Badge variant="outline" className="text-xs">{scoreLabel}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Paginação */}
            {total > pageSize && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{formatNumberBR((paginaAtual - 1) * pageSize + 1)}</span>
                  {' '}–{' '}
                  <span className="font-medium text-foreground">{formatNumberBR(Math.min(paginaAtual * pageSize, total))}</span>
                  {' '}de{' '}
                  <span className="font-medium text-foreground">{formatNumberBR(total)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(paginaAtual - 1)} disabled={paginaAtual === 1 || isPending} aria-label="Página anterior">
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">Página <span className="font-medium text-foreground">{paginaAtual}</span> de <span className="font-medium text-foreground">{totalPaginas}</span></span>
                  <Button variant="outline" size="sm" onClick={() => handlePageChange(paginaAtual + 1)} disabled={paginaAtual === totalPaginas || isPending} aria-label="Próxima página">
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {total === 0 && !isPending && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground">Ajuste os filtros para ver mais resultados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
