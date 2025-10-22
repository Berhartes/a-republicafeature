import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Status, EmptyDataPlaceholder } from '@/components/Status'
import { User, BarChart3, TrendingUp, Shield, FileText, Network } from 'lucide-react'

import { usePerfilDeputadoData } from '@/components/perfil-deputado/hooks/usePerfilDeputadoData'
import { usePerfilDeputadoFilters } from '@/components/perfil-deputado/hooks/usePerfilDeputadoFilters'

import { PerfilDeputadoHeader } from '@/components/perfil-deputado/components/PerfilDeputadoHeader'

import { PerfilDeputadoOverviewPage } from '@/components/perfil-deputado/pages/PerfilDeputadoOverviewPage'

import { PremiacoesDeputado } from '@/components/premiacoes/PremiacoesDeputado'
import { NetworkGraph } from '@/components/NetworkGraph'

interface PerfilDeputadoModularV2Props {}

export function PerfilDeputadoModularV2({}: PerfilDeputadoModularV2Props) {
  const {
    deputadoId,
    deputadoData,
    despesasDetalhadas,
    alertasConformidade,
    perfilComportamental,
    redesPoliticas,
    loadingDespesas,
    loadingRelacoes,
    globalLoading,
    globalError,
    deputadoDetalhes,
    isConnected,
    anosDisponiveis,
    mesesDisponiveis,
    carregarDespesasDetalhadas,
    carregarRedesPoliticas,
    refetchGlobal,
    getDeputadoCoroas,
    getDeputadoTrofeus,
    getDeputadoMedalhas
  } = usePerfilDeputadoData()

  const {
    activeTab,
    anoSelecionado,
    mesSelecionado,
    periodDescription,
    setActiveTab,
    setAnoSelecionado,
    setMesSelecionado
  } = usePerfilDeputadoFilters(anosDisponiveis)

  useEffect(() => {
    if (deputadoId && deputadoId !== 'geral') {
      carregarDespesasDetalhadas(anoSelecionado, mesSelecionado === 'todos' ? undefined : mesSelecionado)
    }
  }, [anoSelecionado, mesSelecionado, deputadoId, carregarDespesasDetalhadas])

  if (globalError) {
    return (
      <div className="container mx-auto py-6">
        <Status error={globalError} onRetry={refetchGlobal} />
      </div>
    )
  }

  if (!globalLoading && !deputadoData && deputadoId !== 'geral') {
    return (
      <div className="container mx-auto py-6">
        <EmptyDataPlaceholder />
      </div>
    )
  }

  if (deputadoId === 'geral' || !deputadoId) {
    return (
      <div className="container mx-auto py-6 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Deputado não especificado
        </h3>
        <p className="text-muted-foreground">
          Selecione um deputado específico para visualizar o perfil.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <PerfilDeputadoHeader
        deputadoData={deputadoData}
        anoSelecionado={anoSelecionado}
        mesSelecionado={mesSelecionado}
        anosDisponiveis={anosDisponiveis}
        mesesDisponiveis={mesesDisponiveis}
        periodDescription={periodDescription}
        loading={globalLoading || loadingDespesas}
        isConnected={isConnected}
        onAnoChange={setAnoSelecionado}
        onMesChange={setMesSelecionado}
        getDeputadoCoroas={getDeputadoCoroas}
        getDeputadoTrofeus={getDeputadoTrofeus}
        getDeputadoMedalhas={getDeputadoMedalhas}
      />
      
      <Status loading={globalLoading} error={globalError} onRetry={refetchGlobal} />

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="visao-geral" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Despesas ({despesasDetalhadas.length})
          </TabsTrigger>
          <TabsTrigger value="premiacoes" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Premiações
          </TabsTrigger>
          <TabsTrigger value="conformidade" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Conformidade ({alertasConformidade.length})
          </TabsTrigger>
          <TabsTrigger value="relacoes" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Relações
          </TabsTrigger>
          <TabsTrigger value="documentos" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="visao-geral">
          <PerfilDeputadoOverviewPage
            deputadoData={deputadoData}
            despesasDetalhadas={despesasDetalhadas}
            perfilComportamental={perfilComportamental}
            loading={globalLoading || loadingDespesas}
            periodDescription={periodDescription}
            getDeputadoCoroas={getDeputadoCoroas}
            getDeputadoTrofeus={getDeputadoTrofeus}
            getDeputadoMedalhas={getDeputadoMedalhas}
          />
        </TabsContent>

        {/* Aba: Despesas (placeholder - pode ser modularizada no futuro) */}
        <TabsContent value="despesas">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Análise de Despesas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {despesasDetalhadas.length}
                </div>
                <div className="text-sm text-blue-500">Total de Transações</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  R$ {despesasDetalhadas.reduce((sum, d) => sum + (d.valorDocumento || 0), 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-green-500">Valor Total</div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">
                  R$ {despesasDetalhadas.length > 0 ? (despesasDetalhadas.reduce((sum, d) => sum + (d.valorDocumento || 0), 0) / despesasDetalhadas.length).toFixed(2) : '0'}
                </div>
                <div className="text-sm text-purple-500">Média por Transação</div>
              </div>
            </div>
            <p className="text-muted-foreground text-center py-8">
              📊 Análise detalhada de despesas será implementada aqui
            </p>
          </div>
        </TabsContent>

        {/* Aba: Premiações */}
        <TabsContent value="premiacoes">
          {deputadoData && (
            <PremiacoesDeputado
              deputadoId={String(deputadoData.id || deputadoData.deputadoId || deputadoId)}
              deputadoNome={deputadoData.nomeEleitoral || deputadoData.nomeCivil || deputadoDetalhes?.nomeEleitoral || 'Deputado'}
            />
          )}
        </TabsContent>

        {/* Aba: Conformidade (placeholder) */}
        <TabsContent value="conformidade">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Análise de Conformidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {alertasConformidade.length}
                </div>
                <div className="text-sm text-red-500">Alertas Ativos</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.max(0, 100 - alertasConformidade.length * 10)}%
                </div>
                <div className="text-sm text-green-500">Score de Conformidade</div>
              </div>
            </div>
            <p className="text-muted-foreground text-center py-8">
              🛡️ Análise detalhada de conformidade será implementada aqui
            </p>
          </div>
        </TabsContent>

        {/* Aba: Relações */}
        <TabsContent value="relacoes">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rede de Relações</h2>
            {redesPoliticas && redesPoliticas.nodes && redesPoliticas.nodes.length > 0 ? (
              <NetworkGraph 
                nodes={redesPoliticas.nodes}
                edges={redesPoliticas.edges}
              />
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🕸️</div>
                <p className="text-muted-foreground">
                  {loadingRelacoes ? 'Carregando rede de relações...' : 'Nenhuma relação mapeada'}
                </p>
                {!loadingRelacoes && (
                  <button 
                    onClick={carregarRedesPoliticas}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Carregar Relações
                  </button>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Aba: Documentos (placeholder) */}
        <TabsContent value="documentos">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Documentos e Comprovantes</h2>
            <p className="text-muted-foreground text-center py-8">
              📄 Sistema de documentos será implementado aqui
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info (Perfil Deputado Modular V2):</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Deputado ID:</strong> {deputadoId}
            </div>
            <div>
              <strong>Nome:</strong> {deputadoData?.nomeEleitoral || 'N/A'}
            </div>
            <div>
              <strong>Aba Ativa:</strong> {activeTab}
            </div>
            <div>
              <strong>Período:</strong> {periodDescription}
            </div>
            <div>
              <strong>Despesas:</strong> {despesasDetalhadas.length}
            </div>
            <div>
              <strong>Alertas:</strong> {alertasConformidade.length}
            </div>
            <div>
              <strong>Loading:</strong> {globalLoading ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Connected:</strong> {isConnected ? 'Sim' : 'Não'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
