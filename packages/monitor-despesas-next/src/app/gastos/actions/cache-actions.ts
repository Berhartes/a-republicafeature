'use server';

import { CacheService } from '@/services/cache-service';
import { revalidateTag } from 'next/cache';
import { CACHE_KEYS } from '@/constants/cache'

/**
 * Invalida o cache de dados da aplicação.
 * Pode ser usado para limpar um cache específico ou todos os caches.
 * 
 * @param cacheKey A chave do cache a ser invalidado (opcional). Se não for fornecida, todos os caches serão limpos.
 * @returns Um objeto com o status da operação.
 */
export async function invalidateCache(cacheKey?: string): Promise<{
  success: boolean;
  message: string;
  clearedKeys: string[];
}> {
  try {
    const cacheService = CacheService.getInstance();
    
    const keysToClear: string[] = [];
    if (cacheKey) {
      keysToClear.push(cacheKey);
    } else {
      // Se nenhuma chave for fornecida, busca todas as chaves do registro.
      // Esta é uma simplificação; uma implementação mais robusta poderia ter um método
      // getRegisteredKeys() no CacheService.
      const stats = cacheService.getStats();
      if (stats instanceof Map) {
        keysToClear.push(...stats.keys());
      }
    }

    cacheService.clearCache(cacheKey);

    // Invalida tags do Next.js para forçar a revalidação de dados em páginas que usam ISR/SSR com tags.
    if (cacheKey) {
      revalidateTag(cacheKey, 'max');
    } else {
      for (const key of keysToClear) {
        revalidateTag(key, 'max');
      }
    }

    const message = cacheKey
      ? `Cache cleared for: ${cacheKey}`
      : 'All caches cleared';

    console.log(`[CACHE_INVALIDATION] ${message}`);

    return {
      success: true,
      message,
      clearedKeys: keysToClear,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('[CACHE_INVALIDATION_ERROR]', errorMessage);
    return {
      success: false,
      message: `Failed to invalidate cache: ${errorMessage}`,
      clearedKeys: [],
    };
  }
}
/**
 * Retorna estatísticas do CacheService para uma chave específica ou para todas.
 */
export async function getCacheStats(cacheKey?: string): Promise<
  | { key: string; stats: import('@/services/cache-service').CacheStats | undefined }
  | Array<{ key: string; stats: import('@/services/cache-service').CacheStats }>
> {
  const cacheService = CacheService.getInstance();
  const stats = cacheService.getStats(cacheKey);
  if (cacheKey) {
    return { key: cacheKey, stats: stats as any };
  }
  const all: Array<{ key: string; stats: import('@/services/cache-service').CacheStats }> = [];
  if (stats instanceof Map) {
    for (const [key, value] of stats.entries()) {
      all.push({ key, stats: value });
    }
  }
  return all;
}

export async function invalidateSuppliers() {
  const cs = CacheService.getInstance()
  cs.clearCache(CACHE_KEYS.SUPPLIERS)
  revalidateTag(CACHE_KEYS.SUPPLIERS, 'max')
  return { success: true }
}

export async function invalidateDeputies() {
  const cs = CacheService.getInstance()
  cs.clearCache(CACHE_KEYS.DEPUTIES)
  revalidateTag(CACHE_KEYS.DEPUTIES, 'max')
  return { success: true }
}

export async function invalidateAnalysis() {
  const cs = CacheService.getInstance()
  cs.clearCache(CACHE_KEYS.ANALYSIS)
  revalidateTag(CACHE_KEYS.ANALYSIS, 'max')
  return { success: true }
}

export async function invalidatePremiacoes() {
  const cs = CacheService.getInstance()
  cs.clearCache(CACHE_KEYS.PREMIACOES)
  revalidateTag(CACHE_KEYS.PREMIACOES, 'max')
  return { success: true }
}

/**
 * Lista caches disponíveis aplicando filtro por tipo de página.
 */
export async function listAvailableCaches(pageType: 'fornecedores' | 'deputados' | 'transacoes' | 'premiacoes' | 'all' = 'all') {
  const { loadCacheByKeyWithSource } = await import('@/lib/cache/cache-sources')

  const allCacheTypes = [
    { name: 'suppliers-cache', displayName: 'Fornecedores', description: 'Cache completo de fornecedores e transações', icon: '🏢', pageTypes: ['fornecedores'] },
    { name: 'deputies-cache', displayName: 'Deputados', description: 'Cache de deputados e despesas', icon: '👥', pageTypes: ['deputados', 'transacoes'] },
    { name: 'analysis-cache', displayName: 'Análises', description: 'Cache de análises e métricas', icon: '📊', pageTypes: ['transacoes'] },
    { name: 'dashboard-cache', displayName: 'Dashboard', description: 'Cache otimizado para dashboard', icon: '📈', pageTypes: ['transacoes'] },
    { name: 'rankings-cache', displayName: 'Rankings', description: 'Cache de rankings e classificações', icon: '🏆', pageTypes: ['premiacoes', 'transacoes'] },
    { name: 'premiacoes-cache', displayName: 'Premiações', description: 'Premiações consolidadas', icon: '🎖️', pageTypes: ['premiacoes'] },
  ]

  const cacheTypes = allCacheTypes.filter(c => pageType === 'all' || c.pageTypes.includes(pageType))

  // Evitar padrões amplos e leituras de filesystem no bundler; confiar nas métricas retornadas

  const results = [] as Array<{
    name: string
    displayName: string
    size: string
    lastModified: Date
    entries: number
    description: string
    available: boolean
    etlSource?: string
    metadata?: any
  }>

  for (const ct of cacheTypes) {
    const { data, source, sizeBytes } = await loadCacheByKeyWithSource<any>(ct.name)
    if (data) {
      let entries = 0
      if (Array.isArray((data as any).data)) entries = (data as any).data.length
      else if (Array.isArray((data as any).deputados)) entries = (data as any).deputados.length
      else if (Array.isArray((data as any).rankings)) entries = (data as any).rankings.length
      else if (typeof data === 'object') entries = Object.keys(data as any).length

      const size = typeof sizeBytes === 'number' ? sizeBytes : Buffer.byteLength(JSON.stringify(data), 'utf-8')
      results.push({
        name: ct.name,
        displayName: `${ct.icon} ${ct.displayName}`,
        size: formatFileSize(size),
        lastModified: new Date(),
        entries,
        description: ct.description,
        available: true,
        etlSource: source,
        metadata: (data as any).metadata || {},
      })
    } else {
      results.push({
        name: ct.name,
        displayName: `${ct.icon} ${ct.displayName}`,
        size: '0 KB',
        lastModified: new Date(),
        entries: 0,
        description: `${ct.description} (não disponível)`,
        available: false,
      })
    }
  }

  return results
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}
