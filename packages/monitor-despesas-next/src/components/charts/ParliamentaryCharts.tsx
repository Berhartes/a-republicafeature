import { BarChartWrapper, PieChartWrapper, LineChartWrapper, AreaChartWrapper } from './ChartWrapper'
import type { DeputadoProcessado } from '@/components/lista-deputados/hooks/useListaDeputadosData'
import type { AlertaSuspeito, FornecedorSuspeito } from '@/types/gastos'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `R$ ${(value / 1000).toFixed(0)}K`
  }
  return formatCurrency(value)
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value)
}

interface GastosPorDeputadoChartProps {
  deputados: DeputadoProcessado[]
  limit?: number
  height?: number
  className?: string
  loading?: boolean
}

export function GastosPorDeputadoChart({ 
  deputados, 
  limit = 10, 
  height = 400,
  className,
  loading 
}: GastosPorDeputadoChartProps) {
  const data = deputados
    .slice(0, limit)
    .map(d => ({
      nome: d.nomeEleitoral.length > 20 ? `${d.nomeEleitoral.substring(0, 17)}...` : d.nomeEleitoral,
      nomeCompleto: d.nomeEleitoral,
      gastos: d.totalGasto,
      partido: d.siglaPartido,
      uf: d.siglaUf
    }))

  return (
    <BarChartWrapper
      title={`Top ${limit} Deputados por Gastos`}
      data={data}
      xKey="nome"
      yKey="gastos"
      height={height}
      className={className}
      loading={loading}
      color="primary"
      showGrid={true}
      formatValue={formatCompactCurrency}
      formatLabel={(label) => data.find(d => d.nomeEleitoral === label)?.nomeCompleto || label}
      emptyMessage="Nenhum dado de deputado disponível"
    />
  )
}

interface GastosPorPartidoChartProps {
  deputados: DeputadoProcessado[]
  height?: number
  className?: string
  loading?: boolean
  onPartidoClick?: (partido: string) => void
}

