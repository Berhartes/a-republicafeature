import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { categoriaTransacoesService } from '@/services/categoria-transacoes.service'
import { categoriaEvolucaoService } from '@/services/categoria-evolucao.service'
import { categoriaRelacoesService } from '@/services/categoria-relacoes.service'
import { categoriaAlertasService } from '@/services/categoria-alertas.service'

// Mock global fetch to use real cache data
const mockCacheData = {
  suppliers: null,
  deputies: null,
  alerts: null,
}

const originalFetch = global.fetch

const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body ?? {}), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

const testFileDir = path.dirname(fileURLToPath(import.meta.url))

const resolveCachePath = (fileName: string) =>
  path.resolve(testFileDir, '../../../../public/cache', fileName)

const loadCacheData = async (fileName: string) => {
  try {
    const filePath = resolveCachePath(fileName)
    const raw = await readFile(filePath, 'utf-8')
    return JSON.parse(raw)
  } catch (error) {
    console.warn(`Failed to read cache file ${fileName}:`, error)
    return null
  }
}

beforeAll(async () => {
  mockCacheData.suppliers = await loadCacheData('suppliers-cache.json')
  mockCacheData.deputies = await loadCacheData('deputies-cache.json')
  mockCacheData.alerts = await loadCacheData('alerts-cache.json')

  const fetchStub = vi.fn(async (input: any) => {
    const url = typeof input === 'string' ? input : (input?.url ?? '')

    if (typeof url === 'string') {
      if (url.includes('suppliers-cache.json')) {
        return createJsonResponse(mockCacheData.suppliers)
      }

      if (url.includes('deputies-cache.json')) {
        return createJsonResponse(mockCacheData.deputies)
      }

      if (url.includes('alerts-cache.json')) {
        return createJsonResponse(mockCacheData.alerts)
      }

      if (url.includes('supplier-')) {
        return createJsonResponse(null, { status: 404 })
      }

      if (url.startsWith('/cache/')) {
        return createJsonResponse(null, { status: 404 })
      }
    }

    if (typeof originalFetch === 'function') {
      return originalFetch(input as RequestInfo)
    }

    return createJsonResponse(null, { status: 404 })
  })

  vi.stubGlobal('fetch', fetchStub)
})

afterAll(() => {
  if (typeof originalFetch === 'function') {
    global.fetch = originalFetch
  }
  vi.unstubAllGlobals()
})

