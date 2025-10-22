import { useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingAnimation } from '@/components/Loading'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Card, CardContent } from '@/components/ui/card'
import { useNavigate } from '@tanstack/react-router'
import { NetworkGraph } from '@/components/NetworkGraph'

import { usePerfilFornecedorData } from '@/components/perfil-fornecedor/hooks/usePerfilFornecedorData'
import { usePerfilFornecedorFilters } from '@/components/perfil-fornecedor/hooks/usePerfilFornecedorFilters'

import { PerfilFornecedorHeader } from '@/components/perfil-fornecedor/components/PerfilFornecedorHeader'

import { PerfilFornecedorVisaoGeralPage } from '@/components/perfil-fornecedor/pages/PerfilFornecedorVisaoGeralPage'
import { PerfilFornecedorTransacoesPage } from '@/components/perfil-fornecedor/pages/PerfilFornecedorTransacoesPage'


interface PerfilFornecedorModularProps {}

export function PerfilFornecedorModular({}: PerfilFornecedorModularProps) {
  const navigate = useNavigate()
  const [showHistorico, setShowHistorico] = useState(false)

  const {
    fornecedorData,
    transacoesDetalhadas,
    dadosHistoricos,
    loading,
    loadingHistorico,
    redeRelacoes,
    mediasCategoria,
    fornecedorInflacionado,
    percentualInflacao,
    deputadoModalAberto,
    deputadoSelecionado,
    transacoesDeputado,
    anosDisponiveis,
    mesesDisponiveis,
    recarregarDados,
    carregarDadosAno,
    limparRedeVisivel,
    abrirModalDeputado,
    fecharModalDeputado,
    exportarPerfilCompleto
  } = usePerfilFornecedorData()

  const {
    activeTab,
    anoSelecionado,
    mesSelecionado,
    abas,
    navegarParaAba,
    setAnoSelecionado,
    setMesSelecionado,
    buscaTransacao,
    setBuscaTransacao,
    ordenacaoTransacoes,
    setOrdenacaoTransacoes,
    direcaoOrdenacao,
    setDirecaoOrdenacao,
    filtroCategoria,
    setFiltroCategoria,
    filtroRiscoTransacao,
    setFiltroRiscoTransacao,
    transacoesExibidas,
    setTransacoesExibidas,
    mostrarRedeRelacoes,
    setMostrarRedeRelacoes
  } = usePerfilFornecedorFilters()

  const deputadosAtendidosCount = useMemo(() => {
    if (!fornecedorData) return 0
    const value = fornecedorData.deputadosAtendidos
    if (Array.isArray(value)) return value.length
    if (typeof value === 'number') return value
    return fornecedorData?.numeroDeputadosAtendidos || 0
  }, [fornecedorData])

  const cnpj = fornecedorData?.cnpj || ''

  const handleAnoChange = async (novoAno: number) => {
    setAnoSelecionado(novoAno)
    await carregarDadosAno(novoAno, mesSelecionado)
  }

  const handleMesChange = async (novoMes: string) => {
    setMesSelecionado(novoMes)
    await carregarDadosAno(anoSelecionado, novoMes)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil: ${fornecedorData?.nome || 'Fornecedor'}`,
        text: `Análise do fornecedor ${fornecedorData?.nome} - Gastos dos Deputados`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  if (loading && !fornecedorData) {
    return (
      <div className="container mx-auto py-6">
        <LoadingAnimation mode="simple" message="Carregando perfil do fornecedor..." />
      </div>
    )
  }

  if (!loading && !fornecedorData) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Fornecedor não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            O fornecedor solicitado não foi encontrado ou não possui dados disponíveis.
          </p>
          <button
            onClick={() => navigate({ to: '/gastos/fornecedores' })}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Voltar para Fornecedores
          </button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Principal */}
        <PerfilFornecedorHeader
          fornecedorData={fornecedorData}
          cnpj={cnpj}
          loading={loading}
          loadingHistorico={loadingHistorico}
          anosDisponiveis={anosDisponiveis}
          mesesDisponiveis={mesesDisponiveis}
          anoSelecionado={anoSelecionado}
          mesSelecionado={mesSelecionado}
          fornecedorInflacionado={fornecedorInflacionado}
          percentualInflacao={percentualInflacao}
          onAnoChange={handleAnoChange}
          onMesChange={handleMesChange}
          onRefresh={recarregarDados}
          onExport={exportarPerfilCompleto}
          onShare={handleShare}
          onToggleHistorico={() => setShowHistorico(!showHistorico)}
          showHistorico={showHistorico}
        />

        {/* Abas Principais */}
        <Tabs value={activeTab} onValueChange={navegarParaAba}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {abas.map(aba => (
              <TabsTrigger key={aba.id} value={aba.id} className="text-xs">
                <span className="hidden sm:inline mr-1">{aba.icone}</span>
                <span className="hidden md:inline">{aba.nome || 'Sem nome'}</span>
                <span className="md:hidden">{(aba.nome || 'Sem nome').split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="visao-geral">
            <PerfilFornecedorVisaoGeralPage
              fornecedorData={fornecedorData}
              transacoesDetalhadas={transacoesDetalhadas}
              mediasCategoria={mediasCategoria}
              fornecedorInflacionado={fornecedorInflacionado}
              percentualInflacao={percentualInflacao}
              anoSelecionado={anoSelecionado}
              mesSelecionado={mesSelecionado}
            />
          </TabsContent>

          {/* Aba: Transações */}
          <TabsContent value="transacoes">
            <PerfilFornecedorTransacoesPage
              transacoesDetalhadas={transacoesDetalhadas}
              fornecedorData={fornecedorData}
              buscaTransacao={buscaTransacao}
              setBuscaTransacao={setBuscaTransacao}
              ordenacaoTransacoes={ordenacaoTransacoes}
              setOrdenacaoTransacoes={setOrdenacaoTransacoes}
              direcaoOrdenacao={direcaoOrdenacao}
              setDirecaoOrdenacao={setDirecaoOrdenacao}
              filtroCategoria={filtroCategoria}
              setFiltroCategoria={setFiltroCategoria}
              filtroRiscoTransacao={filtroRiscoTransacao}
              setFiltroRiscoTransacao={setFiltroRiscoTransacao}
              transacoesExibidas={transacoesExibidas}
              setTransacoesExibidas={setTransacoesExibidas}
            />
          </TabsContent>

          {/* Aba: Deputados */}
          <TabsContent value="deputados">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Análise de Deputados</h3>
                  <p className="text-muted-foreground">
                    Esta seção mostrará a análise detalhada dos deputados que transacionaram com este fornecedor.
                  </p>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {deputadosAtendidosCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Deputados Únicos</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {transacoesDetalhadas.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Transações</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        R$ {(fornecedorData?.totalTransacionado || 0).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-sm text-muted-foreground">Valor Total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Evolução */}
          <TabsContent value="evolucao">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Evolução Temporal</h3>
                <p>Os gráficos de evolução por deputado e projeções históricas serão disponibilizados em breve.</p>
                <p className="text-sm">
                  Enquanto isso você pode acompanhar os principais indicadores nas abas "Visão Geral" e "Transações".
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Análise */}
          <TabsContent value="analise">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Análise Avançada</h3>
                  <p className="text-muted-foreground mb-4">
                    Análise de padrões, anomalias e métricas avançadas do fornecedor.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Score de Suspeição</h4>
                      <div className="text-3xl font-bold text-orange-600">
                        {(fornecedorData?.scoreSuspeicao || 0).toFixed(1)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {fornecedorData?.scoreSuspeicao >= 70 ? 'Alto risco' :
                         fornecedorData?.scoreSuspeicao >= 40 ? 'Risco moderado' : 'Baixo risco'}
                      </p>
                    </div>
                    
                    <div className="p-4 border rounded">
                      <h4 className="font-medium mb-2">Inflação de Preços</h4>
                      <div className={`text-3xl font-bold ${fornecedorInflacionado ? 'text-red-600' : 'text-green-600'}`}>
                        {percentualInflacao > 0 ? '+' : ''}{percentualInflacao.toFixed(1)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {fornecedorInflacionado ? 'Acima da média' : 'Dentro da média'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Relacionamentos */}
          <TabsContent value="relacionamentos">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Rede de Relacionamentos</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMostrarRedeRelacoes(!mostrarRedeRelacoes)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded"
                      >
                        {mostrarRedeRelacoes ? 'Ocultar Rede' : 'Mostrar Rede'}
                      </button>
                      <button
                        onClick={limparRedeVisivel}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </div>

                  {mostrarRedeRelacoes && redeRelacoes.nodes.length > 0 && (
                    <div className="h-96 border rounded">
                      <NetworkGraph
                        nodes={redeRelacoes.nodes}
                        edges={redeRelacoes.edges}
                        onNodeClick={(node) => {
                          if (node.type === 'deputado') {
                            abrirModalDeputado(node, anoSelecionado)
                          }
                        }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded">
                      <div className="text-lg font-bold text-blue-600">
                        {redeRelacoes.nodes.filter(n => n.type === 'deputado').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Deputados Conectados</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded">
                      <div className="text-lg font-bold text-green-600">
                        {redeRelacoes.edges.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Conexões Totais</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Alertas */}
          <TabsContent value="alertas">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Sistema de Alertas</h3>
                  <p className="text-muted-foreground mb-4">
                    Alertas e anomalias detectadas no comportamento do fornecedor.
                  </p>
                  
                  <div className="space-y-4">
                    {fornecedorInflacionado && (
                      <div className="p-4 bg-orange-50 border-l-4 border-orange-400 text-left">
                        <div className="font-medium text-orange-800">🚨 Inflação de Preços Detectada</div>
                        <div className="text-sm text-orange-700 mt-1">
                          Valores {percentualInflacao.toFixed(1)}% acima da média da categoria.
                        </div>
                      </div>
                    )}
                    
                    {(fornecedorData?.scoreSuspeicao || 0) >= 70 && (
                      <div className="p-4 bg-red-50 border-l-4 border-red-400 text-left">
                        <div className="font-medium text-red-800">⚠️ Alto Score de Suspeição</div>
                        <div className="text-sm text-red-700 mt-1">
                          Score de {(fornecedorData?.scoreSuspeicao || 0).toFixed(1)} indica necessidade de investigação.
                        </div>
                      </div>
                    )}
                    
                    {(!fornecedorInflacionado && (fornecedorData?.scoreSuspeicao || 0) < 40) && (
                      <div className="p-4 bg-green-50 border-l-4 border-green-400 text-left">
                        <div className="font-medium text-green-800">✅ Fornecedor Regular</div>
                        <div className="text-sm text-green-700 mt-1">
                          Nenhuma anomalia significativa detectada.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Deputado */}
        {deputadoModalAberto && deputadoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {deputadoSelecionado.name} ({deputadoSelecionado.siglaPartido} - {deputadoSelecionado.siglaUf})
                </h2>
                <button
                  onClick={fecharModalDeputado}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {transacoesDeputado.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Transações</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">
                      R$ {transacoesDeputado.reduce((acc, t) => acc + (t.valorLiquido || t.vlrLiquido || 0), 0).toLocaleString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded">
                    <div className="text-lg font-bold text-purple-600">
                      R$ {(() => {
                        if (transacoesDeputado.length === 0) return '0';
                        const valorTotal = transacoesDeputado.reduce((acc, t) => acc + (t.valorLiquido || t.vlrLiquido || 0), 0);
                        const mesesEstimados = 12;
                        const mediaMensal = valorTotal / mesesEstimados;
                        return mediaMensal.toLocaleString('pt-BR');
                      })()}
                    </div>
                    <div className="text-sm text-muted-foreground">Média Mensal por Deputado</div>
                  </div>
                </div>
                <button
                  onClick={fecharModalDeputado}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔧 Debug Info (Perfil Fornecedor Modular):</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Fornecedor:</strong> {fornecedorData?.nome || 'N/A'}
              </div>
              <div>
                <strong>CNPJ:</strong> {cnpj}
              </div>
              <div>
                <strong>Transações:</strong> {transacoesDetalhadas.length}
              </div>
              <div>
                <strong>Dados Históricos:</strong> {dadosHistoricos.length}
              </div>
              <div>
                <strong>Ano Selecionado:</strong> {anoSelecionado}
              </div>
              <div>
                <strong>Aba Ativa:</strong> {activeTab}
              </div>
              <div>
                <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
              </div>
              <div>
                <strong>Score:</strong> {(fornecedorData?.scoreSuspeicao || 0).toFixed(1)}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
