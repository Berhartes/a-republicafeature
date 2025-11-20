import React from 'react'
import { useNavigate } from '@/lib/router/navigation'
import { CategoryBarItemProps, CategoryData } from './CategoryDistributionChart.types'
import {
  calculateBarPercentages,
  calculateComparison,
  calculateRecordPercentage,
  formatCurrency,
  getCategoryColor,
  getComparisonClasses
} from './CategoryDistributionChart.utils'

export const CategoryBarItem: React.FC<CategoryBarItemProps> = ({
  item,
  index,
  context,
  referenceData,
  showPieChart,
  onCategoryClick,
  countLabel,
  showComparison,
  allData
}) => {
  const navigate = useNavigate()
  const categoryColor = item.cor || getCategoryColor(item.categoria)
  const mediaCategoria = referenceData?.media || 0
  const maxCategoria = referenceData?.maximo || 0
  const recordista = referenceData?.recordista

  const percentages = calculateBarPercentages(item, referenceData, allData)
  const comparison = calculateComparison(item.valor, mediaCategoria)
  const recordPercentage = calculateRecordPercentage(item.valor, maxCategoria)

  const isClickable = Boolean(onCategoryClick)

  const handleCategoryClick = () => {
    if (onCategoryClick) {
      onCategoryClick(item.categoria)
    }
  }

  return (
    <div className="space-y-2">
      {/* Header com nome da categoria e valor */}
      <div
        className={`flex items-start justify-between text-sm gap-4 ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={isClickable ? handleCategoryClick : undefined}
      >
        <div className="flex items-center gap-2 flex-1">
          <span className="font-medium leading-relaxed">{item.categoria}</span>
          <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-full text-gray-700">
            {item.percentual}
          </span>
        </div>
        <div className="text-right">
          <div className="font-semibold whitespace-nowrap">
            R$ {formatCurrency(item.valor, context)}
          </div>
          {context === 'perfil-deputado' && mediaCategoria > 0 && (
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>Média: R$ {formatCurrency(mediaCategoria, context)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Sistema de barras comparativas */}
      <div
        className={`relative w-full bg-muted rounded-full h-5 ring-1 ring-border ${isClickable ? 'cursor-pointer' : ''}`}
        onClick={isClickable ? handleCategoryClick : undefined}
      >
        {/* Barra do valor máximo (referência - fundo) */}
        {maxCategoria > 0 && (context === 'perfil-deputado' || index === 0) && (
          <div 
            className="absolute top-0 left-0 h-5 rounded-full transition-all duration-500 border-2 border-dotted"
            style={{ 
              width: `${percentages.maximo}%`,
              backgroundColor: 'transparent',
              borderColor: '#ef4444',
              opacity: 0.6
            }}
          />
        )}
        
        {/* Barra da média */}
        {mediaCategoria > 0 && (
          <div 
            className="absolute top-0 left-0 h-5 rounded-full transition-all duration-500 border-2 border-dashed"
            style={{ 
              width: `${percentages.media}%`,
              backgroundColor: 'transparent',
              borderColor: categoryColor,
              opacity: 0.7
            }}
          />
        )}
        
        {/* Barra principal */}
        <div 
          className="absolute top-0 left-0 h-5 rounded-full shadow-sm transition-all duration-500" 
          style={{ 
            width: `${percentages.principal}%`,
            background: `linear-gradient(to right, ${categoryColor}, ${categoryColor}CC)`,
            opacity: 0.9
          }}
        />
      </div>

      {/* Informações detalhadas */}
      <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
        {/* Contador (fornecedores/transações) */}
        {item.count !== undefined && context === 'fornecedores-page' && (
          <div>{item.count} {countLabel}</div>
        )}
        
        {/* Média para fornecedores */}
        {context === 'fornecedores-page' && item.count && item.count > 0 && (
          <div>Média: R$ {formatCurrency(item.valor / item.count, context)}</div>
        )}
        
        {/* Análise comparativa para deputados */}
        {showComparison && mediaCategoria > 0 && (
          <div>
            <span className={getComparisonClasses(comparison.tipo)}>
              {comparison.formatado}
            </span>
          </div>
        )}
        
        {/* Informações do recorde */}
        {maxCategoria > 0 && (
          <div>
            <span className="text-red-600">
              {recordPercentage.formatado}
            </span>
          </div>
        )}
        
        {/* Informações do recordista */}
        {recordista && maxCategoria > 0 && context === 'perfil-deputado' && (
          <div>
            <span className="text-purple-600 font-medium">
              🏆 {recordista.nomeEleitoral}
              {recordista.siglaPartido && recordista.siglaUf && (
                <span className="text-gray-500"> ({recordista.siglaPartido}-{recordista.siglaUf})</span>
              )}
              <span className="text-gray-600"> - R$ {formatCurrency(maxCategoria, context)}</span>
            </span>
          </div>
        )}
        
        {/* Link para categoria (fornecedores) */}
        {context === 'fornecedores-page' && (onCategoryClick) && (
          <div 
            className="cursor-pointer hover:underline"
            onClick={handleCategoryClick}
          >
            <span className="text-blue-600">
              → Ver todos os {item.count || 0} {countLabel} desta categoria
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

interface CategoryBarChartProps {
  data: CategoryData[]
  context: 'fornecedores-page' | 'perfil-deputado'
  referenceData?: Record<string, import('./CategoryDistributionChart.types').ReferenceData>
  showPieChart: boolean
  onCategoryClick?: (categoria: string) => void
  countLabel?: string
  showComparison?: boolean
  maxHeight?: number
}

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({
  data,
  context,
  referenceData,
  showPieChart,
  onCategoryClick,
  countLabel,
  showComparison,
  maxHeight
}) => {
  return (
    <div 
      className={`space-y-4 overflow-y-auto pr-2 h-full`}
      style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
    >
      {data.map((item, index) => (
        <CategoryBarItem
          key={`${item.categoria}-${index}`}
          item={item}
          index={index}
          context={context}
          referenceData={referenceData?.[item.categoria]}
          showPieChart={showPieChart}
          onCategoryClick={onCategoryClick}
          countLabel={countLabel}
          showComparison={showComparison}
          allData={data}
        />
      ))}
      
      {/* Indicador de scroll */}
      {data.length > 7 && (
        <div className="text-center text-xs text-muted-foreground mt-4 pt-2 border-t">
          <span className="bg-gray-100 px-2 py-1 rounded">
            ↓ Role para ver todas as {data.length} categorias ↓
          </span>
        </div>
      )}
    </div>
  )
}