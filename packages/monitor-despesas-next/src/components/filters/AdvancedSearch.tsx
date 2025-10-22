import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Calendar as CalendarIcon, X, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryIcons } from './category-icons'

export interface FilterOptions {
  searchTerm: string
  dateRange: {
    start: Date | undefined
    end: Date | undefined
  }
  valueRange: {
    min: number
    max: number
  }
  estados: string[]
  partidos: string[]
  categorias: string[]
  tiposAlerta: string[]
  scoreMinimo: number
}

interface AdvancedSearchProps {
  onFilterChange: (filters: FilterOptions) => void
  availableFilters?: {
    estados?: string[]
    partidos?: string[]
    categorias?: string[]
    tiposAlerta?: string[]
  }
  showDateFilter?: boolean
  showValueFilter?: boolean
  showScoreFilter?: boolean
}

export function AdvancedSearch({ 
  onFilterChange, 
  availableFilters = {},
  showDateFilter = true,
  showValueFilter = true,
  showScoreFilter = true
}: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    dateRange: {
      start: undefined,
      end: undefined
    },
    valueRange: {
      min: 0,
      max: 100000
    },
    estados: [],
    partidos: [],
    categorias: [],
    tiposAlerta: [],
    scoreMinimo: 0
  })

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const resetFilters = () => {
    const defaultFilters: FilterOptions = {
      searchTerm: '',
      dateRange: {
        start: undefined,
        end: undefined
      },
      valueRange: {
        min: 0,
        max: 100000
      },
      estados: [],
      partidos: [],
      categorias: [],
      tiposAlerta: [],
      scoreMinimo: 0
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  const activeFiltersCount = () => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.valueRange.min > 0 || filters.valueRange.max < 100000) count++
    if (filters.estados.length > 0) count++
    if (filters.partidos.length > 0) count++
    if (filters.categorias.length > 0) count++
    if (filters.tiposAlerta.length > 0) count++
    if (filters.scoreMinimo > 0) count++
    return count
  }

  const toggleArrayFilter = (value: string, key: keyof FilterOptions) => {
    const currentArray = filters[key] as string[]
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value]
    updateFilter(key, newArray)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Busca Avançada
            </CardTitle>
            <CardDescription>
              {activeFiltersCount() > 0 
                ? `${activeFiltersCount()} filtros ativos` 
                : 'Refine sua busca com filtros detalhados'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {activeFiltersCount() > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Recolher
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expandir
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Busca principal sempre visível */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por nome, CNPJ, descrição..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Filtro de Data */}
            {showDateFilter && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Inicial</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange.start && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.start ? (
                          filters.dateRange.start.toLocaleDateString('pt-BR')
                        ) : (
                          <span>Selecione a data inicial</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.start}
                        onSelect={(date: Date | undefined) => 
                          updateFilter('dateRange', { ...filters.dateRange, start: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateRange.end && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange.end ? (
                          filters.dateRange.end.toLocaleDateString('pt-BR')
                        ) : (
                          <span>Selecione a data final</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange.end}
                        onSelect={(date: Date | undefined) => 
                          updateFilter('dateRange', { ...filters.dateRange, end: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}

            {/* Filtro de Valor */}
            {showValueFilter && (
              <div className="space-y-2">
                <Label>Faixa de Valor (R$)</Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={100000}
                    step={1000}
                    value={[filters.valueRange.min, filters.valueRange.max]}
                    onValueChange={(value) => 
                      updateFilter('valueRange', { min: value[0], max: value[1] })
                    }
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>R$ {filters.valueRange.min.toLocaleString('pt-BR')}</span>
                    <span>R$ {filters.valueRange.max.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filtro de Score */}
            {showScoreFilter && (
              <div className="space-y-2">
                <Label>Score Mínimo de Suspeição</Label>
                <div className="px-2">
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={[filters.scoreMinimo]}
                    onValueChange={(value) => updateFilter('scoreMinimo', value[0])}
                    className="mb-2"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {filters.scoreMinimo}
                  </div>
                </div>
              </div>
            )}

            {/* Filtros de Seleção Múltipla */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estados */}
              {availableFilters.estados && availableFilters.estados.length > 0 && (
                <div className="space-y-2">
                  <Label>Estados</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.estados.map(estado => (
                      <Badge
                        key={estado}
                        variant={filters.estados.includes(estado) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter(estado, 'estados')}
                      >
                        {estado}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Partidos */}
              {availableFilters.partidos && availableFilters.partidos.length > 0 && (
                <div className="space-y-2">
                  <Label>Partidos</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableFilters.partidos.map(partido => (
                      <Badge
                        key={partido}
                        variant={filters.partidos.includes(partido) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayFilter(partido, 'partidos')}
                      >
                        {partido}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Categorias */}
            {availableFilters.categorias && availableFilters.categorias.length > 0 && (
              <div className="space-y-2">
                <Label>Categorias de Gasto</Label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.categorias.map(categoria => {
                    const Icon = categoryIcons[categoria] || 'div'
                    return (
                      <Badge
                        key={categoria}
                        variant={filters.categorias.includes(categoria) ? "default" : "outline"}
                        className="cursor-pointer text-xs flex items-center gap-2"
                        onClick={() => toggleArrayFilter(categoria, 'categorias')}
                      >
                        <Icon className="h-4 w-4" />
                        {categoria.length > 30 ? categoria.substring(0, 30) + '...' : categoria}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Tipos de Alerta */}
            {availableFilters.tiposAlerta && availableFilters.tiposAlerta.length > 0 && (
              <div className="space-y-2">
                <Label>Tipos de Alerta</Label>
                <div className="flex flex-wrap gap-2">
                  {availableFilters.tiposAlerta.map(tipo => (
                    <Badge
                      key={tipo}
                      variant={filters.tiposAlerta.includes(tipo) ? "warning" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayFilter(tipo, 'tiposAlerta')}
                    >
                      {tipo.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filtros ativos */}
        {activeFiltersCount() > 0 && !isExpanded && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.searchTerm && (
              <Badge variant="secondary">
                Busca: {filters.searchTerm}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('searchTerm', '')}
                />
              </Badge>
            )}
            {(filters.dateRange.start || filters.dateRange.end) && (
              <Badge variant="secondary">
                Período definido
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('dateRange', { start: undefined, end: undefined })}
                />
              </Badge>
            )}
            {filters.scoreMinimo > 0 && (
              <Badge variant="secondary">
                Score ≥ {filters.scoreMinimo}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('scoreMinimo', 0)}
                />
              </Badge>
            )}
            {filters.estados.length > 0 && (
              <Badge variant="secondary">
                {filters.estados.length} estado(s)
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('estados', [])}
                />
              </Badge>
            )}
            {filters.partidos.length > 0 && (
              <Badge variant="secondary">
                {filters.partidos.length} partido(s)
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => updateFilter('partidos', [])}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
