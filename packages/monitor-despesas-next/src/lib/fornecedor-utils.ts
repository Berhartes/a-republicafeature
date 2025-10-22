
export type TimestampLike = {
  toDate?: () => Date
  seconds?: number
  nanoseconds?: number
} | null | undefined

export type FornecedorTimelineEntry = readonly [string, number, number?]

export interface LegacyRecebimentoEntry {
  valor?: number | string | null
  transacoes?: number | string | null
  quantidade?: number | string | null
}

export type LegacyRecebimentoPorMes = Record<string, LegacyRecebimentoEntry | number | null | undefined>

export interface RelacionamentoDeputadoResumo {
  deputadoId?: string
  id?: string | number
  nome?: string
  estado?: string
  partido?: string
  valor?: number
  valorTotal?: number
  numeroTransacoes?: number
  timeline?: { inicio?: string; fim?: string } | null
}

export interface RelacionamentoDeputadosCompacto {
  quantidade?: number | null
  principais?: RelacionamentoDeputadoResumo[]
  completa?: RelacionamentoDeputadoResumo[]
}

export interface DistribuicoesUltraCompactas {
  uf?: Record<string, [number | undefined, number | undefined]>
  cat?: Record<string, [number | undefined, number | undefined, number | undefined]>
  part?: Record<string, [number | undefined, number | undefined, number | undefined]>
}

export interface DistribuicoesLegadoDetalhes {
  valor?: number | null
  transacoes?: number | null
  deputados?: number | null
}

export interface DistribuicoesLegado {
  porUF?: {
    disponibilidade?: string[]
    detalhes?: Record<string, DistribuicoesLegadoDetalhes | undefined>
  }
  porCategoria?: {
    disponibilidade?: string[]
    detalhes?: Record<string, DistribuicoesLegadoDetalhes | undefined>
  }
  porPartido?: {
    disponibilidade?: string[]
    detalhes?: Record<string, DistribuicoesLegadoDetalhes | undefined>
  }
}

export interface PerfilFornecedorCompleto {
  identificacao?: {
    cnpj?: string
    nome?: string
    categoriaPrincipal?: string
    nomeFantasia?: string
    razaoSocial?: string
  }
  nome?: string
  cnpj?: string
  cnpjCpf?: string
  categoriasPrincipais?: Array<{ categoria?: string; valor?: number }>
  deputadosClientes?: Array<{
    nome?: string
    valor?: number
    id?: number | string
    deputadoId?: string
    partido?: string
    estado?: string
  }>
  timeline?: FornecedorTimelineEntry[]
  recebimentoPorMes?: LegacyRecebimentoPorMes
  relacionamentoDeputados?: RelacionamentoDeputadosCompacto
  numeroDeputadosRelacionados?: number | null
  dist?: DistribuicoesUltraCompactas | null
  distribuicoes?: DistribuicoesLegado | null
  metadados?: {
    periodos?: string | null
    periodosAtivos?: Record<string, string[]>
    proc?: {
      ts?: TimestampLike | string | number | null
      v?: string | null
    }
    processamento?: {
      timestamp?: string | null
      versao?: string | null
      [key: string]: unknown
    }
    [key: string]: unknown
  } | null
  [key: string]: unknown
}

export type PerfilFornecedorMetadados = NonNullable<PerfilFornecedorCompleto['metadados']>

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return fallback
    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  return fallback
}

function normalizarTimeline(perfil: PerfilFornecedorCompleto): FornecedorTimelineEntry[] {
  if (Array.isArray(perfil.timeline) && perfil.timeline.length > 0) {
    return perfil.timeline.map(entry => {
      const [anoMesRaw, valorRaw, transacoesRaw] = entry
      const anoMes = typeof anoMesRaw === 'string' ? anoMesRaw : String(anoMesRaw)
      const valor = safeNumber(valorRaw)
      const transacoes = safeNumber(transacoesRaw)
      return [anoMes, valor, transacoes] as FornecedorTimelineEntry
    })
  }

  if (perfil.recebimentoPorMes && typeof perfil.recebimentoPorMes === 'object') {
    return Object.entries(perfil.recebimentoPorMes)
      .map(([anoMesRaw, dados]) => {
        const anoMes = typeof anoMesRaw === 'string' ? anoMesRaw : String(anoMesRaw)

        if (dados == null) {
          return [anoMes, 0, 0] as FornecedorTimelineEntry
        }

        if (typeof dados === 'number' || typeof dados === 'string') {
          return [anoMes, safeNumber(dados), 0] as FornecedorTimelineEntry
        }

        const valor = safeNumber(dados.valor)
        const transacoes = safeNumber(dados.transacoes ?? dados.quantidade)
        return [anoMes, valor, transacoes] as FornecedorTimelineEntry
      })
      .sort((a, b) => a[0].localeCompare(b[0]))
  }

  return []
}

