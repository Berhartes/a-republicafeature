import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingAnimation } from '@/components/Loading'
import { TooltipProvider } from '@/components/ui/tooltip'

import { useDeputadoData } from '@/components/deputado/hooks/useDeputadoData'
import { useDeputadoFilters } from '@/components/deputado/hooks/useDeputadoFilters'

import { DeputadoHeader } from '@/components/deputado/components/DeputadoHeader'
import { DeputadoStatsCards } from '@/components/deputado/components/DeputadoStatsCards'

import { DeputadoVisaoGeralPage } from '@/components/deputado/pages/DeputadoVisaoGeralPage'
import { DeputadoTransacoesPage } from '@/components/deputado/pages/DeputadoTransacoesPage'
import { DeputadoFornecedoresPage } from '@/components/deputado/pages/DeputadoFornecedoresPage'
import { DeputadoEvolucaoPage } from '@/components/deputado/pages/DeputadoEvolucaoPage'

import { DeputadoDataProcessing } from '@/components/deputado/utils/deputadoDataProcessing'

interface PerfilDeputadoModularProps {}

export function PerfilDeputadoModular({}: PerfilDeputadoModularProps) {
  const {
    deputadoId,
    deputadoData,
    despesasDetalhadas,
    loadingDeputado,
    loadingDespesas,
    error,
    anoSelecionado,
    mesSelecionado,
    anosDisponiveis,
    mesesDisponiveis,
    atualizarAno,
    atualizarMes,
    alertasConformidade,
    perfilComportamental,
    getDeputadoCoroas,
    getDeputadoTrofeus,
    getDeputadoMedalhas
  } = useDeputadoData()

  const {
    activeTab,
    navegarParaAba,
    abas,
    categoriaEvolucao,
    setCategoriaEvolucao,
    filtroFornecedorCategoria,
    setFiltroFornecedorCategoria,
    categoriaTransacaoSelecionada,
    setCategoriaTransacaoSelecionada,
    loadingComparativo,
    loadingRelacoes
  } = useDeputadoFilters()

  const isLoading = loadingDeputado || loadingDespesas

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading || !deputadoData) {
    return (
      <div className="container mx-auto py-6">
        <LoadingAnimation mode="animated" message="Carregando perfil do deputado..." />
      </div>
    )
  }

  const exportarPerfil = () => {
    const estatisticas = DeputadoDataProcessing.calcularEstatisticasGerais(despesasDetalhadas)
    DeputadoDataProcessing.exportarPerfilCompleto(deputadoData, despesasDetalhadas, estatisticas)
  }

  const compartilharPerfil = () => {
    if (navigator.share) {
      navigator.share({
        title: `Perfil de ${deputadoData.nomeEleitoral}`,
        text: `Veja o perfil de gastos do deputado ${deputadoData.nomeEleitoral} (${deputadoData.siglaPartido} - ${deputadoData.siglaUf})`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header do Deputado */}
        <DeputadoHeader
          deputadoId={deputadoId}
          deputadoData={deputadoData}
          perfilComportamental={perfilComportamental}
          getDeputadoCoroas={getDeputadoCoroas}
          getDeputadoTrofeus={getDeputadoTrofeus}
          getDeputadoMedalhas={getDeputadoMedalhas}
          onExportarPerfil={exportarPerfil}
          onCompartilhar={compartilharPerfil}
        />

        {/* Controles de Filtros Temporais */}
        <DeputadoStatsCards
          anoSelecionado={anoSelecionado}
          mesSelecionado={mesSelecionado}
          anosDisponiveis={anosDisponiveis}
          mesesDisponiveis={mesesDisponiveis}
          atualizarAno={atualizarAno}
          atualizarMes={atualizarMes}
          loading={loadingDespesas}
        />

        {/* Abas Principais */}
        <Tabs value={activeTab} onValueChange={navegarParaAba}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {abas.map(aba => (
              <TabsTrigger key={aba.id} value={aba.id} className="text-xs">
                <span className="hidden sm:inline mr-1">{aba.icone}</span>
                {aba.nomeEleitoral}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="visao-geral">
            <DeputadoVisaoGeralPage
              despesasDetalhadas={despesasDetalhadas}
              alertasConformidade={alertasConformidade}
              anoSelecionado={anoSelecionado}
              mesSelecionado={mesSelecionado}
            />
          </TabsContent>

          {/* Aba: Transações */}
          <TabsContent value="transacoes">
            <DeputadoTransacoesPage
              despesasDetalhadas={despesasDetalhadas}
              categoriaTransacaoSelecionada={categoriaTransacaoSelecionada}
              setCategoriaTransacaoSelecionada={setCategoriaTransacaoSelecionada}
              anoSelecionado={anoSelecionado}
              mesSelecionado={mesSelecionado}
            />
          </TabsContent>

          {/* Aba: Fornecedores */}
          <TabsContent value="fornecedores">
            <DeputadoFornecedoresPage
              despesasDetalhadas={despesasDetalhadas}
              filtroFornecedorCategoria={filtroFornecedorCategoria}
              setFiltroFornecedorCategoria={setFiltroFornecedorCategoria}
              anoSelecionado={anoSelecionado}
              mesSelecionado={mesSelecionado}
            />
          </TabsContent>

          {/* Aba: Evolução */}
          <TabsContent value="evolucao">
            <DeputadoEvolucaoPage
              deputadoData={deputadoData}
              despesasDetalhadas={despesasDetalhadas}
              categoriaEvolucao={categoriaEvolucao}
              setCategoriaEvolucao={setCategoriaEvolucao}
              anoSelecionado={anoSelecionado}
            />
          </TabsContent>

          {/* Aba: Comparativo */}
          <TabsContent value="comparativo">
            <div className="text-center py-8 text-muted-foreground">
              {loadingComparativo ? (
                <div>
                  <div className="inline-block w-6 h-6 border-2 border-current border-r-transparent rounded-full animate-spin mb-2" />
                  <p>Carregando dados comparativos...</p>
                </div>
              ) : (
                <div>
                  <p>⚖️ Página de Comparativo será implementada em breve</p>
                  <p className="text-sm mt-2">
                    Aqui você verá comparações com outros deputados do mesmo partido/UF
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba: Relacionamentos */}
          <TabsContent value="relacoes">
            <div className="text-center py-8 text-muted-foreground">
              {loadingRelacoes ? (
                <div>
                  <div className="inline-block w-6 h-6 border-2 border-current border-r-transparent rounded-full animate-spin mb-2" />
                  <p>Carregando rede de relacionamentos...</p>
                </div>
              ) : (
                <div>
                  <p>🌐 Página de Relacionamentos será implementada em breve</p>
                  <p className="text-sm mt-2">
                    Aqui você verá a rede de relacionamentos políticos e comerciais
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba: Premiações */}
          <TabsContent value="premiacoes">
            <div className="text-center py-8 text-muted-foreground">
              <p>🏆 Página de Premiações será implementada em breve</p>
              <p className="text-sm mt-2">
                Aqui você verá o histórico completo de troféus, medalhas e coroas
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔧 Debug Info:</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Deputado:</strong> {deputadoData.nomeEleitoral} ({deputadoData.siglaPartido} - {deputadoData.siglaUf})
              </div>
              <div>
                <strong>Transações:</strong> {despesasDetalhadas.length}
              </div>
              <div>
                <strong>Período:</strong> {mesSelecionado === 'todos' ? 'Ano' : 'Mês'} {mesSelecionado !== 'todos' ? mesSelecionado + '/' : ''}{anoSelecionado}
              </div>
              <div>
                <strong>Aba Ativa:</strong> {activeTab}
              </div>
              <div>
                <strong>Alertas:</strong> {alertasConformidade.length}
              </div>
              <div>
                <strong>Perfil Comportamental:</strong> {perfilComportamental?.classificacaoRisco || 'N/A'}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
