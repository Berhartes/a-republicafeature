import { ReactNode, useMemo } from 'react'
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

export interface BaseChartProps {
  data: any[]
  height?: number
  className?: string
  loading?: boolean
  error?: string
  emptyMessage?: string
  title?: string
  description?: string
}

export const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#6b7280'
} as const

export const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
]

interface ChartContainerProps extends BaseChartProps {
  children: ReactNode
}

export function ChartContainer({ 
  data, 
  loading, 
  error, 
  emptyMessage = 'Nenhum dado disponível',
  title,
  description,
  className,
  children 
}: ChartContainerProps) {
  if (loading) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando gráfico...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-red-600">
            <span>Erro ao carregar gráfico: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        {(title || description) && (
          <CardHeader>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <span>{emptyMessage}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}

// Componente de gráfico de barras reutilizável
interface BarChartWrapperProps extends BaseChartProps {
  dataKey: string
  xAxisKey: string
  color?: string
  showGrid?: boolean
  showLegend?: boolean
}

export function BarChartWrapper({
  data,
  height = 300,
  dataKey,
  xAxisKey,
  color = CHART_COLORS.primary,
  showGrid = true,
  showLegend = false,
  ...containerProps
}: BarChartWrapperProps) {
  return (
    <ChartContainer data={data} {...containerProps}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
            {showLegend && <Legend />}
            <Bar dataKey={dataKey} fill={color} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

// Componente de gráfico de pizza reutilizável
interface PieChartWrapperProps extends BaseChartProps {
  dataKey: string
  nameKey: string
  showLabels?: boolean
}

export function PieChartWrapper({
  data,
  height = 300,
  dataKey,
  nameKey,
  showLabels = true,
  ...containerProps
}: PieChartWrapperProps) {
  const chartData = useMemo(() => 
    data.map((item, index) => ({
      ...item,
      fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    })), [data]
  )

  return (
    <ChartContainer data={data} {...containerProps}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey={dataKey}
              label={showLabels ? ({ name, percent }) => 
                percent > 0.05 ? `${name}: ${(percent * 100).toFixed(1)}%` : null
              : false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

// Componente de gráfico de linha reutilizável
interface LineChartWrapperProps extends BaseChartProps {
  dataKey: string
  xAxisKey: string
  color?: string
  showGrid?: boolean
  showLegend?: boolean
}

export function LineChartWrapper({
  data,
  height = 300,
  dataKey,
  xAxisKey,
  color = CHART_COLORS.primary,
  showGrid = true,
  showLegend = false,
  ...containerProps
}: LineChartWrapperProps) {
  return (
    <ChartContainer data={data} {...containerProps}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}

// Componente de gráfico de área reutilizável
interface AreaChartWrapperProps extends BaseChartProps {
  dataKey: string
  xAxisKey: string
  color?: string
  showGrid?: boolean
  showLegend?: boolean
}

export function AreaChartWrapper({
  data,
  height = 300,
  dataKey,
  xAxisKey,
  color = CHART_COLORS.primary,
  showGrid = true,
  showLegend = false,
  ...containerProps
}: AreaChartWrapperProps) {
  return (
    <ChartContainer data={data} {...containerProps}>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              fill={color}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainer>
  )
}