
import React, { useMemo } from 'react'
import { Filter, RefreshCw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUnifiedFilterData, useUnifiedCache } from '@/contexts/UnifiedCacheProvider'

interface FornecedorFiltersOptimizedProps {
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
  
  fornecedoresFiltrados?: any[]
  totalFornecedores?: number
  
  showAdvancedFilters?: boolean
  compactMode?: boolean
}

export function FornecedorFiltersOptimized({
  busca,
  setBusca,
  filtroScore,
  setFiltroScore,
  filtroValor,
  setFiltroValor,
  filtroDeputados,
  setFiltroDeputados,
  filtroCategoria,
  setFiltroCategoria,
  apenasComAlertas,
  setApenasComAlertas,
  onLimparFiltros,
  fornecedoresFiltrados = [],
  totalFornecedores,
  showAdvancedFilters = true,
  compactMode = false
}: FornecedorFiltersOptimizedProps) {
  
  const {
    categorias: categoriasCache,
    totalFornecedores: totalFromCache,
    hasValidData,
    cacheStatus,
    isLoading
  } = useUnifiedFilterData()
  
  const {
    shouldShowCacheIndicator,
    getCacheStatusMessage,
    reprocessarFornecedores
  } = useUnifiedCache()
  
  const totalFinal = totalFornecedores ?? totalFromCache
  
  const categoriasDisponiveis = useMemo(() => {
    if (!categoriasCache || categoriasCache.length === 0) {
      return []
    }
    return categoriasCache
      .filter(cat => cat && cat.trim() !== '')
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [categoriasCache])
  
  const temFiltroAtivo = useMemo(() => {
    return busca || 
           filtroScore !== 'todos' || 
           filtroValor !== 'todos' || 
           filtroDeputados !== 'todos' || 
           filtroCategoria !== 'todas' || 
           apenasComAlertas
  }, [busca, filtroScore, filtroValor, filtroDeputados, filtroCategoria, apenasComAlertas])
  
  const estatisticasFiltro = useMemo(() => {
    const resultados = fornecedoresFiltrados.length
    const percentual = totalFinal > 0 ? (resultados / totalFinal) * 100 : 0
    
    return {
      resultados,
      total: totalFinal,
      percentual: percentual.toFixed(1)
    }
  }, [fornecedoresFiltrados.length, totalFinal])
  
  const handleReprocessar = async () => {
    try {
      await reprocessarFornecedores({ forceRefresh: true })
    } catch (error) {
      console.error('Erro ao reprocessar fornecedores:', error)
    }
  }
  
  if (compactMode) {
    return (
      <div className="space-y-3">
        {/* Busca e categoria em uma linha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Input
              placeholder="Buscar fornecedor..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8"
            />
            <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categoriasDisponiveis.map(categoria => (
                <SelectItem key={categoria} value={categoria}>
                  {categoria}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Status e clear */}
        {temFiltroAtivo && (
          <div className="flex items-center justify-between text-sm">
            <Badge variant="secondary">
              {estatisticasFiltro.resultados} de {estatisticasFiltro.total} fornecedores ({estatisticasFiltro.percentual}%)
            </Badge>
            <Button variant="ghost" size="sm" onClick={onLimparFiltros}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros de Fornecedores
            </CardTitle>
            <CardDescription>
              {temFiltroAtivo 
                ? `${estatisticasFiltro.resultados} de ${estatisticasFiltro.total} fornecedores (${estatisticasFiltro.percentual}%)`
                : `Filtre entre ${totalFinal.toLocaleString('pt-BR')} fornecedores disponíveis`
              }
            </CardDescription>
            
            {/* Indicador de cache */}
            {shouldShowCacheIndicator() && (
              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md inline-block mt-2">
                {getCacheStatusMessage()}
              </div>
            )}
          </div>
          
          {/* Controles */}
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
            
            {temFiltroAtivo && (
              <Button variant="outline" size="sm" onClick={onLimparFiltros}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-full h-9 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Filtros principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Busca por nome/CNPJ */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar Fornecedor</label>
                <div className="relative">
                  <Input
                    placeholder="Nome ou CNPJ..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-8"
                  />
                  <Filter className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              {/* Categoria otimizada do cache */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Categoria ({categoriasDisponiveis.length} disponíveis)
                </label>
                <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    {categoriasDisponiveis.map(categoria => (
                      <SelectItem key={categoria} value={categoria}>
                        {categoria}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Score de suspeição */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Score de Suspeição</label>
                <Select value={filtroScore} onValueChange={setFiltroScore}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os scores</SelectItem>
                    <SelectItem value="alto">Alto (7-10)</SelectItem>
                    <SelectItem value="medio">Médio (4-6)</SelectItem>
                    <SelectItem value="baixo">Baixo (0-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Valor transacionado */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor Transacionado</label>
                <Select value={filtroValor} onValueChange={setFiltroValor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os valores</SelectItem>
                    <SelectItem value="muito-alto">Muito Alto (&gt;1M)</SelectItem>
                    <SelectItem value="alto">Alto (500K-1M)</SelectItem>
                    <SelectItem value="medio">Médio (100K-500K)</SelectItem>
                    <SelectItem value="baixo">Baixo (&lt;100K)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros avançados */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {/* Deputados atendidos */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deputados Atendidos</label>
                  <Select value={filtroDeputados} onValueChange={setFiltroDeputados}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Qualquer quantidade</SelectItem>
                      <SelectItem value="muitos">Muitos (&gt;20)</SelectItem>
                      <SelectItem value="varios">Vários (10-20)</SelectItem>
                      <SelectItem value="poucos">Poucos (5-10)</SelectItem>
                      <SelectItem value="exclusivo">Exclusivo (1-4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Checkbox para alertas */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filtros Especiais</label>
                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="apenasComAlertas"
                      checked={apenasComAlertas}
                      onChange={(e) => setApenasComAlertas(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="apenasComAlertas" className="text-sm">
                      Apenas fornecedores com alertas
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Resumo de filtros ativos */}
            {temFiltroAtivo && (
              <div className="flex flex-wrap gap-2 pt-4 border-t bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mr-2">Filtros ativos:</div>
                
                {busca && (
                  <Badge variant="secondary">
                    Busca: "{busca}"
                  </Badge>
                )}
                
                {filtroCategoria !== 'todas' && (
                  <Badge variant="secondary">
                    Categoria: {filtroCategoria}
                  </Badge>
                )}
                
                {filtroScore !== 'todos' && (
                  <Badge variant="secondary">
                    Score: {filtroScore}
                  </Badge>
                )}
                
                {filtroValor !== 'todos' && (
                  <Badge variant="secondary">
                    Valor: {filtroValor}
                  </Badge>
                )}
                
                {filtroDeputados !== 'todos' && (
                  <Badge variant="secondary">
                    Deputados: {filtroDeputados}
                  </Badge>
                )}
                
                {apenasComAlertas && (
                  <Badge variant="warning">
                    Com alertas
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