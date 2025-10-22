
import { normalizarCategoria } from './categoria-utils'

const PALETA_CORES = [
  '#3B82F6', // Azul
  '#10B981', // Verde
  '#F59E0B', // Amarelo/Laranja
  '#EF4444', // Vermelho
  '#8B5CF6', // Roxo
  '#06B6D4', // Ciano
  '#6B7280', // Cinza
  '#EC4899', // Rosa
  '#14B8A6', // Verde-água
  '#F97316', // Laranja
] as const

const MAPEAMENTO_CATEGORIA_COR: Record<string, string> = {
  'COMBUSTÍVEIS E LUBRIFICANTES': '#3B82F6',
  'COMBUSTIVEIS E LUBRIFICANTES': '#3B82F6',
  
  'PASSAGENS AÉREAS': '#EF4444',
  'PASSAGENS AEREAS': '#EF4444',
  
  'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR': '#F59E0B',
  'FORNECIMENTO DE ALIMENTACAO DO PARLAMENTAR': '#F59E0B',
  'ALIMENTAÇÃO DO PARLAMENTAR': '#F59E0B',
  'ALIMENTACAO DO PARLAMENTAR': '#F59E0B',
  
  'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': '#14B8A6',
  'HOSPEDAGEM, EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': '#14B8A6',
  'HOSPEDAGEM (EXCETO DF)': '#14B8A6',
  'HOSPEDAGEM': '#14B8A6',
  
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES': '#06B6D4',
  'LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES': '#06B6D4',
  'LOCAÇÃO DE VEÍCULOS AUTOMOTORES': '#06B6D4',
  'LOCACAO DE VEICULOS AUTOMOTORES': '#06B6D4',
  
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': '#10B981',
  'DIVULGACAO DA ATIVIDADE PARLAMENTAR': '#10B981',
  
  'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS': '#8B5CF6',
  'CONSULTORIA, PESQUISA E TRABALHO TECNICO': '#8B5CF6',
  'CONSULTORIAS E TRABALHOS TÉCNICOS': '#8B5CF6',
  'CONSULTORIAS E TRABALHOS TECNICOS': '#8B5CF6',
  
  'TELEFONIA': '#6B7280',
  
  'SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO': '#6B7280',
  'SERVICO DE TAXI, PEDAGIO E ESTACIONAMENTO': '#6B7280',
  'TÁXI, PEDÁGIO E ESTACIONAMENTO': '#6B7280',
  'TAXI, PEDAGIO E ESTACIONAMENTO': '#6B7280',
  
  'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS': '#8B5CF6',
  'PASSAGENS TERRESTRES, MARITIMAS OU FLUVIAIS': '#8B5CF6',
  'PASSAGENS TERRESTRES/MARÍTIMAS': '#8B5CF6',
  'PASSAGENS TERRESTRES/MARITIMAS': '#8B5CF6',
  
  'LOCAÇÃO OU FRETAMENTO DE AERONAVES': '#F97316',
  'LOCACAO OU FRETAMENTO DE AERONAVES': '#F97316',
  'LOCAÇÃO DE AERONAVES': '#F97316',
  'LOCACAO DE AERONAVES': '#F97316',
  
  'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR': '#EC4899',
  'PARTICIPACAO EM CURSO, PALESTRA OU EVENTO SIMILAR': '#EC4899',
  'PARTICIPAÇÃO EM CURSOS/EVENTOS': '#EC4899',
  'PARTICIPACAO EM CURSOS/EVENTOS': '#EC4899',
  
  'SERVIÇOS POSTAIS': '#EC4899',
  'SERVICOS POSTAIS': '#EC4899',
  
  'MANUTENÇÃO DE EQUIPAMENTOS DE INFORMÁTICA': '#3B82F6',
  'MANUTENCAO DE EQUIPAMENTOS DE INFORMATICA': '#3B82F6',
  'MANUTENÇÃO DE EQUIPAMENTOS DE TI': '#3B82F6',
  'MANUTENCAO DE EQUIPAMENTOS DE TI': '#3B82F6',
  
  'ASSINATURA DE PUBLICAÇÕES': '#F97316',
  'ASSINATURA DE PUBLICACOES': '#F97316',
  
  'AQUISIÇÃO DE TOKENS': '#10B981', // Verde
  'AQUISICAO DE TOKENS': '#10B981',
  'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR': '#14B8A6', // Verde-água
  'MANUTENCAO DE ESCRITORIO DE APOIO A ATIVIDADE PARLAMENTAR': '#14B8A6',
  'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA': '#EF4444', // Vermelho
  'SERVICO DE SEGURANCA PRESTADO POR EMPRESA ESPECIALIZADA': '#EF4444',
}

