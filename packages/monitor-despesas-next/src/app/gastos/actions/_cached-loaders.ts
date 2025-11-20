import { unstable_cache, revalidateTag } from 'next/cache'
import { CacheService } from '@/services/cache-service'
import { CACHE_KEYS } from '@/constants/cache'

// Funções cacheadas com tags para suportar revalidateTag
// Cada uma carrega os dados usando CacheService.getFromSources

const cacheService = CacheService.getInstance()

export const loadSuppliersCache = async () => {
  return cacheService.getFromSources<{ fornecedores?: any[]; data?: any[] }>(CACHE_KEYS.SUPPLIERS)
}

export const loadDeputiesCache = async () => {
  return cacheService.getFromSources<{ deputados?: any[]; data?: { deputados?: any[] } }>(CACHE_KEYS.DEPUTIES)
}

export const loadAnalysisCache = unstable_cache(
  async () => {
    return cacheService.getFromSources<{ alertas?: any[]; fornecedoresSuspeitos?: any[] }>(CACHE_KEYS.ANALYSIS)
  },
  ['loadAnalysisCache'],
  { tags: [CACHE_KEYS.ANALYSIS] }
)

export const loadPremiacoesCache = unstable_cache(
  async () => {
    return cacheService.getFromSources<{ premiacoes?: { coroas: any[]; trofeus: any[]; medalhas: any[] } }>(CACHE_KEYS.PREMIACOES)
  },
  ['loadPremiacoesCache'],
  { tags: [CACHE_KEYS.PREMIACOES] }
)

// Utilitário: invalida explicitamente a tag (além do fluxo padrão via API invalidate)
export async function invalidateTagFor(key: string) {
  revalidateTag(key, 'max')
}
