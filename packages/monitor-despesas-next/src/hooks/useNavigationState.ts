import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from '@/lib/router/navigation';
import { categoryToSlug, slugToCategory } from '@/lib/category-slugs';

export interface NavigationState {
  previousPage: string | null;
  previousFilters: Record<string, any>;
  currentPage: string;
  currentFilters: Record<string, any>;
  breadcrumb: Array<{ label: string; path: string; filters?: Record<string, any> }>;
}

export interface NavigationContextData {
  fornecedorId?: string;
  categoria?: string;
  filtros?: {
    busca?: string;
    score?: string;
    categoria?: string;
    ano?: number | 'todos';
    mes?: string;
    [key: string]: any;
  };
  origem?: 'fornecedores-geral' | 'categoria-especifica' | 'perfil-fornecedor' | 'busca-global';
}

const STORAGE_KEY = 'gastos-navigation-state';

export function useNavigationState() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [navigationState, setNavigationState] = useState<NavigationState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          previousPage: null,
          previousFilters: {},
          currentPage: location.pathname,
          currentFilters: {},
          breadcrumb: [],
          ...parsed
        };
      }
    } catch (error) {
      console.warn('[useNavigationState] Erro ao recuperar estado:', error);
    }

    return {
      previousPage: null,
      previousFilters: {},
      currentPage: location.pathname,
      currentFilters: {},
      breadcrumb: []
    };
  });

  const contextDataRef = useRef<NavigationContextData>({});

  const persistState = useCallback((state: NavigationState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('[useNavigationState] Erro ao persistir estado:', error);
    }
  }, []);

  const updateNavigationContext = useCallback((data: NavigationContextData) => {
    contextDataRef.current = { ...contextDataRef.current, ...data };
    console.log('📍 [Navigation Context] Atualizado:', contextDataRef.current);
  }, []);

  const navigateWithContext = useCallback((
    to: string, 
    contextData?: NavigationContextData,
    options?: { 
      replace?: boolean; 
      preserveFilters?: boolean;
      updateBreadcrumb?: boolean;
    }
  ) => {
    const { replace = false, preserveFilters = false, updateBreadcrumb = true } = options || {};

    if (contextData) {
      updateNavigationContext(contextData);
    }

    const newState: NavigationState = {
      previousPage: navigationState.currentPage,
      previousFilters: preserveFilters ? navigationState.currentFilters : {},
      currentPage: to,
      currentFilters: preserveFilters ? navigationState.currentFilters : {},
      breadcrumb: updateBreadcrumb ? generateBreadcrumb(to, navigationState.breadcrumb) : navigationState.breadcrumb
    };

    setNavigationState(newState);
    persistState(newState);

    navigate({ to, replace });

    console.log(`🧭 [Navigation] ${navigationState.currentPage} → ${to}`);
  }, [navigate, navigationState, updateNavigationContext, persistState]);

  const generateBreadcrumb = useCallback((
    currentPath: string,
    _existingBreadcrumb: NavigationState['breadcrumb']
  ): NavigationState['breadcrumb'] => {
    const breadcrumb: NavigationState['breadcrumb'] = [];

    breadcrumb.push({ label: 'Dashboard', path: '/gastos/dashboards' });

    if (currentPath.includes('/fornecedores')) {
      breadcrumb.push({ label: 'Fornecedores', path: '/gastos/fornecedores' });
      
      if (currentPath.includes('/categorias/')) {
        const categoriaSlug = currentPath.split('/categorias/')[1];
        const categoria = categoriaSlug ? (slugToCategory(categoriaSlug) || categoriaSlug) : 'Categoria não especificada';
        
        breadcrumb.push({ 
          label: `Categoria: ${categoria}`, 
          path: currentPath,
          filters: { categoria }
        });
      }
      
      if (currentPath.includes('/fornecedor/')) {
        const fornecedorId = currentPath.split('/fornecedor/')[1];
        breadcrumb.push({ 
          label: 'Perfil do Fornecedor', 
          path: currentPath,
          filters: { fornecedorId }
        });
      }
    }

    if (currentPath.includes('/categorias/')) {
      const categoriaSlug = currentPath.split('/categorias/')[1];
      const categoria = categoriaSlug ? (slugToCategory(categoriaSlug) || categoriaSlug) : 'Categoria não especificada';
      
      breadcrumb.push({ label: 'Fornecedores', path: '/gastos/fornecedores' });
      breadcrumb.push({ 
        label: `${categoria}`, 
        path: currentPath,
        filters: { categoria }
      });
    }

    if (currentPath.includes('/perfil/')) {
      breadcrumb.push({ label: 'Deputados', path: '/gastos/deputados' });
      breadcrumb.push({ label: 'Perfil do Deputado', path: currentPath });
    }

    return breadcrumb;
  }, []);

  const navigateToFornecedoresWithCategory = useCallback((categoria: string, filtros?: Record<string, any>) => {
    const contextData: NavigationContextData = {
      categoria,
      filtros: { categoria, ...filtros },
      origem: 'categoria-especifica'
    };

    navigateWithContext('/gastos/fornecedores', contextData, {
      preserveFilters: true,
      updateBreadcrumb: true
    });
  }, [navigateWithContext]);

  const navigateToCategoria = useCallback((categoria: string, filtros?: Record<string, any>) => {
    const categoriaSlug = categoryToSlug(categoria);
    
    const contextData: NavigationContextData = {
      categoria,
      filtros: { ...filtros },
      origem: 'fornecedores-geral'
    };

    navigateWithContext(`/gastos/categorias/${categoriaSlug}`, contextData, {
      preserveFilters: false,
      updateBreadcrumb: true
    });
  }, [navigateWithContext]);

  const navigateToFornecedor = useCallback((cnpj: string, origem?: string) => {
    const contextData: NavigationContextData = {
      fornecedorId: cnpj,
      origem: (origem as any) || 'fornecedores-geral'
    };

    navigateWithContext(`/gastos/fornecedor/${cnpj}`, contextData, {
      preserveFilters: true,
      updateBreadcrumb: true
    });
  }, [navigateWithContext]);

  const goBack = useCallback((defaultPath: string = '/gastos/fornecedores') => {
    const targetPath = navigationState.previousPage || defaultPath;
    
    console.log(`⬅️ [Navigation] Voltando para: ${targetPath}`);
    
    navigateWithContext(targetPath, contextDataRef.current, {
      preserveFilters: true,
      updateBreadcrumb: false
    });
  }, [navigationState.previousPage, navigateWithContext]);

  const cameFrom = useCallback((pagePath: string): boolean => {
    return navigationState.previousPage?.includes(pagePath) || false;
  }, [navigationState.previousPage]);

  const getPreservedFilters = useCallback((filterKey?: string) => {
    if (filterKey) {
      return contextDataRef.current.filtros?.[filterKey];
    }
    return contextDataRef.current.filtros || {};
  }, []);

  const clearContext = useCallback(() => {
    contextDataRef.current = {};
    setNavigationState({
      previousPage: null,
      previousFilters: {},
      currentPage: location.pathname,
      currentFilters: {},
      breadcrumb: []
    });
    localStorage.removeItem(STORAGE_KEY);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname !== navigationState.currentPage) {
      const newState: NavigationState = {
        ...navigationState,
        previousPage: navigationState.currentPage,
        currentPage: location.pathname,
        breadcrumb: generateBreadcrumb(location.pathname, navigationState.breadcrumb)
      };
      
      setNavigationState(newState);
      persistState(newState);
    }
  }, [location.pathname, navigationState, generateBreadcrumb, persistState]);

  return {
    navigationState,
    contextData: contextDataRef.current,
    
    navigateWithContext,
    navigateToFornecedoresWithCategory,
    navigateToCategoria, 
    navigateToFornecedor,
    goBack,
    
    cameFrom,
    getPreservedFilters,
    updateNavigationContext,
    clearContext,
    
    isInCategory: () => location.pathname.includes('/categorias/'),
    isInFornecedores: () => location.pathname.includes('/fornecedores'),
    getCurrentCategory: () => {
      if (location.pathname.includes('/categorias/')) {
        const slug = location.pathname.split('/categorias/')[1];
        return slug ? (slugToCategory(slug) || slug) : null;
      }
      return contextDataRef.current.categoria || null;
    }
  };
}