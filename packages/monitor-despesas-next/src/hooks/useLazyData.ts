
import { useState, useEffect, useCallback } from 'react';
import { etlCacheService } from '../services/etl-cache.service';
import {
  loadManifest,
  loadSuppliersCache,
  loadDashboardCache,
  loadAnalysisCache,
  isCacheLoaded,
  isCacheLoading,
  getCacheError,
  preloadCaches,
  type CacheType,
} from '../data-access/lazy-loader';

interface UseDataState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useDashboardData(): UseDataState<any> {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboardData = await loadDashboardCache();
      setData(dashboardData);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useDashboardData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function useSuppliersData(): UseDataState<SupplierCacheEntry[]> {
  const [data, setData] = useState<SupplierCacheEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const suppliers = await loadSuppliersCache();
      setData(suppliers);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useSuppliersData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function useAnalysisData(): UseDataState<any> {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const analysisData = await loadAnalysisCache();
      setData(analysisData);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useAnalysisData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function usePremiacoesData(): UseDataState<any> {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const premiacoesData = await etlCacheService.fetchPremiacoesCache();
      setData(premiacoesData);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[usePremiacoesData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function useTransacoesData(): UseDataState<any> {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const transacoesData = await etlCacheService.fetchTransacoesCache();
      setData(transacoesData);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useTransacoesData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function useCategoriasData(): UseDataState<any> {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const categoriasData = await etlCacheService.fetchCategoriasCache();
      setData(categoriasData);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useCategoriasData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function useSenadoData(): UseDataState<any> {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const senadoData = await etlCacheService.fetchSenadoCache();
      setData(senadoData);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('[useSenadoData] Erro:', error);
      
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}

export function usePreloadCaches(route: string) {
  useEffect(() => {
    const cachesToPreload: CacheType[] = [];
    
    if (route.includes('/fornecedor')) {
      cachesToPreload.push('suppliers');
    }
    
    if (route.includes('/dashboard') || route === '/') {
      cachesToPreload.push('dashboard');
    }
    
    if (route.includes('/analise')) {
      cachesToPreload.push('analysis');
    }

    if (route.includes('/premiacoes')) {
      cachesToPreload.push('premiacoes');
    }

    if (route.includes('/transacoes')) {
      cachesToPreload.push('transacoes');
    }

    if (route.includes('/categorias')) {
      cachesToPreload.push('categorias');
    }

    if (route.includes('/senado')) {
      cachesToPreload.push('senado');
    }
    
    if (cachesToPreload.length > 0) {
      preloadCaches(cachesToPreload).catch(err => {
        console.warn('[usePreloadCaches] Erro ao pre-carregar:', err);
      });
    }
  }, [route]);
}

export function useCacheStatus(type: CacheType) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLoaded(isCacheLoaded(type));
      setIsLoading(isCacheLoading(type));
      setError(getCacheError(type) || null);
    }, 500);

    return () => clearInterval(interval);
  }, [type]);

  return { isLoaded, isLoading, error };
}

export function useManifest() {
  const [manifest, setManifest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    loadManifest()
      .then(data => {
        setManifest(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });
  }, []);

  return { manifest, loading, error };
}
