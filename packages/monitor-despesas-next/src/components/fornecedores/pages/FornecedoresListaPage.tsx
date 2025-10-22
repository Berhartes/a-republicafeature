import { FornecedoresFilters } from '../components/FornecedoresFilters.js'
import { FornecedoresGrid } from '../components/FornecedoresGrid.js'
import type { FornecedorStats } from '@/services/fornecedores-service'
import type { FornecedoresFilters as FiltersType } from '../hooks/useFornecedoresData.js'

interface FornecedoresListaPageProps {
  fornecedores: FornecedorStats[]
  filters: FiltersType
  updateFilter: (key: keyof FiltersType, value: any) => void
  ordenacao: string
  setOrdenacao: (ordenacao: string) => void
  categoriasDisponiveis: string[]
  loading: boolean
  carregandoMais: boolean
  temMaisItens: boolean
  onCarregarMais: () => void
  onAplicarFiltroRapido: (tipo: string) => void
  onResetarFiltros: () => void
  opcoesOrdenacao: Array<{ valor: string, nome: string }>
  opcoesScore: Array<{ valor: string, nome: string }>
  opcoesValor: Array<{ valor: string, nome: string }>
  opcoesTransacoes: Array<{ valor: string, nome: string }>
  opcoesDeputados: Array<{ valor: string, nome: string }>
}

export function FornecedoresListaPage({
  fornecedores,
  filters,
  updateFilter,
  ordenacao,
  setOrdenacao,
  categoriasDisponiveis,
  loading,
  carregandoMais,
  temMaisItens,
  onCarregarMais,
  onAplicarFiltroRapido,
  onResetarFiltros,
  opcoesOrdenacao,
  opcoesScore,
  opcoesValor,
  opcoesTransacoes,
  opcoesDeputados
}: FornecedoresListaPageProps) {
  
  const handleAplicarFiltroRapido = (tipo: string) => {
    const configuracoes = {
      'suspeitos': () => {
        updateFilter('filtroScore', 'alto')
        setOrdenacao('score-desc')
      },
      'alto-valor': () => {
        updateFilter('filtroValor', 'acima500k')
        setOrdenacao('valor-desc')
      },
      'muitas-transacoes': () => {
        updateFilter('filtroTransacoes', 'muitas')
        setOrdenacao('transacoes-desc')
      },
      'poucos-deputados': () => {
        updateFilter('filtroDeputados', 'poucos')
        setOrdenacao('score-desc')
      }
    }

    const configuracao = configuracoes[tipo as keyof typeof configuracoes]
    if (configuracao) {
      configuracao()
    }
    
    onAplicarFiltroRapido(tipo)
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <FornecedoresFilters
        filters={filters}
        updateFilter={updateFilter}
        ordenacao={ordenacao}
        setOrdenacao={setOrdenacao}
        categoriasDisponiveis={categoriasDisponiveis}
        opcoesOrdenacao={opcoesOrdenacao}
        opcoesScore={opcoesScore}
        opcoesValor={opcoesValor}
        opcoesTransacoes={opcoesTransacoes}
        opcoesDeputados={opcoesDeputados}
        onAplicarFiltroRapido={handleAplicarFiltroRapido}
        onResetarFiltros={onResetarFiltros}
      />

      {/* Grid de Fornecedores */}
      <FornecedoresGrid
        fornecedores={fornecedores}
        loading={loading}
        carregandoMais={carregandoMais}
        temMaisItens={temMaisItens}
        onCarregarMais={onCarregarMais}
      />
    </div>
  )
}