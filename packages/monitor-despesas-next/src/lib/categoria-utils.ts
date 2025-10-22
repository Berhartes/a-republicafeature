

interface TransacaoComCategoria {
  tipoDespesa?: string | null
  categoria?: string | null
}

interface OpcoesCategorizacao {
  fallback?: string
  logs?: boolean
  campoCategoria?: keyof TransacaoComCategoria
}

export function calcularCategoriaPrincipalPorMaioria(
  transacoes: TransacaoComCategoria[],
  opcoes: OpcoesCategorizacao = {}
): string {
  const {
    fallback = 'MATERIAL DE EXPEDIENTE',  // 🔧 CORREÇÃO CRÍTICA - categoria mais provável estatisticamente
    logs = false,
    campoCategoria = 'tipoDespesa'
  } = opcoes

  if (!transacoes || !Array.isArray(transacoes) || transacoes.length === 0) {
    if (logs) {
      console.log('[CATEGORIA-UTILS] Sem transações disponíveis, retornando fallback:', fallback)
    }
    return fallback
  }

  const contador: Record<string, number> = {}
  let transacoesValidas = 0

  transacoes.forEach(transacao => {
    const categoriaRaw = transacao[campoCategoria]
    
    if (categoriaRaw && typeof categoriaRaw === 'string' && categoriaRaw.trim()) {
      const categoria = categoriaRaw.trim()
      contador[categoria] = (contador[categoria] || 0) + 1
      transacoesValidas++
    }
  })

  if (Object.keys(contador).length === 0 || transacoesValidas === 0) {
    if (logs) {
      console.log('[CATEGORIA-UTILS] Nenhuma categoria válida encontrada em', transacoes.length, 'transações, tentando fallback inteligente...')
    }
    
    const fallbackInteligente = calcularFallbackInteligente(transacoes)
    if (fallbackInteligente !== fallback) {
      if (logs) {
        console.log('[CATEGORIA-UTILS] Fallback inteligente aplicado:', fallbackInteligente)
      }
      return fallbackInteligente
    }
    
    if (logs) {
      console.log('[CATEGORIA-UTILS] Usando fallback padrão:', fallback)
    }
    return fallback
  }

  const [categoriaPrincipal, frequencia] = Object.entries(contador)
    .sort(([,a], [,b]) => b - a)[0]

  if (logs) {
    const porcentagem = (frequencia / transacoesValidas) * 100
    console.log(`[CATEGORIA-UTILS] Categoria principal: "${categoriaPrincipal}" → ${frequencia}/${transacoesValidas} (${porcentagem.toFixed(1)}%)`)
  }

  return categoriaPrincipal
}

function calcularFallbackInteligente(transacoes: TransacaoComCategoria[]): string {
  if (!transacoes || transacoes.length === 0) {
    return 'OUTRAS DESPESAS'
  }

  const valores = transacoes
    .map(t => typeof t === 'object' && t !== null && 'valor' in t ? (t as any).valor : 0)
    .filter(v => typeof v === 'number' && v > 0)
  
  if (valores.length === 0) {
    return 'OUTRAS DESPESAS'
  }

  const valorTotal = valores.reduce((sum, v) => sum + v, 0)
  const valorMedio = valorTotal / valores.length
  const quantidadeTransacoes = valores.length

  if (quantidadeTransacoes > 15 && valorMedio < 800) {
    return 'COMBUSTÍVEIS E LUBRIFICANTES'
  }

  if (valorMedio >= 50 && valorMedio <= 2000 && quantidadeTransacoes > 5) {
    return 'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR'
  }

  if (valorMedio > 8000 && quantidadeTransacoes <= 10) {
    return 'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS'
  }

  if (valorMedio >= 200 && valorMedio <= 1500 && quantidadeTransacoes >= 3 && quantidadeTransacoes <= 15) {
    return 'TELEFONIA'
  }

  if (valorMedio >= 150 && valorMedio <= 600 && quantidadeTransacoes <= 20) {
    return 'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL'
  }

  if (valorMedio >= 20 && valorMedio <= 500 && quantidadeTransacoes <= 25) {
    return 'MATERIAL DE EXPEDIENTE'
  }

  if (valorMedio >= 500 && valorMedio <= 5000 && quantidadeTransacoes <= 8) {
    return 'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR'
  }

  return 'MATERIAL DE EXPEDIENTE'  // 🔧 CORREÇÃO CRÍTICA - categoria mais provável para casos não identificados
}

export function obterCategoriaFallbackGlobal(): string {
  return 'MATERIAL DE EXPEDIENTE'  // 🔧 CORREÇÃO CRÍTICA - categoria estatisticamente mais provável
}

export function ehCategoriaValida(categoria: string | null | undefined): boolean {
  if (!categoria || typeof categoria !== 'string') {
    return false
  }

  const categoriaLimpa = categoria.trim()
  
  const categoriasFallback = [
    'Não Identificado',
    'OUTRAS DESPESAS',
    'Outros',
    'Indefinido',
    'Sem Categoria',
    'N/A',
    ''
  ]

  return categoriaLimpa.length > 0 && 
         !categoriasFallback.some(fallback => 
           fallback.toLowerCase() === categoriaLimpa.toLowerCase()
         )
}


const CATEGORIA_HASH_MAP: Record<string, string> = {
  'COMBUSTÍVEIS E LUBRIFICANTES': 'aa56cfdc',
  'COMBUSTÍVEIS E LUBRIFICANTES.': 'aa56cfdc', // Com ponto final
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': 'a71931c4',
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.': 'a71931c4',
  'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR': '2f09877d',
  'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR.': '2f09877d',
  'ASSINATURA DE PUBLICAÇÕES': '20ddc235',
  'ASSINATURA DE PUBLICAÇÕES.': '20ddc235',
  'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': 'fb7c80a7',
  'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL.': 'fb7c80a7',
  'AQUISIÇÃO DE TOKENS': 'f1485b50',
  'AQUISIÇÃO DE TOKENS.': 'f1485b50',
  
  'PASSAGENS AÉREAS': 'd88ed5d5',
  'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS': 'd6a54c8a',
  'TELEFONIA': 'd572ad92',
  'SERVIÇOS POSTAIS': '67af7883',
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES': '85436f9a',
  'LOCAÇÃO OU FRETAMENTO DE AERONAVES': '3a5f2c8d',
  'LOCAÇÃO OU FRETAMENTO DE EMBARCAÇÕES': '4b8c9d1e',
  'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR': '9b071fb2',
  'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS': 'e97c35d7',
  'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR': '2dcc0d6a',
  'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA': 'ea418723',
  'SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO': '0f7af60f'
}

export function normalizarCategoriaDisplay(categoria: string | undefined): string {
  if (!categoria) return 'Categoria'
  
  if (categoria === 'SEM_CATEGORIA') return 'Sem categoria'
  if (categoria.toLowerCase().includes('fallback_')) return 'Categoria não mapeada'
  if (categoria.toLowerCase().trim() === 'null') return 'Categoria'
  if (categoria.toLowerCase().trim() === 'undefined') return 'Categoria'
  
  try {
    let decoded = categoria
    
    try {
      decoded = decodeURIComponent(decoded)
    } catch {
      decoded = decoded
        .replace(/%C3%87/g, 'Ç')
        .replace(/%C3%83/g, 'Ã')
        .replace(/%C3%8D/g, 'Í')
        .replace(/%C3%95/g, 'Õ')
        .replace(/%C3%9A/g, 'Ú')
        .replace(/%C3%A7/g, 'ç')
        .replace(/%C3%A3/g, 'ã')
        .replace(/%C3%AD/g, 'í')
        .replace(/%C3%B5/g, 'õ')
        .replace(/%C3%BA/g, 'ú')
        .replace(/%20/g, ' ')
    }
    
    decoded = decoded.replace(/\+/g, ' ')
    
    const normalizedNames: Record<string, string> = {
      'LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES': 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES',
      'LOCA%C3%87%C3%83O%20OU%20FRETAMENTO%20DE%20VE%C3%8DCULOS%20AUTOMOTORES': 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES',
      'LOCAÇÃO OU FRETAMENTO DE VE&Iacute;CULOS AUTOMOTORES': 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES',
      'COMBUSTIVEIS E LUBRIFICANTES.': 'COMBUSTÍVEIS E LUBRIFICANTES',
      'COMBUSTIVEIS E LUBRIFICANTES': 'COMBUSTÍVEIS E LUBRIFICANTES',
      'MANUTENCAO DE EQUIPAMENTOS DE INFORMATICA': 'MANUTENÇÃO DE EQUIPAMENTOS DE INFORMÁTICA',
      'SERVICOS POSTAIS': 'SERVIÇOS POSTAIS',
      'TELEFONIA': 'TELEFONIA',
      'PASSAGENS AEREAS': 'PASSAGENS AÉREAS',
      'DIVULGACAO DA ATIVIDADE PARLAMENTAR.': 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR',
      'DIVULGACAO DA ATIVIDADE PARLAMENTAR': 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR'
    }
    
    const upperDecoded = decoded.toUpperCase()
    for (const [key, value] of Object.entries(normalizedNames)) {
      if (key.toUpperCase() === upperDecoded || key === decoded) {
        decoded = value
        break
      }
    }
    
    decoded = decoded
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .trim() // Remove leading/trailing spaces
    
    if (!decoded || decoded.length === 0) {
      return 'Categoria'
    }
    
    const decodedLower = decoded.toLowerCase()
    if (decodedLower.includes('não especificada') || 
        decodedLower.includes('nao especificada') ||
        decodedLower === 'sem categoria especificada' ||
        decodedLower === 'categoria nao especificada') {
      return 'Sem categoria'
    }
    
    return decoded
  } catch (error) {
    console.warn('Error normalizing category name for display:', error)
    return categoria
  }
}

