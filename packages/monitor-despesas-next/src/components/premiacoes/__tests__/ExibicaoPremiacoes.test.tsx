import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ExibicaoPremiacoes } from '../ExibicaoPremiacoes'
import type { PremiacoesProcessadas } from '@/types/etl-deputados.types'

describe('ExibicaoPremiacoes', () => {
  const mockPremiacoes: PremiacoesProcessadas = {
    coroas: [
      {
        deputadoId: '1',
        titulo: 'Campeão Geral',
        descricao: 'Maior gasto total',
        categoria: 'GERAL',
        valor: 1000000,
        nomeEleitoral: 'João Silva',
        siglaPartido: 'PT',
        siglaUf: 'SP',
        ano: 2024,
        posicao: 1
      }
    ],
    trofeus: [
      {
        deputadoId: '2',
        titulo: 'Campeão Anual',
        descricao: 'Maior gasto em 2024',
        categoria: 'COMBUSTIVEIS',
        valor: 500000,
        nomeEleitoral: 'Maria Santos',
        siglaPartido: 'PSDB',
        siglaUf: 'RJ',
        ano: 2024,
        posicao: 1
      }
    ],
    medalhas: [
      {
        deputadoId: '3',
        titulo: 'Menção Honrosa',
        descricao: 'Destaque em categoria',
        categoria: 'ALIMENTACAO',
        valor: 250000,
        nomeEleitoral: 'Pedro Costa',
        siglaPartido: 'MDB',
        siglaUf: 'MG',
        ano: 2024,
        posicao: 3
      }
    ],
    coroasOuro: [],
    trofeusPrata: [],
    medalhasBronze: [],
    badgesEspeciais: [],
    estatisticas: {
      totalPremiacoes: 3,
      totalCoroas: 1,
      totalTrofeus: 1,
      totalMedalhas: 1
    }
  }

  it('renders tabs with correct counters', () => {
    render(<ExibicaoPremiacoes premiacoes={mockPremiacoes} />)
    
    expect(screen.getByText(/Coroas \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Troféus \(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/Medalhas \(1\)/)).toBeInTheDocument()
  })

  it('renders coroas content correctly', () => {
    render(<ExibicaoPremiacoes premiacoes={mockPremiacoes} />)
    
    expect(screen.getByText('Campeões históricos')).toBeInTheDocument()
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('PT - SP')).toBeInTheDocument()
    expect(screen.getByText('GERAL')).toBeInTheDocument()
  })

  it('shows empty state when no coroas', () => {
    const emptyPremiacoes: PremiacoesProcessadas = {
      ...mockPremiacoes,
      coroas: []
    }
    
    render(<ExibicaoPremiacoes premiacoes={emptyPremiacoes} />)
    
    expect(screen.getByText('Nenhuma coroa disponível')).toBeInTheDocument()
  })

  it('disables tabs when arrays are empty', () => {
    const emptyPremiacoes: PremiacoesProcessadas = {
      coroas: [],
      trofeus: [],
      medalhas: [],
      coroasOuro: [],
      trofeusPrata: [],
      medalhasBronze: [],
      badgesEspeciais: [],
      estatisticas: {
        totalPremiacoes: 0
      }
    }
    
    render(<ExibicaoPremiacoes premiacoes={emptyPremiacoes} />)
    
    const coroasTab = screen.getByRole('tab', { name: /Coroas/ })
    const trofeusTab = screen.getByRole('tab', { name: /Troféus/ })
    const medalhasTab = screen.getByRole('tab', { name: /Medalhas/ })
    
    expect(coroasTab).toBeDisabled()
    expect(trofeusTab).toBeDisabled()
    expect(medalhasTab).toBeDisabled()
  })

  it('formats currency values correctly', () => {
    render(<ExibicaoPremiacoes premiacoes={mockPremiacoes} />)
    
    expect(screen.getByText(/R\$\s*1\.000\.000,00/)).toBeInTheDocument()
  })
})
