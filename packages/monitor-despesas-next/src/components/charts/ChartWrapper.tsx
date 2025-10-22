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
import { cn } from '@/lib/utils'

interface BaseChartProps {
  data: any[]
  height?: number
  className?: string
  loading?: boolean
  error?: string
  emptyMessage?: string
}

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  muted: '#6b7280'
} as const

const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1'  // indigo
] as const

interface ChartWrapperProps extends BaseChartProps {
  title?: string
  children: ReactNode
}

function ChartWrapper({ 
  data, 
  height = 300, 
  className, 
  loading, 
  error, 
  emptyMessage = 'Nenhum dado disponível',
  title,
  children 
}: ChartWrapperProps) {
  if (loading) {
    return (
      <div className={cn('flex items-center justify-center border rounded-lg', className)} style={{ height }}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          <span>Carregando gráfico...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center border rounded-lg bg-destructive/10', className)} style={{ height }}>
        <div className="text-center text-destructive">
          <p className="font-medium">Erro ao carregar gráfico</p>
          <p className="text-sm mt-1 opacity-80">{error}</p>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center border rounded-lg bg-muted/20', className)} style={{ height }}>
        <div className="text-center text-muted-foreground">
          <p>{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('border rounded-lg p-4 bg-card', className)}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      )}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface BarChartWrapperProps extends BaseChartProps {
  title?: string
  xKey: string
  yKey: string
  color?: keyof typeof CHART_COLORS
  showGrid?: boolean
  showLegend?: boolean
  formatValue?: (value: any) => string
  formatLabel?: (label: any) => string
}

export function BarChartWrapper({
  data,
  height = 300,
  className,
  loading,
  error,
  emptyMessage,
  title,
  xKey,
  yKey,
  color = 'primary',
  showGrid = true,
  showLegend = false,
  formatValue,
  formatLabel
}: BarChartWrapperProps) {
  const chartColor = CHART_COLORS[color]

  const customTooltip = useMemo(() => ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium">{formatLabel ? formatLabel(label) : label}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue ? formatValue(value) : value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }, [formatValue, formatLabel])

  return (
    <ChartWrapper
      data={data}
      height={height}
      className={className}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      title={title}
    >
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
        <XAxis 
          dataKey={xKey} 
          className="text-xs"
          tickFormatter={formatLabel}
        />
        <YAxis 
          className="text-xs"
          tickFormatter={formatValue}
        />
        <Tooltip content={customTooltip} />
        {showLegend && <Legend />}
        <Bar 
          dataKey={yKey} 
          fill={chartColor}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartWrapper>
  )
}

interface PieChartWrapperProps extends BaseChartProps {
  title?: string
  nameKey: string
  valueKey: string
  showLabels?: boolean
  formatValue?: (value: any) => string
  formatLabel?: (entry: any) => string
}

export function PieChartWrapper({
  data,
  height = 300,
  className,
  loading,
  error,
  emptyMessage,
  title,
  nameKey,
  valueKey,
  showLabels = true,
  formatValue,
  formatLabel
}: PieChartWrapperProps) {
  const customTooltip = useMemo(() => ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium">{formatLabel ? formatLabel(data) : data[nameKey]}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue ? formatValue(data[valueKey]) : data[valueKey].toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }, [nameKey, valueKey, formatValue, formatLabel])

  const renderLabel = useMemo(() => (entry: any) => {
    if (!showLabels) return null
    const name = formatLabel ? formatLabel(entry) : entry[nameKey]
    return name.length > 15 ? `${name.substring(0, 12)}...` : name
  }, [nameKey, showLabels, formatLabel])

  return (
    <ChartWrapper
      data={data}
      height={height}
      className={className}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      title={title}
    >
      <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={Math.min(height / 3, 120)}
          fill="#8884d8"
          dataKey={valueKey}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={customTooltip} />
      </PieChart>
    </ChartWrapper>
  )
}

interface LineChartWrapperProps extends BaseChartProps {
  title?: string
  xKey: string
  yKey: string
  color?: keyof typeof CHART_COLORS
  showGrid?: boolean
  showDots?: boolean
  strokeWidth?: number
  formatValue?: (value: any) => string
  formatLabel?: (label: any) => string
}

export function LineChartWrapper({
  data,
  height = 300,
  className,
  loading,
  error,
  emptyMessage,
  title,
  xKey,
  yKey,
  color = 'primary',
  showGrid = true,
  showDots = true,
  strokeWidth = 2,
  formatValue,
  formatLabel
}: LineChartWrapperProps) {
  const chartColor = CHART_COLORS[color]

  const customTooltip = useMemo(() => ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium">{formatLabel ? formatLabel(label) : label}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue ? formatValue(value) : value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }, [formatValue, formatLabel])

  return (
    <ChartWrapper
      data={data}
      height={height}
      className={className}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      title={title}
    >
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
        <XAxis 
          dataKey={xKey} 
          className="text-xs"
          tickFormatter={formatLabel}
        />
        <YAxis 
          className="text-xs"
          tickFormatter={formatValue}
        />
        <Tooltip content={customTooltip} />
        <Line 
          type="monotone" 
          dataKey={yKey} 
          stroke={chartColor}
          strokeWidth={strokeWidth}
          dot={showDots ? { fill: chartColor, strokeWidth: 2, r: 4 } : false}
          activeDot={{ r: 6, fill: chartColor }}
        />
      </LineChart>
    </ChartWrapper>
  )
}

interface AreaChartWrapperProps extends BaseChartProps {
  title?: string
  xKey: string
  yKey: string
  color?: keyof typeof CHART_COLORS
  showGrid?: boolean
  fillOpacity?: number
  formatValue?: (value: any) => string
  formatLabel?: (label: any) => string
}

export function AreaChartWrapper({
  data,
  height = 300,
  className,
  loading,
  error,
  emptyMessage,
  title,
  xKey,
  yKey,
  color = 'primary',
  showGrid = true,
  fillOpacity = 0.3,
  formatValue,
  formatLabel
}: AreaChartWrapperProps) {
  const chartColor = CHART_COLORS[color]

  const customTooltip = useMemo(() => ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-md">
          <p className="font-medium">{formatLabel ? formatLabel(label) : label}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue ? formatValue(value) : value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }, [formatValue, formatLabel])

  return (
    <ChartWrapper
      data={data}
      height={height}
      className={className}
      loading={loading}
      error={error}
      emptyMessage={emptyMessage}
      title={title}
    >
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="opacity-30" />}
        <XAxis 
          dataKey={xKey} 
          className="text-xs"
          tickFormatter={formatLabel}
        />
        <YAxis 
          className="text-xs"
          tickFormatter={formatValue}
        />
        <Tooltip content={customTooltip} />
        <Area 
          type="monotone" 
          dataKey={yKey} 
          stroke={chartColor}
          fill={chartColor}
          fillOpacity={fillOpacity}
          strokeWidth={2}
        />
      </AreaChart>
    </ChartWrapper>
  )
}