import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, TrendingUp, Users, AlertTriangle, Building2, RefreshCw, Database } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

import { ExportDialog } from '@/components/export/ExportDialog'
import { Favoritos } from '@/components/Favoritos'
import { PredictiveAnalytics } from '@/components/analytics/PredictiveAnalytics'
import { ApiDataFetcher } from '@/components/api/ApiDataFetcher'
import { DataFetcher } from '@/components/DataFetcher'
import { Ranking } from '@/components/Ranking'
import { InteractiveCharts } from '@/components/charts/InteractiveCharts'
import { TemporalComparison } from '@/components/charts/TemporalComparison'
import { PredictiveMetrics } from '@/components/charts/PredictiveMetrics'
import { Status } from '@/components/Status'

import { useDashboardData } from '@/components/dashboard/hooks/useDashboardData'


interface DashboardModularProps {
  onViewProfile?: (deputadoId: string) => void
}

export function Dashboard({ onViewProfile }: DashboardModularProps) {
  const {
    analiseData,
    loading,
    isConnected,
    hasData,
    limparCache,
    recarregarDados,
    getUIMetrics,
    getUIChartData,
    cacheInfo
  } = useDashboardData()

  if (!hasData && !loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-green-500 to-purple-500 bg-clip-text text-transparent">
              Dashboard de Análise
            </h2>
            <p className="text-muted-foreground text-lg">
              Comece fazendo upload de um arquivo CSV ou buscando dados diretamente da API
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Status loading={loading} />
            <Button onClick={recarregarDados} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar
            </Button>
          </div>
        </div>

        {/* Data Sources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Dados do 
              </CardTitle>
              <CardDescription>
                Carregar dados em tempo real do banco 
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataFetcher />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                API da Câmara
              </CardTitle>
              <CardDescription>
                Buscar dados diretamente da API oficial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiDataFetcher />
            </CardContent>
          </Card>
        </div>

        {/* Status */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum dado carregado. Use uma das opções acima para começar a análise.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  const uiMetrics = getUIMetrics()
  const uiChartData = getUIChartData()

  const totalDeputados = uiMetrics?.td || analiseData?.deputados?.length || 0
  const totalAlertas = uiMetrics?.ta || analiseData?.alertas?.length || 0
  const totalGastos = uiMetrics?.tg || analiseData?.deputados?.reduce((sum: number, dep: any) => sum + (dep.totalGasto || 0), 0) || 0
  const mediaGastos = uiMetrics?.mg || (totalDeputados > 0 ? totalGastos / totalDeputados : 0)

  const gravidadeData = uiChartData?.alertas?.map(alerta => ({
    name: alerta.n,
    value: alerta.v
  })) || Object.entries(analiseData?.alertas?.reduce((acc: any, alerta: any) => {
    acc[alerta.gravidade] = (acc[alerta.gravidade] || 0) + 1
    return acc
  }, {}) || {}).map(([gravidade, count]) => ({
    name: gravidade,
    value: count
  }))

  const partidosData = uiChartData?.partidos?.map(partido => ({
    partido: partido.p,
    gasto: partido.g
  })) || Object.entries(analiseData?.deputados?.reduce((acc: any, dep: any) => {
    acc[dep.siglaPartido] = (acc[dep.siglaPartido] || 0) + (dep.totalGasto || 0)
    return acc
  }, {}) || {})
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([partido, gasto]) => ({
      partido,
      gasto: Number(gasto)
    }))

  if (process.env.NODE_ENV === 'development' && uiMetrics) {
    console.log('🎨 [DashboardModular] Usando dados do cache UI:', {
      metrics: uiMetrics,
      chartDataAvailable: Boolean(uiChartData?.alertas && uiChartData?.partidos),
      cacheInfo
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-green-500 to-purple-500 bg-clip-text text-transparent">
            Dashboard de Análise
          </h2>
          <p className="text-muted-foreground text-lg">
            Visão geral dos dados carregados e métricas principais
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {totalDeputados} deputados
            </span>
            <span className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {totalAlertas} alertas
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              R$ {(totalGastos / 1000000).toFixed(1)}M em gastos
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Status loading={loading} />
          <Button onClick={recarregarDados} variant="outline" size="sm" disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <ExportDialog data={analiseData} />
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Deputados</p>
                <p className="text-3xl font-bold">{totalDeputados}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Alertas</p>
                <p className="text-3xl font-bold text-red-600">{totalAlertas}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gastos</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {(totalGastos / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Média por Deputado</p>
                <p className="text-3xl font-bold text-purple-600">
                  R$ {(mediaGastos / 1000).toFixed(0)}k
                </p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">📊 Resumo</TabsTrigger>
          <TabsTrigger value="rankings">🏆 Rankings</TabsTrigger>
          <TabsTrigger value="analytics">📈 Análises</TabsTrigger>
          <TabsTrigger value="predictions">🔮 Predições</TabsTrigger>
          <TabsTrigger value="favorites">⭐ Favoritos</TabsTrigger>
          <TabsTrigger value="tools">🛠️ Ferramentas</TabsTrigger>
        </TabsList>

        {/* Aba: Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alertas por Gravidade */}
            {gravidadeData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Alertas por Gravidade</CardTitle>
                  <CardDescription>
                    Distribuição dos alertas por nível de gravidade
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={gravidadeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {gravidadeData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gastos por Partido */}
            {partidosData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Partidos por Gastos</CardTitle>
                  <CardDescription>
                    Partidos com maior volume de gastos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={partidosData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="partido" type="category" width={60} />
                        <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Gastos']} />
                        <Bar dataKey="gasto" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Aba: Rankings */}
        <TabsContent value="rankings">
          <Ranking />
        </TabsContent>

        {/* Aba: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <InteractiveCharts />
            <TemporalComparison />
          </div>
        </TabsContent>

        {/* Aba: Predictions */}
        <TabsContent value="predictions" className="space-y-6">
          <PredictiveAnalytics />
          <PredictiveMetrics />
        </TabsContent>

        {/* Aba: Favorites */}
        <TabsContent value="favorites">
          <Favoritos onSelectDeputado={onViewProfile || (() => {})} />
        </TabsContent>

        {/* Aba: Tools */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do </CardTitle>
                <CardDescription>
                  Gerencie e atualize dados do banco
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataFetcher />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API da Câmara</CardTitle>
                <CardDescription>
                  Fetch dados em tempo real da API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiDataFetcher />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cache e Performance</CardTitle>
              <CardDescription>
                Gerencie cache local e performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Limpar Cache Local</p>
                  <p className="text-sm text-muted-foreground">
                    Remove dados armazenados localmente
                  </p>
                </div>
                <Button onClick={limparCache} variant="outline">
                  Limpar Cache
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Recarregar Todos os Dados</p>
                  <p className="text-sm text-muted-foreground">
                    Force refresh de todos os dados
                  </p>
                </div>
                <Button onClick={recarregarDados} variant="outline" disabled={loading}>
                  {loading ? 'Carregando...' : 'Recarregar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info (Dashboard Modular):</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <strong>Deputados:</strong> {totalDeputados}
            </div>
            <div>
              <strong>Alertas:</strong> {totalAlertas}
            </div>
            <div>
              <strong>Total Gastos:</strong> R$ {(totalGastos / 1000000).toFixed(1)}M
            </div>
            <div>
              <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Connected:</strong> {isConnected ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Has Data:</strong> {hasData ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>🎨 UI Cache:</strong> {uiMetrics ? 'Ativo' : 'Não disponível'}
            </div>
            <div>
              <strong>📊 Cache Size:</strong> {cacheInfo.cacheSize || 'N/A'}
            </div>
            <div>
              <strong>⏰ Cache Age:</strong> {cacheInfo.age || 'N/A'}
            </div>
            {uiMetrics && (
              <>
                <div>
                  <strong>🎯 Fonte Métricas:</strong> Cache UI
                </div>
                <div>
                  <strong>📈 Fonte Gráficos:</strong> {uiChartData?.alertas ? 'Cache UI' : 'Dados originais'}
                </div>
                <div>
                  <strong>💾 Components:</strong> {cacheInfo.components.join(', ')}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}