export function getCategoriaColor(categoria: string): string {
  if (!categoria) return PALETA_CORES[0]
  
  const categoriaUpper = categoria.toUpperCase()
  if (MAPEAMENTO_CATEGORIA_COR[categoriaUpper]) {
    return MAPEAMENTO_CATEGORIA_COR[categoriaUpper]
  }
  
  const categoriaNormalizada = normalizarCategoria(categoria)
  
  if (categoriaNormalizada.includes('combusti') || categoriaNormalizada.includes('lubrificant')) {
    return '#3B82F6' // Azul
  }
  
  if ((categoriaNormalizada.includes('locacao') || categoriaNormalizada.includes('fretamento')) && 
      categoriaNormalizada.includes('veiculo')) {
    return '#06B6D4' // Ciano
  }
  
  if (categoriaNormalizada.includes('aeronav') || categoriaNormalizada.includes('aviao')) {
    return '#F97316' // Laranja
  }
  
  if (categoriaNormalizada.includes('passag') && categoriaNormalizada.includes('aer')) {
    return '#EF4444' // Vermelho
  }
  
  if (categoriaNormalizada.includes('alimenta') || categoriaNormalizada.includes('refeic')) {
    return '#F59E0B' // Amarelo
  }
  
  if (categoriaNormalizada.includes('hospedagem')) {
    return '#14B8A6' // Verde-água
  }
  
  if (categoriaNormalizada.includes('consultoria') || categoriaNormalizada.includes('pesquisa')) {
    return '#8B5CF6' // Roxo
  }
  
  if (categoriaNormalizada.includes('divulgacao') || categoriaNormalizada.includes('atividade-parlamentar')) {
    return '#10B981' // Verde
  }
  
  if (categoriaNormalizada.includes('telefon')) {
    return '#6B7280' // Cinza
  }
  
  if (categoriaNormalizada.includes('taxi') || categoriaNormalizada.includes('pedagio')) {
    return '#6B7280' // Cinza
  }
  
  const hash = categoria.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length]
}

export function getCategoriaColorIndex(categoria: string): number {
  const cor = getCategoriaColor(categoria)
  const index = PALETA_CORES.indexOf(cor as any)
  return index >= 0 ? index : 0
}

export function getAllColors(): readonly string[] {
  return PALETA_CORES
}

export function getAllCategoryColors(): Record<string, string> {
  return { ...MAPEAMENTO_CATEGORIA_COR }
}

export function hasSpecificColor(categoria: string): boolean {
  return !!MAPEAMENTO_CATEGORIA_COR[categoria.toUpperCase()]
}

export function getCategoriesWithSpecificColors(): string[] {
  return Object.keys(MAPEAMENTO_CATEGORIA_COR)
}

export function debugCategoriaColor(categoria: string): {
  categoria: string
  cor: string
  corNome: string
  metodo: 'mapeamento_direto' | 'palavra_chave' | 'hash_fallback'
} {
  const cor = getCategoriaColor(categoria)
  const categoriaUpper = categoria.toUpperCase()
  const categoriaNormalizada = normalizarCategoria(categoria)
  
  let metodo: 'mapeamento_direto' | 'palavra_chave' | 'hash_fallback' = 'hash_fallback'
  
  if (MAPEAMENTO_CATEGORIA_COR[categoriaUpper]) {
    metodo = 'mapeamento_direto'
  } else if (
    categoriaNormalizada.includes('combusti') ||
    categoriaNormalizada.includes('locacao') ||
    categoriaNormalizada.includes('aeronav') ||
    categoriaNormalizada.includes('passag') ||
    categoriaNormalizada.includes('alimenta') ||
    categoriaNormalizada.includes('hospedagem') ||
    categoriaNormalizada.includes('consultoria') ||
    categoriaNormalizada.includes('divulgacao') ||
    categoriaNormalizada.includes('telefon') ||
    categoriaNormalizada.includes('taxi')
  ) {
    metodo = 'palavra_chave'
  }
  
  const corNomes: Record<string, string> = {
    '#3B82F6': 'Azul',
    '#10B981': 'Verde', 
    '#F59E0B': 'Amarelo',
    '#EF4444': 'Vermelho',
    '#8B5CF6': 'Roxo',
    '#06B6D4': 'Ciano',
    '#6B7280': 'Cinza',
    '#EC4899': 'Rosa',
    '#14B8A6': 'Verde-água',
    '#F97316': 'Laranja'
  }
  
  return {
    categoria,
    cor,
    corNome: corNomes[cor] || 'Desconhecida',
    metodo
  }
}