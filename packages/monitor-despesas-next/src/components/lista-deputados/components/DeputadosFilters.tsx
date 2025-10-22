import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Filter, X, Settings, DollarSign, Target, AlertTriangle, Crown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FilterState } from '../hooks/useListaDeputadosFilters'

interface DeputadosFilttersProps {
  filters: FilterState
  partidosDisponiveis: string[]
  ufsDisponiveis: string[]
  maxGasto: number
  maxScore: number
  totalFiltrados: number
  totalDeputados: number
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void
  onResetFilters: () => void
  onClose: () => void
}

export function DeputadosFilters({
  filters,
  partidosDisponiveis,
  ufsDisponiveis,
  maxGasto,
  maxScore,
  totalFiltrados,
  totalDeputados,
  onUpdateFilter,
  onResetFilters,
  onClose
}: DeputadosFilttersProps) {

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
    return `R$ ${value.toLocaleString('pt-BR')}`
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalFiltrados} de {totalDeputados} deputados
            </span>
            <Button variant="outline" size="sm" onClick={onResetFilters}>
              <Settings className="h-4 w-4 mr-1" />
              Limpar
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Filtros por Localização */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Partido</Label>
            <Select value={filters.partido} onValueChange={(value) => onUpdateFilter('partido', value)}>
              <SelectTrigger aria-label="Selecionar partido">
                <SelectValue placeholder="Selecione um partido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="TODOS" value="TODOS">Todos os Partidos</SelectItem>
                {partidosDisponiveis.map(partido => (
                  <SelectItem key={`partido-${partido}`} value={partido}>
                    {partido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Estado (UF)</Label>
            <Select value={filters.uf} onValueChange={(value) => onUpdateFilter('uf', value)}>
              <SelectTrigger aria-label="Selecionar estado">
                <SelectValue placeholder="Selecione um estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="TODOS-UF" value="TODOS">Todos os Estados</SelectItem>
                {ufsDisponiveis.map(uf => (
                  <SelectItem key={`uf-${uf}`} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros por Valor */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <Label className="font-medium">Faixa de Gastos</Label>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatCurrency(filters.minGasto)}</span>
              <span>{formatCurrency(filters.maxGasto === Infinity ? maxGasto : filters.maxGasto)}</span>
            </div>
            
            <div className="px-2">
              <Slider
                value={[filters.minGasto, filters.maxGasto === Infinity ? maxGasto : filters.maxGasto]}
                onValueChange={([min, max]) => {
                  onUpdateFilter('minGasto', min)
                  onUpdateFilter('maxGasto', max)
                }}
                max={maxGasto}
                min={0}
                step={10000}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minGasto', 0)
                  onUpdateFilter('maxGasto', 50000)
                }}
              >
                Até 50k
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minGasto', 50000)
                  onUpdateFilter('maxGasto', 200000)
                }}
              >
                50k-200k
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minGasto', 200000)
                  onUpdateFilter('maxGasto', maxGasto)
                }}
              >
                200k+
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros por Score */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-600" />
            <Label className="font-medium">Score de Suspeição</Label>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{filters.minScore.toFixed(0)}</span>
              <span>{filters.maxScore.toFixed(0)}</span>
            </div>
            
            <div className="px-2">
              <Slider
                value={[filters.minScore, filters.maxScore]}
                onValueChange={([min, max]) => {
                  onUpdateFilter('minScore', min)
                  onUpdateFilter('maxScore', max)
                }}
                max={maxScore}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            
            <div className="grid grid-cols-4 gap-2 text-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minScore', 0)
                  onUpdateFilter('maxScore', 20)
                }}
                className="text-green-600"
              >
                Baixo
                <br />
                (0-20)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minScore', 20)
                  onUpdateFilter('maxScore', 40)
                }}
                className="text-yellow-600"
              >
                Médio
                <br />
                (20-40)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minScore', 40)
                  onUpdateFilter('maxScore', 70)
                }}
                className="text-orange-600"
              >
                Alto
                <br />
                (40-70)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onUpdateFilter('minScore', 70)
                  onUpdateFilter('maxScore', 100)
                }}
                className="text-red-600"
              >
                Crítico
                <br />
                (70+)
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros por Características */}
        <div className="space-y-4">
          <Label className="font-medium">Características Especiais</Label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                  <div className="font-medium">Possui Alertas</div>
                  <div className="text-sm text-muted-foreground">Deputados com alertas ativos</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filters.hasAlertas === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilter('hasAlertas', filters.hasAlertas === true ? null : true)}
                >
                  Sim
                </Button>
                <Button
                  variant={filters.hasAlertas === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilter('hasAlertas', filters.hasAlertas === false ? null : false)}
                >
                  Não
                </Button>
                <Button
                  variant={filters.hasAlertas === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilter('hasAlertas', null)}
                >
                  Todos
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <div>
                  <div className="font-medium">Possui Coroas</div>
                  <div className="text-sm text-muted-foreground">Deputados com conquistas</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={filters.hasCoroas === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilter('hasCoroas', filters.hasCoroas === true ? null : true)}
                >
                  Sim
                </Button>
                <Button
                  variant={filters.hasCoroas === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilter('hasCoroas', filters.hasCoroas === false ? null : false)}
                >
                  Não
                </Button>
                <Button
                  variant={filters.hasCoroas === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdateFilter('hasCoroas', null)}
                >
                  Todos
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo dos Filtros Ativos */}
        {(filters.partido !== 'TODOS' ||
          filters.uf !== 'TODOS' || 
          filters.minGasto > 0 || 
          filters.maxGasto < maxGasto ||
          filters.minScore > 0 ||
          filters.maxScore < maxScore ||
          filters.hasAlertas !== null ||
          filters.hasCoroas !== null) && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium">Filtros Ativos:</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.partido !== 'TODOS' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  Partido: {filters.partido}
                  <button onClick={() => onUpdateFilter('partido', 'TODOS')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.uf !== 'TODOS' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  UF: {filters.uf}
                  <button onClick={() => onUpdateFilter('uf', 'TODOS')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(filters.minGasto > 0 || filters.maxGasto < maxGasto) && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  Gastos: {formatCurrency(filters.minGasto)} - {formatCurrency(filters.maxGasto === Infinity ? maxGasto : filters.maxGasto)}
                  <button onClick={() => {
                    onUpdateFilter('minGasto', 0)
                    onUpdateFilter('maxGasto', maxGasto)
                  }}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.hasAlertas !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                  Alertas: {filters.hasAlertas ? 'Sim' : 'Não'}
                  <button onClick={() => onUpdateFilter('hasAlertas', null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.hasCoroas !== null && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  Coroas: {filters.hasCoroas ? 'Sim' : 'Não'}
                  <button onClick={() => onUpdateFilter('hasCoroas', null)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}