import { useEffect, useCallback, useRef } from 'react';
import { useFornecedoresContext } from '@/contexts/FornecedoresDataContext';

const CATEGORIAS_POPULARES = [
  'COMBUSTIVEIS E LUBRIFICANTES',
  'LOCACAO DE VEICULOS', 
  'PASSAGENS AEREAS',
  'HOSPEDAGEM',
  'ALIMENTACAO',
  'CONSULTORIA ASSESSORIA E PESQUISA',
  'DIVULGACAO DA ATIVIDADE PARLAMENTAR',
  'SERVICOS POSTAIS',
  'TELEFONIA'
];

const PRELOAD_CONFIG = {
  maxConcurrent: 3, // Máximo de categorias sendo pré-carregadas ao mesmo tempo
  delayBetweenPreloads: 1500, // Delay entre pré-carregamentos (ms)
  enableOnlyWhenConnected: true, // Só pré-carregar quando conectado
  respectNetworkConditions: true // Considerar condições da rede
};

export interface UsePreloadCategoriasOptions {
  autoStart?: boolean;
  
  categorias?: string[];
  
  priority?: 'high' | 'normal' | 'low';
  
  onlyWhenActive?: boolean;
}

export function usePreloadCategorias({
  autoStart = true,
  categorias = CATEGORIAS_POPULARES,
  priority = 'normal',
  onlyWhenActive: _onlyWhenActive = true
}: UsePreloadCategoriasOptions = {}) {
  
  const {
    isConnected,
    fornecedores,
    preloadCategoria,
    isCategoriaLoaded
  } = useFornecedoresContext();

  const preloadingRef = useRef<Set<string>>(new Set());
  const preloadQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  const getNetworkConditions = useCallback((): 'fast' | 'normal' | 'slow' => {
    const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    
    if (!connection) return 'normal';
    
    const { effectiveType, downlink } = connection;
    
    if (effectiveType === '4g' && downlink > 2) return 'fast';
    if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 2)) return 'normal';
    return 'slow';
  }, []);

  const processPreloadQueue = useCallback(async () => {
    if (isProcessingRef.current || preloadQueueRef.current.length === 0) {
      return;
    }

    isProcessingRef.current = true;

    const isPageActive = typeof document !== 'undefined' ? !document.hidden : true
    if (_onlyWhenActive && !isPageActive) {
      isProcessingRef.current = false
      return
    }
    const networkCondition = getNetworkConditions();
    
    const maxConcurrent = networkCondition === 'fast' ? 
      PRELOAD_CONFIG.maxConcurrent : 
      Math.max(1, Math.floor(PRELOAD_CONFIG.maxConcurrent / 2));
      
    const delay = networkCondition === 'slow' ? 
      PRELOAD_CONFIG.delayBetweenPreloads * 2 : 
      PRELOAD_CONFIG.delayBetweenPreloads;

    console.log(`🔮 [usePreloadCategorias] Processando fila: ${preloadQueueRef.current.length} categorias (network: ${networkCondition})`);

    const batches = [];
    for (let i = 0; i < preloadQueueRef.current.length; i += maxConcurrent) {
      batches.push(preloadQueueRef.current.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
      const promises = batch.map(async (categoria) => {
        if (preloadingRef.current.has(categoria)) {
          console.log(`⏭️ [usePreloadCategorias] Categoria ${categoria} já sendo pré-carregada - skip`);
          return;
        }

        preloadingRef.current.add(categoria);
        
        try {
          await preloadCategoria(categoria);
          console.log(`✅ [usePreloadCategorias] Pré-carregamento concluído: ${categoria}`);
        } catch (error) {
          console.warn(`⚠️ [usePreloadCategorias] Erro no pré-carregamento de ${categoria}:`, error);
        } finally {
          preloadingRef.current.delete(categoria);
        }
      });

      await Promise.allSettled(promises);
      
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    preloadQueueRef.current = [];
    isProcessingRef.current = false;
    
    console.log(`🎯 [usePreloadCategorias] Processamento da fila concluído`);
  }, [preloadCategoria, getNetworkConditions]);

  const startPreloading = useCallback((categoriasToPreload: string[] = categorias) => {
    if (!PRELOAD_CONFIG.enableOnlyWhenConnected || isConnected) {
      const categoriasNaoCarregadas = categoriasToPreload.filter(categoria => 
        !isCategoriaLoaded(categoria) && 
        !preloadingRef.current.has(categoria)
      );

      if (categoriasNaoCarregadas.length === 0) {
        console.log(`⚡ [usePreloadCategorias] Todas as categorias já estão carregadas`);
        return;
      }

      if (priority === 'high') {
        preloadQueueRef.current = [...categoriasNaoCarregadas, ...preloadQueueRef.current];
      } else if (priority === 'low') {
        preloadQueueRef.current = [...preloadQueueRef.current, ...categoriasNaoCarregadas];
      } else {
        preloadQueueRef.current = [...preloadQueueRef.current, ...categoriasNaoCarregadas];
      }

      console.log(`🔮 [usePreloadCategorias] Adicionando ${categoriasNaoCarregadas.length} categorias à fila (prioridade: ${priority})`);
      
      processPreloadQueue();
    } else {
      console.log(`🌐 [usePreloadCategorias] Aguardando conexão para pré-carregamento...`);
    }
  }, [categorias, isConnected, isCategoriaLoaded, priority, processPreloadQueue]);

  const cancelPreloading = useCallback(() => {
    console.log(`🛑 [usePreloadCategorias] Cancelando pré-carregamentos...`);
    preloadQueueRef.current = [];
    preloadingRef.current.clear();
    isProcessingRef.current = false;
  }, []);

  useEffect(() => {
    if (autoStart && isConnected && fornecedores.length > 0) {
      const timer = setTimeout(() => {
        startPreloading();
      }, 2000);

      return () => clearTimeout(timer);
    }
    return undefined
  }, [autoStart, isConnected, fornecedores.length, startPreloading]);

  useEffect(() => {
    return () => {
      cancelPreloading();
    };
  }, [cancelPreloading]);

  return {
    startPreloading,
    
    cancelPreloading,
    
    status: {
      isProcessing: isProcessingRef.current,
      preloadingCount: preloadingRef.current.size,
      queueLength: preloadQueueRef.current.length,
      preloadingCategories: Array.from(preloadingRef.current),
      networkCondition: getNetworkConditions()
    }
  };
}

export function usePreloadCategoria(categoria: string, options: { 
  autoPreload?: boolean;
  priority?: 'high' | 'normal' | 'low';
} = {}) {
  const { autoPreload = false, priority = 'normal' } = options;
  
  const { startPreloading } = usePreloadCategorias({
    autoStart: autoPreload,
    categorias: [categoria],
    priority
  });

  const preload = useCallback(() => {
    startPreloading([categoria]);
  }, [startPreloading, categoria]);

  return { preload };
}
