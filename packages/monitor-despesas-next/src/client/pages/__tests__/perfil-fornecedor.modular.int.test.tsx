import React from 'react'
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  beforeAll,
  afterAll,
} from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PerfilFornecedorModular } from '../PerfilFornecedorModular'

// Helpers
const { TEST_CNPJ, TEST_CNPJ_ENCODED } = vi.hoisted(() => {
  const value = '47.029.518/0001-11'
  return {
    TEST_CNPJ: value,
    TEST_CNPJ_ENCODED: encodeURIComponent(value),
  }
})

// Mock next/router to supply the CNPJ via query
vi.mock('next/router', () => {
  return {
    useRouter: () => ({
      query: { cnpj: TEST_CNPJ_ENCODED },
      asPath: `/gastos/fornecedor/${TEST_CNPJ_ENCODED}`,
      push: vi.fn(),
      replace: vi.fn(),
    }),
  }
})

// Mock the data-access functions used by the supplier profile hook
vi.mock('@/data-access/monitordespesas', () => {
  const supplierEntry = {
    cnpj: TEST_CNPJ,
    nome: 'Fornecedor Teste Ltda',
    totalTransacionado: 124000,
    totalTransacoes: 8,
    numeroDeputadosAtendidos: 3,
    categorias: ['VEICULOS'],
    // Campos extras tolerados pelo mapeamento
    scoreSuspeicao: 55.5,
  }

  return {
    fetchManifest: vi.fn(async () => ({ suppliersCachePath: '/mock.json' })),
    fetchSuppliersCache: vi.fn(async () => ({
      data: [supplierEntry],
      filename: 'mock.json',
      fetchedAt: new Date().toISOString(),
      hash: 'mock-hash',
    })),
  }
})

// Mock GlobalDataContext to avoid heavy ETL loading and provide minimal structure
vi.mock('@/contexts/GlobalDataContext', () => {
  const state = {
    deputados: [],
    loading: false,
    error: null,
    filteredDeputados: [],
    searchTerm: '',
    selectedYear: '2025',
    alertas: [],
    fornecedoresSuspeitos: [],
    analiseCompleta: { transacoes: [] },
    premiacoesGlobais: null,
    transacoes: [],
  }
  return {
    useGlobalData: () => ({
      state,
      dispatch: () => {},
      loadDeputados: async () => {},
    }),
    GlobalDataProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  }
})

// Mock TanStack Router navigate hook used by the component
vi.mock('@tanstack/react-router', () => {
  return {
    useNavigate: () => () => {},
  }
})

// Mock ETL cache service to prevent network requests in tests
vi.mock('@/services/etl-cache.service', () => {
  const etlCacheService = {
    fetchSupplierDetailsCache: vi.fn(async () => null),
    normalizeSupplierTransactions: vi.fn(() => []),
  }
  return { etlCacheService }
})

// Stub heavy NetworkGraph component to avoid DOM/WebGL dependencies in tests
vi.mock('@/components/NetworkGraph', () => ({
  NetworkGraph: () => <div data-testid="network-graph" />,
}))

const originalFetch = global.fetch

const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body ?? {}), {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

const supplierCacheFallback = {
  data: {
    transacoesDetalhadas: [],
    historico: [],
  },
}

beforeAll(() => {
  const fetchStub = vi.fn(async (input: any, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input?.url ?? '')

    if (typeof url === 'string' && url.startsWith('/cache/')) {
      if (url.includes('supplier-')) {
        return createJsonResponse(supplierCacheFallback)
      }

      return createJsonResponse(null, { status: 404 })
    }

    if (typeof originalFetch === 'function') {
      return originalFetch(input as RequestInfo, init)
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

describe('PerfilFornecedorModular (integração)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renderiza header com nome e CNPJ formatado, e tabs principais', async () => {
    render(<PerfilFornecedorModular />)

    // Nome do fornecedor (do cache mock)
    expect(await screen.findByText('Fornecedor Teste Ltda')).toBeInTheDocument()

    // CNPJ formatado
    expect(screen.getByText(/CNPJ: 47\.029\.518\/0001-11/)).toBeInTheDocument()

    // Tabs principais
    const tabs = [
      'Visão Geral',
      'Transações',
      'Deputados',
      'Evolução',
      'Análise',
      'Relacionamentos',
      'Alertas',
    ]

    for (const label of tabs) {
      expect(
        screen.getByRole('tab', { name: new RegExp(label, 'i') })
      ).toBeInTheDocument()
    }

    const user = userEvent.setup()

    // Navega para aba Transações e valida conteúdo previsto
    await user.click(screen.getByRole('tab', { name: /Transações/i }))
    expect(await screen.findByText(/Filtros e Ordenação/i)).toBeInTheDocument()
  }, 10000)

  it('alternar para aba Deputados exibe título da seção', async () => {
    render(<PerfilFornecedorModular />)
    const user = userEvent.setup()
    const deputadosTab = await screen.findByRole('tab', { name: /Deputados/i })
    await user.click(deputadosTab)
    expect(await screen.findByText(/Análise de Deputados/i)).toBeInTheDocument()
  })

  it('alternar para aba Evolução exibe texto de evolução temporal', async () => {
    render(<PerfilFornecedorModular />)
    const user = userEvent.setup()
    const evolucaoTab = await screen.findByRole('tab', { name: /Evolução/i })
    await user.click(evolucaoTab)
    expect(await screen.findByText(/Evolução Temporal/i)).toBeInTheDocument()
  })

  it('alternar para aba Análise exibe título de análise avançada', async () => {
    render(<PerfilFornecedorModular />)
    const user = userEvent.setup()
    const analiseTab = await screen.findByRole('tab', { name: /Análise/i })
    await user.click(analiseTab)
    expect(await screen.findByText(/Análise Avançada/i)).toBeInTheDocument()
  })

  it('alternar para aba Relacionamentos exibe título de rede', async () => {
    render(<PerfilFornecedorModular />)
    const user = userEvent.setup()
    const relacionamentosTab = await screen.findByRole('tab', {
      name: /Relacionamentos/i,
    })
    await user.click(relacionamentosTab)
    expect(
      await screen.findByText(/Rede de Relacionamentos/i)
    ).toBeInTheDocument()
  })

  it('alternar para aba Alertas exibe título de sistema de alertas', async () => {
    render(<PerfilFornecedorModular />)
    const user = userEvent.setup()
    const alertasTab = await screen.findByRole('tab', { name: /Alertas/i })
    await user.click(alertasTab)
    expect(await screen.findByText(/Sistema de Alertas/i)).toBeInTheDocument()
  })
})
