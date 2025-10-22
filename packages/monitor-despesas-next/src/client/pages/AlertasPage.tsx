import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNavigate } from '@tanstack/react-router'
import { Status, EmptyDataPlaceholder } from '@/components/Status'
import { BarChart3, AlertTriangle, Shield } from 'lucide-react'

import { useAlertasData } from '@/components/alertas-page/hooks/useAlertasData'
import { useAlertasFilters } from '@/components/alertas-page/hooks/useAlertasFilters'

import { AlertasHeader } from '@/components/alertas-page/components/AlertasHeader'
import { AlertasFilters } from '@/components/alertas-page/components/AlertasFilters'

import { AlertasDashboardPage } from '@/components/alertas-page/pages/AlertasDashboardPage'
import { AlertasListPage } from '@/components/alertas-page/pages/AlertasListPage'
import { AlertasAnalysisPage } from '@/components/alertas-page/pages/AlertasAnalysisPage'

interface AlertasPageProps {
  onViewProfile?: (deputadoId: string) => void
}

export function AlertasPage({ onViewProfile }: AlertasPageProps) {
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)

  const {
    alertas,
    loading,
    error,
    isConnected,
    metricas,
    refetch,
    exportarAlertas,
    getTipoLabel
  } = useAlertasData()

  const {
    filtroTipo,
    filtroGravidade,
    buscaTexto,
    abaSelecionada,
    alertasFiltrados,
    tiposDisponiveis,
    gravidadesDisponiveis,
    filtrosStats,
    setFiltroTipo,
    setFiltroGravidade,
    setBuscaTexto,
    setAbaSelecionada,
    resetFilters
  } = useAlertasFilters(alertas, getTipoLabel)

  const handleViewProfile = (deputadoId: string) => {
    console.log('🧭 [AlertasPageModular] Navegando para perfil:', deputadoId)
    if (onViewProfile) {
      onViewProfile(deputadoId)
    } else {
      navigate({
        to: `/gastos/perfil/${deputadoId || 'geral'}`
      })
    }
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Status />
      </div>
    )
  }

  if (!loading && alertas.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <EmptyDataPlaceholder />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Principal */}
      <AlertasHeader
        totalAlertas={alertasFiltrados.length}
        deputadosUnicos={metricas.deputadosUnicos}
        valorTotal={metricas.valorTotal}
        loading={loading}
        isConnected={isConnected}
        onRefresh={refetch}
        onExport={exportarAlertas}
      />
      
      <Status loading={loading} error={error} onRetry={refetch} />

      {/* Filtros Avançados (Colapsível) */}
      {showFilters && (
        <AlertasFilters
          filtroTipo={filtroTipo}
          filtroGravidade={filtroGravidade}
          buscaTexto={buscaTexto}
          tiposDisponiveis={tiposDisponiveis}
          gravidadesDisponiveis={gravidadesDisponiveis}
          totalOriginal={filtrosStats.totalOriginal}
          totalFiltrado={filtrosStats.totalFiltrado}
          onTipoChange={setFiltroTipo}
          onGravidadeChange={setFiltroGravidade}
          onBuscaChange={setBuscaTexto}
          onResetFilters={resetFilters}
        />
      )}

      {/* Tabs Principal */}
      <Tabs value={abaSelecionada} onValueChange={setAbaSelecionada} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="alertas" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Alertas ({alertasFiltrados.length})
          </TabsTrigger>
          <TabsTrigger value="combustivel" className="flex items-center gap-2">
            <span className="text-sm">⛽</span>
            Combustível ({metricas.combustivel.total})
          </TabsTrigger>
          <TabsTrigger value="analise" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Análise
          </TabsTrigger>
        </TabsList>

        {/* Aba: Dashboard */}
        <TabsContent value="dashboard">
          <AlertasDashboardPage
            metricas={metricas}
            loading={loading}
          />
        </TabsContent>

        {/* Aba: Lista de Alertas */}
        <TabsContent value="alertas">
          <div className="space-y-4">
            {/* Botão para mostrar/ocultar filtros */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Lista de Alertas</h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'} ({filtrosStats.totalFiltrado}/{filtrosStats.totalOriginal})
              </button>
            </div>
            
            <AlertasListPage
              alertasFiltrados={alertasFiltrados}
              loading={loading}
              onViewProfile={handleViewProfile}
            />
          </div>
        </TabsContent>

        {/* Aba: Combustível (reutiliza Lista com filtro específico) */}
        <TabsContent value="combustivel">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-lg">⛽</span>
              Alertas de Combustível
            </h2>
            
            <AlertasListPage
              alertasFiltrados={alertasFiltrados.filter(a => {
                const descricaoLower = (a.descricao || '').toLowerCase()
                const fornecedorLower = (a.detalhes?.fornecedor || '').toLowerCase()
                
                return a.tipo === 'SUPERFATURAMENTO' && (
                  descricaoLower.includes('combustível') || 
                  descricaoLower.includes('combustivel') ||
                  descricaoLower.includes('abastecimento') ||
                  descricaoLower.includes('lubrificante') ||
                  descricaoLower.includes('gasolina') ||
                  descricaoLower.includes('diesel') ||
                  descricaoLower.includes('etanol') ||
                  fornecedorLower.includes('posto') ||
                  fornecedorLower.includes('shell') ||
                  fornecedorLower.includes('petrobras') ||
                  fornecedorLower.includes('ipiranga') ||
                  fornecedorLower.includes('br distribuidora') ||
                  fornecedorLower.includes('ale combustíveis') ||
                  fornecedorLower.includes('combustível') ||
                  fornecedorLower.includes('combustivel')
                )
              })}
              loading={loading}
              onViewProfile={handleViewProfile}
            />
          </div>
        </TabsContent>

        {/* Aba: Análise */}
        <TabsContent value="analise">
          <AlertasAnalysisPage
            metricas={metricas}
            alertasFiltrados={alertasFiltrados}
            loading={loading}
            onViewProfile={handleViewProfile}
            dadosCombustivel={null}
            loadingCombustivel={false}
            onCarregarDadosCombustivel={() => {}}
          />
        </TabsContent>
      </Tabs>

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info (Alertas Page Modular):</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Total Alertas:</strong> {alertas.length}
            </div>
            <div>
              <strong>Filtrados:</strong> {alertasFiltrados.length}
            </div>
            <div>
              <strong>Aba Atual:</strong> {abaSelecionada}
            </div>
            <div>
              <strong>Filtros Ativos:</strong> {
                [filtroTipo !== 'TODOS', filtroGravidade !== 'TODOS', buscaTexto.trim() !== ''].filter(Boolean).length
              }
            </div>
            <div>
              <strong>Deputados Únicos:</strong> {metricas.deputadosUnicos}
            </div>
            <div>
              <strong>Loading:</strong> {loading ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Valor Total:</strong> R$ {(metricas.valorTotal / 1000000).toFixed(1)}M
            </div>
            <div>
              <strong>Combustível:</strong> {metricas.combustivel.total} alertas
            </div>
          </div>
        </div>
      )}
    </div>
  )
}