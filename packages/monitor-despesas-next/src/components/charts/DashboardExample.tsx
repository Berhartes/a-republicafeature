import { useState } from 'react'
import {
  GastosPorDeputadoChart,
  GastosPorPartidoChart,
  GastosPorEstadoChart,
  ScoreSuspeicaoChart,
  EvolucaoGastosChart,
  AlertasPorTipoChart,
  TopFornecedoresChart
} from '@/components/charts'
import { useEventListener } from '@/lib/event-bus'
import type { DeputadoProcessado } from '@/components/lista-deputados/hooks/useListaDeputadosData'
import type { AlertaSuspeito, FornecedorSuspeito } from '@/types/gastos'

interface DashboardExampleProps {
  deputados: DeputadoProcessado[]
  alertas: AlertaSuspeito[]
  fornecedores: FornecedorSuspeito[]
  evolucaoData?: Array<{ periodo: string; valor: number; mes: number; ano: number }>
  isLoading?: boolean
}

export function DashboardExample({
  deputados,
  alertas,
  fornecedores,
  evolucaoData = [],
  isLoading = false
}: DashboardExampleProps) {
  const [selectedPartido, setSelectedPartido] = useState<string | null>(null)
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null)

  useEventListener('filter:applied', (event) => {
    console.log('Dashboard: Filter applied', event)
  })

  useEventListener('ui:notification', (event) => {
    console.log('Dashboard: Notification', event)
  })

  const filteredDeputados = deputados.filter(d => {
    if (selectedPartido && d.siglaPartido !== selectedPartido) return false
    if (selectedEstado && d.siglaUf !== selectedEstado) return false
    return true
  })

  const handlePartidoClick = (partido: string) => {
    setSelectedPartido(selectedPartido === partido ? null : partido)
  }

  const handleEstadoClick = (estado: string) => {
    setSelectedEstado(selectedEstado === estado ? null : estado)
  }

  const clearFilters = () => {
    setSelectedPartido(null)
    setSelectedEstado(null)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard de Transparência</h1>
        
        {(selectedPartido || selectedEstado) && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {selectedPartido && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                {selectedPartido}
                <button 
                  onClick={() => setSelectedPartido(null)}
                  className="hover:bg-primary/20 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            {selectedEstado && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/10 text-secondary rounded text-sm">
                {selectedEstado}
                <button 
                  onClick={() => setSelectedEstado(null)}
                  className="hover:bg-secondary/20 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            <button 
              onClick={clearFilters}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Limpar todos
            </button>
          </div>
        )}
      </div>

      {/* Row 1: Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GastosPorDeputadoChart
          deputados={filteredDeputados}
          limit={10}
          loading={isLoading}
          height={400}
        />
        
        <GastosPorPartidoChart
          deputados={filteredDeputados}
          loading={isLoading}
          height={400}
          onPartidoClick={handlePartidoClick}
        />
      </div>

      {/* Row 2: Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GastosPorEstadoChart
          deputados={filteredDeputados}
          loading={isLoading}
          height={400}
          onEstadoClick={handleEstadoClick}
        />
        
        <ScoreSuspeicaoChart
          deputados={filteredDeputados}
          limit={15}
          loading={isLoading}
          height={400}
        />
      </div>

      {/* Row 3: Temporal and analysis charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EvolucaoGastosChart
          data={evolucaoData}
          loading={isLoading}
          height={350}
          type="area"
        />
        
        <AlertasPorTipoChart
          alertas={alertas}
          loading={isLoading}
          height={350}
        />
      </div>

      {/* Row 4: Suppliers analysis */}
      <div className="grid grid-cols-1 gap-6">
        <TopFornecedoresChart
          fornecedores={fornecedores}
          limit={15}
          loading={isLoading}
          height={450}
        />
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {filteredDeputados.length.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Deputados</div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            R$ {(filteredDeputados.reduce((acc, d) => acc + d.totalGasto, 0) / 1000000).toFixed(1)}M
          </div>
          <div className="text-sm text-muted-foreground">Total de Gastos</div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-amber-600">
            {alertas.length.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Alertas</div>
        </div>
        
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {fornecedores.filter(f => f.indiceSuspeicao > 50).length.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Fornecedores Suspeitos</div>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-lg">Carregando dados...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}