function isTimelineEntry(entry: [number, number] | FornecedorTimelineEntry): entry is FornecedorTimelineEntry {
  return typeof entry[0] === 'string'
}

function ensurePrincipais(perfil: PerfilFornecedorCompleto): RelacionamentoDeputadoResumo[] {
  if (Array.isArray(perfil.relacionamentoDeputados?.principais)) {
    return perfil.relacionamentoDeputados!.principais!.map(rel => ({
      ...rel,
      partido: rel.partido ?? rel.partido,
      estado: rel.estado ?? rel.estado
    }))
  }

  if (Array.isArray(perfil.deputadosClientes)) {
    return perfil.deputadosClientes.map(dep => ({
      nome: dep.nome,
      partido: dep.partido,
      estado: dep.estado,
      valor: dep.valor,
      deputadoId: dep.deputadoId ?? (dep.id != null ? String(dep.id) : undefined)
    }))
  }

  return []
}

function getDistribuicoesLegado(perfil: PerfilFornecedorCompleto): DistribuicoesLegado | null {
  if (perfil.distribuicoes && typeof perfil.distribuicoes === 'object') {
    return perfil.distribuicoes
  }
  return null
}

function sortStrings(values: string[] | undefined | null): string[] {
  return Array.isArray(values) ? [...values].map(String).sort() : []
}

function normalizarPeriodoAnoMes(ano: string, mes: string): string {
  const anoLimpo = ano.trim()
  const mesNumero = mes.padStart(2, '0')
  return `${anoLimpo}-${mesNumero}`
}

function parsePeriodosLegado(perfil: PerfilFornecedorCompleto): Record<string, string[]> {
  if (perfil.metadados?.periodosAtivos && typeof perfil.metadados.periodosAtivos === 'object') {
    return perfil.metadados.periodosAtivos
  }
  return {}
}

export function getTimelineEntries(perfil: PerfilFornecedorCompleto): FornecedorTimelineEntry[] {
  return normalizarTimeline(perfil)
}

export function getTotalRecebido(perfil: PerfilFornecedorCompleto): number {
  return getTimelineEntries(perfil).reduce((sum, [, valor]) => sum + valor, 0)
}

export function getNumeroTransacoes(perfil: PerfilFornecedorCompleto): number {
  return getTimelineEntries(perfil).reduce((sum, [, , transacoes]) => sum + safeNumber(transacoes), 0)
}

export function getNumeroDeputados(perfil: PerfilFornecedorCompleto): number {
  const relacionamentoQtd = perfil.relacionamentoDeputados?.quantidade
  if (typeof relacionamentoQtd === 'number' && relacionamentoQtd >= 0) {
    return relacionamentoQtd
  }

  if (typeof perfil.numeroDeputadosRelacionados === 'number') {
    return perfil.numeroDeputadosRelacionados
  }

  if (Array.isArray(perfil.relacionamentoDeputados?.principais)) {
    return perfil.relacionamentoDeputados!.principais!.length
  }

  if (Array.isArray(perfil.deputadosClientes)) {
    return perfil.deputadosClientes.length
  }

  return 0
}

export function getPrincipaisDeputados(perfil: PerfilFornecedorCompleto): RelacionamentoDeputadoResumo[] {
  return ensurePrincipais(perfil)
}

export function getRelacionamentosCompletos(perfil: PerfilFornecedorCompleto): RelacionamentoDeputadoResumo[] {
  if (Array.isArray(perfil.relacionamentoDeputados?.completa)) {
    return perfil.relacionamentoDeputados!.completa!
  }
  return []
}

export function getResumoDeputados(perfil: PerfilFornecedorCompleto) {
  const principais = getPrincipaisDeputados(perfil)

  return {
    total: getNumeroDeputados(perfil),
    nomesPrincipais: principais.slice(0, 3).map(dep => ({
      nome: dep.nome || 'Nome não informado',
      partido: dep.partido || 'Sem partido'
    }))
  }
}

