import { describe, it, expect } from 'vitest'
import { getRankingGeral, getRankingFiltrado, calcularEstatisticasRanking } from '../unified-ranking-service'
import { processarPremiacoes, identificarCampeaoGeral } from '../premiacao-unificada'
import { processarPremiacaoItem, gerarTituloPremiacoes } from '../premiacoes-processor'
import type { DeputadoProcessado, RankingDeputados } from '@/types/etl-deputados.types'

describe('Services Integration', () => {
  const mockDeputados: DeputadoProcessado[] = [
    {
      id: '1',
      nomeEleitoral: 'Deputado A',
      siglaPartido: 'PT',
      siglaUf: 'SP',
      foto: '',
      totalGastos: 100000,
      totalTransacoes: 50,
      mediaTransacao: 2000,
      gastosPorAno: { 2023: 50000, 2024: 50000 },
      transacoesPorAno: { 2023: 25, 2024: 25 },
      topCategorias: [{ categoria: 'COMBUSTÍVEIS E LUBRIFICANTES', valor: 60000, percentual: 60 }],
      topFornecedores: [],
      scoreSuspeicao: 0,
      classificacaoRisco: 'Baixo',
      alertas: [],
      ultimaAtualizacao: '2024-01-01',
      anosDisponiveis: [2023, 2024],
      dadosCompletos: true,
    },
    {
      id: '2',
      nomeEleitoral: 'Deputado B',
      siglaPartido: 'PSDB',
      siglaUf: 'RJ',
      foto: '',
      totalGastos: 80000,
      totalTransacoes: 40,
      mediaTransacao: 2000,
      gastosPorAno: { 2023: 40000, 2024: 40000 },
      transacoesPorAno: { 2023: 20, 2024: 20 },
      topCategorias: [{ categoria: 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR', valor: 50000, percentual: 62.5 }],
      topFornecedores: [],
      scoreSuspeicao: 0,
      classificacaoRisco: 'Baixo',
      alertas: [],
      ultimaAtualizacao: '2024-01-01',
      anosDisponiveis: [2023, 2024],
      dadosCompletos: true,
    },
  ]

  describe('unified-ranking-service', () => {
    it('should return ranking geral sorted by totalGastos', () => {
      const ranking = getRankingGeral(mockDeputados)
      expect(ranking).toHaveLength(2)
      expect(ranking[0].id).toBe('1')
      expect(ranking[0].totalGastos).toBe(100000)
    })

    it('should filter ranking by UF', () => {
      const ranking = getRankingFiltrado(mockDeputados, { uf: 'SP' })
      expect(ranking).toHaveLength(1)
      expect(ranking[0].siglaUf).toBe('SP')
    })

    it('should calculate statistics correctly', () => {
      const stats = calcularEstatisticasRanking(mockDeputados)
      expect(stats.totalDeputados).toBe(2)
      expect(stats.totalGastos).toBe(180000)
      expect(stats.mediaGastos).toBe(90000)
    })
  })

  describe('premiacao-unificada', () => {
    const mockRankings: RankingDeputados = {
      geral: mockDeputados,
      porCategoria: {
        'COMBUSTÍVEIS E LUBRIFICANTES': [mockDeputados[0]],
      },
      porAno: {
        2023: mockDeputados,
        2024: mockDeputados,
      },
      estatisticas: {
        totalDeputados: 2,
        totalGastos: 180000,
        mediaGastos: 90000,
        medianaGastos: 90000,
      },
    }

    it('should identify campeao geral', () => {
      const campeao = identificarCampeaoGeral(mockDeputados)
      expect(campeao).toBeDefined()
      expect(campeao?.nomeEleitoral).toBe('Deputado A')
      expect(campeao?.valorTotal).toBe(100000)
    })

    it('should generate premiacoes', () => {
      const premiacoes = processarPremiacoes(mockDeputados, mockRankings)
      expect(premiacoes.coroas.length).toBeGreaterThan(0)
      expect(premiacoes.trofeus.length).toBeGreaterThan(0)
      expect(premiacoes.estatisticas.totalPremiacoes).toBeGreaterThan(0)
    })
  })

  describe('premiacoes-processor', () => {
    it('should generate correct title', () => {
      const titulo = gerarTituloPremiacoes('coroa', 'Geral', 2024)
      expect(titulo).toBe('Campeão Geral 2024')
    })

    it('should process premiacao item', () => {
      const item = processarPremiacaoItem(mockDeputados[0], 'coroa', {
        posicao: 1,
        categoria: 'Geral',
      })
      expect(item.deputadoId).toBe('1')
      expect(item.nomeEleitoral).toBe('Deputado A')
      expect(item.posicao).toBe(1)
    })
  })
})
