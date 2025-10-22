
export interface PreloadOptions {
  prefetch?: boolean;
  priority?: 'high' | 'low' | 'auto';
}

export async function preloadRoutes(routes: string[] = [], options: PreloadOptions = {}): Promise<void> {
  void options
  const defaultRoutes = [
    '/gastos',
    '/gastos/deputados', 
    '/gastos/fornecedores',
    '/gastos/alertas'
  ];
  
  const routesToPreload = routes.length > 0 ? routes : defaultRoutes;
  
  if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
    console.log('⚡ [Preload] Rotas identificadas para preload:', routesToPreload);
    return;
  }
  
  requestIdleCallback(() => {
    routesToPreload.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
    
    console.log('⚡ [Preload] Rotas pré-carregadas:', routesToPreload.length);
  });
}

export function preloadCriticalResources(): void {
  if (typeof window === 'undefined') return;
  
  const criticalResources: string[] = [
  ];
  
  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.setAttribute('as', 'font'); // ou 'image', 'style', etc
    document.head.appendChild(link);
  });
  
  if (criticalResources.length > 0) {
    console.log('🎯 [Preload] Recursos críticos pré-carregados:', criticalResources.length);
  }
}

export async function preloadFornecedorData(cnpj: string): Promise<void> {
  try {
    console.log('📊 [Preload] Dados do fornecedor identificados para preload:', cnpj);
  } catch (error) {
    console.warn('⚠️ [Preload] Erro no preload do fornecedor:', error);
  }
}

export async function preloadDeputadoData(deputadoId: string): Promise<void> {
  try {
    console.log('👤 [Preload] Dados do deputado identificados para preload:', deputadoId);
  } catch (error) {
    console.warn('⚠️ [Preload] Erro no preload do deputado:', error);
  }
}

export function cleanupPreloadResources(): void {
  if (typeof document === 'undefined') return;
  
  const preloadLinks = document.querySelectorAll('link[rel="prefetch"], link[rel="preload"]');
  const now = Date.now();
  
  preloadLinks.forEach(link => {
    const linkElement = link as HTMLLinkElement;
    const created = parseInt(linkElement.dataset.created || '0');
    
    if (now - created > 5 * 60 * 1000) {
      linkElement.remove();
    }
  });
  
  console.log('🧹 [Preload] Limpeza de recursos concluída');
}
