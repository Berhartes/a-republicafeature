import React, { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, X, PieChart as PieChartIcon } from 'lucide-react'
import { CategoryDistributionChartProps, DEFAULT_CONTEXTS } from './CategoryDistributionChart.types'
import { CategoryLegend } from './CategoryLegend'
import { CategoryPieChart } from './CategoryPieChart'
import { CategoryBarChart } from './CategoryBarChart'

export const CategoryDistributionChart: React.FC<CategoryDistributionChartProps> = ({
  data,
  loading,
  context,
  title,
  description,
  className,
  showPieChart = false,
  onTogglePieChart,
  maxHeight,
  referenceData,
  onCategoryClick,
  categoryUrlResolver,
  countLabel,
  showAverage,
  showCount,
  showComparison,
  legendLabels,
  emptyMessage,
  loadingMessage
}) => {
  const contextConfig = DEFAULT_CONTEXTS[context]
  
  const config = useMemo(() => ({
    countLabel: countLabel || contextConfig.countLabel,
    showCount: showCount !== undefined ? showCount : contextConfig.showCount,
    showAverage: showAverage !== undefined ? showAverage : contextConfig.showAverage,
    showComparison: showComparison !== undefined ? showComparison : contextConfig.showComparison,
    legendLabels: legendLabels || contextConfig.legendLabels
  }), [countLabel, showCount, showAverage, showComparison, legendLabels, contextConfig])

  const defaultTitle = title || "Distribuição e Detalhamento de Gastos por Categoria"
  const defaultDescription = description || (
    context === 'fornecedores-page' 
      ? `Análise detalhada dos fornecedores por categoria${data.length > 0 ? ` (${data.length} categorias principais)` : ''}`
      : `Análise detalhada dos gastos${data.length > 0 ? ` (${data.reduce((sum, item) => sum + (item.count || 0), 0)} transações no período)` : ''}`
  )

  const calculatedMaxHeight = maxHeight

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{defaultTitle}</CardTitle>
          <CardDescription>{defaultDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>{loadingMessage || 'Carregando categorias...'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{defaultTitle}</CardTitle>
          <CardDescription>{defaultDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
            {emptyMessage || 'Não há dados de categorias para o período selecionado.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{defaultTitle}</CardTitle>
            <CardDescription>{defaultDescription}</CardDescription>
          </div>
          
          {/* Botão para alternar visualização */}
          {onTogglePieChart && (
            <div className="flex items-center gap-2">
              {!showPieChart ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTogglePieChart(true)}
                  className="flex items-center gap-2"
                >
                  <PieChartIcon className="h-4 w-4" />
                  Ver Gráfico em Pizza
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTogglePieChart(false)}
                  className="flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Legenda */}
        <CategoryLegend
          context={context}
          labels={config.legendLabels}
          showPieChart={showPieChart}
        />
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0 space-y-4">
          {/* Gráfico Pizza - Condicional */}
          {showPieChart && (
            <CategoryPieChart data={data} height={300} />
          )}
          
          {/* Barras Detalhadas */}
          <div className="flex-1 min-h-0">
            <CategoryBarChart
              data={data}
              context={context}
              referenceData={referenceData}
              showPieChart={showPieChart}
              onCategoryClick={onCategoryClick}
              categoryUrlResolver={categoryUrlResolver}
              countLabel={config.countLabel}
              showComparison={config.showComparison}
              maxHeight={calculatedMaxHeight}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CategoryDistributionChart