describe('Categoria Services Integration Tests', () => {
  const testCategoria = 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES'

  describe('CategoriaTransacoesService', () => {
    it('deve obter transações reais de uma categoria', async () => {
      const resultado =
        await categoriaTransacoesService.obterTransacoesCategoria(testCategoria)

      expect(resultado).toBeDefined()
      expect(resultado.granularidade).toBeDefined()
      expect(['cache-completo', 'estimativa-agregada', 'sem-dados']).toContain(
        resultado.granularidade.fonteInformacao
      )

      if (resultado.transacoes.length > 0) {
        const transacao = resultado.transacoes[0]
        expect(transacao).toHaveProperty('id')
        expect(transacao).toHaveProperty('fornecedor')
        expect(transacao).toHaveProperty('valor')
        expect(transacao).toHaveProperty('data')
        expect(transacao).toHaveProperty('categoria', testCategoria)
        expect(typeof transacao.valor).toBe('number')
        expect(transacao.valor).toBeGreaterThan(0)
      }

      expect(resultado.estatisticas).toBeDefined()
      expect(typeof resultado.estatisticas.totalValor).toBe('number')
      expect(typeof resultado.estatisticas.quantidade).toBe('number')
    })

    it('deve aplicar filtros corretamente', async () => {
      const resultado =
        await categoriaTransacoesService.obterTransacoesCategoria(testCategoria)

      if (resultado.transacoes.length > 0) {
        const filtros = {
          valorMinimo: 1000,
          ordenacao: 'valor' as const,
        }

        const transacoesFiltradas =
          await categoriaTransacoesService.filtrarTransacoes(
            resultado.transacoes,
            filtros
          )

        // Verificar se o filtro de valor mínimo foi aplicado
        transacoesFiltradas.forEach(transacao => {
          expect(transacao.valor).toBeGreaterThanOrEqual(1000)
        })

        // Verificar se a ordenação por valor foi aplicada (decrescente)
        for (let i = 1; i < transacoesFiltradas.length; i++) {
          expect(transacoesFiltradas[i].valor).toBeLessThanOrEqual(
            transacoesFiltradas[i - 1].valor
          )
        }
      }
    })
  })

  describe('CategoriaEvolucaoService', () => {
    it('deve obter evolução anual de uma categoria', async () => {
      const resultado =
        await categoriaEvolucaoService.obterEvolucaoCategoria(testCategoria)

      expect(resultado).toBeDefined()
      expect(typeof resultado.temDados).toBe('boolean')
      expect(resultado.anosDisponiveis).toBeInstanceOf(Array)

      if (resultado.temDados) {
        expect(resultado.evolucaoAnual).toBeInstanceOf(Array)
        expect(resultado.estatisticas).toBeDefined()

        if (resultado.evolucaoAnual.length > 0) {
          const evolucaoItem = resultado.evolucaoAnual[0]
          expect(evolucaoItem).toHaveProperty('ano')
          expect(evolucaoItem).toHaveProperty('valor')
          expect(evolucaoItem).toHaveProperty('transacoes')
          expect(typeof evolucaoItem.valor).toBe('number')
          expect(typeof evolucaoItem.transacoes).toBe('number')
        }

        expect(resultado.estatisticas.totalPeriodo).toBeGreaterThanOrEqual(0)
        expect(['crescente', 'decrescente', 'estavel']).toContain(
          resultado.estatisticas.tendencia
        )
      }
    })

    it('deve gerar dados para gráficos', async () => {
      const dadosLinha = await categoriaEvolucaoService.obterDadosParaGrafico(
        testCategoria,
        'linha'
      )
      const dadosBarra = await categoriaEvolucaoService.obterDadosParaGrafico(
        testCategoria,
        'barra'
      )
      const dadosPizza = await categoriaEvolucaoService.obterDadosParaGrafico(
        testCategoria,
        'pizza'
      )

      expect(Array.isArray(dadosLinha)).toBe(true)
      expect(Array.isArray(dadosBarra)).toBe(true)
      expect(Array.isArray(dadosPizza)).toBe(true)

      // Se há dados, verificar estrutura
      if (dadosLinha.length > 0) {
        expect(dadosLinha[0]).toHaveProperty('mes')
        expect(dadosLinha[0]).toHaveProperty('valor')
      }

      if (dadosBarra.length > 0) {
        expect(dadosBarra[0]).toHaveProperty('ano')
        expect(dadosBarra[0]).toHaveProperty('valor')
      }

      if (dadosPizza.length > 0) {
        expect(dadosPizza[0]).toHaveProperty('name')
        expect(dadosPizza[0]).toHaveProperty('value')
      }
    })
  })

  describe('CategoriaRelacoesService', () => {
    it('deve obter relacionamentos de uma categoria', async () => {
      const resultado =
        await categoriaRelacoesService.obterRelacoesCategoria(testCategoria)

      expect(resultado).toBeDefined()
      expect(typeof resultado.temDados).toBe('boolean')
      expect(resultado.relacionamentos).toBeInstanceOf(Array)
      expect(resultado.estatisticas).toBeDefined()
      expect(resultado.rankingPartidos).toBeInstanceOf(Array)

      if (resultado.relacionamentos.length > 0) {
        const relacionamento = resultado.relacionamentos[0]
        expect(relacionamento).toHaveProperty('deputado')
        expect(relacionamento).toHaveProperty('fornecedor')
        expect(relacionamento).toHaveProperty('valorTotal')
        expect(relacionamento).toHaveProperty('intensidade')
        expect(typeof relacionamento.valorTotal).toBe('number')
        expect(typeof relacionamento.intensidade).toBe('number')
        expect(relacionamento.intensidade).toBeGreaterThanOrEqual(0)
        expect(relacionamento.intensidade).toBeLessThanOrEqual(100)
      }

      expect(resultado.estatisticas.totalDeputados).toBeGreaterThanOrEqual(0)
      expect(resultado.estatisticas.totalFornecedores).toBeGreaterThanOrEqual(0)
      expect(resultado.estatisticas.densidadeRede).toBeGreaterThanOrEqual(0)
    })

    it('deve filtrar relacionamentos corretamente', async () => {
      const resultado =
        await categoriaRelacoesService.obterRelacoesCategoria(testCategoria)

      if (resultado.relacionamentos.length > 0) {
        const filtros = {
          apenasFortes: true,
        }

        const relacionamentosFiltrados =
          await categoriaRelacoesService.filtrarRelacionamentos(
            resultado.relacionamentos,
            filtros
          )

        // Verificar se apenas relacionamentos fortes foram retornados
        relacionamentosFiltrados.forEach(rel => {
          expect(rel.intensidade).toBeGreaterThan(70)
        })
      }
    })
  })

  describe('CategoriaAlertasService', () => {
    it('deve obter alertas de uma categoria', async () => {
      const resultado =
        await categoriaAlertasService.obterAlertasCategoria(testCategoria)

      expect(resultado).toBeDefined()
      expect(typeof resultado.temDados).toBe('boolean')
      expect(resultado.alertas).toBeInstanceOf(Array)
      expect(resultado.estatisticas).toBeDefined()

      if (resultado.alertas.length > 0) {
        const alerta = resultado.alertas[0]
        expect(alerta).toHaveProperty('id')
        expect(alerta).toHaveProperty('tipo')
        expect(alerta).toHaveProperty('severidade')
        expect(alerta).toHaveProperty('titulo')
        expect(alerta).toHaveProperty('descricao')
        expect(['alta', 'media', 'baixa']).toContain(alerta.severidade)
        expect([
          'valor_atipico',
          'frequencia_alta',
          'concentracao',
          'crescimento_anomalo',
          'fornecedor_novo',
          'score_alto',
        ]).toContain(alerta.tipo)
      }

      expect(typeof resultado.estatisticas.scoreSuspeicao).toBe('number')
      expect(resultado.estatisticas.scoreSuspeicao).toBeGreaterThanOrEqual(0)
      expect(resultado.estatisticas.scoreSuspeicao).toBeLessThanOrEqual(100)
      expect(resultado.estatisticas.total).toBe(resultado.alertas.length)
    })

    it('deve gerar recomendações baseadas nas estatísticas', async () => {
      const resultado =
        await categoriaAlertasService.obterAlertasCategoria(testCategoria)
      const recomendacoes = categoriaAlertasService.obterRecomendacoes(
        resultado.estatisticas
      )

      expect(Array.isArray(recomendacoes)).toBe(true)
      expect(recomendacoes.length).toBeGreaterThan(0)

      recomendacoes.forEach(recomendacao => {
        expect(typeof recomendacao).toBe('string')
        expect(recomendacao.length).toBeGreaterThan(0)
      })
    })

    it('deve filtrar alertas corretamente', async () => {
      const resultado =
        await categoriaAlertasService.obterAlertasCategoria(testCategoria)

      if (resultado.alertas.length > 0) {
        const filtros = {
          severidade: 'alta' as const,
        }

        const alertasFiltrados = await categoriaAlertasService.filtrarAlertas(
          resultado.alertas,
          filtros
        )

        alertasFiltrados.forEach(alerta => {
          expect(alerta.severidade).toBe('alta')
        })
      }
    })
  })

  describe('Cross-service data consistency', () => {
    it('deve ter dados consistentes entre os serviços', async () => {
      const [transacoes, evolucao, relacoes, alertas] = await Promise.all([
        categoriaTransacoesService.obterTransacoesCategoria(testCategoria),
        categoriaEvolucaoService.obterEvolucaoCategoria(testCategoria),
        categoriaRelacoesService.obterRelacoesCategoria(testCategoria),
        categoriaAlertasService.obterAlertasCategoria(testCategoria),
      ])

      // Se há dados em um serviço, deve haver pelo menos indicação nos outros
      const temAlgumDado =
        transacoes.transacoes.length > 0 ||
        evolucao.temDados ||
        relacoes.temDados ||
        alertas.temDados

      if (temAlgumDado) {
        // Pelo menos um dos serviços deve reconhecer que existem dados para a categoria
        expect(
          transacoes.granularidade.fonteInformacao !== 'sem-dados' ||
            evolucao.temDados ||
            relacoes.temDados ||
            alertas.temDados
        ).toBe(true)
      }
    })
  })
})
