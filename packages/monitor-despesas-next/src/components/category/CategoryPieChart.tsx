import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts'
import { CategoryPieChartProps } from './CategoryDistributionChart.types'
import { shouldShowPieLabel, truncateCategory, getCategoryColor, formatCurrency } from './CategoryDistributionChart.utils'

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({
  data,
  height = 300
}) => {
  return (
    <div className="mb-6">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percentual, categoria }) => {
              if (!shouldShowPieLabel(percentual, categoria)) return ''
              const categoriaCompacta = truncateCategory(categoria, 25)
              return `${categoriaCompacta}: ${percentual}%`
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="valor"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.cor || getCategoryColor(entry.categoria)} 
              />
            ))}
          </Pie>
          <RechartsTooltip 
            formatter={(value: number) => [
              `R$ ${formatCurrency(value, 'fornecedores-page')}`,
              'Valor'
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return payload[0].payload.categoria
              }
              return label
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}