export function GastosPorPartidoChart({ 
  deputados, 
  height = 350,
  className,
  loading,
  onPartidoClick 
}: GastosPorPartidoChartProps) {
  const data = Object.entries(
    deputados.reduce((acc, d) => {
      acc[d.siglaPartido] = (acc[d.siglaPartido] || 0) + d.totalGasto
      return acc
    }, {} as Record<string, number>)
  )
    .map(([partido, total]) => ({ 
      partido, 
      total,
      deputados: deputados.filter(d => d.siglaPartido === partido).length
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15)

  return (
    <PieChartWrapper
      title="Gastos por Partido"
      data={data}
      nameKey="partido"
      valueKey="total"
      height={height}
      className={className}
      loading={loading}
      showLabels={true}
      formatValue={formatCurrency}
      formatLabel={(entry) => `${entry.siglaPartido} (${entry.deputados} dep.)`}
      emptyMessage="Nenhum dado de partido disponível"
    />
  )
}

interface GastosPorEstadoChartProps {
  deputados: DeputadoProcessado[]
  height?: number
  className?: string
  loading?: boolean
  onEstadoClick?: (uf: string) => void
}

export function GastosPorEstadoChart({ 
  deputados, 
  height = 400,
  className,
  loading,
  onEstadoClick 
}: GastosPorEstadoChartProps) {
  const data = Object.entries(
    deputados.reduce((acc, d) => {
      acc[d.siglaUf] = (acc[d.siglaUf] || 0) + d.totalGasto
      return acc
    }, {} as Record<string, number>)
  )
    .map(([uf, total]) => ({ 
      uf, 
      total,
      deputados: deputados.filter(d => d.siglaUf === uf).length
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <BarChartWrapper
      title="Gastos por Estado"
      data={data}
      xKey="uf"
      yKey="total"
      height={height}
      className={className}
      loading={loading}
      color="secondary"
      showGrid={true}
      formatValue={formatCompactCurrency}
      formatLabel={(uf) => {
        const item = data.find(d => d.siglaUf === uf)
        return item ? `${uf} (${item.deputados} dep.)` : uf
      }}
      emptyMessage="Nenhum dado de estado disponível"
    />
  )
}

interface ScoreSuspeicaoChartProps {
  deputados: DeputadoProcessado[]
  limit?: number
  height?: number
  className?: string
  loading?: boolean
}

export function ScoreSuspeicaoChart({ 
  deputados, 
  limit = 15,
  height = 400,
  className,
  loading 
}: ScoreSuspeicaoChartProps) {
  const data = deputados
    .filter(d => d.scoreSuspeicao > 0)
    .slice(0, limit)
    .map(d => ({
      nome: d.nomeEleitoral.length > 20 ? `${d.nomeEleitoral.substring(0, 17)}...` : d.nomeEleitoral,
      nomeCompleto: d.nomeEleitoral,
      score: d.scoreSuspeicao,
      alertas: d.alertas.length,
      partido: d.siglaPartido
    }))

  return (
    <BarChartWrapper
      title={`Top ${limit} Deputados por Score de Suspeição`}
      data={data}
      xKey="nome"
      yKey="score"
      height={height}
      className={className}
      loading={loading}
      color="danger"
      showGrid={true}
      formatValue={(value) => `${value.toFixed(1)} pts`}
      formatLabel={(label) => data.find(d => d.nomeEleitoral === label)?.nomeCompleto || label}
      emptyMessage="Nenhum deputado com score de suspeição"
    />
  )
}

interface EvolucaoGastosChartProps {
  data: Array<{ periodo: string; valor: number; mes: number; ano: number }>
  height?: number
  className?: string
  loading?: boolean
  type?: 'line' | 'area'
}

export function EvolucaoGastosChart({ 
  data, 
  height = 350,
  className,
  loading,
  type = 'area'
}: EvolucaoGastosChartProps) {
  const chartData = data.map(item => ({
    periodo: item.periodo,
    valor: item.valor,
    mes: item.mes,
    ano: item.ano
  }))

  const formatLabel = (periodo: string) => {
    const item = data.find(d => d.periodo === periodo)
    if (!item) return periodo
    
    const meses = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ]
    
    return `${meses[item.mes - 1]}/${item.ano.toString().slice(-2)}`
  }

  const ChartComponent = type === 'line' ? LineChartWrapper : AreaChartWrapper

  return (
    <ChartComponent
      title="Evolução dos Gastos"
      data={chartData}
      xKey="periodo"
      yKey="valor"
      height={height}
      className={className}
      loading={loading}
      color="info"
      showGrid={true}
      formatValue={formatCompactCurrency}
      formatLabel={formatLabel}
      emptyMessage="Nenhum dado temporal disponível"
    />
  )
}

interface AlertasPorTipoChartProps {
  alertas: AlertaSuspeito[]
  height?: number
  className?: string
  loading?: boolean
}

export function AlertasPorTipoChart({ 
  alertas, 
  height = 300,
  className,
  loading 
}: AlertasPorTipoChartProps) {
  const tipoNames = {
    'SUPERFATURAMENTO': 'Superfaturamento',
    'LIMITE_EXCEDIDO': 'Limite Excedido',
    'FORNECEDOR_SUSPEITO': 'Fornecedor Suspeito',
    'CONCENTRACAO_TEMPORAL': 'Concentração Temporal',
    'VALOR_REPETIDO': 'Valor Repetido'
  }

  const data = Object.entries(
    alertas.reduce((acc, alerta) => {
      const tipo = tipoNames[alerta.tipo as keyof typeof tipoNames] || alerta.tipo
      acc[tipo] = (acc[tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  )
    .map(([tipo, quantidade]) => ({ tipo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  return (
    <PieChartWrapper
      title="Distribuição de Alertas por Tipo"
      data={data}
      nameKey="tipo"
      valueKey="quantidade"
      height={height}
      className={className}
      loading={loading}
      showLabels={true}
      formatValue={formatNumber}
      emptyMessage="Nenhum alerta disponível"
    />
  )
}

interface TopFornecedoresChartProps {
  fornecedores: FornecedorSuspeito[]
  limit?: number
  height?: number
  className?: string
  loading?: boolean
}

export function TopFornecedoresChart({ 
  fornecedores, 
  limit = 10,
  height = 400,
  className,
  loading 
}: TopFornecedoresChartProps) {
  const data = fornecedores
    .filter(f => f.indiceSuspeicao > 0)
    .slice(0, limit)
    .map(f => ({
      nome: f.nomeEleitoral.length > 25 ? `${f.nomeEleitoral.substring(0, 22)}...` : f.nomeEleitoral,
      nomeCompleto: f.nomeEleitoral,
      indice: f.indiceSuspeicao,
      total: f.totalRecebido,
      deputados: f.deputadosAtendidos
    }))

  return (
    <BarChartWrapper
      title={`Top ${limit} Fornecedores Suspeitos`}
      data={data}
      xKey="nome"
      yKey="indice"
      height={height}
      className={className}
      loading={loading}
      color="warning"
      showGrid={true}
      formatValue={(value) => `${value.toFixed(1)} pts`}
      formatLabel={(label) => data.find(d => d.nomeEleitoral === label)?.nomeCompleto || label}
      emptyMessage="Nenhum fornecedor suspeito encontrado"
    />
  )
}