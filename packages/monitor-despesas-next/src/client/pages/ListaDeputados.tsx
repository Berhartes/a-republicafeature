import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Status, EmptyDataPlaceholder } from '@/components/Status'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Database, RefreshCw } from 'lucide-react'

import { useEtlDeputadosData } from '@/hooks/useEtlDeputadosData'
import { useListaDeputadosFilters } from '@/components/lista-deputados/hooks/useListaDeputadosFilters'

import { ListaDeputadosHeader } from '@/components/lista-deputados/components/ListaDeputadosHeader'
import { DeputadosFilters } from '@/components/lista-deputados/components/DeputadosFilters'

import { DeputadosGridPage } from '@/components/lista-deputados/pages/DeputadosGridPage'

interface ListaDeputadosProps {}

export function ListaDeputados({}: ListaDeputadosProps) {
  const navigate = useNavigate()

  const {
    deputados,
    loading,
    error,
    cacheStatus,
    carregarDeputados,
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

  const deputadosProcessados = deputados
  const isRefreshing = loading
  const hasOptimizedData = fonteAtual === 'etl'
  const optimizedDataInfo = hasOptimizedData ? {
    cacheInfo: { totalDeputados },
    source: 'Sistema ETL',
    dataAge: cacheStatus.dataAge
  } : null

  const maxValues = React.useMemo(() => {
    if (deputados.length === 0) return { maxGasto: 2000000, maxScore: 100 }

    const maxGasto = Math.max(...deputados.map(d => d.totalGastos))
    const maxScore = Math.max(...deputados.map(d => d.scoreSuspeicao))

    return { maxGasto, maxScore }
  }, [deputados])

  const refreshData = carregarDeputados
  const clearOptimizedData = limparCache

  const {
    showFilters,
    itemsPerPage,
    currentPage,
    totalPages,
    filters,
    deputadosPaginados,
    totalFiltrados,
    gastoTotalFiltrado,
    setShowFilters,
    toggleFilters,
    setItemsPerPage,
    goToPage,
    nextPage,
    prevPage,
    updateFilter,
    resetFilters,
    aplicarFiltroRapido,
    buscarDeputado,
    ordenarPor,
  } = useListaDeputadosFilters(deputadosProcessados, maxValues.maxGasto)

  const handleDeputadoClick = (deputado: any) => {
    console.log('🧭 [ListaDeputados] Navegando para perfil:', deputado.nomeEleitoral)
    navigate({
      to: `/gastos/perfil/${deputado.id || 'geral'}`
    })
  }

  const hasTriedInitialLoad = React.useRef(false)

  React.useEffect(() => {
    if (!loading && deputados.length === 0 && !error && !hasTriedInitialLoad.current) {
      console.log('🚨 [ListaDeputados] Forçando carregamento de dados...')
      hasTriedInitialLoad.current = true
      refreshData()
    }
  }, [loading, deputados.length, error, refreshData])

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
        <EmptyDataPlaceholder
          title="Carregando Deputados..."
          description="Iniciando carregamento de dados dos deputados. Aguarde um momento."
        />
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              console.log('🔄 Manual refresh triggered')
              refreshData()
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Indicador de Dados ETL */}
        {hasOptimizedData && optimizedDataInfo && (
          <Alert className="border-green-200 bg-green-50">
            <Database className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-green-800 font-medium">
                    🔗 Conectado ao Sistema ETL
                  </span>
                  <span className="text-green-600 text-sm">
                    • {optimizedDataInfo.cacheInfo.totalDeputados} deputados
                    • R$ {(totalGastos / 1000000).toFixed(1)}M total
                    • {optimizedDataInfo.dataAge}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={loading}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Atualizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearOptimizedData}
                  >
                    Limpar Cache
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Indicador quando não conectado ao ETL */}
        {!hasOptimizedData && !loading && (
          <Alert className="border-orange-200 bg-orange-50">
            <Database className="h-4 w-4 text-orange-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-orange-800 font-medium">
                    ⚠️ Sistema ETL desconectado
                  </span>
                  <span className="text-orange-600 text-sm">
                    {fonteAtual === 'localStorage' ? 'Usando dados locais' : 'Sem dados disponíveis'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshData}
                    disabled={loading}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Tentar Conectar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = '/gastos/processador-deputados'}
                  >
                    <Database className="w-3 h-3 mr-1" />
                    Processar Dados
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Header Principal */}
        <ListaDeputadosHeader
          totalDeputados={deputadosProcessados.length}
          totalFiltrados={totalFiltrados}
          gastoTotalFiltrado={gastoTotalFiltrado}
          loading={loading}
          isRefreshing={isRefreshing}
          isConnected={true} // TODO: get from context
          viewMode="grid"
          showFilters={showFilters}
          showStats={false}
          searchTerm={filters.searchTerm}
          sortBy={filters.sortBy}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          totalPages={totalPages}
          onViewModeChange={() => {}} // Não usado mais
          onToggleFilters={toggleFilters}
          onToggleStats={() => {}} // Não usado mais
          onSearchChange={buscarDeputado}
          onSortChange={ordenarPor}
          onItemsPerPageChange={setItemsPerPage}
          onRefresh={refreshData}
          onQuickFilter={aplicarFiltroRapido}
          onResetFilters={resetFilters}
        />

        {/* Filtros Avançados */}
        {showFilters && (
          <DeputadosFilters
            filters={filters}
            partidosDisponiveis={partidosDisponiveis}
            ufsDisponiveis={ufsDisponiveis}
            maxGasto={maxValues.maxGasto}
            maxScore={maxValues.maxScore}
            totalFiltrados={totalFiltrados}
            totalDeputados={deputadosProcessados.length}
            onUpdateFilter={updateFilter}
            onResetFilters={resetFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        {/* Conteúdo Principal - apenas Grid View */}
        <DeputadosGridPage
          deputadosPaginados={deputadosPaginados}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalFiltrados={totalFiltrados}
          loading={loading}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          onDeputadoClick={handleDeputadoClick}
        />

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔧 Debug Info (Lista Deputados):</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Total Deputados:</strong> {deputadosProcessados.length}
              </div>
              <div>
                <strong>Filtrados:</strong> {totalFiltrados}
              </div>
              <div>
                <strong>Página Atual:</strong> {currentPage}/{totalPages}
              </div>
              <div>
                <strong>View Mode:</strong> Grid (fixo)
              </div>
              <div>
                <strong>Filtros Ativos:</strong> {
                  Object.entries(filters).filter(([key, value]) => {
                    if (key === 'sortBy') return false
                    if (key === 'searchTerm') return value !== ''
                    if (key === 'partido' || key === 'uf') return value !== 'TODOS'
                    if (key === 'minGasto') return value > 0
                    if (key === 'maxGasto') return value < maxValues.maxGasto
                    if (key === 'minScore') return value > 0
                    if (key === 'maxScore') return value < maxValues.maxScore
                    return value !== null
                  }).length
                }
              </div>
              <div>
                <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
              </div>
              <div>
                <strong>Gasto Total Filtrado:</strong> R$ {(gastoTotalFiltrado / 1000000).toFixed(1)}M
              </div>
              <div>
                <strong>Partidos Disponíveis:</strong> {partidosDisponiveis.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}