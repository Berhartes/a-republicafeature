
import { 
  fetchManifest, 
  fetchSuppliersCache, 
  fetchDashboardCache,
  fetchAnalysisCache,
  type Manifest,
  type SupplierCacheEntry 
} from './monitordespesas';

export type CacheType = 'suppliers' | 'dashboard' | 'analysis' | 'deputies' | 'rankings' | 'premiacoes' | 'transacoes' | 'categorias' | 'senado';

export interface LazyLoadState {
  loaded: Set<CacheType>;
  loading: Set<CacheType>;
  errors: Map<CacheType, Error>;
  lastLoadTime: Map<CacheType, number>;
}

const state: LazyLoadState = {
  loaded: new Set(),
  loading: new Set(),
  errors: new Map(),
  lastLoadTime: new Map(),
};

const memoryCache = {
  manifest: null as Manifest | null,
  suppliers: null as SupplierCacheEntry[] | null,
  dashboard: null as any,
  analysis: null as any,
  deputies: null as any,
  rankings: null as any,
  premiacoes: null as any,
  transacoes: null as any,
  categorias: null as any,
  senado: null as any,
};

export function isCacheLoaded(type: CacheType): boolean {
  return state.loaded.has(type);
}

export function isCacheLoading(type: CacheType): boolean {
  return state.loading.has(type);
}

export function getCacheError(type: CacheType): Error | undefined {
  return state.errors.get(type);
}

export async function loadManifest(): Promise<Manifest | null> {
  if (memoryCache.manifest) {
    console.info('[LazyLoad] Usando manifest em cache');
    return memoryCache.manifest;
  }

  console.info('[LazyLoad] Carregando manifest...');
  const manifest = await fetchManifest();
  
  if (manifest) {
    memoryCache.manifest = manifest;
    console.info('[LazyLoad] ✅ Manifest carregado');
  }
  
  return manifest;
}

