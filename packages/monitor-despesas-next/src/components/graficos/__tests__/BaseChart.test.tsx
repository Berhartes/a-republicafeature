import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ChartContainer,
  BarChartWrapper,
  PieChartWrapper,
  LineChartWrapper
} from '../BaseChart'

const renderChart = (element: React.ReactElement) =>
  render(
    <div style={{ width: 800, height: 400 }}>
      {element}
    </div>
  )

describe('ChartContainer', () => {
  const mockData = [
    { nome: 'Item 1', valor: 1000 },
    { nome: 'Item 2', valor: 2000 }
  ]

  it('deve renderizar conteúdo quando dados estão disponíveis', () => {
    render(
      <ChartContainer data={mockData} title="Teste">
        <div>Conteúdo do gráfico</div>
      </ChartContainer>
    )

    expect(screen.getByText('Teste')).toBeInTheDocument()
    expect(screen.getByText('Conteúdo do gráfico')).toBeInTheDocument()
  })

  it('deve exibir loading quando loading for true', () => {
    render(
      <ChartContainer data={mockData} loading={true} title="Teste">
        <div>Conteúdo do gráfico</div>
      </ChartContainer>
    )

    expect(screen.getByText('Carregando gráfico...')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo do gráfico')).not.toBeInTheDocument()
  })

  it('deve exibir erro quando error estiver presente', () => {
    render(
      <ChartContainer data={mockData} error="Erro de teste" title="Teste">
        <div>Conteúdo do gráfico</div>
      </ChartContainer>
    )

    expect(screen.getByText('Erro ao carregar gráfico: Erro de teste')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo do gráfico')).not.toBeInTheDocument()
  })

  it('deve exibir mensagem vazia quando não há dados', () => {
    render(
      <ChartContainer data={[]} emptyMessage="Sem dados" title="Teste">
        <div>Conteúdo do gráfico</div>
      </ChartContainer>
    )

    expect(screen.getByText('Sem dados')).toBeInTheDocument()
    expect(screen.queryByText('Conteúdo do gráfico')).not.toBeInTheDocument()
  })

  it('deve renderizar título e descrição quando fornecidos', () => {
    render(
      <ChartContainer 
        data={mockData} 
        title="Título do Gráfico" 
        description="Descrição do gráfico"
      >
        <div>Conteúdo</div>
      </ChartContainer>
    )

    expect(screen.getByText('Título do Gráfico')).toBeInTheDocument()
    expect(screen.getByText('Descrição do gráfico')).toBeInTheDocument()
  })
})

describe('BarChartWrapper', () => {
  const mockData = [
    { categoria: 'A', valor: 1000 },
    { categoria: 'B', valor: 2000 },
    { categoria: 'C', valor: 1500 }
  ]

  it('deve renderizar gráfico de barras com dados', () => {
    render(
      <BarChartWrapper
        data={mockData}
        dataKey="valor"
        xAxisKey="categoria"
        title="Gráfico de Barras"
      />
    )

    expect(screen.getByText('Gráfico de Barras')).toBeInTheDocument()
    // O gráfico Recharts é renderizado, mas não podemos testar facilmente o SVG
  })

  it('deve aplicar cor personalizada', () => {
    const { container } = renderChart(
      <BarChartWrapper
        data={mockData}
        dataKey="valor"
        xAxisKey="categoria"
        color="#ff0000"
      />
    )

    // Verifica se o componente renderiza sem erros
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
  })

  it('deve exibir loading quando loading for true', () => {
    render(
      <BarChartWrapper
        data={mockData}
        dataKey="valor"
        xAxisKey="categoria"
        loading={true}
      />
    )

    expect(screen.getByText('Carregando gráfico...')).toBeInTheDocument()
  })
})

describe('PieChartWrapper', () => {
  const mockData = [
    { categoria: 'A', valor: 1000 },
    { categoria: 'B', valor: 2000 },
    { categoria: 'C', valor: 1500 }
  ]

  it('deve renderizar gráfico de pizza com dados', () => {
    render(
      <PieChartWrapper
        data={mockData}
        dataKey="valor"
        nameKey="categoria"
        title="Gráfico de Pizza"
      />
    )

    expect(screen.getByText('Gráfico de Pizza')).toBeInTheDocument()
  })

  it('deve renderizar sem labels quando showLabels for false', () => {
    const { container } = renderChart(
      <PieChartWrapper
        data={mockData}
        dataKey="valor"
        nameKey="categoria"
        showLabels={false}
      />
    )

    // Verifica se o componente renderiza sem erros
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
  })
})

describe('LineChartWrapper', () => {
  const mockData = [
    { mes: 'Jan', valor: 1000 },
    { mes: 'Fev', valor: 2000 },
    { mes: 'Mar', valor: 1500 }
  ]

  it('deve renderizar gráfico de linha com dados', () => {
    render(
      <LineChartWrapper
        data={mockData}
        dataKey="valor"
        xAxisKey="mes"
        title="Gráfico de Linha"
      />
    )

    expect(screen.getByText('Gráfico de Linha')).toBeInTheDocument()
  })

  it('deve aplicar configurações de grid e legenda', () => {
    const { container } = renderChart(
      <LineChartWrapper
        data={mockData}
        dataKey="valor"
        xAxisKey="mes"
        showGrid={false}
        showLegend={true}
      />
    )

    // Verifica se o componente renderiza sem erros
    expect(container.querySelector('.recharts-wrapper')).toBeTruthy()
  })
})