import { Filter, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface FornecedorFiltersProps {
  busca: string
  setBusca: (value: string) => void
  filtroScore: string
  setFiltroScore: (value: string) => void
  filtroValor: string
  setFiltroValor: (value: string) => void
  filtroDeputados: string
  setFiltroDeputados: (value: string) => void
  filtroCategoria: string
  setFiltroCategoria: (value: string) => void
  apenasComAlertas: boolean
  setApenasComAlertas: (value: boolean) => void
  onLimparFiltros: () => void
  fornecedoresFiltrados: any[]
  totalFornecedores: number
}

export function FornecedorFilters({
  busca,
  setBusca,
  filtroScore,
  setFiltroScore,
  filtroValor,
  setFiltroValor,
  filtroDeputados,
  setFiltroDeputados,
  filtroCategoria,
  apenasComAlertas,
  setApenasComAlertas,
  onLimparFiltros,
  fornecedoresFiltrados,
  totalFornecedores
}: FornecedorFiltersProps) {
  const temFiltroAtivo = busca || filtroScore !== 'todos' || filtroValor !== 'todos' || 
                        filtroDeputados !== 'todos' || filtroCategoria !== 'todas' || apenasComAlertas

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filtros</h3>
          {temFiltroAtivo && (
            <Badge variant="secondary">
              {fornecedoresFiltrados.length} de {totalFornecedores}
            </Badge>
          )}
        </div>
        {temFiltroAtivo && (
          <Button variant="outline" size="sm" onClick={onLimparFiltros}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Buscar Fornecedor</label>
          <Input
            placeholder="Nome ou CNPJ..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Score de Suspeição</label>
          <Select value={filtroScore} onValueChange={setFiltroScore}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="alto">Alto (7-10)</SelectItem>
              <SelectItem value="medio">Médio (4-6)</SelectItem>
              <SelectItem value="baixo">Baixo (0-3)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Valor Transacionado</label>
          <Select value={filtroValor} onValueChange={setFiltroValor}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="muito-alto">Muito Alto (&gt;1M)</SelectItem>
              <SelectItem value="alto">Alto (500K-1M)</SelectItem>
              <SelectItem value="medio">Médio (100K-500K)</SelectItem>
              <SelectItem value="baixo">Baixo (&lt;100K)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Deputados Atendidos</label>
          <Select value={filtroDeputados} onValueChange={setFiltroDeputados}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="muitos">Muitos (&gt;20)</SelectItem>
              <SelectItem value="varios">Vários (10-20)</SelectItem>
              <SelectItem value="poucos">Poucos (5-10)</SelectItem>
              <SelectItem value="exclusivo">Exclusivo (1-4)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="apenasComAlertas"
          checked={apenasComAlertas}
          onChange={(e) => setApenasComAlertas(e.target.checked)}
          className="rounded"
        />
        <label htmlFor="apenasComAlertas" className="text-sm font-medium">
          Apenas fornecedores com alertas
        </label>
      </div>
    </div>
  )
}