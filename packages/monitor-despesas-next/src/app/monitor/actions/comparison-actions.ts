'use server'

import { loadDeputiesCache } from './_cached-loaders'

interface ComparisonFilters {
    categoria?: string
    ano?: number
    mes?: number
}

interface DeputadoComparacaoDetalhado {
    id: string
    nome: string
    nomeEleitoral: string
    siglaPartido: string
    siglaUf: string
    urlFoto: string

    // Totais gerais
    totalGasto: number
    totalTransacoes: number
    mediaTransacao: number

    // Por ano
    gastosPorAno: Record<number, number>
    transacoesPorAno: Record<number, number>

    // Por mês (agregado de todos os anos)
    gastosPorMes: Record<number, number>
    transacoesPorMes: Record<number, number>

    // Por categoria
    gastosPorCategoria: Array<{ categoria: string; total: number; transacoes: number }>

    // Top fornecedores
    topFornecedores: Array<{ nome: string; total: number; transacoes: number }>

    // Métricas
    scoreSuspeicao: number
    numAlertas: number

    // Evolução mensal (últimos 12 meses)
    evolucaoMensal: Array<{ mes: string; total: number }>
}

/**
 * Busca dados detalhados de comparação para múltiplos deputados
 * Inclui análise por categoria, período, fornecedores, etc.
 */
export async function getDetailedComparisonData(
    ids: string[],
    filters: ComparisonFilters = {}
): Promise<DeputadoComparacaoDetalhado[]> {
    if (ids.length === 0) return []

    const rawCacheData = await loadDeputiesCache()
    if (!rawCacheData) return []

    let rawDeputados: any[] = []
    if (Array.isArray(rawCacheData)) {
        rawDeputados = rawCacheData as any[]
    } else if (Array.isArray((rawCacheData as any).deputados)) {
        rawDeputados = (rawCacheData as any).deputados
    } else if (typeof (rawCacheData as any).data === 'object' && Array.isArray((rawCacheData as any).data.deputados)) {
        rawDeputados = (rawCacheData as any).data.deputados
    }

    if (!Array.isArray(rawDeputados) || rawDeputados.length === 0) return []

    const idSet = new Set(ids)
    const deputadosFiltrados = rawDeputados.filter(d => idSet.has(String(d.id)))

    return deputadosFiltrados.map(raw => processDeputadoDetalhado(raw, filters))
}

function processDeputadoDetalhado(raw: any, filters: ComparisonFilters): DeputadoComparacaoDetalhado {
    // Processar gastos por ano
    const gastosPorAno: Record<number, number> = {}
    const transacoesPorAno: Record<number, number> = {}

    if (raw.anos && Array.isArray(raw.anos)) {
        for (const ano of raw.anos) {
            if (ano && typeof ano.ano === 'number') {
                gastosPorAno[ano.ano] = ano.total || 0
                transacoesPorAno[ano.ano] = ano.numeroDespesas || ano.numeroTransacoes || 0
            }
        }
    }

    // Processar gastos por mês (agregado)
    const gastosPorMes: Record<number, number> = {}
    const transacoesPorMes: Record<number, number> = {}

    if (raw.gastosPorMes && typeof raw.gastosPorMes === 'object') {
        for (let mes = 1; mes <= 12; mes++) {
            gastosPorMes[mes] = raw.gastosPorMes[mes] || 0
            transacoesPorMes[mes] = raw.transacoesPorMes?.[mes] || 0
        }
    }

    // Processar gastos por categoria
    const gastosPorCategoria: Array<{ categoria: string; total: number; transacoes: number }> = []

    if (raw.topCategorias && Array.isArray(raw.topCategorias)) {
        raw.topCategorias.forEach((cat: any) => {
            if (cat && cat.categoria) {
                gastosPorCategoria.push({
                    categoria: cat.categoria,
                    total: cat.total || cat.valor || 0,
                    transacoes: cat.numeroTransacoes || cat.transacoes || 0
                })
            }
        })
    }

    // Filtrar por categoria se especificado
    let totalGasto = Object.values(gastosPorAno).reduce((sum, val) => sum + (val as number), 0)
    let totalTransacoes = Object.values(transacoesPorAno).reduce((sum, val) => sum + (val as number), 0)

    if (filters.categoria) {
        const catData = gastosPorCategoria.find(c => c.categoria === filters.categoria)
        if (catData) {
            totalGasto = catData.total
            totalTransacoes = catData.transacoes
        } else {
            totalGasto = 0
            totalTransacoes = 0
        }
    }

    // Filtrar por ano se especificado
    if (filters.ano) {
        totalGasto = gastosPorAno[filters.ano] || 0
        totalTransacoes = transacoesPorAno[filters.ano] || 0
    }

    // Processar top fornecedores
    const topFornecedores: Array<{ nome: string; total: number; transacoes: number }> = []

    if (raw.topFornecedores && Array.isArray(raw.topFornecedores)) {
        raw.topFornecedores.slice(0, 10).forEach((forn: any) => {
            if (forn && forn.nome) {
                topFornecedores.push({
                    nome: forn.nome || forn.nomeFornecedor,
                    total: forn.total || forn.valor || 0,
                    transacoes: forn.numeroTransacoes || forn.transacoes || 0
                })
            }
        })
    }

    // Criar evolução mensal (últimos 12 meses)
    const evolucaoMensal: Array<{ mes: string; total: number }> = []
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    for (let mes = 1; mes <= 12; mes++) {
        evolucaoMensal.push({
            mes: mesesNomes[mes - 1],
            total: gastosPorMes[mes] || 0
        })
    }

    return {
        id: String(raw.id),
        nome: raw.nome || raw.nomeEleitoral || 'Desconhecido',
        nomeEleitoral: raw.nomeEleitoral || raw.nome,
        siglaPartido: raw.siglaPartido || 'N/A',
        siglaUf: raw.siglaUf || 'N/A',
        urlFoto: raw.urlFoto || '',

        totalGasto,
        totalTransacoes,
        mediaTransacao: totalTransacoes > 0 ? totalGasto / totalTransacoes : 0,

        gastosPorAno,
        transacoesPorAno,
        gastosPorMes,
        transacoesPorMes,
        gastosPorCategoria,
        topFornecedores,

        scoreSuspeicao: typeof raw.scoreSuspeicao === 'number' ? raw.scoreSuspeicao : 0,
        numAlertas: Array.isArray(raw.alertas) ? raw.alertas.length : (typeof raw.numAlertas === 'number' ? raw.numAlertas : 0),

        evolucaoMensal
    }
}