export function getTimelineGeral(perfil: PerfilFornecedorCompleto): { inicio: string; fim: string } {
  const timelineEntries = getTimelineEntries(perfil)

  if (timelineEntries.length > 0) {
    const mesesOrdenados = timelineEntries.map(([anoMes]) => anoMes).sort()
    const primeiroMes = mesesOrdenados[0]
    const ultimoMes = mesesOrdenados[mesesOrdenados.length - 1]

    const inicio = `${primeiroMes}-01T00:00:00.000Z`
    const [ano, mes] = ultimoMes.split('-')
    const ultimoDiaDoMes = new Date(Number(ano), Number(mes), 0).getDate()
    const fim = `${ultimoMes}-${String(ultimoDiaDoMes).padStart(2, '0')}T23:59:59.999Z`

    return { inicio, fim }
  }

  const periodos = getPeriodosAtivos(perfil)
  const anosOrdenados = Object.keys(periodos).sort()
  if (anosOrdenados.length > 0) {
    const anoInicial = anosOrdenados[0]
    const anoFinal = anosOrdenados[anosOrdenados.length - 1]
    const mesesAnoInicial = sortStrings(periodos[anoInicial])
    const mesesAnoFinal = sortStrings(periodos[anoFinal])

    if (mesesAnoInicial.length > 0 && mesesAnoFinal.length > 0) {
      const inicioMes = normalizarPeriodoAnoMes(anoInicial, mesesAnoInicial[0])
      const fimMes = normalizarPeriodoAnoMes(anoFinal, mesesAnoFinal[mesesAnoFinal.length - 1])
      const inicio = `${inicioMes}-01T00:00:00.000Z`
      const [anoFim, mesFim] = fimMes.split('-')
      const ultimoDiaDoMes = new Date(Number(anoFim), Number(mesFim), 0).getDate()
      const fim = `${fimMes}-${String(ultimoDiaDoMes).padStart(2, '0')}T23:59:59.999Z`
      return { inicio, fim }
    }
  }

  return { inicio: '', fim: '' }
}

export function timelineToRecord(timeline: FornecedorTimelineEntry[]): Record<string, { valor: number; transacoes: number }> {
  return timeline.reduce((acc, entry) => {
    const [anoMes, valor, transacoes] = entry
    acc[anoMes] = {
      valor: safeNumber(valor),
      transacoes: safeNumber(transacoes)
    }
    return acc
  }, {} as Record<string, { valor: number; transacoes: number }>)
}

export function recordToTimeline(recebimentoPorMes: LegacyRecebimentoPorMes): FornecedorTimelineEntry[] {
  return Object.entries(recebimentoPorMes)
    .map(([anoMesRaw, dados]) => {
      const anoMes = typeof anoMesRaw === 'string' ? anoMesRaw : String(anoMesRaw)

      if (dados == null) {
        return [anoMes, 0, 0] as FornecedorTimelineEntry
      }

      if (typeof dados === 'number' || typeof dados === 'string') {
        return [anoMes, safeNumber(dados), 0] as FornecedorTimelineEntry
      }

      const valor = safeNumber(dados.valor)
      const transacoes = safeNumber(dados.transacoes ?? dados.quantidade)
      return [anoMes, valor, transacoes] as FornecedorTimelineEntry
    })
    .sort((a, b) => a[0].localeCompare(b[0]))
}

export function getDadosMes(perfil: PerfilFornecedorCompleto, anoMes: string): { valor: number; transacoes: number } | null {
  const timelineEntries = getTimelineEntries(perfil)
  const entrada = timelineEntries.find(([mes]) => mes === anoMes)
  if (entrada) {
    return { valor: entrada[1], transacoes: safeNumber(entrada[2]) }
  }

  const recebido = perfil.recebimentoPorMes?.[anoMes]
  if (recebido == null) {
    return null
  }

  if (typeof recebido === 'number' || typeof recebido === 'string') {
    return { valor: safeNumber(recebido), transacoes: 0 }
  }

  return {
    valor: safeNumber(recebido.valor),
    transacoes: safeNumber(recebido.transacoes ?? recebido.quantidade)
  }
}

