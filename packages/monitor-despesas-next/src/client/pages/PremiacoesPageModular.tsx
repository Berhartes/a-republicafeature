
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TrendingUp, Trophy, Filter, Settings, AlertTriangle, Crown, Award, Medal, Star, RefreshCw, Database, Rocket } from 'lucide-react'
import { getCategoriaIconJSX } from '@/components/premiacoes/utils/categoria-icons'

import { useEtlDeputadosData } from '@/hooks/useEtlDeputadosData'
import { DeputadoProcessado, PremiacoesProcessadas, RankingDeputados } from '@/types/etl-deputados.types'
import SystemV4Demo from './SystemV4Demo'

interface EstatisticasGlobais {
  totalGeral: number
  totalTransacoes: number
  mediaTransacao: number
  totalDeputados: number
  totalFornecedores: number
  totalCategorias: number
  anosDisponiveis: number[]
  estatisticasPorAno: Record<string, any>
  estatisticasPorCategoria: Record<string, any>
  top10Geral: DeputadoRanking[]
  top10PorCategoria: Record<string, DeputadoRanking[]>
  ultimaAtualizacao: Date
}

export default function PremiacoesPageModular() {
  const {
    deputados,
    loading: loadingDeputados,
    error: errorDeputados,
    rankings,
    premiacoes,
    cacheStatus,
    carregarDeputados,
    carregarRankings,
    carregarPremiacoes,
    limparCache,
    totalDeputados,
    totalGastos,
    mediaGastos,
    partidosDisponiveis,
    ufsDisponiveis,
    anosDisponiveis,
    ultimaAtualizacao,
    fonteAtual
  } = useEtlDeputadosData()

  const [anoSelecionado, setAnoSelecionado] = useState('2025')
  const [rankingGeral, setRankingGeral] = useState<DeputadoProcessado[]>([])
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('TODAS')
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showCategoriaSelection, setShowCategoriaSelection] = useState(false)
  const [processandoPremiacoes, setProcessandoPremiacoes] = useState(false)
  
  const categoriasDisponiveis = useMemo(() => {
    if (rankings?.porCategoria) {
      return Object.keys(rankings.porCategoria)
    }
    return [
      'COMBUSTÍVEIS E LUBRIFICANTES',
      'MANUTENÇÃO DE ESCRITÓRIO',
      'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR',
      'HOSPEDAGEM',
      'PASSAGENS AÉREAS'
    ]
  }, [rankings])

  useEffect(() => {
    if (rankings && !premiacoes && !processandoPremiacoes) {
      setProcessandoPremiacoes(true)
      carregarPremiacoes().finally(() => {
        setProcessandoPremiacoes(false)
      })
    }
  }, [rankings, premiacoes, carregarPremiacoes, processandoPremiacoes])

  useEffect(() => {
    if (rankings) {
      setRankingGeral(rankings.geral || [])
    }
  }, [rankings])

  const carregarRankingFiltrado = useCallback(async (ano: string, categoria: string) => {
    if (!rankings) return

    try {
      console.log('🔍 [Filtro] Aplicando filtros:', { ano, categoria })
      console.log('🔍 [Filtro] Rankings disponíveis:', {
        geral: rankings.geral?.length || 0,
        categorias: Object.keys(rankings.porCategoria || {}),
        anos: Object.keys(rankings.porAno || {})
      })

      let ranking = rankings.geral || []

      if (categoria !== 'TODAS') {
        ranking = rankings.porCategoria?.[categoria] || []
        console.log(`✅ [Filtro] Ranking para categoria "${categoria}":`, ranking.length, 'deputados')
        if (ranking.length > 0) {
          console.log('📊 [Filtro] Primeiros 3 deputados da categoria:')
          ranking.slice(0, 3).forEach((dep, idx) => {
            console.log(`  ${idx + 1}º ${dep.nomeEleitoral}: R$ ${dep.totalGastos?.toLocaleString('pt-BR')} (${dep.totalTransacoes} transações)`)
          })
        }
      }

      if (ano !== 'todos' && rankings.porAno?.[Number(ano)]) {
        ranking = rankings.porAno[Number(ano)] || []
        console.log(`✅ [Filtro] Ranking para ano ${ano}:`, ranking.length, 'deputados')
      }

      setRankingGeral(ranking)
      console.log('✅ [Filtro] Ranking atualizado:', ranking.length, 'deputados')
    } catch (err) {
      console.error('❌ [Filtro] Erro ao filtrar ranking:', err)
      setRankingGeral([])
    }
  }, [rankings])

  const totalPremiacoes = useMemo(() => {
    if (!premiacoes) return 0
    const { coroas = [], trofeus = [], medalhas = [] } = premiacoes
    return coroas.length + trofeus.length + medalhas.length
  }, [premiacoes])
  
  const handleAnoChange = useCallback((novoAno: string) => {
    setAnoSelecionado(novoAno)
    carregarRankingFiltrado(novoAno, categoriaSelecionada)
  }, [categoriaSelecionada, carregarRankingFiltrado])
  
  const handleCategoriaChange = useCallback((novaCategoria: string) => {
    setCategoriaSelecionada(novaCategoria)
    carregarRankingFiltrado(anoSelecionado, novaCategoria)
  }, [anoSelecionado, carregarRankingFiltrado])
  
    
      
        
    

  const handleCalcularPremiacoes = useCallback(async () => {
    setProcessandoPremiacoes(true)
    try {
      await carregarPremiacoes()
      console.log('✅ Premiações recalculadas com sucesso')
    } catch (error) {
      console.error('❌ Erro ao calcular premiações:', error)
    } finally {
      setProcessandoPremiacoes(false)
    }
  }, [carregarPremiacoes])

  const handleAtualizarRankings = useCallback(async () => {
    try {
      await carregarRankings()
      carregarRankingFiltrado(anoSelecionado, categoriaSelecionada)
      console.log('✅ Rankings atualizados com sucesso')
    } catch (error) {
      console.error('❌ Erro ao atualizar rankings:', error)
    }
  }, [carregarRankings, carregarRankingFiltrado, anoSelecionado, categoriaSelecionada])

  const handleAtualizarDados = useCallback(async () => {
    try {
      await carregarDeputados()
      console.log('✅ Dados de deputados atualizados')
    } catch (error) {
      console.error('❌ Erro ao atualizar dados:', error)
    }
  }, [carregarDeputados])

  const handleLimparCache = useCallback(() => {
    limparCache()
    console.log('🗑️ Cache do ETL limpo')
  }, [limparCache])

  return (
    <TooltipProvider>
      <div className="container mx-auto px-12 py-8 space-y-4 max-w-7xl">
        {/* Cabeçalho com Controles Administrativos */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🏆 Premiações</h1>
            <p className="text-sm text-muted-foreground">
              Condecorações para os parlamentares que mais se destacam no uso das cotas parlamentares
            </p>
            {/* Status do ETL */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${cacheStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-muted-foreground">
                {fonteAtual === 'etl' ? '🔗 Conectado ao Sistema ETL' :
                 fonteAtual === 'localStorage' ? '💾 Dados locais' :
                 '⚠️ Sem dados'}
                {ultimaAtualizacao && ` • ${cacheStatus.dataAge}`}
              </span>
            </div>
          </div>
          
          {/* Botão de Engrenagem */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdminPanel(!showAdminPanel)}
              className="hover:bg-gray-100"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            {/* Painel Admin */}
            {showAdminPanel && (
              <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-64">
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={handleCalcularPremiacoes}
                    disabled={processandoPremiacoes}
                  >
                    <Trophy className="w-3 h-3 mr-2" />
                    {processandoPremiacoes ? 'Calculando...' : 'Calcular Premiações'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={handleAtualizarRankings}
                    disabled={loadingDeputados}
                  >
                    <RefreshCw className="w-3 h-3 mr-2" />
                    {loadingDeputados ? 'Atualizando...' : 'Atualizar Rankings'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={handleAtualizarDados}
                    disabled={loadingDeputados}
                  >
                    <Database className="w-3 h-3 mr-2" />
                    Atualizar Dados ETL
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleLimparCache}
                  >
                    <Settings className="w-3 h-3 mr-2" />
                    Limpar Cache
                  </Button>
                  {/* Status Info */}
                  <div className="border-t pt-2 mt-2">
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>📊 {totalDeputados} deputados</div>
                      <div>💰 R$ {(totalGastos / 1000000).toFixed(1)}M total</div>
                      <div>🏆 {totalPremiacoes} premiações</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Estado de carregamento e erro */}
        {loadingDeputados && (
          <Alert className="max-w-4xl mx-auto border-blue-200 bg-blue-50">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              Carregando dados de deputados do Sistema ETL...
            </AlertDescription>
          </Alert>
        )}

        {processandoPremiacoes && (
          <Alert className="max-w-4xl mx-auto border-purple-200 bg-purple-50">
            <Trophy className="h-4 w-4 text-purple-600" />
            <AlertDescription>
              Processando premiações e rankings...
            </AlertDescription>
          </Alert>
        )}

        {errorDeputados && (
          <Alert className="max-w-4xl mx-auto border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Erro ao carregar dados</strong>
                  <div className="text-sm text-orange-700 mt-1">
                    {errorDeputados}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleAtualizarDados}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Tentar Novamente
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.location.href = '/gastos/processador-deputados'}>
                    Processar Dados
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Dashboard de Estatísticas */}
        {(deputados.length > 0 || premiacoes) && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalPremiacoes}</p>
                    <p className="text-sm text-muted-foreground">Premiações</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{totalDeputados}</p>
                    <p className="text-sm text-muted-foreground">Deputados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{premiacoes?.estatisticas.totalCoroas || 0}</p>
                    <p className="text-sm text-muted-foreground">Coroas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Award className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{(premiacoes?.estatisticas.totalTrofeus || 0) + (premiacoes?.estatisticas.totalMedalhas || 0)}</p>
                    <p className="text-sm text-muted-foreground">Troféus & Medalhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Tabs Principais */}
        <Tabs defaultValue="rankings" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rankings" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Rankings
            </TabsTrigger>
            <TabsTrigger value="premiacoes" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Premiações {totalPremiacoes > 0 ? `(${totalPremiacoes})` : ''}
            </TabsTrigger>
            <TabsTrigger value="sistemav4" className="flex items-center gap-2">
              <Rocket className="w-4 h-4" />
              Sistema V4
            </TabsTrigger>
          </TabsList>
          
          {/* Tab Rankings */}
          <TabsContent value="rankings" className="space-y-4">
            {/* Filtros e Controles dentro da aba */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5" />
                  Filtros
                </CardTitle>
                <CardDescription>
                  Selecione período e categoria para visualizar rankings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-center flex-wrap">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Ano:</label>
                    <Select value={anoSelecionado} onValueChange={handleAnoChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os anos</SelectItem>
                        {anosDisponiveis.map(ano => (
                          <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    variant="default"
                    onClick={() => setShowCategoriaSelection(!showCategoriaSelection)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Escolher uma categoria
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showCategoriaSelection ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-500" />
                    Escolher Categoria
                  </CardTitle>
                  <CardDescription>
                    Selecione uma categoria para filtrar os rankings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <Button
                      variant={categoriaSelecionada === 'TODAS' ? 'default' : 'outline'}
                      className="justify-start text-left h-16 p-3"
                      onClick={() => {
                        handleCategoriaChange('TODAS')
                        setShowCategoriaSelection(false)
                      }}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <div className="flex-shrink-0">
                          <Filter className="h-5 w-5" />
                        </div>
                        <span className="text-xs leading-tight">Todas as categorias</span>
                      </div>
                    </Button>
                    {categoriasDisponiveis.map(categoria => (
                      <Button
                        key={categoria}
                        variant={categoriaSelecionada === categoria ? 'default' : 'outline'}
                        className="justify-start text-left h-16 p-3"
                        onClick={() => {
                          handleCategoriaChange(categoria)
                          setShowCategoriaSelection(false)
                        }}
                        title={categoria}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <div className="flex-shrink-0">
                            {getCategoriaIconJSX(categoria)}
                          </div>
                          <span className="text-xs leading-tight break-words">{categoria}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Ranking de Deputados</CardTitle>
                  <CardDescription>
                    {categoriaSelecionada === 'TODAS' ? 'Ranking geral' : categoriaSelecionada} • {anoSelecionado === 'todos' ? 'Todos os anos' : anoSelecionado}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rankingGeral.length > 0 ? (
                    <div className="space-y-4">
                      {rankingGeral.slice(0, 10).map((deputado, index) => (
                        <div key={deputado.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0 ? 'bg-yellow-100 text-yellow-800' :
                              index === 1 ? 'bg-gray-100 text-gray-800' :
                              index === 2 ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{deputado.nomeEleitoral}</p>
                              <p className="text-sm text-muted-foreground">{deputado.siglaPartido} • {deputado.siglaUf}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">R$ {deputado.totalGastos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            <p className="text-sm text-muted-foreground">{deputado.totalTransacoes} transações</p>
                          </div>
                        </div>
                      ))}
                      {rankingGeral.length > 10 && (
                        <p className="text-center text-sm text-muted-foreground mt-4">
                          E mais {rankingGeral.length - 10} deputados...
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Nenhum registro disponível para {categoriaSelecionada.toLowerCase()} em {anoSelecionado === 'todos' ? 'todos os anos' : anoSelecionado}.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Premiações */}
          <TabsContent value="premiacoes" className="space-y-4">
            {premiacoes ? (
              <div className="space-y-6">
                {/* Seção de Coroas */}
                {premiacoes.coroas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Coroas de Ouro ({premiacoes.coroas.length})
                      </CardTitle>
                      <CardDescription>
                        Os maiores destaques em gastos parlamentares
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {premiacoes.coroas.map((coroa, index) => (
                          <div key={index} className="p-4 border-2 border-yellow-200 bg-yellow-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Crown className="h-8 w-8 text-yellow-600 flex-shrink-0 mt-1" />
                              <div>
                                <h3 className="font-bold text-yellow-800">{coroa.titulo}</h3>
                                <p className="text-sm text-yellow-700 mt-1">{coroa.descricao}</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">
                                  {coroa.categoria}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Seção de Troféus */}
                {premiacoes.trofeus.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-blue-500" />
                        Troféus de Prata ({premiacoes.trofeus.length})
                      </CardTitle>
                      <CardDescription>
                        Reconhecimentos especiais por performance parlamentar
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {premiacoes.trofeus.map((trofeu, index) => (
                          <div key={index} className="p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Trophy className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                              <div>
                                <h3 className="font-bold text-blue-800">{trofeu.titulo}</h3>
                                <p className="text-sm text-blue-700 mt-1">{trofeu.descricao}</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                                  {trofeu.categoria}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Seção de Medalhas */}
                {premiacoes.medalhas.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Medal className="h-5 w-5 text-orange-500" />
                        Medalhas de Bronze ({premiacoes.medalhas.length})
                      </CardTitle>
                      <CardDescription>
                        Menções honrosas em categorias específicas
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        {premiacoes.medalhas.map((medalha, index) => (
                          <div key={index} className="p-4 border-2 border-orange-200 bg-orange-50 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Medal className="h-8 w-8 text-orange-600 flex-shrink-0 mt-1" />
                              <div>
                                <h3 className="font-bold text-orange-800">{medalha.titulo}</h3>
                                <p className="text-sm text-orange-700 mt-1">{medalha.descricao}</p>
                                <span className="inline-block mt-2 px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded">
                                  {medalha.categoria}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Campeão Geral */}
                {premiacoes.campeaoGeral && (
                  <Card className="border-2 border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-purple-800">
                        <Star className="h-6 w-6 text-purple-600" />
                        🏆 Campeão Geral dos Gastos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-3 p-4 bg-purple-100 rounded-lg">
                          <Crown className="h-10 w-10 text-purple-600" />
                          <div>
                            <h3 className="text-xl font-bold text-purple-800">
                              {premiacoes.campeaoGeral.nomeEleitoral}
                            </h3>
                            <p className="text-purple-700">
                              {premiacoes.campeaoGeral.siglaPartido} • {premiacoes.campeaoGeral.siglaUf}
                            </p>
                            <p className="text-lg font-bold text-purple-800 mt-2">
                              R$ {premiacoes.campeaoGeral.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {totalPremiacoes === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center text-sm text-muted-foreground">
                      Nenhuma premiação encontrada.
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCalcularPremiacoes}
                          disabled={processandoPremiacoes}
                        >
                          {processandoPremiacoes ? 'Processando...' : 'Calcular Premiações'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  Sistema de premiações carregando...
                  {errorDeputados && (
                    <div className="mt-2">

                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Sistema V4 */}
          <TabsContent value="sistemav4" className="space-y-4">
            <SystemV4Demo />
          </TabsContent>
        </Tabs>
        
      </div>
    </TooltipProvider>
  )
}