/**
 * Busca categorias disponíveis para comparação
 */
export async function getCategoriasDisponiveis(): Promise<string[]> {
    const rawCacheData = await loadDeputiesCache()
    if (!rawCacheData) return []

    let rawDeputados: any[] = []
    if (Array.isArray(rawCacheData)) {
        rawDeputados = rawCacheData as any[]
    } else if (Array.isArray((rawCacheData as any).deputados)) {
        rawDeputados = (rawCacheData as any).deputados
    }

    const categoriasSet = new Set<string>()

    rawDeputados.forEach(dep => {
        if (dep.topCategorias && Array.isArray(dep.topCategorias)) {
            dep.topCategorias.forEach((cat: any) => {
                if (cat && cat.categoria) {
                    categoriasSet.add(cat.categoria)
                }
            })
        }
    })

    return Array.from(categoriasSet).sort()
}

/**
 * Compara estados (agregação por UF)
 */
export async function compareEstados(ufs: string[]): Promise<any[]> {
    if (ufs.length === 0) return []

    const rawCacheData = await loadDeputiesCache()
    if (!rawCacheData) return []

    let rawDeputados: any[] = []
    if (Array.isArray((rawCacheData as any).deputados)) {
        rawDeputados = (rawCacheData as any).deputados
    }

    return ufs.map(uf => {
        const deputadosUf = rawDeputados.filter(d => d.siglaUf === uf)

        const totalGasto = deputadosUf.reduce((sum, d) => {
            const gastos = d.anos?.reduce((s: number, a: any) => s + (a.total || 0), 0) || 0
            return sum + gastos
        }, 0)

        const totalTransacoes = deputadosUf.reduce((sum, d) => {
            const trans = d.anos?.reduce((s: number, a: any) => s + (a.numeroDespesas || 0), 0) || 0
            return sum + trans
        }, 0)

        return {
            uf,
            totalDeputados: deputadosUf.length,
            totalGasto,
            totalTransacoes,
            mediaGastoPorDeputado: deputadosUf.length > 0 ? totalGasto / deputadosUf.length : 0,
            mediaTransacaoPorDeputado: deputadosUf.length > 0 ? totalTransacoes / deputadosUf.length : 0
        }
    })
}

/**
 * Compara partidos (agregação por partido)
 */
export async function comparePartidos(partidos: string[]): Promise<any[]> {
    if (partidos.length === 0) return []

    const rawCacheData = await loadDeputiesCache()
    if (!rawCacheData) return []

    let rawDeputados: any[] = []
    if (Array.isArray((rawCacheData as any).deputados)) {
        rawDeputados = (rawCacheData as any).deputados
    }

    return partidos.map(partido => {
        const deputadosPartido = rawDeputados.filter(d => d.siglaPartido === partido)

        const totalGasto = deputadosPartido.reduce((sum, d) => {
            const gastos = d.anos?.reduce((s: number, a: any) => s + (a.total || 0), 0) || 0
            return sum + gastos
        }, 0)

        const totalTransacoes = deputadosPartido.reduce((sum, d) => {
            const trans = d.anos?.reduce((s: number, a: any) => s + (a.numeroDespesas || 0), 0) || 0
            return sum + trans
        }, 0)

        return {
            partido,
            totalDeputados: deputadosPartido.length,
            totalGasto,
            totalTransacoes,
            mediaGastoPorDeputado: deputadosPartido.length > 0 ? totalGasto / deputadosPartido.length : 0,
            mediaTransacaoPorDeputado: deputadosPartido.length > 0 ? totalTransacoes / deputadosPartido.length : 0
        }
    })
}
