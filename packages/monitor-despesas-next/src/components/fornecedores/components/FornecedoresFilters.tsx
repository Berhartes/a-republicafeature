import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Filter, Search, Zap, Shield, AlertOctagon, TrendingUp } from 'lucide-react'
import type { FornecedoresFilters } from '../hooks/useFornecedoresData.js'

interface FornecedoresFiltersProps {
  filters: FornecedoresFilters
  updateFilter: (key: keyof FornecedoresFilters, value: any) => void
  ordenacao: string
  setOrdenacao: (ordenacao: string) => void
  categoriasDisponiveis: string[]
  opcoesOrdenacao: Array<{ valor: string, nome: string }>
  opcoesScore: Array<{ valor: string, nome: string }>
  opcoesValor: Array<{ valor: string, nome: string }>
  opcoesTransacoes: Array<{ valor: string, nome: string }>
  opcoesDeputados: Array<{ valor: string, nome: string }>
  onAplicarFiltroRapido: (tipo: string) => void
  onResetarFiltros: () => void
}

export function FornecedoresFilters({
  filters,
  updateFilter,
  ordenacao,
  setOrdenacao,
  categoriasDisponiveis,
  opcoesOrdenacao,
  opcoesScore,
  opcoesValor,
  opcoesTransacoes,
  opcoesDeputados,
  onAplicarFiltroRapido,
  onResetarFiltros
}: FornecedoresFiltersProps) {
  const filtrosAtivos = Object.entries(filters).filter(([key, value]) => {
    if (key === 'busca') return value.trim() !== ''
    if (key === 'apenasComAlertas') return value === true
    return value !== 'todos' && value !== 'todas' && value !== ''
  }).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avançados
          {filtrosAtivos > 0 && (
            <Badge variant="secondary">{filtrosAtivos} ativo(s)</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure os filtros para refinar a análise dos fornecedores
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros Rápidos */}
        <div>
          <label className="text-sm font-medium mb-2 block">Filtros Rápidos:</label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAplicarFiltroRapido('suspeitos')}
              className="flex items-center gap-1"
            >
              <AlertOctagon className="h-3 w-3" />
              Suspeitos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAplicarFiltroRapido('alto-valor')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Alto Valor
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAplicarFiltroRapido('muitas-transacoes')}
              className="flex items-center gap-1"
            >
              <Zap className="h-3 w-3" />
              Muitas Transações
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAplicarFiltroRapido('poucos-deputados')}
              className="flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Concentração
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetarFiltros}
              className="text-muted-foreground"
            >
              Limpar Todos
            </Button>
          </div>
        </div>

        {/* Filtros Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div>
            <label className="text-sm font-medium mb-2 block">Buscar:</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome, CNPJ ou deputado..."
                value={filters.busca}
                onChange={(e) => updateFilter('busca', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Score de Suspeição */}
          <div>
            <label className="text-sm font-medium mb-2 block">Score de Suspeição:</label>
            <Select value={filters.filtroScore} onValueChange={(value) => updateFilter('filtroScore', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesScore.map(opcao => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Faixa de Valor */}
          <div>
            <label className="text-sm font-medium mb-2 block">Faixa de Valor:</label>
            <Select value={filters.filtroValor} onValueChange={(value) => updateFilter('filtroValor', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesValor.map(opcao => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ordenação */}
          <div>
            <label className="text-sm font-medium mb-2 block">Ordenar por:</label>
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesOrdenacao.map(opcao => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros Secundários */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Número de Transações */}
          <div>
            <label className="text-sm font-medium mb-2 block">Número de Transações:</label>
            <Select value={filters.filtroTransacoes} onValueChange={(value) => updateFilter('filtroTransacoes', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesTransacoes.map(opcao => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deputados Atendidos */}
          <div>
            <label className="text-sm font-medium mb-2 block">Deputados Atendidos:</label>
            <Select value={filters.filtroDeputados} onValueChange={(value) => updateFilter('filtroDeputados', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opcoesDeputados.map(opcao => (
                  <SelectItem key={opcao.valor} value={opcao.valor}>
                    {opcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria:</label>
            <Select value={filters.filtroCategoria} onValueChange={(value) => updateFilter('filtroCategoria', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                {categoriasDisponiveis.slice(0, 20).map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria.length > 30 ? categoria.substring(0, 30) + '...' : categoria}
                  </SelectItem>
                ))}
                {categoriasDisponiveis.length > 20 && (
                  <SelectItem value="mais" disabled>
                    ... e mais {categoriasDisponiveis.length - 20} categorias
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Switch para Apenas com Alertas */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <div className="font-medium">Apenas com Alertas</div>
            <div className="text-sm text-muted-foreground">
              Mostrar apenas fornecedores com score de suspeição ≥ 30
            </div>
          </div>
          <Switch
            checked={filters.apenasComAlertas}
            onCheckedChange={(checked) => updateFilter('apenasComAlertas', checked)}
          />
        </div>

        {/* Resumo dos Filtros Ativos */}
        {filtrosAtivos > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm font-medium mb-2">Filtros Ativos:</div>
            <div className="flex flex-wrap gap-1">
              {filters.busca && (
                <Badge variant="secondary">Busca: "{filters.busca}"</Badge>
              )}
              {filters.filtroScore !== 'todos' && (
                <Badge variant="secondary">Score: {filters.filtroScore}</Badge>
              )}
              {filters.filtroValor !== 'todos' && (
                <Badge variant="secondary">Valor: {filters.filtroValor}</Badge>
              )}
              {filters.filtroCategoria !== 'todas' && (
                <Badge variant="secondary">Categoria: {filters.filtroCategoria}</Badge>
              )}
              {filters.filtroTransacoes !== 'todas' && (
                <Badge variant="secondary">Transações: {filters.filtroTransacoes}</Badge>
              )}
              {filters.filtroDeputados !== 'todos' && (
                <Badge variant="secondary">Deputados: {filters.filtroDeputados}</Badge>
              )}
              {filters.apenasComAlertas && (
                <Badge variant="destructive">Apenas Alertas</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}