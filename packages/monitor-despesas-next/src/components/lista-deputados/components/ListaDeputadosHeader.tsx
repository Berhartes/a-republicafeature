import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, RefreshCw, Filter, Grid3X3, List, BarChart3, Users, TrendingUp, Crown, AlertTriangle, Settings } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ViewMode, SortOption } from '../hooks/useListaDeputadosData.js'

interface ListaDeputadosHeaderProps {
  totalDeputados: number
  totalFiltrados: number
  gastoTotalFiltrado: number
  loading: boolean
  isRefreshing: boolean
  isConnected: boolean
  
  viewMode: ViewMode
  showFilters: boolean
  showStats: boolean
  searchTerm: string
  sortBy: SortOption
  itemsPerPage: number
  currentPage: number
  totalPages: number
  
  onViewModeChange: (mode: ViewMode) => void
  onToggleFilters: () => void
  onToggleStats: () => void
  onSearchChange: (term: string) => void
  onSortChange: (sort: SortOption) => void
  onItemsPerPageChange: (items: number) => void
  onRefresh: () => void
  onQuickFilter: (type: 'top10' | 'alertas' | 'coroas' | 'criticos' | 'baixoGasto') => void
  onResetFilters: () => void
}

export function ListaDeputadosHeader({
  totalDeputados,
  totalFiltrados,
  gastoTotalFiltrado,
  loading,
  isRefreshing,
  isConnected,
  viewMode,
  showFilters,
  showStats,
  searchTerm,
  sortBy,
  itemsPerPage,
  currentPage,
  totalPages,
  onViewModeChange,
  onToggleFilters,
  onToggleStats,
  onSearchChange,
  onSortChange,
  onItemsPerPageChange,
  onRefresh,
  onQuickFilter,
  onResetFilters
}: ListaDeputadosHeaderProps) {

  return (
    <div className="space-y-4">
      {/* Título e Controles Principais */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Lista de Deputados
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore e analise o desempenho dos deputados federais
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {totalFiltrados.toLocaleString()} de {totalDeputados.toLocaleString()} deputados
            </Badge>
            <Badge variant="secondary">
              R$ {gastoTotalFiltrado.toLocaleString('pt-BR')} em gastos filtrados
            </Badge>
            {!isConnected && (
              <Badge variant="destructive">
                Desconectado
              </Badge>
            )}
          </div>
        </div>

        {/* Controles de Ação */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onToggleStats}
            className={`flex items-center gap-2 ${showStats ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <BarChart3 className="h-4 w-4" />
            {showStats ? 'Ocultar Stats' : 'Ver Stats'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onToggleFilters}
            className={`flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-200' : ''}`}
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Ocultar Filtros' : 'Filtros'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading || isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Barra de Busca e Controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Busca */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Buscar por nome, partido ou UF..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9"
                  aria-label="Buscar deputados por nome, partido ou UF"
                  role="searchbox"
                />
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Ordenar:</span>
              <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gastos">Gastos</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="partido">Partido</SelectItem>
                  <SelectItem value="uf">UF</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="alertas">Alertas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Visualização */}
            <div className="flex items-center gap-1 border rounded p-1" role="group" aria-label="Modo de visualização">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                aria-label="Visualização em grade"
                aria-pressed={viewMode === 'grid'}
              >
                <Grid3X3 className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                aria-label="Visualização em lista"
                aria-pressed={viewMode === 'list'}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('compact')}
                aria-label="Visualização compacta"
                aria-pressed={viewMode === 'compact'}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Items por página */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Por página:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(parseInt(value))}>
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="24">24</SelectItem>
                  <SelectItem value="48">48</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros Rápidos */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Filtros Rápidos:</span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickFilter('top10')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Top 10
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickFilter('alertas')}
              className="flex items-center gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Com Alertas
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickFilter('coroas')}
              className="flex items-center gap-1"
            >
              <Crown className="h-3 w-3" />
              Com Coroas
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickFilter('criticos')}
              className="flex items-center gap-1"
            >
              <AlertTriangle className="h-3 w-3" />
              Score Crítico
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuickFilter('baixoGasto')}
              className="flex items-center gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              Baixo Gasto
            </Button>

            {/* Separador */}
            <div className="h-6 w-px bg-border mx-2" />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onResetFilters}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Paginação Info */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Página {currentPage} de {totalPages} • {totalFiltrados} deputados encontrados
          </div>
          <div>
            Mostrando {Math.min(itemsPerPage, totalFiltrados - (currentPage - 1) * itemsPerPage)} de {totalFiltrados}
          </div>
        </div>
      )}

      {/* Status de Loading */}
      {(loading || isRefreshing) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-800">
                  {isRefreshing ? 'Atualizando dados...' : 'Carregando deputados...'}
                </div>
                <div className="text-sm text-blue-700">
                  Aguarde enquanto coletamos as informações mais atualizadas.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}