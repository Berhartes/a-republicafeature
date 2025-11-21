import type { DeputadoProcessado, PremiacaoItem } from '@/types/etl-deputados.types'

interface ContextoPremiacoes {
  categoria?: string
  ano?: number
  posicao: number
}

/**
 * Convert deputado data into PremiacaoItem format
 */
export function processarPremiacaoItem(
  deputado: DeputadoProcessado,
  tipo: 'coroa' | 'trofeu' | 'medalha',
  contexto: ContextoPremiacoes
): PremiacaoItem {
  const titulo = gerarTituloPremiacoes(tipo, contexto.categoria, contexto.ano)
  const descricao = gerarDescricaoPremiacoes(deputado, contexto)

  return {
    deputadoId: deputado.id,
    titulo,
    descricao,
    categoria: contexto.categoria || 'Geral',
    valor: deputado.totalGastos,
    nomeEleitoral: deputado.nomeEleitoral,
    siglaPartido: deputado.siglaPartido,
    siglaUf: deputado.siglaUf,
    ano: contexto.ano,
    posicao: contexto.posicao,
  }
}

/**
 * Create titles like "Campeão Geral 2025"
 */
export function gerarTituloPremiacoes(
  tipo: string,
  categoria?: string,
  ano?: number
): string {
  const prefixos: Record<string, string> = {
    coroa: 'Campeão',
    trofeu: 'Campeão',
    medalha: 'Destaque',
  }

  const prefixo = prefixos[tipo] || 'Premiação'
  
  if (ano) {
    return `${prefixo} ${categoria || 'Geral'} ${ano}`
  }
  
  return `${prefixo} ${categoria || 'Geral'}`
}

/**
 * Create descriptions with deputado context
 */
export function gerarDescricaoPremiacoes(
  deputado: DeputadoProcessado,
  contexto: ContextoPremiacoes
): string {
  const posicaoTexto = contexto.posicao === 1 
    ? '1º lugar' 
    : contexto.posicao === 2 
    ? '2º lugar' 
    : '3º lugar'

  const categoriaTexto = contexto.categoria || 'Geral'
  const anoTexto = contexto.ano ? ` em ${contexto.ano}` : ''

  return `${posicaoTexto} em ${categoriaTexto}${anoTexto} - ${deputado.siglaPartido}/${deputado.siglaUf}`
}

/**
 * Map category names to lucide-react icon names
 */
export function mapCategoriaToIcon(categoria: string): string {
  const iconMap: Record<string, string> = {
    'COMBUSTÍVEIS E LUBRIFICANTES': 'Fuel',
    'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': 'Megaphone',
    'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR': 'Utensils',
    'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES': 'Car',
    'LOCAÇÃO OU FRETAMENTO DE AERONAVES': 'Plane',
    'PASSAGENS AÉREAS': 'Plane',
    'TELEFONIA': 'Phone',
    'SERVIÇOS POSTAIS': 'Mail',
    'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR': 'Building',
    'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS': 'FileText',
    'HOSPEDAGEM, EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': 'Hotel',
    'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS': 'Ship',
    'ASSINATURA DE PUBLICAÇÕES': 'Newspaper',
    'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR': 'GraduationCap',
    'SEGURANÇA E VIGILÂNCIA': 'Shield',
    'Geral': 'Trophy',
  }

  return iconMap[categoria] || 'Award'
}
