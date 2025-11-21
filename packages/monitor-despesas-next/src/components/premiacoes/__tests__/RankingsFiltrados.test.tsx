import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RankingsFiltrados } from '../RankingsFiltrados'
import type { DeputadoProcessado } from '@/types/etl-deputados.types'

// Mock UnifiedRankingDisplay
vi.mock('@/components/unified/UnifiedRankingDisplay', () => ({
  UnifiedRankingDisplay: ({ deputados }: { deputados: DeputadoProcessado[] }) => (
    <div data-testid="unified-ranking-display">
      {deputados.map((d) => (
        <div key={d.id} data-testid={`deputado-${d.id}`}>
          {d.nomeEleitoral}
        </div>
      ))}
    </div>
  ),
}))

describe('RankingsFiltrados', () => {
  const mockDeputados: DeputadoProcessado[] = Array.from({ length: 120 }, (_, i) => ({
    id: `dep-${i}`,
    nomeEleitoral: `Deputado ${i}`,
    siglaPartido: 'PT',
    siglaUf: 'SP',
    foto: '',
    totalGastos: 100000 - i * 100,
    totalTransacoes: 100,
    mediaTransacao: 1000,
    gastosPorAno: { 2024: 50000 },
    transacoesPorAno: { 2024: 50 },
    topCategorias: [],
    topFornecedores: [],
    scoreSuspeicao: 0,
    classificacaoRisco: 'Baixo' as const,
    alertas: [],
    ultimaAtualizacao: '2024-01-01',
    anosDisponiveis: [2024],
    dadosCompletos: true,
  }))

  it('should render with initial 50 deputados', () => {
    render(
      <RankingsFiltrados
        ranking={mockDeputados}
        titulo="Top Deputados"
      />
    )

    expect(screen.getByText('Top Deputados')).toBeInTheDocument()
    expect(screen.getByText('Exibindo 50 de 120 deputados')).toBeInTheDocument()
  })

  it('should show "Ver mais" button when there are more deputados', () => {
    render(
      <RankingsFiltrados
        ranking={mockDeputados}
        titulo="Top Deputados"
      />
    )

    const button = screen.getByRole('button', { name: /Ver mais \+50 deputados/ })
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('70 restantes')
  })

  it('should load more deputados when "Ver mais" is clicked', () => {
    render(
      <RankingsFiltrados
        ranking={mockDeputados}
        titulo="Top Deputados"
      />
    )

    const button = screen.getByRole('button', { name: /Ver mais \+50 deputados/ })
    fireEvent.click(button)

    expect(screen.getByText('Exibindo 100 de 120 deputados')).toBeInTheDocument()
    expect(button).toHaveTextContent('20 restantes')
  })

  it('should hide "Ver mais" button when all deputados are shown', () => {
    render(
      <RankingsFiltrados
        ranking={mockDeputados.slice(0, 30)}
        titulo="Top Deputados"
      />
    )

    expect(screen.queryByRole('button', { name: /Ver mais/ })).not.toBeInTheDocument()
  })

  it('should pass correct props to UnifiedRankingDisplay', () => {
    const mockOnClick = vi.fn()
    const mockPremiacoes = {
      coroas: [],
      trofeus: [],
      medalhas: [],
      coroasOuro: [],
      trofeusPrata: [],
      medalhasBronze: [],
      badgesEspeciais: [],
      estatisticas: { totalPremiacoes: 0 },
    }

    render(
      <RankingsFiltrados
        ranking={mockDeputados}
        titulo="Top Deputados"
        onDeputadoClick={mockOnClick}
        premiacoes={mockPremiacoes}
      />
    )

    expect(screen.getByTestId('unified-ranking-display')).toBeInTheDocument()
  })
})
