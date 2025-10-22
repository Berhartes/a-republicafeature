
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X, ChevronDown, ChevronUp, RotateCcw, Zap } from 'lucide-react'
import { useUnifiedFilterData, useUnifiedCache } from '@/contexts/UnifiedCacheProvider'
import { getCategoriaColor } from '@/lib/categoria-colors'

export interface OptimizedFilterOptions {
  searchTerm: string
  valueRange: {
    min: number
    max: number
  }
  categorias: string[]
  scoreMinimo: number
  showOnlyWithAlerts: boolean
}

interface AdvancedSearchOptimizedProps {
  onFilterChange: (filters: OptimizedFilterOptions) => void
  showValueFilter?: boolean
  showScoreFilter?: boolean
  showCategoryFilter?: boolean
  showAlertsFilter?: boolean
  maxValue?: number
  placeholder?: string
  compactMode?: boolean
}

export function AdvancedSearchOptimized({ 
  onFilterChange, 
  showValueFilter = true,
  showScoreFilter = true,
  showCategoryFilter = true,
  showAlertsFilter = true,
  maxValue = 1000000,
  placeholder = "Buscar por nome, CNPJ, descrição...",
  compactMode = false
}: AdvancedSearchOptimizedProps) {
  
  const [isExpanded, setIsExpanded] = useState(false)
  
  const {
    categorias: categoriasCache,
    hasValidData,
    cacheStatus,
    isLoading
  } = useUnifiedFilterData()
  
  const {
    shouldShowCacheIndicator,
    getCacheStatusMessage,
    reprocessarFornecedores
  } = useUnifiedCache()
  
  const [filters, setFilters] = useState<OptimizedFilterOptions>({
    searchTerm: '',
    valueRange: {
      min: 0,
      max: maxValue
    },
    categorias: [],
    scoreMinimo: 0,
    showOnlyWithAlerts: false
  })
  
  const categoriasDisponiveis = useMemo(() => {
    if (!categoriasCache || categoriasCache.length === 0) {
      return []
    }
    return categoriasCache
      .filter(cat => cat && cat.trim() !== '')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [categoriasCache])
  
  const updateFilter = (key: keyof OptimizedFilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const resetFilters = () => {
    const defaultFilters: OptimizedFilterOptions = {
      searchTerm: '',
      valueRange: {
        min: 0,
        max: maxValue
      },
      categorias: [],
      scoreMinimo: 0,
      showOnlyWithAlerts: false
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }
  
  const activeFiltersCount = () => {
    let count = 0
    if (filters.searchTerm) count++
    if (filters.valueRange.min > 0 || filters.valueRange.max < maxValue) count++
    if (filters.categorias.length > 0) count++
    if (filters.scoreMinimo > 0) count++
    if (filters.showOnlyWithAlerts) count++
    return count
  }
  
  const toggleCategoria = (categoria: string) => {
    const novasCategorias = filters.categorias.includes(categoria)
      ? filters.categorias.filter(cat => cat !== categoria)
      : [...filters.categorias, categoria]
    updateFilter('categorias', novasCategorias)
  }
  
  const handleReprocessar = async () => {
    try {
      await reprocessarFornecedores({ forceRefresh: true })
    } catch (error) {
      console.error('Erro ao reprocessar dados:', error)
    }
  }
  
  const formatarValor = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`
    }
    return `R$ ${value.toLocaleString('pt-BR')}`
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Busca Avançada
            </CardTitle>
            <CardDescription>
              {activeFiltersCount() > 0 
                ? `${activeFiltersCount()} filtros ativos${hasValidData ? ' (dados otimizados)' : ''}` 
                : 'Refine sua busca com filtros detalhados'}
            </CardDescription>
            
            {/* Indicador de cache */}
            {shouldShowCacheIndicator() && (
              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md inline-block mt-2">
                {getCacheStatusMessage()}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!hasValidData && (
              <Button 
                onClick={handleReprocessar}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isLoading ? 'Carregando...' : 'Carregar Dados'}
              </Button>
            )}
            
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
            
            {!compactMode && (
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
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-full h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Busca principal sempre visível */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={placeholder}
                value={filters.searchTerm}
                onChange={(e) => updateFilter('searchTerm', e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros expandidos ou sempre visíveis no modo compacto */}
            {(isExpanded || compactMode) && (
              <div className="space-y-4 pt-4 border-t">
                
                {/* Filtro de Valor */}
                {showValueFilter && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Faixa de Valor ({formatarValor(filters.valueRange.min)} - {formatarValor(filters.valueRange.max)})
                    </Label>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={maxValue}
                        step={10000}
                        value={[filters.valueRange.min, filters.valueRange.max]}
                        onValueChange={(value) => 
                          updateFilter('valueRange', { min: value[0], max: value[1] })
                        }
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatarValor(0)}</span>
                        <span>{formatarValor(maxValue)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Filtro de Score */}
                {showScoreFilter && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Score Mínimo de Suspeição ({filters.scoreMinimo})
                    </Label>
                    <div className="px-2">
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[filters.scoreMinimo]}
                        onValueChange={(value) => updateFilter('scoreMinimo', value[0])}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>100</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Categorias do cache */}
                {showCategoryFilter && categoriasDisponiveis.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Categorias de Gasto ({categoriasDisponiveis.length} disponíveis)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {categoriasDisponiveis.map(categoria => (
                        <Badge
                          key={categoria}
                          variant={filters.categorias.includes(categoria) ? "default" : "outline"}
                          className="cursor-pointer text-xs flex items-center justify-start p-2 h-auto"
                          style={{
                            backgroundColor: filters.categorias.includes(categoria) 
                              ? getCategoriaColor(categoria) 
                              : undefined,
                            borderColor: getCategoriaColor(categoria)
                          }}
                          onClick={() => toggleCategoria(categoria)}
                        >
                          <span className="truncate">
                            {categoria.length > 25 ? categoria.substring(0, 25) + '...' : categoria}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtro de alertas */}
                {showAlertsFilter && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Filtros Especiais</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showOnlyWithAlerts"
                        checked={filters.showOnlyWithAlerts}
                        onChange={(e) => updateFilter('showOnlyWithAlerts', e.target.checked)}
                        className="rounded"
                      />
                      <label htmlFor="showOnlyWithAlerts" className="text-sm">
                        Apenas itens com alertas de suspeição
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Filtros ativos quando não expandido */}
            {activeFiltersCount() > 0 && !isExpanded && !compactMode && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {filters.searchTerm && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Busca: {filters.searchTerm.substring(0, 15)}
                    {filters.searchTerm.length > 15 && '...'}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('searchTerm', '')}
                    />
                  </Badge>
                )}
                
                {(filters.valueRange.min > 0 || filters.valueRange.max < maxValue) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Valor: {formatarValor(filters.valueRange.min)} - {formatarValor(filters.valueRange.max)}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('valueRange', { min: 0, max: maxValue })}
                    />
                  </Badge>
                )}
                
                {filters.scoreMinimo > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Score ≥ {filters.scoreMinimo}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('scoreMinimo', 0)}
                    />
                  </Badge>
                )}
                
                {filters.categorias.length > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {filters.categorias.length} categoria(s)
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('categorias', [])}
                    />
                  </Badge>
                )}
                
                {filters.showOnlyWithAlerts && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    Com alertas
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => updateFilter('showOnlyWithAlerts', false)}
                    />
                  </Badge>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}