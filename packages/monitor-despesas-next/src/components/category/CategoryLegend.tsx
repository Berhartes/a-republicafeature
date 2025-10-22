import React from 'react'
import { CategoryLegendProps } from './CategoryDistributionChart.types'

export const CategoryLegend: React.FC<CategoryLegendProps> = ({
  context,
  labels,
  showPieChart
}) => {
  if (showPieChart) return null

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
      {/* Indicador principal */}
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-blue-500 rounded opacity-80"></div>
        <span>{labels.primary}</span>
      </div>
      
      {/* Indicador de referência (média) */}
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border-2 border-dashed border-blue-500 rounded opacity-70"></div>
        <span>{labels.reference}</span>
      </div>
      
      {/* Indicador de máximo/recorde */}
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 border-2 border-dotted border-red-500 rounded opacity-60"></div>
        <span className="text-purple-600">🏆 {labels.maximum}</span>
      </div>
    </div>
  )
}