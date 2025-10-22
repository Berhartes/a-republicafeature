
import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Search,
  Filter,
  TrendingUp,
  AlertTriangle,
  Eye,
  RefreshCw,
  FileText,
  Database,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

import Top5FornecedoresRanking, { type FornecedorRanking } from '@/components/fornecedores/Top5FornecedoresRanking'
import { CategoryDistributionChart } from '@/components/category/CategoryDistributionChart'
import { type CategoryData } from '@/components/category/CategoryDistributionChart.types'

import { fetchManifest, fetchSuppliersCache, type SupplierCacheEntry } from '@/data-access/monitordespesas'
import { toast } from '@/hooks/useToast'

interface FornecedorSimples {
  cnpj: string
  nome: string
  totalTransacionado: number
  transacoes: number
  scoreSuspeicao: number
  categoria: string
  deputadosAtendidos: number
}

interface EstatisticasSimples {
  totalFornecedores: number
  totalVolume: number
  mediaScore: number
  fornecedoresSuspeitos: number
}

function FornecedoresPage() {

  const [fornecedores, setFornecedores] = useState<FornecedorSimples[]>([])
  const [fornecedoresFiltrados, setFornecedoresFiltrados] = useState<FornecedorSimples[]>([])
  const [estatisticas, setEstatisticas] = useState<EstatisticasSimples | null>(null)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroScore, setFiltroScore] = useState('')
  const [dataSource, setDataSource] = useState<'processador' | 'mock'>('mock')
  const [hasProcessedData, setHasProcessedData] = useState(false)
  const [lastProcessed, setLastProcessed] = useState<string | null>(null)

  const [top5Fornecedores, setTop5Fornecedores] = useState<FornecedorRanking[]>([])
  const [categoriaData, setCategoriaData] = useState<CategoryData[]>([])
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('TODAS')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const ITENS_POR_PAGINA = 100


  const calcularEstatisticas = (fornecedores: FornecedorSimples[]): EstatisticasSimples => {
    const totalVolume = fornecedores.reduce((sum, f) => sum + f.totalTransacionado, 0)
    const mediaScore = fornecedores.length > 0 ?
      fornecedores.reduce((sum, f) => sum + f.scoreSuspeicao, 0) / fornecedores.length : 0
    const fornecedoresSuspeitos = fornecedores.filter(f => f.scoreSuspeicao > 70).length

    return {
      totalFornecedores: fornecedores.length,
      totalVolume,
      mediaScore,
      fornecedoresSuspeitos
    }
  }

  const aplicarFiltros = (fornecedores: FornecedorSimples[]) => {
    const fornecedoresUnicos = fornecedores.reduce((acc, current) => {
      const existingIndex = acc.findIndex(item => item.cnpj === current.cnpj)
      if (existingIndex === -1) {
        acc.push(current)
      } else {
        if (current.totalTransacionado > acc[existingIndex].totalTransacionado) {
          acc[existingIndex] = current
        }
      }
      return acc
    }, [] as FornecedorSimples[])

    let resultado = fornecedoresUnicos

    if (busca) {
      resultado = resultado.filter(f =>
        f.nome.toLowerCase().includes(busca.toLowerCase()) ||
        f.cnpj.includes(busca)
      )
    }

    if (filtroCategoria) {
      resultado = resultado.filter(f => f.categoria === filtroCategoria)
    }

    if (filtroScore === 'alto') {
      resultado = resultado.filter(f => f.scoreSuspeicao > 70)
    } else if (filtroScore === 'medio') {
      resultado = resultado.filter(f => f.scoreSuspeicao >= 30 && f.scoreSuspeicao <= 70)
    } else if (filtroScore === 'baixo') {
      resultado = resultado.filter(f => f.scoreSuspeicao < 30)
    }

    return resultado
  }

  const carregarDadosDoETL = async (): Promise<{ dados: FornecedorSimples[], metadata?: any }> => {
    try {
      console.log('🔍 [FornecedoresPage] Carregando dados do cache ETL...')

      const manifest = await fetchManifest()
      if (!manifest) {
        console.warn('⚠️ [FornecedoresPage] Manifest não encontrado')
        return { dados: [] }
      }

      const suppliersCache = await fetchSuppliersCache(manifest)
      if (!suppliersCache || !suppliersCache.data) {
        console.warn('⚠️ [FornecedoresPage] Cache de fornecedores não encontrado')
        return { dados: [] }
      }

      console.log('📦 [FornecedoresPage] Cache ETL carregado:', {
        fornecedores: suppliersCache.data.length,
        filename: suppliersCache.filename,
        fetchedAt: suppliersCache.fetchedAt
      })

      const fornecedores = suppliersCache.data.map((f: SupplierCacheEntry) => ({
        cnpj: f.cnpj,
        nome: f.nome || f.nomeFornecedor || f.nomeEleitoral || 'Fornecedor não identificado',
        totalTransacionado: f.totalTransacionado || f.totalRecebido || f.totalRecebidoTodos || 0,
        transacoes: f.transacoes || f.totalTransacoes || f.numeroTransacoes || 0,
        scoreSuspeicao: f.scoreSuspeicao || 0,
        categoria: f.categoriaOriginal || f.categoria || f.categoriasOriginais?.[0] || f.categorias?.[0] || 'SEM_CATEGORIA',
        deputadosAtendidos: f.numeroDeputadosAtendidos || (Array.isArray(f.deputadosAtendidos) ? f.deputadosAtendidos.length : 1)
      }))

      return {
        dados: fornecedores.sort((a, b) => b.totalTransacionado - a.totalTransacionado),
        metadata: {
          source: 'etl_cache',
          filename: suppliersCache.filename,
          fetchedAt: suppliersCache.fetchedAt,
          hash: suppliersCache.hash
        }
      }
    } catch (error) {
      console.error('❌ [FornecedoresPage] Erro ao carregar dados do cache ETL:', error)
      return { dados: [] }
    }
  }

  const processarDadosParaGraficos = (fornecedoresData: FornecedorSimples[]) => {
    console.log('📊 [FornecedoresPage] Processando dados para gráficos...')

    const top5 = fornecedoresData
      .slice(0, 5)
      .map(f => ({
        nome: f.nome,
        cnpj: f.cnpj,
        valor: f.totalTransacionado,
        numeroTransacoes: f.transacoes,
        categoriaPrincipal: f.categoria,
        categorias: [f.categoria],
        deputadosAtendidos: f.deputadosAtendidos
      }))

    setTop5Fornecedores(top5)

    const categoriaMap = new Map<string, { valor: number; count: number; fornecedores: string[] }>()

    fornecedoresData.forEach(f => {
      const categoria = f.categoria
      if (!categoriaMap.has(categoria)) {
        categoriaMap.set(categoria, { valor: 0, count: 0, fornecedores: [] })
      }
      const cat = categoriaMap.get(categoria)!
      cat.valor += f.totalTransacionado
      cat.count += 1
      cat.fornecedores.push(f.nome)
    })

    const totalVolume = Array.from(categoriaMap.values()).reduce((sum, cat) => sum + cat.valor, 0)

    const categoriaChartData = Array.from(categoriaMap.entries())
      .map(([categoria, data]) => ({
        categoria,
        valor: data.valor,
        count: data.count,
        percentual: totalVolume > 0 ? `${((data.valor / totalVolume) * 100).toFixed(1)}%` : '0%'
      }))
      .sort((a, b) => b.valor - a.valor)

    setCategoriaData(categoriaChartData)

    console.log('✅ [FornecedoresPage] Dados dos gráficos processados:', {
      top5: top5.length,
      categorias: categoriaChartData.length
    })
  }


  useEffect(() => {
    const carregarDados = async () => {
      setLoading(true)
      console.log('🔎 [FornecedoresPage] Carregando dados do cache ETL...')

      try {
        const { dados: dadosETL, metadata: metadataETL } = await carregarDadosDoETL()

        if (dadosETL.length > 0) {
          console.log(`✅ [FornecedoresPage] ${dadosETL.length} fornecedores carregados do cache ETL`)

          setDataSource('processador') // Manter compatibilidade com UI
          setHasProcessedData(true)
          setLastProcessed(metadataETL?.fetchedAt || new Date().toISOString())

          setFornecedores(dadosETL)
          setFornecedoresFiltrados(dadosETL)
          setEstatisticas(calcularEstatisticas(dadosETL))
          processarDadosParaGraficos(dadosETL)

          toast({
            title: 'Dados carregados',
            description: `${dadosETL.length} fornecedores carregados do cache ETL.`
          })
        } else {
          console.log('❌ [FornecedoresPage] Cache ETL vazio ou não encontrado')
          console.log('💡 [FornecedoresPage] AÇÃO NECESSÁRIA: Verifique se o Sistema ETL está executando')

          setDataSource('processador')
          setHasProcessedData(false)
          setLastProcessed(null)

          setFornecedores([])
          setFornecedoresFiltrados([])
          setEstatisticas({
            totalFornecedores: 0,
            totalVolume: 0,
            mediaScore: 0,
            fornecedoresSuspeitos: 0
          })
          processarDadosParaGraficos([])

          toast({
            title: 'Cache ETL não encontrado',
            description: 'Verifique se o Sistema ETL está executando e gerando o cache.',
            variant: 'destructive'
          })
        }
      } catch (error) {
        console.error('❌ [FornecedoresPage] Erro ao carregar cache ETL:', error)

        setHasProcessedData(false)
        setFornecedores([])
        setFornecedoresFiltrados([])
        setEstatisticas({
          totalFornecedores: 0,
          totalVolume: 0,
          mediaScore: 0,
          fornecedoresSuspeitos: 0
        })

        toast({
          title: 'Erro ao carregar dados',
          description: 'Erro ao acessar o cache ETL. Verifique a conexão.',
          variant: 'destructive'
        })
      }

      setLoading(false)
    }

    carregarDados()
  }, [])

  const irParaProcessador = () => {
    window.location.href = '/gastos/processador-fornecedores'
  }

  const recarregarDados = async () => {
    setLoading(true)
    console.log('🔄 [FornecedoresPage] Recarregando dados do cache ETL...')

    try {
      const { dados: dadosETL, metadata: metadataETL } = await carregarDadosDoETL()

      if (dadosETL.length > 0) {
        setDataSource('processador')
        setHasProcessedData(true)
        setLastProcessed(metadataETL?.fetchedAt || new Date().toISOString())

        setFornecedores(dadosETL)
        setFornecedoresFiltrados(dadosETL)
        setEstatisticas(calcularEstatisticas(dadosETL))
        processarDadosParaGraficos(dadosETL)

        toast({
          title: 'Dados atualizados',
          description: `${dadosETL.length} fornecedores recarregados do cache ETL.`
        })
      } else {
        setHasProcessedData(false)
        setFornecedores([])
        setFornecedoresFiltrados([])
        setEstatisticas({
          totalFornecedores: 0,
          totalVolume: 0,
          mediaScore: 0,
          fornecedoresSuspeitos: 0
        })

        toast({
          title: 'Cache vazio',
          description: 'Nenhum dado encontrado no cache ETL.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ [FornecedoresPage] Erro ao recarregar cache ETL:', error)
      toast({
        title: 'Erro ao recarregar',
        description: 'Erro ao acessar o cache ETL.',
        variant: 'destructive'
      })
    }

    setLoading(false)
  }

  const limparFiltros = () => {
    setBusca('')
    setFiltroCategoria('')
    setFiltroScore('')
  }

  const formatarValor = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor)
  }

  const getScoreColor = (score: number) => {
    if (score > 70) return 'bg-red-500'
    if (score > 30) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getScoreLabel = (score: number) => {
    if (score > 70) return 'Alto Risco'
    if (score > 30) return 'Risco Médio'
    return 'Baixo Risco'
  }

  const categoriasUnicas = Array.from(new Set(fornecedores.map(f => f.categoria))).sort()

  const handleCategoriaChange = (categoria: string) => {
    setCategoriaSelecionada(categoria)
    console.log('📂 [FornecedoresPage] Categoria selecionada:', categoria)
  }

  const totalPaginas = Math.max(1, Math.ceil(fornecedoresFiltrados.length / ITENS_POR_PAGINA))
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA
  const fim = Math.min(inicio + ITENS_POR_PAGINA, fornecedoresFiltrados.length)
  const fornecedoresPagina = fornecedoresFiltrados.slice(inicio, fim)

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Carregando fornecedores...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fornecedores</h1>
          <p className="text-muted-foreground">
            Análise de fornecedores e suas transações com deputados
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:flex-nowrap">
          <Button onClick={recarregarDados} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {!hasProcessedData && (
            <Button onClick={irParaProcessador} variant="default" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Verificar Cache ETL
            </Button>
          )}
          <Button onClick={irParaProcessador} variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Status do Cache
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.totalFornecedores.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {fornecedoresFiltrados.length !== estatisticas.totalFornecedores &&
                  `${fornecedoresFiltrados.length} visíveis`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatarValor(estatisticas.totalVolume)}</div>
              <p className="text-xs text-muted-foreground">
                Transacionado com deputados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estatisticas.mediaScore.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Suspeição média
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alto Risco</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{estatisticas.fornecedoresSuspeitos}</div>
              <p className="text-xs text-muted-foreground">
                Score &gt; 70
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      

      {/* Informação sobre FONTE DE DADOS CORRIGIDA */}
      <Alert className={
        hasProcessedData
          ? 'border-green-200 bg-green-50'
          : 'border-red-200 bg-red-50'
      }>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          {hasProcessedData ? (
            <div>
              <span className="font-medium text-green-800">✅ FONTE DE DADOS:</span>{' '}
              Dados carregados do cache ETL (/cache/suppliers-cache.json).
              {lastProcessed && (
                <span className="text-green-700 text-sm block mt-1">
                  Última atualização do cache: {new Date(lastProcessed).toLocaleString('pt-BR')}
                </span>
              )}
              <button
                onClick={irParaProcessador}
                className="text-green-700 hover:underline font-medium ml-1"
              >
                Verificar status do cache →
              </button>
            </div>
          ) : (
            <div>
              <span className="font-medium text-red-800">❌ CACHE ETL NÃO ENCONTRADO:</span>{' '}
              Esta página carrega dados do cache gerado pelo Sistema ETL. Nenhum cache foi encontrado.
              <button
                onClick={irParaProcessador}
                className="text-red-700 hover:underline font-medium ml-1"
              >
                Verificar cache ETL →
              </button>
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* Estatísticas Adicionais */}
      {estatisticas && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-lg font-bold">
                    {fornecedores.filter(f => f.scoreSuspeicao > 70).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Fornecedores de Alto Risco</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-lg font-bold">
                    {categoriaData.length}
                  </div>
                  <p className="text-xs text-muted-foreground">Categorias Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="text-lg font-bold">
                    R$ {estatisticas ? (estatisticas.totalVolume / estatisticas.totalFornecedores).toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráficos de Análise */}
      <div className="grid gap-6 md:grid-cols-2 items-stretch">
        {/* Top 5 Fornecedores */}
        <Card className="flex flex-col">
          <Top5FornecedoresRanking
            fornecedores={top5Fornecedores}
            loading={loading}
            context="fornecedores-page"
            totalReferencia={estatisticas?.totalVolume || 0}
            labelPercentual="do total"
            categorias={categoriasUnicas}
            categoriaSelecionada={categoriaSelecionada}
            onCategoriaChange={handleCategoriaChange}
            categorySelectMode="dropdown"
            showDeputadosCount={true}
            monetaryFormat="without-cents"
            title="Top 5 Fornecedores"
            description="Fornecedores com maior volume de transações"
          />
        </Card>

        {/* Distribuição de Gastos por Categoria (sem Card externo para evitar redundância) */}
         <CategoryDistributionChart
          data={categoriaData}
          loading={loading}
          context="fornecedores-page"
          maxHeight={360}
          showPieChart={false}
          emptyMessage="Nenhuma categoria encontrada para o período selecionado"
          title="Distribuição de Gastos por Categoria"
          description="Volume transacionado por categoria de despesa"
          className="flex flex-col"
        />
      </div>

      {/* Filtros (movido para abaixo dos gráficos) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre e busque fornecedores específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label htmlFor="busca-fornecedores" className="text-sm font-medium">Busca</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca-fornecedores"
                  placeholder="Nome ou CNPJ..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todas as categorias</option>
                {categoriasUnicas.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Score de Suspeição</label>
              <select
                value={filtroScore}
                onChange={(e) => setFiltroScore(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Todos os scores</option>
                <option value="alto">Alto Risco (&gt; 70)</option>
                <option value="medio">Risco Médio (30-70)</option>
                <option value="baixo">Baixo Risco (&lt; 30)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <Button onClick={limparFiltros} variant="outline" className="w-full">
                Limpar Filtros
              </Button>
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
            <Badge variant="secondary">{fornecedoresFiltrados.length}</Badge>
          </CardTitle>
          <CardDescription>
            Fornecedores ordenados por valor total transacionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Exibir página atual (100 por página) */}
            {fornecedoresPagina.map((fornecedor, index) => (
              <div
                key={`${fornecedor.cnpj}-${inicio + index}`}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground font-mono">
                      #{(inicio + index + 1).toString().padStart(3, '0')}
                    </span>
                    <div>
                      <h3 className="font-medium">{fornecedor.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        CNPJ: {fornecedor.cnpj} • {fornecedor.categoria}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium">{formatarValor(fornecedor.totalTransacionado)}</p>
                    <p className="text-sm text-muted-foreground">
                      {fornecedor.transacoes} transações • {fornecedor.deputadosAtendidos} deputados
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getScoreColor(fornecedor.scoreSuspeicao)}`}></div>
                    <span className="text-sm font-medium">
                      {fornecedor.scoreSuspeicao.toFixed(0)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {getScoreLabel(fornecedor.scoreSuspeicao)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}

            {/* Paginação */}
            {fornecedoresFiltrados.length > ITENS_POR_PAGINA && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{(inicio + 1).toLocaleString()}</span>
                  {' '}–{' '}
                  <span className="font-medium text-foreground">{fim.toLocaleString()}</span>
                  {' '}de{' '}
                  <span className="font-medium text-foreground">{fornecedoresFiltrados.length.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página <span className="font-medium text-foreground">{paginaAtual}</span> de <span className="font-medium text-foreground">{totalPaginas}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    aria-label="Próxima página"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {fornecedoresFiltrados.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground">
                  Ajuste os filtros para ver mais resultados.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FornecedoresPage