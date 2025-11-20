
export interface CategoryDefinition {
  id: number
  
  canonical: string
  
  displayName: string
  
  code: string
  
  aliases: string[]
  
  keywords: string[]
  
  icon: string
  
  color: string
  
  description: string
  
  status: 'active' | 'deprecated' | 'merged'
  
  mergedInto?: number
  
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
    source: 'api_camara' | 'manual' | 'migration'
  }
}

export interface CategoryMatchResult {
  category: CategoryDefinition
  confidence: number
  matchType: 'exact' | 'alias' | 'keyword' | 'fuzzy'
  matchedText: string
}

export class CategoryRegistry {
  private categories: Map<number, CategoryDefinition> = new Map()
  private codeIndex: Map<string, number> = new Map()
  private canonicalIndex: Map<string, number> = new Map()
  private aliasIndex: Map<string, number[]> = new Map()
  private keywordIndex: Map<string, number[]> = new Map()
  
  constructor() {
    this.initializeDefaultCategories()
  }
  
  private initializeDefaultCategories(): void {
    const defaultCategories: Omit<CategoryDefinition, 'metadata'>[] = [
      {
        id: 1,
        canonical: 'LOCACAO_OU_FRETAMENTO_DE_VEICULOS_AUTOMOTORES',
        displayName: 'Locação ou Fretamento de Veículos Automotores',
        code: 'locacao-veiculos',
        aliases: [
          'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES',
          'LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES',
          'LOCAÇÃO E FRETAMENTO DE VEÍCULOS',
          'ALUGUEL DE VEÍCULOS',
          'RENTAL DE CARROS'
        ],
        keywords: ['locacao', 'fretamento', 'veiculo', 'automovel', 'carro', 'aluguel'],
        icon: '🚗',
        color: '#3B82F6',
        description: 'Despesas com locação ou fretamento de veículos automotores',
        status: 'active'
      },
      {
        id: 2,
        canonical: 'LOCACAO_OU_FRETAMENTO_DE_AERONAVES',
        displayName: 'Locação ou Fretamento de Aeronaves',
        code: 'locacao-aeronaves', 
        aliases: [
          'LOCAÇÃO OU FRETAMENTO DE AERONAVES',
          'LOCACAO OU FRETAMENTO DE AERONAVES',
          'FRETAMENTO DE AERONAVES',
          'ALUGUEL DE AVIÕES',
          'CHARTER DE AERONAVES'
        ],
        keywords: ['locacao', 'fretamento', 'aeronave', 'aviao', 'helicoptero', 'charter'],
        icon: '✈️',
        color: '#8B5CF6',
        description: 'Despesas com locação ou fretamento de aeronaves',
        status: 'active'
      },
      {
        id: 3,
        canonical: 'COMBUSTIVEIS_E_LUBRIFICANTES',
        displayName: 'Combustíveis e Lubrificantes',
        code: 'combustiveis',
        aliases: [
          'COMBUSTÍVEIS E LUBRIFICANTES',
          'COMBUSTIVEIS E LUBRIFICANTES',
          'COMBUSTÍVEL E LUBRIFICANTE',
          'GASOLINA E ÓLEO',
          'ABASTECIMENTO',
          'Combustiveis E Lubrificantes',
          'Combust Veis E Lubrificantes',
          'combustiveis e lubrificantes'
        ],
        keywords: ['combustivel', 'lubrificante', 'gasolina', 'diesel', 'etanol', 'oleo'],
        icon: '⛽',
        color: '#EF4444',
        description: 'Despesas com combustíveis e lubrificantes para veículos',
        status: 'active'
      },
      {
        id: 4,
        canonical: 'FORNECIMENTO_DE_ALIMENTACAO_DO_PARLAMENTAR',
        displayName: 'Fornecimento de Alimentação do Parlamentar',
        code: 'alimentacao',
        aliases: [
          'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR',
          'FORNECIMENTO DE ALIMENTACAO DO PARLAMENTAR',
          'ALIMENTAÇÃO DO PARLAMENTAR',
          'REFEIÇÕES',
          'RESTAURANTE'
        ],
        keywords: ['alimentacao', 'refeicao', 'restaurante', 'lanche', 'comida'],
        icon: '🍽️',
        color: '#F59E0B',
        description: 'Despesas com alimentação do parlamentar',
        status: 'active'
      },
      {
        id: 5,
        canonical: 'DIVULGACAO_DA_ATIVIDADE_PARLAMENTAR',
        displayName: 'Divulgação da Atividade Parlamentar',
        code: 'divulgacao',
        aliases: [
          'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR',
          'DIVULGACAO DA ATIVIDADE PARLAMENTAR',
          'PUBLICIDADE PARLAMENTAR',
          'COMUNICAÇÃO INSTITUCIONAL'
        ],
        keywords: ['divulgacao', 'publicidade', 'comunicacao', 'parlamentar', 'institucional'],
        icon: '📢',
        color: '#10B981',
        description: 'Despesas com divulgação da atividade parlamentar',
        status: 'active'
      },
      {
        id: 6,
        canonical: 'AQUISICAO_DE_TOKENS_E_CERTIFICADOS_DIGITAIS',
        displayName: 'Aquisição de Tokens e Certificados Digitais',
        code: 'tokens-certificados',
        aliases: [
          'AQUISIÇÃO DE TOKENS E CERTIFICADOS DIGITAIS',
          'AQUISICAO DE TOKENS E CERTIFICADOS DIGITAIS',
          'TOKENS E CERTIFICADOS',
          'CERTIFICAÇÃO DIGITAL'
        ],
        keywords: ['aquisicao', 'tokens', 'certificados', 'digitais', 'certificacao'],
        icon: '🔐',
        color: '#6B7280',
        description: 'Despesas com aquisição de tokens e certificados digitais',
        status: 'active'
      },
      {
        id: 7,
        canonical: 'ASSINATURA_DE_PUBLICACOES',
        displayName: 'Assinatura de Publicações',
        code: 'assinatura-publicacoes',
        aliases: [
          'ASSINATURA DE PUBLICAÇÕES',
          'ASSINATURA DE PUBLICACOES',
          'PUBLICAÇÕES',
          'REVISTAS E JORNAIS'
        ],
        keywords: ['assinatura', 'publicacoes', 'revistas', 'jornais', 'periodicos'],
        icon: '📰',
        color: '#4B5563',
        description: 'Despesas com assinatura de publicações e periódicos',
        status: 'active'
      },
      {
        id: 8,
        canonical: 'CONSULTORIAS_PESQUISAS_E_TRABALHOS_TECNICOS',
        displayName: 'Consultorias, Pesquisas e Trabalhos Técnicos',
        code: 'consultorias-pesquisas',
        aliases: [
          'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS',
          'CONSULTORIAS PESQUISAS E TRABALHOS TECNICOS',
          'CONSULTORIAS E PESQUISAS',
          'TRABALHOS TÉCNICOS'
        ],
        keywords: ['consultorias', 'pesquisas', 'trabalhos', 'tecnicos', 'assessoria'],
        icon: '📊',
        color: '#7C3AED',
        description: 'Despesas com consultorias, pesquisas e trabalhos técnicos',
        status: 'active'
      },
      {
        id: 9,
        canonical: 'HOSPEDAGEM_EXCETO_DO_PARLAMENTAR_NO_DISTRITO_FEDERAL',
        displayName: 'Hospedagem (Exceto do Parlamentar no Distrito Federal)',
        code: 'hospedagem',
        aliases: [
          'HOSPEDAGEM, EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL',
          'HOSPEDAGEM EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL',
          'HOSPEDAGEM',
          'HOTEL'
        ],
        keywords: ['hospedagem', 'hotel', 'pousada', 'alojamento'],
        icon: '🏨',
        color: '#DC2626',
        description: 'Despesas com hospedagem (exceto do parlamentar no Distrito Federal)',
        status: 'active'
      },
      {
        id: 10,
        canonical: 'LOCACAO_OU_FRETAMENTO_DE_EMBARCACOES',
        displayName: 'Locação ou Fretamento de Embarcações',
        code: 'locacao-embarcacoes',
        aliases: [
          'LOCAÇÃO OU FRETAMENTO DE EMBARCAÇÕES',
          'LOCACAO OU FRETAMENTO DE EMBARCACOES',
          'FRETAMENTO DE EMBARCAÇÕES',
          'ALUGUEL DE BARCOS'
        ],
        keywords: ['locacao', 'fretamento', 'embarcacoes', 'barcos', 'navios'],
        icon: '🚢',
        color: '#0891B2',
        description: 'Despesas com locação ou fretamento de embarcações',
        status: 'active'
      },
      {
        id: 11,
        canonical: 'MANUTENCAO_DE_ESCRITORIO_DE_APOIO_ATIVIDADE_PARLAMENTAR',
        displayName: 'Manutenção de Escritório de Apoio à Atividade Parlamentar',
        code: 'manutencao-escritorio',
        aliases: [
          'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR',
          'MANUTENCAO DE ESCRITORIO DE APOIO ATIVIDADE PARLAMENTAR',
          'MANUTENÇÃO DE ESCRITÓRIO',
          'ESCRITÓRIO PARLAMENTAR'
        ],
        keywords: ['manutencao', 'escritorio', 'apoio', 'parlamentar', 'atividade'],
        icon: '🏢',
        color: '#059669',
        description: 'Despesas com manutenção de escritório de apoio à atividade parlamentar',
        status: 'active'
      },
      {
        id: 12,
        canonical: 'PARTICIPACAO_EM_CURSO_PALESTRA_OU_EVENTO_SIMILAR',
        displayName: 'Participação em Curso, Palestra ou Evento Similar',
        code: 'participacao-eventos',
        aliases: [
          'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR',
          'PARTICIPACAO EM CURSO PALESTRA OU EVENTO SIMILAR',
          'CURSOS E EVENTOS',
          'CAPACITAÇÃO'
        ],
        keywords: ['participacao', 'curso', 'palestra', 'evento', 'capacitacao'],
        icon: '🎓',
        color: '#DB2777',
        description: 'Despesas com participação em cursos, palestras ou eventos similares',
        status: 'active'
      },
      {
        id: 13,
        canonical: 'PASSAGEM_AEREA_REEMBOLSO',
        displayName: 'Passagem Aérea - Reembolso',
        code: 'passagem-aerea-reembolso',
        aliases: [
          'PASSAGEM AÉREA - REEMBOLSO',
          'PASSAGEM AEREA REEMBOLSO',
          'REEMBOLSO DE PASSAGEM',
          'PASSAGEM REEMBOLSO'
        ],
        keywords: ['passagem', 'aerea', 'reembolso', 'viagem', 'aviao'],
        icon: '✈️',
        color: '#1F2937',
        description: 'Reembolso de despesas com passagens aéreas',
        status: 'active'
      },
      {
        id: 14,
        canonical: 'PASSAGEM_AEREA_RPA',
        displayName: 'Passagem Aérea - RPA',
        code: 'passagem-aerea-rpa',
        aliases: [
          'PASSAGEM AÉREA - RPA',
          'PASSAGEM AEREA RPA',
          'RPA PASSAGEM',
          'PASSAGEM RPA'
        ],
        keywords: ['passagem', 'aerea', 'rpa', 'viagem', 'aviao'],
        icon: '✈️',
        color: '#374151',
        description: 'Passagens aéreas via RPA',
        status: 'active'
      },
      {
        id: 15,
        canonical: 'PASSAGEM_AEREA_SIGEPA',
        displayName: 'Passagem Aérea - SIGEPA',
        code: 'passagem-aerea-sigepa',
        aliases: [
          'PASSAGEM AÉREA - SIGEPA',
          'PASSAGEM AEREA SIGEPA',
          'SIGEPA PASSAGEM',
          'PASSAGEM SIGEPA'
        ],
        keywords: ['passagem', 'aerea', 'sigepa', 'viagem', 'aviao'],
        icon: '✈️',
        color: '#4B5563',
        description: 'Passagens aéreas via SIGEPA',
        status: 'active'
      },
      {
        id: 16,
        canonical: 'PASSAGENS_TERRESTRES_MARITIMAS_OU_FLUVIAIS',
        displayName: 'Passagens Terrestres, Marítimas ou Fluviais',
        code: 'passagens-terrestres',
        aliases: [
          'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS',
          'PASSAGENS TERRESTRES MARITIMAS OU FLUVIAIS',
          'PASSAGENS TERRESTRES',
          'ÔNIBUS E BARCO'
        ],
        keywords: ['passagens', 'terrestres', 'maritimas', 'fluviais', 'onibus', 'barco'],
        icon: '🚌',
        color: '#16A34A',
        description: 'Passagens terrestres, marítimas ou fluviais',
        status: 'active'
      },
      {
        id: 17,
        canonical: 'SERVICO_DE_SEGURANCA_PRESTADO_POR_EMPRESA_ESPECIALIZADA',
        displayName: 'Serviço de Segurança Prestado por Empresa Especializada',
        code: 'servico-seguranca',
        aliases: [
          'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA',
          'SERVICO DE SEGURANCA PRESTADO POR EMPRESA ESPECIALIZADA',
          'SEGURANÇA ESPECIALIZADA',
          'EMPRESA DE SEGURANÇA'
        ],
        keywords: ['servico', 'seguranca', 'empresa', 'especializada', 'protecao'],
        icon: '🛡️',
        color: '#B91C1C',
        description: 'Serviços de segurança prestados por empresa especializada',
        status: 'active'
      },
      {
        id: 18,
        canonical: 'SERVICO_DE_TAXI_PEDAGIO_E_ESTACIONAMENTO',
        displayName: 'Serviço de Táxi, Pedágio e Estacionamento',
        code: 'taxi-pedagio',
        aliases: [
          'SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO',
          'SERVICO DE TAXI PEDAGIO E ESTACIONAMENTO',
          'TÁXI E PEDÁGIO',
          'TRANSPORTE URBANO'
        ],
        keywords: ['servico', 'taxi', 'pedagio', 'estacionamento', 'transporte'],
        icon: '🚕',
        color: '#FBBF24',
        description: 'Serviços de táxi, pedágio e estacionamento',
        status: 'active'
      },
      {
        id: 19,
        canonical: 'SERVICOS_POSTAIS',
        displayName: 'Serviços Postais',
        code: 'servicos-postais',
        aliases: [
          'SERVIÇOS POSTAIS',
          'SERVICOS POSTAIS',
          'CORREIOS',
          'CORRESPONDÊNCIA'
        ],
        keywords: ['servicos', 'postais', 'correios', 'correspondencia', 'sedex'],
        icon: '📮',
        color: '#7C2D12',
        description: 'Despesas com serviços postais',
        status: 'active'
      },
      {
        id: 20,
        canonical: 'TELEFONIA',
        displayName: 'Telefonia',
        code: 'telefonia',
        aliases: [
          'TELEFONIA',
          'TELEFONE',
          'COMUNICAÇÃO',
          'CELULAR'
        ],
        keywords: ['telefonia', 'telefone', 'comunicacao', 'celular', 'linha'],
        icon: '📞',
        color: '#1D4ED8',
        description: 'Despesas com telefonia',
        status: 'active'
      }
    ]
    
    defaultCategories.forEach(cat => {
      this.registerCategory({
        ...cat,
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          source: 'migration'
        }
      })
    })
  }
  
  registerCategory(category: CategoryDefinition): void {
    if (this.categories.has(category.id)) {
      throw new Error(`Category ID ${category.id} already exists`)
    }
    
    if (this.codeIndex.has(category.code)) {
      throw new Error(`Category code '${category.code}' already exists`)
    }
    
    this.categories.set(category.id, category)
    
    this.updateIndices(category)
    
    console.log(`✅ [CategoryRegistry] Registered category: ${category.displayName} (ID: ${category.id})`)
  }
  
  private updateIndices(category: CategoryDefinition): void {
    this.codeIndex.set(category.code, category.id)
    
    this.canonicalIndex.set(category.canonical, category.id)
    
    category.aliases.forEach(alias => {
      const normalized = this.normalizeText(alias)
      if (!this.aliasIndex.has(normalized)) {
        this.aliasIndex.set(normalized, [])
      }
      this.aliasIndex.get(normalized)!.push(category.id)
    })
    
    category.keywords.forEach(keyword => {
      const normalized = this.normalizeText(keyword)
      if (!this.keywordIndex.has(normalized)) {
        this.keywordIndex.set(normalized, [])
      }
      this.keywordIndex.get(normalized)!.push(category.id)
    })
  }
  
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }
  
  getById(id: number): CategoryDefinition | undefined {
    return this.categories.get(id)
  }
  
  getByCode(code: string): CategoryDefinition | undefined {
    const id = this.codeIndex.get(code)
    return id ? this.categories.get(id) : undefined
  }
  
  getByCanonical(canonical: string): CategoryDefinition | undefined {
    const id = this.canonicalIndex.get(canonical)
    return id ? this.categories.get(id) : undefined
  }
  
  findCategory(text: string): CategoryMatchResult | null {
    if (!text) return null
    
    const normalized = this.normalizeText(text)
    
    const exactMatch = this.canonicalIndex.get(normalized)
    if (exactMatch) {
      const category = this.categories.get(exactMatch)!
      return {
        category,
        confidence: 1.0,
        matchType: 'exact',
        matchedText: text
      }
    }
    
    const aliasMatches = this.aliasIndex.get(normalized)
    if (aliasMatches && aliasMatches.length > 0) {
      const category = this.categories.get(aliasMatches[0])!
      return {
        category,
        confidence: 0.9,
        matchType: 'alias', 
        matchedText: text
      }
    }
    
    const keywords = normalized.split('_')
    const keywordMatches: { id: number, matches: number }[] = []
    
    keywords.forEach(keyword => {
      const matches = this.keywordIndex.get(keyword)
      if (matches) {
        matches.forEach(id => {
          const existing = keywordMatches.find(km => km.id === id)
          if (existing) {
            existing.matches++
          } else {
            keywordMatches.push({ id, matches: 1 })
          }
        })
      }
    })
    
    if (keywordMatches.length > 0) {
      keywordMatches.sort((a, b) => b.matches - a.matches)
      const bestMatch = keywordMatches[0]
      const category = this.categories.get(bestMatch.id)!
      
      return {
        category,
        confidence: Math.min(0.8, bestMatch.matches / keywords.length),
        matchType: 'keyword',
        matchedText: text
      }
    }
    
    const fuzzyMatches = this.fuzzySearch(normalized)
    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0]
      return {
        category: bestMatch.category,
        confidence: bestMatch.score,
        matchType: 'fuzzy',
        matchedText: text
      }
    }
    
    return null
  }
  
  private fuzzySearch(query: string): { category: CategoryDefinition, score: number }[] {
    const results: { category: CategoryDefinition, score: number }[] = []
    
    this.categories.forEach(category => {
      const canonicalScore = this.calculateSimilarity(query, category.canonical.toLowerCase())
      
      const aliasScores = category.aliases.map(alias => 
        this.calculateSimilarity(query, this.normalizeText(alias))
      )
      
      const maxScore = Math.max(canonicalScore, ...aliasScores)
      
      if (maxScore > 0.6) { // Threshold mínimo de similaridade
        results.push({ category, score: maxScore })
      }
    })
    
    return results.sort((a, b) => b.score - a.score)
  }
  
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    
    const len1 = str1.length
    const len2 = str2.length
    
    if (len1 === 0 || len2 === 0) return 0.0
    
    const commonChars = new Set()
    
    for (let i = 0; i < len1; i++) {
      if (str2.includes(str1[i])) {
        commonChars.add(str1[i])
      }
    }
    
    return commonChars.size / Math.max(len1, len2)
  }
  
  getAllActive(): CategoryDefinition[] {
    return Array.from(this.categories.values())
      .filter(cat => cat.status === 'active')
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }
  
  getStats(): {
    totalCategories: number
    activeCategories: number
    deprecatedCategories: number
    totalAliases: number
    totalKeywords: number
  } {
    const categories = Array.from(this.categories.values())
    
    return {
      totalCategories: categories.length,
      activeCategories: categories.filter(c => c.status === 'active').length,
      deprecatedCategories: categories.filter(c => c.status === 'deprecated').length,
      totalAliases: categories.reduce((sum, c) => sum + c.aliases.length, 0),
      totalKeywords: categories.reduce((sum, c) => sum + c.keywords.length, 0)
    }
  }
}

export const categoryRegistry = new CategoryRegistry()

export const CategoryUtils = {
  resolve: (text: string): CategoryDefinition | null => {
    const result = categoryRegistry.findCategory(text)
    return result ? result.category : null
  },
  
  getCode: (text: string): string | null => {
    const category = CategoryUtils.resolve(text)
    return category ? category.code : null
  },
  
  getDisplayName: (text: string): string => {
    const category = CategoryUtils.resolve(text)
    return category ? category.displayName : text
  },
  
  isSame: (text1: string, text2: string): boolean => {
    const cat1 = CategoryUtils.resolve(text1)
    const cat2 = CategoryUtils.resolve(text2)
    return !!cat1 && !!cat2 && cat1.id === cat2.id
  }
}