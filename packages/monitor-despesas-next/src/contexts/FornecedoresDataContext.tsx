import { createContext, useContext, useReducer, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { type FornecedorStats, type FornecedoresResponse, type BuscarFornecedoresOptions } from '@/types/gastos';
import { normalizarCategoriaDisplay, categoriasEquivalentes } from '@/lib/categoria-utils';
import { fetchManifest, fetchSuppliersCache } from '@/data-access/monitordespesas';

const CATEGORIA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface FornecedoresPorCategoria {
  [categoria: string]: {
    fornecedores: FornecedorStats[];
    estatisticas: any;
    lastUpdated: number;
    loading: boolean;
  };
}

interface FornecedoresDataState {
  fornecedores: FornecedorStats[];
  fornecedoresPorCategoria: FornecedoresPorCategoria;
  estatisticas: FornecedoresResponse['estatisticas'] | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  hasMore: boolean;
  lastOptions: BuscarFornecedoresOptions | null;
  currentCategory: string | null;
}

interface FornecedoresDataContextType {
  fornecedores: FornecedorStats[];
  fornecedoresPorCategoria: FornecedoresPorCategoria;
  estatisticas: FornecedoresResponse['estatisticas'] | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  hasMore: boolean;
  currentCategory: string | null;
  
  buscarFornecedores: (options?: BuscarFornecedoresOptions) => Promise<void>;
  buscarFornecedoresPorCategoria: (categoria: string, forceRefresh?: boolean) => Promise<FornecedorStats[]>;
  getFornecedoresDaCategoria: (categoria: string) => FornecedorStats[];
  preloadCategoria: (categoria: string) => Promise<void>;
  isCategoriaLoaded: (categoria: string) => boolean;
  buscarFornecedorPorCNPJ: (cnpj: string) => Promise<FornecedorStats | null>;
  refetch: () => Promise<void>;
  clearCache: () => void;
  clearCategoriaCache: (categoria: string) => void;
  clearError: () => void;
}

type FornecedoresAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FORNECEDORES'; payload: { fornecedores: FornecedorStats[]; estatisticas: FornecedoresResponse['estatisticas']; hasMore: boolean } }
  | { type: 'SET_CATEGORIA_DATA'; payload: { categoria: string; fornecedores: FornecedorStats[]; estatisticas: any; loading: boolean } }
  | { type: 'SET_CATEGORIA_LOADING'; payload: { categoria: string; loading: boolean } }
  | { type: 'SET_CURRENT_CATEGORY'; payload: string | null }
  | { type: 'CLEAR_CATEGORIA_CACHE'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LAST_OPTIONS'; payload: BuscarFornecedoresOptions | null }
  | { type: 'RESET_STATE' };

function fornecedoresReducer(state: FornecedoresDataState, action: FornecedoresAction): FornecedoresDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_FORNECEDORES':
      return {
        ...state,
        fornecedores: action.payload.fornecedores,
        estatisticas: action.payload.estatisticas,
        hasMore: action.payload.hasMore,
        loading: false,
        error: null
      };
    case 'SET_CATEGORIA_DATA':
      return {
        ...state,
        fornecedoresPorCategoria: {
          ...state.fornecedoresPorCategoria,
          [action.payload.categoria]: {
            fornecedores: action.payload.fornecedores,
            estatisticas: action.payload.estatisticas,
            lastUpdated: Date.now(),
            loading: action.payload.loading
          }
        },
        error: null
      };
    case 'SET_CATEGORIA_LOADING': {
      const existing = state.fornecedoresPorCategoria[action.payload.categoria];
      return {
        ...state,
        fornecedoresPorCategoria: {
          ...state.fornecedoresPorCategoria,
          [action.payload.categoria]: {
            fornecedores: existing?.fornecedores ?? [],
            estatisticas: existing?.estatisticas ?? null,
            lastUpdated: existing?.lastUpdated ?? 0,
            loading: action.payload.loading,
          },
        },
      };
    }
    case 'SET_CURRENT_CATEGORY':
      return { ...state, currentCategory: action.payload };
    case 'CLEAR_CATEGORIA_CACHE':
      const { [action.payload]: removed, ...remainingCategories } = state.fornecedoresPorCategoria;
      return {
        ...state,
        fornecedoresPorCategoria: remainingCategories
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    case 'SET_LAST_OPTIONS':
      return { ...state, lastOptions: action.payload };
    case 'RESET_STATE':
      return {
        ...initialState,
      };
    default:
      return state;
  }
}

const initialState: FornecedoresDataState = {
  fornecedores: [],
  fornecedoresPorCategoria: {},
  estatisticas: null,
  loading: false,
  error: null,
  isConnected: false,
  hasMore: false,
  lastOptions: null,
  currentCategory: null
};

const FornecedoresDataContext = createContext<FornecedoresDataContextType | undefined>(undefined);

interface FornecedoresDataProviderProps {
  children: ReactNode;
  autoLoad?: boolean; // Se deve carregar automaticamente na inicialização
}

export function FornecedoresDataProvider({ children, autoLoad = false }: FornecedoresDataProviderProps) {
  const [state, dispatch] = useReducer(fornecedoresReducer, initialState);
  const cacheRef = useRef<{ lastOptions: string; lastFetch: number; data: any }>({
    lastOptions: '',
    lastFetch: 0,
    data: null
  });

  const buscarFornecedores = useCallback(async (options?: BuscarFornecedoresOptions) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('[FornecedoresDataProvider] 🔄 Iniciando busca de fornecedores...', options);

      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest not found');
      }

      const suppliersCache = await fetchSuppliersCache(manifest);
      if (!suppliersCache) {
        throw new Error('Suppliers cache not found');
      }

      const fornecedores = suppliersCache.data as FornecedorStats[];
      const estatisticas = (suppliersCache.metadata ?? null) as FornecedoresResponse['estatisticas'];

      const responseData = {
        fornecedores,
        estatisticas,
        hasMore: false, // This needs to be properly implemented if pagination is needed
      };

      dispatch({ 
        type: 'SET_FORNECEDORES', 
        payload: responseData
      });

      dispatch({ type: 'SET_LAST_OPTIONS', payload: options || null });

      console.log(`[FornecedoresDataProvider] ✅ ${responseData.fornecedores.length} fornecedores carregados`);

    } catch (error) {
      let errorMessage = 'Erro desconhecido ao buscar fornecedores';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('[FornecedoresDataProvider] ❌ Erro ao buscar fornecedores:', error);
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  const buscarFornecedorPorCNPJ = useCallback(async (cnpj: string): Promise<FornecedorStats | null> => {
    try {
      console.log(`[FornecedoresDataProvider] 🔍 Buscando fornecedor: ${cnpj}`);

      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest not found');
      }

      const suppliersCache = await fetchSuppliersCache(manifest);
      if (!suppliersCache) {
        throw new Error('Suppliers cache not found');
      }

      const fornecedor = (suppliersCache.data as FornecedorStats[]).find((f) => f.cnpj === cnpj);

      if (fornecedor) {
        console.log(`[FornecedoresDataProvider] ✅ Fornecedor encontrado: ${fornecedor.nome}`);
        return fornecedor;
      } else {
        console.log(`[FornecedoresDataProvider] ⚠️ Fornecedor não encontrado: ${cnpj}`);
        return null;
      }
    } catch (error) {
      console.error(`[FornecedoresDataProvider] ❌ Erro ao buscar fornecedor ${cnpj}:`, error);
      return null;
    }
  }, []);

  const matchesCategoria = useCallback((categoriaFornecedor: string, categoriaAlvo: string): boolean => {
    const normalizadaFornecedor = normalizarCategoriaDisplay(categoriaFornecedor);
    const normalizadaAlvo = normalizarCategoriaDisplay(categoriaAlvo);

    return (
      normalizadaFornecedor === normalizadaAlvo ||
      categoriasEquivalentes(categoriaFornecedor, categoriaAlvo) ||
      normalizadaFornecedor.includes(normalizadaAlvo) ||
      normalizadaAlvo.includes(normalizadaFornecedor)
    );
  }, []);

  const getFornecedoresDaCategoria = useCallback((categoria: string): FornecedorStats[] => {
    const categoriaCache = state.fornecedoresPorCategoria[categoria];
    if (categoriaCache && categoriaCache.fornecedores && categoriaCache.fornecedores.length > 0) {
      return categoriaCache.fornecedores;
    }
    
    if (state.fornecedores.length === 0) return [];
    
    return state.fornecedores.filter(fornecedor => {
      if (!fornecedor.categorias || fornecedor.categorias.length === 0) return false;
      
      return fornecedor.categorias.some(cat => matchesCategoria(cat, categoria));
    });
  }, [matchesCategoria, state.fornecedores, state.fornecedoresPorCategoria]);
  
  const buscarFornecedoresPorCategoria = useCallback(async (categoria: string, forceRefresh = false): Promise<FornecedorStats[]> => {
    console.log(`[FornecedoresDataProvider] 🏷️ Buscando fornecedores da categoria: ${categoria}`);

    try {
      dispatch({ type: 'SET_CATEGORIA_LOADING', payload: { categoria, loading: true } });
      dispatch({ type: 'SET_CURRENT_CATEGORY', payload: categoria });

      if (!forceRefresh) {
        const cachedCategoria = state.fornecedoresPorCategoria[categoria];
        const isValid =
          cachedCategoria &&
          cachedCategoria.fornecedores.length > 0 &&
          Date.now() - cachedCategoria.lastUpdated < CATEGORIA_CACHE_DURATION;

        if (isValid) {
          console.log(`[FornecedoresDataProvider] ♻️ Usando cache existente para categoria ${categoria}`);
          dispatch({
            type: 'SET_CATEGORIA_LOADING',
            payload: { categoria, loading: false },
          });
          return cachedCategoria.fornecedores;
        }
      }

      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest not found');
      }

      const suppliersCache = await fetchSuppliersCache(manifest);
      if (!suppliersCache) {
        throw new Error('Suppliers cache not found');
      }

      const fornecedoresFiltrados = (suppliersCache.data as FornecedorStats[]).filter((fornecedor) => {
        if (!fornecedor.categorias || fornecedor.categorias.length === 0) return false;
        return fornecedor.categorias.some(cat => matchesCategoria(cat, categoria));
      });

      const estatisticasCategoria = {
        totalFornecedores: fornecedoresFiltrados.length,
        volumeTotal: fornecedoresFiltrados.reduce((sum, f) => sum + (f.totalRecebido || f.totalTransacionado || 0), 0),
        transacoesTotal: fornecedoresFiltrados.reduce((sum, f) => sum + (f.numeroTransacoes || 0), 0),
        categoria,
      };

      dispatch({
        type: 'SET_CATEGORIA_DATA',
        payload: {
          categoria,
          fornecedores: fornecedoresFiltrados,
          estatisticas: estatisticasCategoria,
          loading: false
        }
      });

      console.log(`[FornecedoresDataProvider] ✅ Categoria ${categoria} carregada: ${fornecedoresFiltrados.length} fornecedores`);
      return fornecedoresFiltrados;

    } catch (error) {
      console.error(`[FornecedoresDataProvider] ❌ Erro ao buscar categoria ${categoria}:`, error);
      dispatch({ type: 'SET_CATEGORIA_LOADING', payload: { categoria, loading: false } });
      dispatch({ type: 'SET_ERROR', payload: `Erro ao carregar categoria ${categoria}` });
      return [];
    }
  }, [state.fornecedoresPorCategoria]);
  
  const preloadCategoria = useCallback(async (categoria: string): Promise<void> => {
    const categoriaCache = state.fornecedoresPorCategoria[categoria];
    const isValidCache = categoriaCache && 
                        (Date.now() - categoriaCache.lastUpdated) < CATEGORIA_CACHE_DURATION;
    
    if (isValidCache) {
      console.log(`[FornecedoresDataProvider] ⚡ Categoria ${categoria} já em cache - skip preload`);
      return;
    }
    
    console.log(`[FornecedoresDataProvider] 🔮 Pré-carregando categoria: ${categoria}`);
    
    try {
      const fornecedoresFiltrados = getFornecedoresDaCategoria(categoria);
      
      if (fornecedoresFiltrados.length > 0) {
        const estatisticasCategoria = {
          totalFornecedores: fornecedoresFiltrados.length,
          volumeTotal: fornecedoresFiltrados.reduce((sum, f) => sum + (f.totalRecebido || f.totalTransacionado || 0), 0),
          transacoesTotal: fornecedoresFiltrados.reduce((sum, f) => sum + (f.numeroTransacoes || 0), 0),
          categoria
        };
        
        dispatch({
          type: 'SET_CATEGORIA_DATA',
          payload: {
            categoria,
            fornecedores: fornecedoresFiltrados,
            estatisticas: estatisticasCategoria,
            loading: false
          }
        });
        
        console.log(`[FornecedoresDataProvider] ✅ Pré-carregamento concluído: ${categoria} (${fornecedoresFiltrados.length} fornecedores)`);
      }
    } catch (error) {
      console.warn(`[FornecedoresDataProvider] ⚠️ Erro no pré-carregamento de ${categoria}:`, error);
    }
  }, [state.fornecedoresPorCategoria, getFornecedoresDaCategoria]);
  
  const isCategoriaLoaded = useCallback((categoria: string): boolean => {
    const categoriaCache = state.fornecedoresPorCategoria[categoria];
    return Boolean(
      categoriaCache &&
        categoriaCache.fornecedores &&
        categoriaCache.fornecedores.length > 0 &&
        Date.now() - categoriaCache.lastUpdated < CATEGORIA_CACHE_DURATION
    );
  }, [state.fornecedoresPorCategoria]);
  
  const refetch = useCallback(async () => {
    console.log('[FornecedoresDataProvider] 🔄 Re-executando última busca...');
    await buscarFornecedores(state.lastOptions || undefined);
  }, [buscarFornecedores, state.lastOptions]);

  const clearCategoriaCache = useCallback((categoria: string) => {
    console.log(`[FornecedoresDataProvider] 🗑️ Limpando cache da categoria: ${categoria}`);
    dispatch({ type: 'CLEAR_CATEGORIA_CACHE', payload: categoria });
  }, []);
  
  const clearCache = useCallback(() => {
    console.log('[FornecedoresDataProvider] 🗑️ Limpando cache...');
    
    cacheRef.current = { lastOptions: '', lastFetch: 0, data: null };
    
    
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  useEffect(() => {
    if (autoLoad) {
      buscarFornecedores().catch((error) => {
        console.error('[FornecedoresDataProvider] ❌ Erro durante autoLoad:', error);
      });
    }
  }, [autoLoad, buscarFornecedores]);


  useEffect(() => {
    return () => {
      console.log('[FornecedoresDataProvider] 🧹 Context cleanup...');
    };
  }, []);

  const value: FornecedoresDataContextType = {
    fornecedores: state.fornecedores,
    fornecedoresPorCategoria: state.fornecedoresPorCategoria,
    estatisticas: state.estatisticas,
    loading: state.loading,
    error: state.error,
    isConnected: state.isConnected,
    hasMore: state.hasMore,
    currentCategory: state.currentCategory,
    
    buscarFornecedores,
    buscarFornecedoresPorCategoria,
    getFornecedoresDaCategoria,
    preloadCategoria,
    isCategoriaLoaded,
    buscarFornecedorPorCNPJ,
    refetch,
    clearCache,
    clearCategoriaCache,
    clearError
  };

  return (
    <FornecedoresDataContext.Provider value={value}>
      {children}
    </FornecedoresDataContext.Provider>
  );
}

export function useFornecedoresContext(): FornecedoresDataContextType {
  const context = useContext(FornecedoresDataContext);
  
  if (context === undefined) {
    throw new Error('useFornecedoresContext deve ser usado dentro de um FornecedoresDataProvider');
  }
  
  return context;
}

export function useFornecedoresContextOptional(): FornecedoresDataContextType | null {
  const context = useContext(FornecedoresDataContext);
  return context || null;
}

export default FornecedoresDataContext;