export function converterDistribuicoesParaUltraCompacto(distribuicoes: DistribuicoesLegado | null | undefined): {
  uf: Record<string, [number, number]>
  cat: Record<string, [number, number, number]>
  part: Record<string, [number, number, number]>
} {
  const resultado = {
    uf: {} as Record<string, [number, number]>,
    cat: {} as Record<string, [number, number, number]>,
    part: {} as Record<string, [number, number, number]>
  }

  if (distribuicoes?.porUF?.detalhes) {
    Object.entries(distribuicoes.porUF.detalhes).forEach(([uf, dados]) => {
      if (!dados) return
      resultado.uf[uf] = [safeNumber(dados.valor), safeNumber(dados.deputados)]
    })
  }

  if (distribuicoes?.porCategoria?.detalhes) {
    Object.entries(distribuicoes.porCategoria.detalhes).forEach(([cat, dados]) => {
      if (!dados) return
      resultado.cat[cat] = [
        safeNumber(dados.valor),
        safeNumber(dados.transacoes),
        safeNumber(dados.deputados)
      ]
    })
  }

  if (distribuicoes?.porPartido?.detalhes) {
    Object.entries(distribuicoes.porPartido.detalhes).forEach(([part, dados]) => {
      if (!dados) return
      resultado.part[part] = [
        safeNumber(dados.valor),
        safeNumber(dados.transacoes),
        safeNumber(dados.deputados)
      ]
    })
  }

  return resultado
}

export function converterUltraCompactoParaDistribuicoes(dist: DistribuicoesUltraCompactas | null | undefined) {
  return {
    porUF: {
      disponibilidade: sortStrings(dist?.uf ? Object.keys(dist.uf) : []),
      detalhes: Object.fromEntries(
        Object.entries(dist?.uf ?? {}).map(([uf, valores]) => [
          uf,
          { valor: safeNumber(valores?.[0]), deputados: safeNumber(valores?.[1]) }
        ])
      )
    },
    porCategoria: {
      disponibilidade: sortStrings(dist?.cat ? Object.keys(dist.cat) : []),
      detalhes: Object.fromEntries(
        Object.entries(dist?.cat ?? {}).map(([cat, valores]) => [
          cat,
          {
            valor: safeNumber(valores?.[0]),
            transacoes: safeNumber(valores?.[1]),
            deputados: safeNumber(valores?.[2])
          }
        ])
      )
    },
    porPartido: {
      disponibilidade: sortStrings(dist?.part ? Object.keys(dist.part) : []),
      detalhes: Object.fromEntries(
        Object.entries(dist?.part ?? {}).map(([partido, valores]) => [
          partido,
          {
            valor: safeNumber(valores?.[0]),
            transacoes: safeNumber(valores?.[1]),
            deputados: safeNumber(valores?.[2])
          }
        ])
      )
    }
  }
}

export function getTimestampProcessamento(perfil: PerfilFornecedorCompleto): string | number | null {
  const procTs = perfil.metadados?.proc?.ts

  if (procTs && typeof procTs === 'object') {
    if (typeof procTs.toDate === 'function') {
      try {
        return procTs.toDate().toISOString()
      } catch {
      }
    }

    if (typeof procTs.seconds === 'number') {
      const millis = procTs.seconds * 1000 + safeNumber(procTs.nanoseconds) / 1_000_000
      return new Date(millis).toISOString()
    }
  }

  if (typeof procTs === 'string' || typeof procTs === 'number') {
    return procTs
  }

  const legado = perfil.metadados?.processamento?.timestamp
  return typeof legado === 'string' || typeof legado === 'number' ? legado : null
}

export function decodePeriodosBitmap(periodosBitmap: string | null | undefined): Record<string, string[]> {
  if (!periodosBitmap) return {}

  const result: Record<string, string[]> = {}
  const anos = periodosBitmap.split('|').map(segment => segment.trim()).filter(Boolean)

  for (const anoData of anos) {
    const [ano, mesesStr] = anoData.split(':')
    if (ano && mesesStr) {
      result[ano] = mesesStr.split(',').map(mes => mes.trim()).filter(Boolean)
    }
  }

  return result
}

export function encodePeriodosBitmap(periodosLegado: Record<string, string[]>): string {
  return Object.keys(periodosLegado)
    .sort()
    .map(ano => `${ano}:${sortStrings(periodosLegado[ano]).join(',')}`)
    .join('|')
}

export function getPeriodosAtivos(perfil: PerfilFornecedorCompleto): Record<string, string[]> {
  const periodosCompactos = perfil.metadados?.periodos
  if (typeof periodosCompactos === 'string' && periodosCompactos.trim().length > 0) {
    return decodePeriodosBitmap(periodosCompactos)
  }

  return parsePeriodosLegado(perfil)
}