export function normalizarCategoria(categoria: string): string {
  if (!categoria) return ''
  
  return categoria
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function gerarHashCategoria(categoria: string): string {
  const categoriaUpper = categoria.toUpperCase()
  if (CATEGORIA_HASH_MAP[categoriaUpper]) {
    return CATEGORIA_HASH_MAP[categoriaUpper]
  }
  
  let hash = 0
  for (let i = 0; i < categoria.length; i++) {
    const char = categoria.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8)
}

export function gerarSlugCategoria(categoria: string): string {
  const categoriaLimpa = normalizarCategoria(categoria)
  const hashMd5 = gerarHashCategoria(categoria)
  return `${categoriaLimpa.substring(0, 20)}-${hashMd5}`
}

export function categoriasEquivalentes(categoria1: string, categoria2: string): boolean {
  if (!categoria1 || !categoria2) return false
  
  const cat1Normalizada = normalizarCategoria(categoria1.toUpperCase())
  const cat2Normalizada = normalizarCategoria(categoria2.toUpperCase())
  
  if (cat1Normalizada === cat2Normalizada ||
      cat1Normalizada.includes(cat2Normalizada) ||
      cat2Normalizada.includes(cat1Normalizada)) {
    return true
  }
  
  
  const isAeronauticCategory = (cat: string) => {
    return (cat.includes('locacao') || cat.includes('fretamento')) && 
           (cat.includes('aeronave') || cat.includes('aviao') || cat.includes('helicoptero'))
  }
  
  const isVehicleCategory = (cat: string) => {
    const locacaoTerms = ['locacao', 'fretamento', 'aluguel', 'rental']
    const veiculoTerms = ['veiculo', 'automovel', 'automofor', 'carro', 'carros', 'veicular', 'automovel']
    
    const temLocacao = locacaoTerms.some(term => cat.includes(term))
    const temVeiculo = veiculoTerms.some(term => cat.includes(term))
    
    return temLocacao && temVeiculo
  }
  
  const isWaterVehicleCategory = (cat: string) => {
    return (cat.includes('locacao') || cat.includes('fretamento')) && 
           (cat.includes('embarcacao') || cat.includes('barco') || cat.includes('navio') || cat.includes('lancha'))
  }
  
  const isTaxiCategory = (cat: string) => {
    return cat.includes('taxi') || cat.includes('pedagio') || cat.includes('estacionamento')
  }
  
  const isAeronautic1 = isAeronauticCategory(cat1Normalizada)
  const isAeronautic2 = isAeronauticCategory(cat2Normalizada)
  const isVehicle1 = isVehicleCategory(cat1Normalizada)
  const isVehicle2 = isVehicleCategory(cat2Normalizada)
  const isWaterVehicle1 = isWaterVehicleCategory(cat1Normalizada)
  const isWaterVehicle2 = isWaterVehicleCategory(cat2Normalizada)
  const isTaxi1 = isTaxiCategory(cat1Normalizada)
  const isTaxi2 = isTaxiCategory(cat2Normalizada)
  
  if ((isAeronautic1 && isAeronautic2) || 
      (isVehicle1 && isVehicle2) || 
      (isWaterVehicle1 && isWaterVehicle2) ||
      (isTaxi1 && isTaxi2)) {
    return true
  }
  
  
  const isFuelCategory = (cat: string) => {
    return cat.includes('combusti') || cat.includes('lubrificant') ||
           cat.includes('gasolina') || cat.includes('diesel') || cat.includes('etanol')
  }
  
  if (isFuelCategory(cat1Normalizada) && isFuelCategory(cat2Normalizada)) {
    return true
  }
  
  const isFoodCategory = (cat: string) => {
    return cat.includes('alimentacao') || cat.includes('refeic') || 
           cat.includes('restaurante') || cat.includes('lanche')
  }
  
  if (isFoodCategory(cat1Normalizada) && isFoodCategory(cat2Normalizada)) {
    return true
  }
  
  const isLodgingCategory = (cat: string) => {
    return cat.includes('hospedagem') || cat.includes('hotel') || cat.includes('pousada')
  }
  
  if (isLodgingCategory(cat1Normalizada) && isLodgingCategory(cat2Normalizada)) {
    return true
  }
  
  const isConsultingCategory = (cat: string) => {
    return cat.includes('consultoria') || cat.includes('assessoria') || cat.includes('pesquisa')
  }
  
  if (isConsultingCategory(cat1Normalizada) && isConsultingCategory(cat2Normalizada)) {
    return true
  }
  
  return false
}

export function logAuditoriaCategoria(
  contexto: 'CATEGORIA' | 'RANKING' | 'FORNECEDOR',
  categoria: string,
  dados: {
    total?: number
    deputados?: number
    transacoes?: number
    fornecedores?: number
    periodo?: string
    [key: string]: any;
  }
): void {
  const timestamp = new Date().toISOString()
  const slug = gerarSlugCategoria(categoria)
  
  console.log(`🔍 [AUDITORIA-${contexto}] ${timestamp}`)
  console.log(`📊 Categoria: "${categoria}"`)
  console.log(`🔗 Slug: "${slug}"`)
  
  if (dados.total !== undefined) {
    console.log(`💰 Total: R$ ${dados.total.toLocaleString('pt-BR')}`)
  }
  if (dados.deputados !== undefined) {
    console.log(`👥 Deputados: ${dados.deputados}`)
  }
  if (dados.transacoes !== undefined) {
    console.log(`📋 Transações: ${dados.transacoes}`)
  }
  if (dados.fornecedores !== undefined) {
    console.log(`🏢 Fornecedores: ${dados.fornecedores}`)
  }
  if (dados.periodo) {
    console.log(`📅 Período: ${dados.periodo}`)
  }
  
  console.log('─'.repeat(50))
}

export function obterAnosFallback(anoSelecionado: string | number): number[] {
  const anoNum = typeof anoSelecionado === 'string' ? 
    (anoSelecionado === 'todos' ? new Date().getFullYear() : parseInt(anoSelecionado)) :
    anoSelecionado
  
  return [anoNum, 2024, 2023, 2022].filter((ano, index, arr) => 
    arr.indexOf(ano) === index // Remove duplicatas
  )
}

export function categoriaExiste(categoria: string): boolean {
  return !!CATEGORIA_HASH_MAP[categoria.toUpperCase()]
}

export function listarCategoriasConhecidas(): string[] {
  return Object.keys(CATEGORIA_HASH_MAP)
    .filter(cat => !cat.endsWith('.')) // Remove duplicatas com ponto
    .sort()
}

export function detectarInconsistencias(
  dadosCategoria: { total: number, deputados: number, periodo: string },
  dadosRanking: { total: number, deputados: number, periodo: string },
  tolerancia: number = 0.05 // 5% de tolerância
): {
  inconsistente: boolean
  divergencias: string[]
} {
  const divergencias: string[] = []
  
  const diferencaTotal = Math.abs(dadosCategoria.total - dadosRanking.total)
  const percentualDiferenca = diferencaTotal / Math.max(dadosCategoria.total, dadosRanking.total, 1)
  
  if (percentualDiferenca > tolerancia) {
    divergencias.push(
      `Total: Categoria R$ ${dadosCategoria.total.toLocaleString('pt-BR')} vs ` +
      `Ranking R$ ${dadosRanking.total.toLocaleString('pt-BR')} ` +
      `(${(percentualDiferenca * 100).toFixed(1)}% diferença)`
    )
  }
  
  const diferencaDeputados = Math.abs(dadosCategoria.deputados - dadosRanking.deputados)
  if (diferencaDeputados > 0) {
    divergencias.push(
      `Deputados: Categoria ${dadosCategoria.deputados} vs Ranking ${dadosRanking.deputados}`
    )
  }
  
  if (dadosCategoria.periodo !== dadosRanking.periodo) {
    divergencias.push(
      `Período: Categoria "${dadosCategoria.periodo}" vs Ranking "${dadosRanking.periodo}"`
    )
  }
  
  return {
    inconsistente: divergencias.length > 0,
    divergencias
  }
}