export async function loadSuppliersCache(): Promise<SupplierCacheEntry[]> {
  const cacheType: CacheType = 'suppliers';
  
  if (memoryCache.suppliers) {
    console.info('[LazyLoad] Usando suppliers em cache (memória)');
    return memoryCache.suppliers;
  }
  
  if (state.loading.has(cacheType)) {
    console.info('[LazyLoad] Suppliers já está sendo carregado, aguardando...');
    while (state.loading.has(cacheType)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return memoryCache.suppliers || [];
  }
  
  try {
    state.loading.add(cacheType);
    state.errors.delete(cacheType);
    
    console.info('[LazyLoad] 📦 Carregando suppliers-cache...');
    const startTime = performance.now();
    
    const manifest = await loadManifest();
    if (!manifest) {
      throw new Error('Manifest não disponível');
    }
    
    const response = await fetchSuppliersCache(manifest);
    
    if (response) {
      memoryCache.suppliers = response.data;
      state.loaded.add(cacheType);
      state.lastLoadTime.set(cacheType, Date.now());
      
      const loadTime = performance.now() - startTime;
      console.info(`[LazyLoad] ✅ Suppliers carregado (${loadTime.toFixed(0)}ms)`);
      
      return response.data;
    }
    
    return [];
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    state.errors.set(cacheType, err);
    console.error('[LazyLoad] ❌ Erro ao carregar suppliers:', err);
    throw err;
    
  } finally {
    state.loading.delete(cacheType);
  }
}

export async function loadDashboardCache(): Promise<any> {
  const cacheType: CacheType = 'dashboard';
  
  if (memoryCache.dashboard) {
    console.info('[LazyLoad] Usando dashboard em cache (memória)');
    return memoryCache.dashboard;
  }
  
  if (state.loading.has(cacheType)) {
    console.info('[LazyLoad] Dashboard já está sendo carregado, aguardando...');
    while (state.loading.has(cacheType)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return memoryCache.dashboard || {};
  }
  
  try {
    state.loading.add(cacheType);
    state.errors.delete(cacheType);
    
    console.info('[LazyLoad] 📊 Carregando dashboard-cache...');
    const startTime = performance.now();
    
    const manifest = await loadManifest();
    if (!manifest) {
      throw new Error('Manifest não disponível');
    }
    
    const response = await fetchDashboardCache(manifest);
    
    if (response) {
      memoryCache.dashboard = response.data;
      state.loaded.add(cacheType);
      state.lastLoadTime.set(cacheType, Date.now());
      
      const loadTime = performance.now() - startTime;
      console.info(`[LazyLoad] ✅ Dashboard carregado (${loadTime.toFixed(0)}ms)`);
      
      return response.data;
    }
    
    return {};
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    state.errors.set(cacheType, err);
    console.error('[LazyLoad] ❌ Erro ao carregar dashboard:', err);
    throw err;
    
  } finally {
    state.loading.delete(cacheType);
  }
}

export async function loadAnalysisCache(): Promise<any> {
  const cacheType: CacheType = 'analysis';
  
  if (memoryCache.analysis) {
    console.info('[LazyLoad] Usando analysis em cache (memória)');
    return memoryCache.analysis;
  }
  
  if (state.loading.has(cacheType)) {
    console.info('[LazyLoad] Analysis já está sendo carregado, aguardando...');
    while (state.loading.has(cacheType)) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return memoryCache.analysis || {};
  }
  
  try {
    state.loading.add(cacheType);
    state.errors.delete(cacheType);
    
    console.info('[LazyLoad] 📈 Carregando analysis-cache...');
    const startTime = performance.now();
    
    const manifest = await loadManifest();
    if (!manifest) {
      throw new Error('Manifest não disponível');
    }
    
    const response = await fetchAnalysisCache(manifest);
    
    if (response) {
      memoryCache.analysis = response.data;
      state.loaded.add(cacheType);
      state.lastLoadTime.set(cacheType, Date.now());
      
      const loadTime = performance.now() - startTime;
      console.info(`[LazyLoad] ✅ Analysis carregado (${loadTime.toFixed(0)}ms)`);
      
      return response.data;
    }
    
    return {};
    
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    state.errors.set(cacheType, err);
    console.error('[LazyLoad] ❌ Erro ao carregar analysis:', err);
    throw err;
    
  } finally {
    state.loading.delete(cacheType);
  }
}

export async function preloadCaches(types: CacheType[]): Promise<void> {
  console.info(`[LazyLoad] 🔄 Pre-carregando caches: ${types.join(', ')}`);
  
  const promises = types.map(type => {
    switch (type) {
      case 'suppliers':
        return loadSuppliersCache();
      case 'dashboard':
        return loadDashboardCache();
      case 'analysis':
        return loadAnalysisCache();
      default:
        return Promise.resolve();
    }
  });
  
  await Promise.allSettled(promises);
  console.info('[LazyLoad] ✅ Pre-carregamento concluído');
}

export function clearMemoryCache(type?: CacheType): void {
  if (type) {
    console.info(`[LazyLoad] 🧹 Limpando cache: ${type}`);
    
    switch (type) {
      case 'suppliers':
        memoryCache.suppliers = null;
        break;
      case 'dashboard':
        memoryCache.dashboard = null;
        break;
      case 'analysis':
        memoryCache.analysis = null;
        break;
    }
    
    state.loaded.delete(type);
    state.lastLoadTime.delete(type);
    state.errors.delete(type);
    
  } else {
    console.info('[LazyLoad] 🧹 Limpando todos os caches');
    
    memoryCache.manifest = null;
    memoryCache.suppliers = null;
    memoryCache.dashboard = null;
    memoryCache.analysis = null;
    memoryCache.deputies = null;
    memoryCache.rankings = null;
    
    state.loaded.clear();
    state.lastLoadTime.clear();
    state.errors.clear();
  }
}

export function getLazyLoadStats() {
  return {
    loaded: Array.from(state.loaded),
    loading: Array.from(state.loading),
    errors: Object.fromEntries(state.errors),
    memoryUsage: {
      manifest: !!memoryCache.manifest,
      suppliers: !!memoryCache.suppliers,
      dashboard: !!memoryCache.dashboard,
      analysis: !!memoryCache.analysis,
      deputies: !!memoryCache.deputies,
      rankings: !!memoryCache.rankings,
    },
    lastLoadTimes: Object.fromEntries(state.lastLoadTime),
  };
}

export function getPreloadStrategy(route: string): CacheType[] {
  if (route.includes('/dashboard') || route === '/') {
    return ['dashboard'];
  }
  
  if (route.includes('/fornecedor')) {
    return ['suppliers'];
  }
  
  if (route.includes('/analise') || route.includes('/analysis')) {
    return ['analysis'];
  }
  
  if (route.includes('/deputado')) {
    return ['deputies'];
  }
  
  if (route.includes('/ranking')) {
    return ['rankings'];
  }
  
  return ['dashboard'];
}