export function calcularPercentualDoTotal(valorItem: number, totalGeral: number): number {
  return totalGeral > 0 ? Number(((valorItem / totalGeral) * 100).toFixed(2)) : 0
}

export function calcularMedia(valor: number, quantidade: number): number
export function calcularMedia(tuple: [number, number] | FornecedorTimelineEntry): number
export function calcularMedia(
  valorOuTupla: number | [number, number] | FornecedorTimelineEntry,
  quantidade?: number
): number {
  if (Array.isArray(valorOuTupla)) {
    if (isTimelineEntry(valorOuTupla)) {
      const valor = safeNumber(valorOuTupla[1])
      const transacoes = safeNumber(valorOuTupla[2])
      return transacoes > 0 ? Number((valor / transacoes).toFixed(2)) : 0
    }

    const [valor, qtd] = valorOuTupla
    const quantidadeNormalizada = safeNumber(qtd)
    return quantidadeNormalizada > 0 ? Number((safeNumber(valor) / quantidadeNormalizada).toFixed(2)) : 0
  }

  const quantidadeNormalizada = safeNumber(quantidade)
  return quantidadeNormalizada > 0 ? Number((safeNumber(valorOuTupla) / quantidadeNormalizada).toFixed(2)) : 0
}

export function calcularPercentualUF(perfil: PerfilFornecedorCompleto, uf: string): number {
  const valorDist = perfil.dist?.uf?.[uf]?.[0]
  const valorLegado = getDistribuicoesLegado(perfil)?.porUF?.detalhes?.[uf]?.valor
  const valor = safeNumber(valorDist ?? valorLegado)
  return calcularPercentualDoTotal(valor, getTotalRecebido(perfil))
}

export function calcularPercentualCategoria(perfil: PerfilFornecedorCompleto, categoria: string): number {
  const valorDist = perfil.dist?.cat?.[categoria]?.[0]
  const valorLegado = getDistribuicoesLegado(perfil)?.porCategoria?.detalhes?.[categoria]?.valor
  const valor = safeNumber(valorDist ?? valorLegado)
  return calcularPercentualDoTotal(valor, getTotalRecebido(perfil))
}

export function calcularPercentualPartido(perfil: PerfilFornecedorCompleto, partido: string): number {
  const valorDist = perfil.dist?.part?.[partido]?.[0]
  const valorLegado = getDistribuicoesLegado(perfil)?.porPartido?.detalhes?.[partido]?.valor
  const valor = safeNumber(valorDist ?? valorLegado)
  return calcularPercentualDoTotal(valor, getTotalRecebido(perfil))
}

export function getUfsAtendidas(perfil: PerfilFornecedorCompleto): string[] {
  if (perfil.dist?.uf) {
    return sortStrings(Object.keys(perfil.dist.uf))
  }

  const legado = getDistribuicoesLegado(perfil)?.porUF?.disponibilidade
  return sortStrings(legado)
}

export function getCategoriasAtendidas(perfil: PerfilFornecedorCompleto): string[] {
  if (perfil.dist?.cat) {
    return sortStrings(Object.keys(perfil.dist.cat))
  }

  const legado = getDistribuicoesLegado(perfil)?.porCategoria?.disponibilidade
  return sortStrings(legado)
}

export function getPartidosAtendidos(perfil: PerfilFornecedorCompleto): string[] {
  if (perfil.dist?.part) {
    return sortStrings(Object.keys(perfil.dist.part))
  }

  const legado = getDistribuicoesLegado(perfil)?.porPartido?.disponibilidade
  return sortStrings(legado)
}

export function calcularMediaMensal(perfil: PerfilFornecedorCompleto, anoMes: string): number {
  const dadosMes = getDadosMes(perfil, anoMes)
  if (!dadosMes) return 0
  return calcularMedia(dadosMes.valor, dadosMes.transacoes)
}

