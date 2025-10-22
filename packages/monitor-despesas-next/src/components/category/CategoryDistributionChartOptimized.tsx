
import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, PieChart as PieChartIcon, Zap } from 'lucide-react'
import { getCategoriaColor } from '@/lib/categoria-colors'
import { useUnifiedChartData, useUnifiedCache } from '@/contexts/UnifiedCacheProvider'

interface CategoryDataPoint {
  categoria: string
  valor: number
  count: number
  percentage: number
  color: string
}

interface CategoryDistributionChartOptimizedProps {
  title?: string
  description?: string
  
  showPieChart?: boolean
  onTogglePieChart?: () => void
  maxHeight?: number
  showScrollIndicator?: boolean
  
  showAverage?: boolean
  showCount?: boolean
  countLabel?: string
  
  onCategoryClick?: (categoria: string) => void
  
  anoSelecionado?: number | 'todos'
  mesSelecionado?: string
  
  context?: 'fornecedores-page' | 'perfil-deputado'
  emptyMessage?: string
}

export function CategoryDistributionChartOptimized({
  title,
  description,
  showPieChart = false,
  onTogglePieChart,
  maxHeight = 400,
  showScrollIndicator = true,
  showAverage = true,
  showCount = true,
  countLabel = 'fornecedores',
  onCategoryClick,
  anoSelecionado,
  mesSelecionado,
  context = 'fornecedores-page',
  emptyMessage
}: CategoryDistributionChartOptimizedProps) {
  
  const {
    categorias,
    dados: dadosCategoria,
    hasValidData,
    cacheStatus,
    isLoading
  } = useUnifiedChartData()
  
  const {
    shouldShowCacheIndicator,
    getCacheStatusMessage,
    reprocessarFornecedores
  } = useUnifiedCache()
  
  const dadosProcessados: CategoryDataPoint[] = useMemo(() => {
    if (!dadosCategoria || Object.keys(dadosCategoria).length === 0) {
      return []
    }
    
    const valorTotal = Object.values(dadosCategoria).reduce((total, fornecedores) => {
      return total + fornecedores.reduce((sum, f) => sum + (f.totalRecebido || f.totalTransacionado || 0), 0)
    }, 0)
    
    const pontosDados: CategoryDataPoint[] = Object.entries(dadosCategoria).map(([categoria, fornecedores]) => {
      const valorCategoria = fornecedores.reduce((sum, f) => sum + (f.totalRecebido || f.totalTransacionado || 0), 0)
      const countCategoria = fornecedores.length
      const percentage = valorTotal > 0 ? (valorCategoria / valorTotal) * 100 : 0
      
      return {
        categoria,
        valor: valorCategoria,
        count: countCategoria,
        percentage,
        color: getCategoriaColor(categoria)
      }
    })
    
    return pontosDados.sort((a, b) => b.valor - a.valor)
  }, [dadosCategoria])
  
  const estatisticas = useMemo(() => {
    if (dadosProcessados.length === 0) {
      return { valorMedio: 0, countTotal: 0, valorTotal: 0 }
    }
    
    const valorTotal = dadosProcessados.reduce((sum, item) => sum + item.valor, 0)
    const countTotal = dadosProcessados.reduce((sum, item) => sum + item.count, 0)
    const valorMedio = valorTotal / dadosProcessados.length
    
    return { valorMedio, countTotal, valorTotal }
  }, [dadosProcessados])
  
  const handleReprocessar = async () => {
    try {
      await reprocessarFornecedores({
        ano: anoSelecionado || 'todos',
        mes: mesSelecionado || 'todos',
        forceRefresh: true
      })
    } catch (error) {
      console.error('Erro ao reprocessar dados:', error)
    }
  }
  
  const handleCategoryClick = (categoria: string) => {
    onCategoryClick?.(categoria)
  }
  
  const formatarValor = (valor: number) => {
    return `R$ ${Math.round(valor).toLocaleString('pt-BR')}`
  }
  
  const formatarPercentual = (percentual: number) => {
    return `${percentual.toFixed(1)}%`
  }
  
  const tituloFinal = title || "Distribuição por Categoria"
  const descricaoFinal = description || (
    hasValidData 
      ? `Análise de ${estadisticas.countTotal} ${countLabel} em ${dadosProcessados.length} categorias (dados otimizados)`
      : "Carregue os dados para visualizar a distribuição"
  )
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{tituloFinal}</CardTitle>
            <CardDescription>{descricaoFinal}</CardDescription>
            
            {/* Indicador de cache */}
            {shouldShowCacheIndicator() && (
              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md inline-block mt-2">
                {getCacheStatusMessage()}
              </div>
            )}
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-2">
            {onTogglePieChart && dadosProcessados.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onTogglePieChart}
              >
                <PieChartIcon className="h-4 w-4 mr-2" />
                {showPieChart ? 'Barras' : 'Pizza'}
              </Button>
            )}
            
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" style={{ maxHeight }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : dadosProcessados.length === 0 ? (
          <div className="text-center py-8">
            <PieChartIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              {emptyMessage || "Nenhum dado de categoria disponível"}
            </p>
            {!hasValidData && (
              <Button onClick={handleReprocessar} disabled={isLoading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Carregar Categorias
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Estatísticas gerais */}
            {(showAverage || showCount) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                {showCount && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {estatisticas.countTotal}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total {countLabel}
                    </div>
                  </div>
                )}
                
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatarValor(estatisticas.valorTotal)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Valor Total
                  </div>
                </div>
                
                {showAverage && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatarValor(estatisticas.valorMedio)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Média por Categoria
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Lista de categorias */}
            <div 
              className="space-y-2 overflow-y-auto"
              style={{ maxHeight: showScrollIndicator ? maxHeight - 120 : 'none' }}
            >
              {dadosProcessados.map((item, index) => (
                <div
                  key={item.categoria}
                  className={`p-3 border rounded-lg transition-all duration-200 ${
                    onCategoryClick 
                      ? 'hover:bg-gray-50 cursor-pointer hover:border-gray-300' 
                      : ''
                  }`}
                  onClick={() => handleCategoryClick(item.categoria)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Indicador de cor */}
                      <div 
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      
                      {/* Nome da categoria */}
                      <span className="font-medium text-gray-900 truncate">
                        {item.categoria}
                      </span>
                      
                      {/* Posição */}
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        #{index + 1}
                      </span>
                    </div>
                    
                    {/* Valores */}
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="font-semibold text-gray-900">
                        {formatarValor(item.valor)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatarPercentual(item.percentage)}
                        {showCount && ` • ${item.count} ${countLabel}`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progresso */}
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(item.percentage, 2)}%`,
                        backgroundColor: item.color 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Indicador de scroll */}
            {showScrollIndicator && dadosProcessados.length > 6 && (
              <div className="text-center text-xs text-gray-500 py-2">
                ↕ Role para ver todas as categorias
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}