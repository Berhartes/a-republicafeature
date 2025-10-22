
const CATEGORY_SLUG_MAP: Record<string, string> = {
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES': 'locacao-de-veiculos',
  'LOCAÇÃO OU FRETAMENTO DE AERONAVES': 'locacao-de-aeronaves',
  'LOCAÇÃO OU FRETAMENTO DE EMBARCAÇÕES': 'locacao-de-embarcacoes',
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': 'divulgacao-parlamentar',
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.': 'divulgacao-parlamentar',
  'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR': 'alimentacao-parlamentar',
  'COMBUSTÍVEIS E LUBRIFICANTES': 'combustiveis-lubrificantes',
  'PASSAGENS AÉREAS': 'passagens-aereas',
  'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS': 'passagens-terrestres',
  'TELEFONIA': 'telefonia',
  'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS': 'consultorias-pesquisas',
  'SERVIÇOS POSTAIS': 'servicos-postais',
  'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': 'hospedagem',
  'ASSINATURA DE PUBLICAÇÕES': 'assinatura-publicacoes',
  'AQUISIÇÃO DE TOKENS': 'aquisicao-tokens',
  'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR': 'manutencao-escritorio',
  'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR': 'cursos-eventos',
  'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA': 'seguranca-especializada',
  'SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO': 'taxi-pedagio'
}

const SLUG_CATEGORY_MAP: Record<string, string> = {}
Object.entries(CATEGORY_SLUG_MAP).forEach(([category, slug]) => {
  SLUG_CATEGORY_MAP[slug] = category
})

function normalizeCategoryName(category: string): string {
  return category
    .toUpperCase()
    .trim()
    .replace(/[ÀÁÂÃÄÅ]/g, 'A')
    .replace(/[ÈÉÊË]/g, 'E')
    .replace(/[ÌÍÎÏ]/g, 'I')
    .replace(/[ÒÓÔÕÖ]/g, 'O')
    .replace(/[ÙÚÛÜ]/g, 'U')
    .replace(/[Ç]/g, 'C')
    .replace(/[Ñ]/g, 'N')
    .replace(/\s+/g, ' ')
}

function generateSlugFromCategory(category: string): string {
  const normalized = normalizeCategoryName(category)
  
  return normalized
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Espaços viram hífens
    .replace(/-+/g, '-') // Múltiplos hífens viram um só
    .replace(/^-|-$/g, '') // Remove hífens do início/fim
    .substring(0, 50) // Limita tamanho
}

export function categoryToSlug(category: string): string {
  if (!category) return 'categoria'
  
  let cleanCategory = category
  try {
    cleanCategory = decodeURIComponent(category)
  } catch {
    try {
      cleanCategory = category
        .replace(/%25C3%2587/g, 'Ç')
        .replace(/%25C3%2583/g, 'Ã')
        .replace(/%C3%87/g, 'Ç')
        .replace(/%C3%83/g, 'Ã')
        .replace(/%C3%8D/g, 'Í')
        .replace(/%C3%95/g, 'Õ')
        .replace(/%C3%9A/g, 'Ú')
        .replace(/%2520/g, ' ')
        .replace(/%20/g, ' ')
        .replace(/\+/g, ' ')
    } catch {
    }
  }
  
  const normalized = normalizeCategoryName(cleanCategory)
  
  if (CATEGORY_SLUG_MAP[normalized]) {
    return CATEGORY_SLUG_MAP[normalized]
  }
  
  for (const [mappedCategory, slug] of Object.entries(CATEGORY_SLUG_MAP)) {
    const mappedNormalized = normalizeCategoryName(mappedCategory)
    if (normalized === mappedNormalized || 
        normalized.includes(mappedNormalized) || 
        mappedNormalized.includes(normalized)) {
      return slug
    }
  }
  
  const autoSlug = generateSlugFromCategory(normalized)
  
  if (autoSlug && autoSlug !== 'categoria') {
    SLUG_CATEGORY_MAP[autoSlug] = normalized
  }
  
  return autoSlug
}

export function slugToCategory(slug: string): string {
  if (!slug) return ''

  if (SLUG_CATEGORY_MAP[slug]) {
    return SLUG_CATEGORY_MAP[slug]
  }

  const slugNormalizado = slug.toLowerCase().replace(/-/g, ' ')

  for (const [mappedCategory, mappedSlug] of Object.entries(CATEGORY_SLUG_MAP)) {
    const categoryNormalizada = mappedCategory.toLowerCase()
    const slugMapeado = mappedSlug.toLowerCase().replace(/-/g, ' ')

    if (slugNormalizado === slugMapeado ||
        categoryNormalizada.includes(slugNormalizado) ||
        slugNormalizado.includes(slugMapeado)) {
      console.log(`🔍 [slugToCategory] Encontrada categoria por similaridade: "${slug}" → "${mappedCategory}"`)
      return mappedCategory
    }
  }

  const categoryFromSlug = slug
    .split('-')
    .map(word => word.toUpperCase())
    .join(' ')

  console.warn(`⚠️ [slugToCategory] Slug não encontrado no mapeamento: ${slug}, tentando: ${categoryFromSlug}`)
  return categoryFromSlug
}

export function isValidSlug(slug: string): boolean {
  return !!SLUG_CATEGORY_MAP[slug]
}

export function getAllSlugs(): string[] {
  return Object.keys(SLUG_CATEGORY_MAP).sort()
}

export function getAllCategoriesWithSlugs(): Array<{category: string, slug: string}> {
  return Object.entries(CATEGORY_SLUG_MAP).map(([category, slug]) => ({
    category,
    slug
  })).sort((a, b) => a.category.localeCompare(b.category))
}

export function createCategoryUrl(category: string): string {
  const slug = categoryToSlug(category)
  return `/gastos/categorias/${slug}`
}

export function getCategoryFromUrl(url: string): string {
  const parts = url.split('/')
  const slug = parts[parts.length - 1]
  return slugToCategory(slug)
}

export function mapearCategoriaCompleta(categoria: string): string {
  if (!categoria) return 'DESPESA NÃO ESPECIFICADA'

  const categoriaNormalizada = normalizeCategoryName(categoria)

  if (CATEGORY_SLUG_MAP[categoriaNormalizada]) {
    return categoriaNormalizada
  }

  for (const [categoriaCompleta] of Object.entries(CATEGORY_SLUG_MAP)) {
    const completaNormalizada = normalizeCategoryName(categoriaCompleta)

    if (completaNormalizada.includes(categoriaNormalizada) ||
        categoriaNormalizada.includes(completaNormalizada)) {
      console.log(`🔍 [mapearCategoriaCompleta] Mapeando "${categoria}" → "${categoriaCompleta}"`)
      return categoriaCompleta
    }
  }

  if (categoriaNormalizada.includes('VEICULO') || categoriaNormalizada.includes('LOCACAO')) {
    return 'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES'
  }

  console.warn(`⚠️ [mapearCategoriaCompleta] Categoria não mapeada: ${categoria}`)
  return categoria.toUpperCase()
}