export function calcularPercentualDeputado(perfil: PerfilFornecedorCompleto, deputadoId: string): number {
  const relacionamentosCompletos = getRelacionamentosCompletos(perfil)
  const relacionamentoDireto = relacionamentosCompletos.find(rel => {
    const idComparacao = rel.deputadoId ?? (rel.id != null ? String(rel.id) : undefined)
    return idComparacao === deputadoId
  })

  const valorRelacionamento = relacionamentoDireto?.valorTotal ?? relacionamentoDireto?.valor

  if (valorRelacionamento != null) {
    return calcularPercentualDoTotal(safeNumber(valorRelacionamento), getTotalRecebido(perfil))
  }

  const principais = getPrincipaisDeputados(perfil)
  const relacionamentoPrincipal = principais.find(rel => {
    const idComparacao = rel.deputadoId ?? (rel.id != null ? String(rel.id) : undefined)
    return idComparacao === deputadoId
  })

  if (relacionamentoPrincipal?.valor != null) {
    return calcularPercentualDoTotal(safeNumber(relacionamentoPrincipal.valor), getTotalRecebido(perfil))
  }

  return 0
}

export function getAnosAtivos(perfil: PerfilFornecedorCompleto): string[] {
  const anos = new Set<string>()

  getTimelineEntries(perfil).forEach(([anoMes]) => {
    anos.add(anoMes.split('-')[0])
  })

  const periodos = getPeriodosAtivos(perfil)
  Object.keys(periodos).forEach(ano => anos.add(ano))

  return Array.from(anos).sort()
}

export function getRecebimentoPorAno(perfil: PerfilFornecedorCompleto): Record<string, { valor: number; transacoes: number; deputados: number }> {
  const agregados: Record<string, { valor: number; transacoes: number }> = {}

  getTimelineEntries(perfil).forEach(([anoMes, valor, transacoes]) => {
    const ano = anoMes.split('-')[0]
    if (!agregados[ano]) {
      agregados[ano] = { valor: 0, transacoes: 0 }
    }
    agregados[ano].valor += safeNumber(valor)
    agregados[ano].transacoes += safeNumber(transacoes)
  })

  const resultado: Record<string, { valor: number; transacoes: number; deputados: number }> = {}
  const totalDeputados = getNumeroDeputados(perfil)

  Object.entries(agregados).forEach(([ano, dados]) => {
    resultado[ano] = {
      valor: dados.valor,
      transacoes: dados.transacoes,
      deputados: totalDeputados
    }
  })

  return resultado
}

export function getTotalMesesAtivos(perfil: PerfilFornecedorCompleto): number {
  const timelineEntries = getTimelineEntries(perfil)
  if (timelineEntries.length > 0) {
    return timelineEntries.length
  }

  if (perfil.recebimentoPorMes && typeof perfil.recebimentoPorMes === 'object') {
    return Object.keys(perfil.recebimentoPorMes).length
  }

  const periodos = getPeriodosAtivos(perfil)
  return Object.values(periodos).reduce((sum, meses) => sum + meses.length, 0)
}

export function getFeatures(perfil: PerfilFornecedorCompleto): string[] {
  const features: string[] = []

  if (getNumeroDeputados(perfil) > 0) {
    features.push('relacionamentos')
  }

  if (getCategoriasAtendidas(perfil).length > 0) {
    features.push('categorias')
  }

  if (getUfsAtendidas(perfil).length > 0) {
    features.push('geografia')
  }

  if (getPartidosAtendidos(perfil).length > 0) {
    features.push('partidos')
  }

  return features
}

export function hasValidData(perfil: PerfilFornecedorCompleto | null | undefined): perfil is PerfilFornecedorCompleto {
  if (!perfil) {
    return false
  }

  const possuiIdentificacao = Boolean(perfil.identificacao?.cnpj || perfil.cnpj || perfil.cnpjCpf)
  const possuiTimeline = getTimelineEntries(perfil).length > 0
  const possuiRelacoes = !!perfil.relacionamentoDeputados || Array.isArray(perfil.deputadosClientes)

  return possuiIdentificacao && (possuiTimeline || possuiRelacoes)
}

export function getEstatisticasBasicas(perfil: PerfilFornecedorCompleto) {
  if (!hasValidData(perfil)) {
    return {
      totalRecebido: 0,
      numeroTransacoes: 0,
      numeroDeputados: 0,
      mediaTransacao: 0,
      ticketMedio: 0
    }
  }

  const totalRecebido = getTotalRecebido(perfil)
  const numeroTransacoes = getNumeroTransacoes(perfil)
  const numeroDeputados = getNumeroDeputados(perfil)

  return {
    totalRecebido,
    numeroTransacoes,
    numeroDeputados,
    mediaTransacao: calcularMedia(totalRecebido, numeroTransacoes),
    ticketMedio: calcularMedia(totalRecebido, numeroDeputados)
  }
}
