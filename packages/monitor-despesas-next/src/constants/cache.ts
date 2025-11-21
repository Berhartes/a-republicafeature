export const CACHE_KEYS = {
  SUPPLIERS: 'suppliers-cache',
  DEPUTIES: 'deputies-cache',
  CATEGORIES: 'categories-cache',
  ANALYSIS: 'analysis-cache',
  PREMIACOES: 'premiacoes-cache',
} as const;

export const CACHE_PATHS = {
  // OBS: caminhos em public/cache permanecem apenas para compatibilidade local
  // Em produção, usar CacheService.getFromSources com ETL/CDN.
  [CACHE_KEYS.SUPPLIERS]: 'public/cache/suppliers-cache.json',
  [CACHE_KEYS.DEPUTIES]: 'public/cache/deputies-cache.json',
  [CACHE_KEYS.CATEGORIES]: 'public/cache/categories-cache.json',
  [CACHE_KEYS.ANALYSIS]: 'public/cache/analysis-cache.json',
  [CACHE_KEYS.PREMIACOES]: 'public/cache/premiacoes-cache.json',
} as const;
