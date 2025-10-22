import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingAnimation } from '@/components/Loading'
import { TooltipProvider } from '@/components/ui/tooltip'

import { useFornecedoresData } from '@/components/fornecedores/hooks/useFornecedoresData'
import { useFornecedoresFilters } from '@/components/fornecedores/hooks/useFornecedoresFilters'

import { FornecedoresHeader } from '@/components/fornecedores/components/FornecedoresHeader'

import { FornecedoresListaPage } from '@/components/fornecedores/pages/FornecedoresListaPage'
import { FornecedoresEstatisticasPage } from '@/components/fornecedores/pages/FornecedoresEstatisticasPage'
import { FornecedoresExportPage } from '@/components/fornecedores/pages/FornecedoresExportPage'


interface FornecedoresPageModularProps {}

export function FornecedoresPageModular({}: FornecedoresPageModularProps) {
  const {
    fornecedores,
    fornecedoresFiltrados,
    fornecedoresOrdenados,
    categoriasDisponiveis,
    estatisticasGerais,
    loading,
    mostrarTodos,
    carregandoMais,
    temMaisItens,
    paginaAtual,
    ordenacao,
    filters,
    isConnected,
    error,
    carregarFornecedores,
    carregarMaisFornecedores,
    updateFilter,
    resetarFiltros,
    setOrdenacao,
    setMostrarTodos,
    refetch
  } = useFornecedoresData()

  const {
    activeTab,
    navegarParaAba,
    abas,
    opcoesOrdenacao,
    opcoesScore,
    opcoesValor,
    opcoesTransacoes,
    opcoesDeputados,
    aplicarFiltroRapido,
    limparFiltrosVisuais
  } = useFornecedoresFilters()

  const handleRefresh = async () => {
    await carregarFornecedores(!mostrarTodos)
    refetch?.()
  }

  const handleExport = () => {
    const dadosExport = JSON.stringify({
      metadata: {
        dataExport: new Date().toISOString(),
        totalRegistros: fornecedoresOrdenados.length
      },
      dados: fornecedoresOrdenados
    }, null, 2)

    const blob = new Blob([dadosExport], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fornecedores-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleToggleMostrarTodos = () => {
    setMostrarTodos(!mostrarTodos)
    carregarFornecedores(mostrarTodos) // Inverso porque vai mudar
  }

  const handleLimparFiltros = () => {
    resetarFiltros()
    limparFiltrosVisuais()
  }

  const handleAplicarFiltroRapido = (tipo: 'suspeitos' | 'alto-valor' | 'muitas-transacoes' | 'poucos-deputados') => {
    const resultado = aplicarFiltroRapido(tipo)
    if (resultado.configuracao) {
      Object.entries(resultado.configuracao).forEach(([key, value]) => {
        if (key === 'ordenacao') {
          setOrdenacao(value as string)
        } else {
          updateFilter(key as any, value)
        }
      })
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (loading && fornecedores.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <LoadingAnimation mode="animated" message="Carregando fornecedores..." />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Debug Info (desenvolvimento) */}
        {/* FIXME: CacheDebugInfo não existe */}
        {/* process.env.NODE_ENV === "development" && <CacheDebugInfo /> */}

        {/* Header Principal */}
        <FornecedoresHeader
          estatisticasGerais={estatisticasGerais}
          loading={loading}
          mostrarTodos={mostrarTodos}
          isConnected={isConnected}
          totalFornecedores={fornecedoresOrdenados.length}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onToggleMostrarTodos={handleToggleMostrarTodos}
          onLimparFiltros={handleLimparFiltros}
        />

        {/* Abas Principais */}
        <Tabs value={activeTab} onValueChange={navegarParaAba}>
          <TabsList className="grid w-full grid-cols-3">
            {abas.map(aba => (
              <TabsTrigger key={aba.id} value={aba.id} className="text-xs">
                <span className="hidden sm:inline mr-1">{aba.icone}</span>
                {aba.nomeEleitoral}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Aba: Lista */}
          <TabsContent value="lista">
            <FornecedoresListaPage
              fornecedores={fornecedoresOrdenados}
              filters={filters}
              updateFilter={updateFilter}
              ordenacao={ordenacao}
              setOrdenacao={setOrdenacao}
              categoriasDisponiveis={categoriasDisponiveis}
              loading={loading}
              carregandoMais={carregandoMais}
              temMaisItens={temMaisItens}
              onCarregarMais={carregarMaisFornecedores}
              onAplicarFiltroRapido={handleAplicarFiltroRapido}
              onResetarFiltros={handleLimparFiltros}
              opcoesOrdenacao={opcoesOrdenacao}
              opcoesScore={opcoesScore}
              opcoesValor={opcoesValor}
              opcoesTransacoes={opcoesTransacoes}
              opcoesDeputados={opcoesDeputados}
            />
          </TabsContent>

          {/* Aba: Estatísticas */}
          <TabsContent value="estatisticas">
            <FornecedoresEstatisticasPage
              fornecedores={fornecedoresOrdenados}
              estatisticasGerais={estatisticasGerais}
            />
          </TabsContent>

          {/* Aba: Export */}
          <TabsContent value="export">
            <FornecedoresExportPage
              fornecedores={fornecedoresOrdenados}
              loading={loading}
            />
          </TabsContent>
        </Tabs>

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔧 Debug Info (Fornecedores Modular):</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Fornecedores Carregados:</strong> {fornecedores.length}
              </div>
              <div>
                <strong>Fornecedores Filtrados:</strong> {fornecedoresFiltrados.length}
              </div>
              <div>
                <strong>Fornecedores Ordenados:</strong> {fornecedoresOrdenados.length}
              </div>
              <div>
                <strong>Modo Exibição:</strong> {mostrarTodos ? 'Todos' : 'Apenas Suspeitos'}
              </div>
              <div>
                <strong>Ordenação:</strong> {ordenacao}
              </div>
              <div>
                <strong>Aba Ativa:</strong> {activeTab}
              </div>
              <div>
                <strong>Categorias Disponíveis:</strong> {categoriasDisponiveis.length}
              </div>
              <div>
                <strong>Status Conexão:</strong> {isConnected ? 'Online' : 'Offline'}
              </div>
              <div>
                <strong>Tem Mais Itens:</strong> {temMaisItens ? 'Sim' : 'Não'}
              </div>
              <div>
                <strong>Página Atual:</strong> {paginaAtual}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}