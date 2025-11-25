import { useMemo } from 'react'
import { BarChartWrapper, PieChartWrapper, LineChartWrapper, BaseChartProps } from '@/components/ui/charts/BaseChart'

interface GastosPorDeputadoProps extends Omit<BaseChartProps, 'data'> {
  deputados: Array<{
    nome: string
    valorTotal: number
    partido?: string
    uf?: string
  }>
}

export function GastosPorDeputado({ deputados, ...props }: GastosPorDeputadoProps) {
  const data = useMemo(() =>
    deputados.map(dep => ({
      nome: dep.nome.length > 15 ? `${dep.nome.substring(0, 15)}...` : dep.nome,
      valor: dep.valorTotal,
      partido: dep.partido,
      uf: dep.uf
    })), [deputados]
  )

  return (
    <BarChartWrapper
      data={data}
      dataKey="valor"
      xAxisKey="nome"
      title="Gastos por Deputado"
      description="Ranking dos deputados por volume de gastos"
      {...props}
    />
  )
}

interface GastosPorCategoriaProps extends Omit<BaseChartProps, 'data'> {
  categorias: Array<{
    categoria: string
    valor: number
    percentual?: string
  }>
  tipo?: 'barra' | 'pizza'
}

export function GastosPorCategoria({ categorias, tipo = 'barra', ...props }: GastosPorCategoriaProps) {
  const data = useMemo(() =>
    categorias.map(cat => ({
      nome: cat.categoria,
      valor: cat.valor,
      percentual: cat.percentual
    })), [categorias]
  )

  if (tipo === 'pizza') {
    return (
      <PieChartWrapper
        data={data}
        dataKey="valor"
        nameKey="nome"
        title="Distribuição por Categoria"
        description="Proporção dos gastos por categoria"
        {...props}
      />
    )
  }

  return (
    <BarChartWrapper
      data={data}
      dataKey="valor"
      xAxisKey="nome"
      title="Gastos por Categoria"
      description="Volume de gastos por categoria"
      {...props}
    />
  )
}

interface EvolucaoTemporalProps extends Omit<BaseChartProps, 'data'> {
  evolucao: Array<{
    periodo: string
    valor: number
    transacoes?: number
  }>
  tipo?: 'linha' | 'area'
}

export function EvolucaoTemporal({ evolucao, tipo = 'linha', ...props }: EvolucaoTemporalProps) {
  const data = useMemo(() =>
    evolucao.map(item => ({
      periodo: item.periodo,
      valor: item.valor,
      transacoes: item.transacoes
    })), [evolucao]
  )

  if (tipo === 'area') {
    return (
      <LineChartWrapper
        data={data}
        dataKey="valor"
        xAxisKey="periodo"
        title="Evolução dos Gastos"
        description="Evolução temporal dos gastos"
        {...props}
      />
    )
  }

  return (
    <LineChartWrapper
      data={data}
      dataKey="valor"
      xAxisKey="periodo"
      title="Evolução dos Gastos"
      description="Evolução temporal dos gastos"
      {...props}
    />
  )
}

interface FornecedoresChartProps extends Omit<BaseChartProps, 'data'> {
  fornecedores: Array<{
    nome: string
    valorTotal: number
    totalTransacoes?: number
  }>
}

export function TopFornecedores({ fornecedores, ...props }: FornecedoresChartProps) {
  const data = useMemo(() =>
    fornecedores.slice(0, 10).map(forn => ({
      nome: forn.nome.length > 20 ? `${forn.nome.substring(0, 20)}...` : forn.nome,
      valor: forn.valorTotal,
      transacoes: forn.totalTransacoes
    })), [fornecedores]
  )

  return (
    <BarChartWrapper
      data={data}
      dataKey="valor"
      xAxisKey="nome"
      title="Top 10 Fornecedores"
      description="Fornecedores com maior volume de negócios"
      {...props}
    />
  )
}

interface GastosPorPartidoProps extends Omit<BaseChartProps, 'data'> {
  partidos: Array<{
    partido: string
    valorTotal: number
    deputados?: number
  }>
}

export function GastosPorPartido({ partidos, ...props }: GastosPorPartidoProps) {
  const data = useMemo(() =>
    partidos.map(partido => ({
      nome: partido.partido,
      valor: partido.valorTotal,
      deputados: partido.deputados
    })), [partidos]
  )

  return (
    <BarChartWrapper
      data={data}
      dataKey="valor"
      xAxisKey="nome"
      title="Gastos por Partido"
      description="Volume de gastos por partido político"
      {...props}
    />
  )
}

interface GastosPorEstadoProps extends Omit<BaseChartProps, 'data'> {
  estados: Array<{
    uf: string
    valorTotal: number
    deputados?: number
  }>
}

export function GastosPorEstado({ estados, ...props }: GastosPorEstadoProps) {
  const data = useMemo(() =>
    estados.map(estado => ({
      nome: estado.uf,
      valor: estado.valorTotal,
      deputados: estado.deputados
    })), [estados]
  )

  return (
    <BarChartWrapper
      data={data}
      dataKey="valor"
      xAxisKey="nome"
      title="Gastos por Estado"
      description="Volume de gastos por unidade federativa"
      {...props}
    />
  )
}

interface ScoreSuspeicaoProps extends Omit<BaseChartProps, 'data'> {
  scores: Array<{
    nome: string
    score: number
    tipo: 'deputado' | 'fornecedor'
  }>
}

export function ScoreSuspeicao({ scores, ...props }: ScoreSuspeicaoProps) {
  const data = useMemo(() =>
    scores.map(item => ({
      nome: item.nome.length > 15 ? `${item.nome.substring(0, 15)}...` : item.nome,
      score: item.score,
      tipo: item.tipo
    })), [scores]
  )

  return (
    <BarChartWrapper
      data={data}
      dataKey="score"
      xAxisKey="nome"
      color="#ef4444"
      title="Score de Suspeição"
      description="Entidades com maior score de suspeição"
      {...props}
    />
  )
}



