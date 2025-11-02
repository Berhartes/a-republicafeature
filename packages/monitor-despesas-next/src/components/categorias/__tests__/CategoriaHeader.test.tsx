import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoriaHeader } from '../components/CategoriaHeader'

// Mock do getCategoriaIcon
vi.mock('@/components/premiacoes/utils/categoria-icons', () => ({
  getCategoriaIcon: () => () => <div data-testid="categoria-icon" />,
}))

describe('CategoriaHeader', () => {
  const defaultProps = {
    categoria: 'Alimentação',
    categoriaSlug: 'alimentacao',
    estatisticasCategoria: {
      totalFornecedores: 150,
      volumeTotal: 500000,
      ranking: 3,
    },
    loading: false,
    erro: null,
    onRefresh: vi.fn(),
    onExport: vi.fn(),
    onShare: vi.fn(),
  }

  it('deve renderizar o título da categoria corretamente', () => {
    render(<CategoriaHeader {...defaultProps} />)

    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    expect(
      screen.getByText('Análise detalhada de gastos por categoria')
    ).toBeInTheDocument()
  })

  it('deve exibir o slug da categoria', () => {
    render(<CategoriaHeader {...defaultProps} />)

    expect(screen.getByText('Slug: alimentacao')).toBeInTheDocument()
  })

  it('deve exibir o ranking quando disponível', () => {
    render(<CategoriaHeader {...defaultProps} />)

    expect(screen.getByText('#3 no ranking')).toBeInTheDocument()
  })

  it('deve renderizar botões de ação', () => {
    render(<CategoriaHeader {...defaultProps} />)

    expect(screen.getByText('Compartilhar')).toBeInTheDocument()
    expect(screen.getByText('Atualizar')).toBeInTheDocument()
    expect(screen.getByText('Exportar')).toBeInTheDocument()
  })

  it('deve chamar onRefresh quando o botão atualizar for clicado', () => {
    const onRefresh = vi.fn()
    render(<CategoriaHeader {...defaultProps} onRefresh={onRefresh} />)

    fireEvent.click(screen.getByText('Atualizar'))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onExport quando o botão exportar for clicado', () => {
    const onExport = vi.fn()
    render(<CategoriaHeader {...defaultProps} onExport={onExport} />)

    fireEvent.click(screen.getByText('Exportar'))
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('deve chamar onShare quando o botão compartilhar for clicado', () => {
    const onShare = vi.fn()
    render(<CategoriaHeader {...defaultProps} onShare={onShare} />)

    fireEvent.click(screen.getByText('Compartilhar'))
    expect(onShare).toHaveBeenCalledTimes(1)
  })

  it('deve exibir alerta de erro quando erro estiver presente', () => {
    const propsComErro = {
      ...defaultProps,
      erro: 'Erro ao carregar dados',
    }

    render(<CategoriaHeader {...propsComErro} />)

    const mensagensErro = screen.getAllByText('Erro ao carregar dados')
    expect(mensagensErro.length).toBeGreaterThanOrEqual(1)
    mensagensErro.forEach((mensagem: HTMLElement) => {
      expect(mensagem).toBeInTheDocument()
    })
  })

  it('deve exibir indicador de carregamento quando loading for true', () => {
    const propsComLoading = {
      ...defaultProps,
      loading: true,
    }

    render(<CategoriaHeader {...propsComLoading} />)

    expect(
      screen.getByText('Carregando dados da categoria...')
    ).toBeInTheDocument()
  })

  it('deve desabilitar botões durante carregamento', () => {
    const propsComLoading = {
      ...defaultProps,
      loading: true,
    }

    render(<CategoriaHeader {...propsComLoading} />)

    const botaoAtualizar = screen.getByText('Atualizar').closest('button')
    const botaoExportar = screen.getByText('Exportar').closest('button')

    expect(botaoAtualizar).toBeDisabled()
    expect(botaoExportar).toBeDisabled()
  })

  it('deve limpar título com caracteres especiais', () => {
    const propsComTituloEspecial = {
      ...defaultProps,
      categoria: 'Alimenta%C3%A7%C3%A3o%20e%20Bebidas',
    }

    render(<CategoriaHeader {...propsComTituloEspecial} />)

    // O componente deve limpar os caracteres especiais
    expect(screen.getByText(/Alimentação e Bebidas/)).toBeInTheDocument()
  })

  it('deve renderizar ícone da categoria', () => {
    render(<CategoriaHeader {...defaultProps} />)

    expect(screen.getByTestId('categoria-icon')).toBeInTheDocument()
  })
})
