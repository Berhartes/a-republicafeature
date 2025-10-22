import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts'
import { RefreshCw, Download, X, Plus, TrendingUp, Users, AlertTriangle, BarChart3, Database } from 'lucide-react'
import { Status, EmptyDataPlaceholder } from '@/components/Status'
import { LoadingAnimation } from '@/components/Loading'
import { DeputadoSearch } from '@/components/DeputadoSearch'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'

import { useEtlDeputadosData } from '@/hooks/useEtlDeputadosData'
import { useCompararDeputadosFilters } from '@/components/comparar-deputados/hooks/useCompararDeputadosFilters'
import { DeputadoProcessado } from '@/types/etl-deputados.types'
import { useState, useMemo, useCallback } from 'react'

interface CompararDeputadosProps {}

export function CompararDeputados({}: CompararDeputadosProps) {
  const {
    deputados,
    loading,
    error,
    cacheStatus,
    carregarDeputados,
    totalDeputados,
    totalGastos,
    partidosDisponiveis,
    ufsDisponiveis,
    anosDisponiveis,
    fonteAtual
  } = useEtlDeputadosData()

  const [deputadosSelecionados, setDeputadosSelecionados] = useState<DeputadoProcessado[]>([])
  const [loadingDespesas, setLoadingDespesas] = useState(false)

  const adicionarDeputado = useCallback((deputado: DeputadoProcessado) => {
    const identificador = deputado.nomeEleitoral || deputado.nomeEleitoral
    if (deputadosSelecionados.length < 5 && !deputadosSelecionados.find(d => (d.nomeEleitoral || d.nomeEleitoral) === identificador)) {
      setDeputadosSelecionados(prev => [...prev, deputado])
    }
  }, [deputadosSelecionados])

  const removerDeputado = useCallback((deputadoId: number | string) => {
    setDeputadosSelecionados(prev => prev.filter(d =>
      d.id !== deputadoId.toString() &&
      (d.nomeEleitoral || d.nomeEleitoral) !== deputadoId.toString()
    ))
  }, [])

  const limparSelecoes = useCallback(() => {
    setDeputadosSelecionados([])
  }, [])

  const podeAdicionarDeputado = deputadosSelecionados.length < 5
  const temDeputadosSelecionados = deputadosSelecionados.length > 0
  const temDadosParaComparacao = deputadosSelecionados.length >= 2

  const dadosComparacao = useMemo(() => {
    return deputadosSelecionados.map(deputado => ({
      nome: deputado.nomeEleitoral,
      nomeSimples: deputado.nomeEleitoral || deputado.nomeEleitoral.split(' ')[0],
      totalGasto: deputado.totalGastos,
      numAlertas: deputado.alertas.length,
      scoreSuspeicao: deputado.scoreSuspeicao,
      numTransacoes: deputado.totalTransacoes,
      mediaGasto: deputado.mediaTransacao,
      partido: deputado.siglaPartido,
      uf: deputado.siglaUf
    }))
  }, [deputadosSelecionados])

  const estatisticasComparacao = useMemo(() => {
    if (deputadosSelecionados.length === 0) return null

    const totalGastos = deputadosSelecionados.reduce((sum, d) => sum + d.totalGastos, 0)
    const totalAlertas = deputadosSelecionados.reduce((sum, d) => sum + d.alertas.length, 0)
    const totalTransacoes = deputadosSelecionados.reduce((sum, d) => sum + d.totalTransacoes, 0)

    return {
      totalGastos,
      totalAlertas,
      mediaGastos: totalGastos / deputadosSelecionados.length,
      totalTransacoes
    }
  }, [deputadosSelecionados])

  const carregarDespesasDetalhadas = useCallback(async (ano: number) => {
    setLoadingDespesas(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoadingDespesas(false)
  }, [])

  const exportarComparacao = useCallback(() => {
    const data = {
      deputados: deputadosSelecionados,
      dadosComparacao,
      estatisticas: estatisticasComparacao,
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comparacao-deputados-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [deputadosSelecionados, dadosComparacao, estatisticasComparacao])

  const {
    metricaSelecionada,
    categoriaEvolucao,
    anoEvolucao,
    sortConfig,
    metricasDisponiveis,
    categoriasDisponiveis,
    anosDisponiveis: anosDisponiveisFilter,
    setMetricaSelecionada,
    setCategoriaEvolucao,
    setAnoEvolucao,
    handleSort,
    sortData,
    resetFilters,
    hasActiveFilters,
    filterSummary
  } = useCompararDeputadosFilters()

  const anosDisponiveisComparacao = anosDisponiveis.length > 0 ? anosDisponiveis : [2023, 2024, 2025]

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Status />
      </div>
    )
  }

  if (!loading && deputados.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <EmptyDataPlaceholder />
      </div>
    )
  }

  const dadosOrdenados = sortData(dadosComparacao)

  return (
    <div className="space-y-6">
      {/* Status ETL */}
      {fonteAtual === 'etl' ? (
        <Alert className="border-green-200 bg-green-50">
          <Database className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-green-800 font-medium">
                  🔗 Conectado ao Sistema ETL
                </span>
                <span className="text-green-600 text-sm">
                  • {totalDeputados} deputados disponíveis para comparação
                  • {cacheStatus.dataAge}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={carregarDeputados}
                disabled={loading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-orange-800 font-medium">
                  ⚠️ Sistema ETL desconectado
                </span>
                <span className="text-orange-600 text-sm ml-2">
                  {fonteAtual === 'localStorage' ? 'Usando dados locais' : 'Sem dados disponíveis'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={carregarDeputados}
                disabled={loading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar Conectar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-purple-500 to-green-500 bg-clip-text text-transparent">
            Comparar Deputados
          </h1>
          <p className="text-muted-foreground text-lg">
            Compare o desempenho e gastos de até 5 deputados simultaneamente
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {deputadosSelecionados.length}/5 deputados selecionados
            </span>
            {estatisticasComparacao && (
              <>
                <span className="flex items-center gap-1">
                  <BarChart3 className="h-4 w-4" />
                  R$ {(estatisticasComparacao.totalGastos / 1000000).toFixed(1)}M em gastos
                </span>
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  {estatisticasComparacao.totalAlertas} alertas
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => carregarDespesasDetalhadas(anoEvolucao)}
            variant="outline"
            size="sm"
            disabled={loading || !temDeputadosSelecionados}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={exportarComparacao}
            variant="outline"
            disabled={!temDadosParaComparacao}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Seleção de Deputados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Selecionar Deputados para Comparação
          </CardTitle>
          <CardDescription>
            Escolha até 5 deputados para comparar. {deputadosSelecionados.length > 0 && `${5 - deputadosSelecionados.length} vagas restantes.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search Input */}
            <DeputadoSearch
              deputados={deputados}
              onSelectDeputado={(deputado) => { adicionarDeputado(deputado); }}
              disabled={!podeAdicionarDeputado}
              placeholder={podeAdicionarDeputado ? "Buscar deputado para adicionar..." : "Máximo de 5 deputados atingido"}
            />

            {/* Selected Deputies */}
            {temDeputadosSelecionados && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Deputados Selecionados:</h4>
                  <Button variant="ghost" size="sm" onClick={limparSelecoes}>
                    Limpar Todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {deputadosSelecionados.map((deputado) => (
                    <Badge key={deputado.id} variant="secondary" className="flex items-center gap-2 py-1 px-3">
                      <span>{deputado.nomeEleitoral || deputado.nomeEleitoral}</span>
                      <span className="text-xs text-muted-foreground">({deputado.siglaPartido}-{deputado.siglaUf})</span>
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removerDeputado(deputado.nomeEleitoral || deputado.nomeEleitoral)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loadingDespesas && (
        <LoadingAnimation mode="animated" message="Carregando dados para comparação..." />
      )}

      {/* Comparison Content */}
      {temDadosParaComparacao && (
        <>
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Filtros e Configurações
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {filterSummary.length} filtros ativos
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Métrica Principal</label>
                  <Select value={metricaSelecionada} onValueChange={setMetricaSelecionada}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {metricasDisponiveis.map((metrica) => (
                        <SelectItem key={metrica.value} value={metrica.value}>
                          {metrica.icon} {metrica.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria (Evolução)</label>
                  <Select value={categoriaEvolucao} onValueChange={setCategoriaEvolucao}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriasDisponiveis.map((categoria) => (
                        <SelectItem key={categoria.value} value={categoria.value}>
                          {categoria.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Ano</label>
                  <Select value={anoEvolucao.toString()} onValueChange={(value) => setAnoEvolucao(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anosDisponiveisComparacao.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium opacity-0">Ações</label>
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    disabled={!hasActiveFilters}
                    className="w-full"
                  >
                    Resetar Filtros
                  </Button>
                </div>
              </div>

              {/* Active filters summary */}
              {hasActiveFilters && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                    {filterSummary.map((filter, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {filter}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics Overview */}
          {estatisticasComparacao && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {(estatisticasComparacao.totalGastos / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Gastos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {estatisticasComparacao.totalAlertas}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Alertas</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {(estatisticasComparacao.mediaGastos / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-muted-foreground">Média de Gastos</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {estatisticasComparacao.totalTransacoes.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Transações</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs for different views */}
          <Tabs defaultValue="tabela" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tabela">📊 Tabela</TabsTrigger>
              <TabsTrigger value="barras">📈 Gráfico de Barras</TabsTrigger>
              <TabsTrigger value="radar">🎯 Radar</TabsTrigger>
              <TabsTrigger value="evolucao">📉 Evolução</TabsTrigger>
            </TabsList>

            {/* Table View */}
            <TabsContent value="tabela">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Detalhada</CardTitle>
                  <CardDescription>
                    Clique nos cabeçalhos para ordenar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50" 
                          onClick={() => handleSort('nome')}
                        >
                          Nome {sortConfig.key === 'nome' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 text-right" 
                          onClick={() => handleSort('totalGasto')}
                        >
                          Total Gasto {sortConfig.key === 'totalGasto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 text-right" 
                          onClick={() => handleSort('numAlertas')}
                        >
                          Alertas {sortConfig.key === 'numAlertas' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 text-right" 
                          onClick={() => handleSort('scoreSuspeicao')}
                        >
                          Score {sortConfig.key === 'scoreSuspeicao' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 text-right" 
                          onClick={() => handleSort('numTransacoes')}
                        >
                          Transações {sortConfig.key === 'numTransacoes' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-muted/50 text-right" 
                          onClick={() => handleSort('mediaGasto')}
                        >
                          Média/Transação {sortConfig.key === 'mediaGasto' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dadosOrdenados.map((deputado) => (
                        <TableRow key={deputado.nomeEleitoral}>
                          <TableCell className="font-medium">{deputado.nomeEleitoral}</TableCell>
                          <TableCell className="text-right">R$ {deputado.totalGasto.toLocaleString('pt-BR')}</TableCell>
                          <TableCell className="text-right">{deputado.numAlertas}</TableCell>
                          <TableCell className="text-right">{deputado.scoreSuspeicao.toFixed(1)}</TableCell>
                          <TableCell className="text-right">{deputado.numTransacoes.toLocaleString()}</TableCell>
                          <TableCell className="text-right">R$ {deputado.mediaGasto.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bar Chart View */}
            <TabsContent value="barras">
              <Card>
                <CardHeader>
                  <CardTitle>Comparação Visual - {metricasDisponiveis.find(m => m.value === metricaSelecionada)?.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dadosComparacao}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nomeSimples" />
                        <YAxis />
                        <Tooltip formatter={(value) => [
                          typeof value === 'number' && value > 1000 ? 
                            `R$ ${value.toLocaleString('pt-BR')}` : 
                            value,
                          metricaSelecionada === 'gastos' ? 'Total Gasto' :
                          metricaSelecionada === 'alertas' ? 'Nº Alertas' :
                          metricaSelecionada === 'ranking' ? 'Score' : 'Valor'
                        ]} />
                        <Bar 
                          dataKey={
                            metricaSelecionada === 'gastos' ? 'totalGasto' :
                            metricaSelecionada === 'alertas' ? 'numAlertas' :
                            metricaSelecionada === 'ranking' ? 'scoreSuspeicao' :
                            'totalGasto'
                          } 
                          fill="#8884d8" 
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Radar Chart View */}
            <TabsContent value="radar">
              <Card>
                <CardHeader>
                  <CardTitle>Análise Multidimensional</CardTitle>
                  <CardDescription>
                    Comparação de múltiplas métricas simultaneamente (normalizadas)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dadosComparacao.map(d => ({
                        deputado: d.nomeSimples,
                        gastos: Math.min(100, (d.totalGasto / Math.max(...dadosComparacao.map(x => x.totalGasto))) * 100),
                        alertas: Math.min(100, (d.numAlertas / Math.max(...dadosComparacao.map(x => x.numAlertas))) * 100),
                        score: Math.min(100, (d.scoreSuspeicao / Math.max(...dadosComparacao.map(x => x.scoreSuspeicao))) * 100),
                        transacoes: Math.min(100, (d.numTransacoes / Math.max(...dadosComparacao.map(x => x.numTransacoes))) * 100)
                      }))}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="deputado" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar name="Gastos" dataKey="gastos" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                        <Radar name="Alertas" dataKey="alertas" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                        <Radar name="Score" dataKey="score" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                        <Radar name="Transações" dataKey="transacoes" stroke="#ff7300" fill="#ff7300" fillOpacity={0.6} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Evolution View */}
            <TabsContent value="evolucao">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Temporal</CardTitle>
                  <CardDescription>
                    Análise de tendências ao longo do tempo (simulado - implementar com dados reais)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { mes: 'Jan', ...dadosComparacao.reduce((acc, d, i) => ({ ...acc, [`deputado${i}`]: Math.random() * d.totalGasto }), {}) },
                        { mes: 'Fev', ...dadosComparacao.reduce((acc, d, i) => ({ ...acc, [`deputado${i}`]: Math.random() * d.totalGasto }), {}) },
                        { mes: 'Mar', ...dadosComparacao.reduce((acc, d, i) => ({ ...acc, [`deputado${i}`]: Math.random() * d.totalGasto }), {}) },
                        { mes: 'Abr', ...dadosComparacao.reduce((acc, d, i) => ({ ...acc, [`deputado${i}`]: Math.random() * d.totalGasto }), {}) },
                        { mes: 'Mai', ...dadosComparacao.reduce((acc, d, i) => ({ ...acc, [`deputado${i}`]: Math.random() * d.totalGasto }), {}) },
                        { mes: 'Jun', ...dadosComparacao.reduce((acc, d, i) => ({ ...acc, [`deputado${i}`]: Math.random() * d.totalGasto }), {}) }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {dadosComparacao.map((deputado, index) => (
                          <Line 
                            key={deputado.nomeEleitoral}
                            type="monotone" 
                            dataKey={`deputado${index}`} 
                            stroke={`hsl(${index * 137.5}, 70%, 50%)`}
                            name={deputado.nomeSimples}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Empty state when no deputies selected */}
      {!temDeputadosSelecionados && !loading && (
        <Card className="py-12">
          <CardContent className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum deputado selecionado
            </h3>
            <p className="text-muted-foreground mb-4">
              Selecione pelo menos 2 deputados para começar a comparação.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && temDeputadosSelecionados && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info (Comparar Deputados Modular):</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Deputados Selecionados:</strong> {deputadosSelecionados.length}
            </div>
            <div>
              <strong>Métrica Ativa:</strong> {metricaSelecionada}
            </div>
            <div>
              <strong>Ano:</strong> {anoEvolucao}
            </div>
            <div>
              <strong>Ordenação:</strong> {sortConfig.key} ({sortConfig.direction})
            </div>
            <div>
              <strong>Loading Despesas:</strong> {loadingDespesas ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Dados para Comparação:</strong> {temDadosParaComparacao ? 'Sim' : 'Não'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}