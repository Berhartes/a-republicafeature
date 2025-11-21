import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CacheService } from '../cache-service'

// Mock do loader unificado para controlar as fontes
vi.mock('@/lib/cache/cache-sources', () => ({
  loadCacheByKeyWithSource: vi.fn(),
}))

// Importar mocks depois de configurar o vi.mock
const { loadCacheByKeyWithSource } = await import('@/lib/cache/cache-sources') as any

const MOCK_CACHE_DATA = { message: 'This is a test' };

describe('CacheService', () => {
  // Função para resetar o singleton do CacheService
  const resetCacheServiceSingleton = () => {
    (CacheService as any).instance = null;
  };

  beforeEach(() => {
    // Reseta o singleton antes de cada teste para garantir isolamento
    resetCacheServiceSingleton();
    // Limpa todos os mocks
    vi.clearAllMocks();
    // Usa timers falsos para controlar o tempo (TTL)
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restaura os timers reais depois de cada teste
    vi.useRealTimers();
  });

  describe('Singleton Pattern', () => {
    it('deve retornar a mesma instância em múltiplas chamadas', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('deve criar uma nova instância após reset (apenas para teste)', () => {
      const instance1 = CacheService.getInstance();
      resetCacheServiceSingleton();
      const instance2 = CacheService.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Cache Operations (HIT/MISS)', () => {
    it('deve carregar dados do disco na primeira chamada (MISS)', async () => {
      (loadCacheByKeyWithSource as vi.Mock).mockResolvedValue({
        data: MOCK_CACHE_DATA,
        source: 'etl-monorepo',
        durationMs: 10,
        sizeBytes: JSON.stringify(MOCK_CACHE_DATA).length,
      })

      const cacheService = CacheService.getInstance();
      const data = await cacheService.getFromSources('test-cache');

      expect(data).toEqual(MOCK_CACHE_DATA);
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(1)
    });

    it('deve retornar dados do cache em chamadas subsequentes (HIT)', async () => {
      (loadCacheByKeyWithSource as vi.Mock).mockResolvedValue({
        data: MOCK_CACHE_DATA,
        source: 'etl-monorepo',
        durationMs: 10,
        sizeBytes: JSON.stringify(MOCK_CACHE_DATA).length,
      })

      const cacheService = CacheService.getInstance();
      // Primeira chamada (MISS)
      await cacheService.getFromSources('test-cache');
      
      // Segunda chamada (deve ser HIT)
      const data = await cacheService.getFromSources('test-cache');

      expect(data).toEqual(MOCK_CACHE_DATA);
      // Não deve chamar loader novamente
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('TTL Management', () => {
    it('deve recarregar os dados da fonte após o TTL expirar', async () => {
      (loadCacheByKeyWithSource as vi.Mock).mockResolvedValue({
        data: MOCK_CACHE_DATA,
        source: 'etl-monorepo',
        durationMs: 10,
        sizeBytes: JSON.stringify(MOCK_CACHE_DATA).length,
      })
      const ttl = 1000; // 1 segundo

      const cacheService = CacheService.getInstance();
      // Primeira chamada (MISS)
      await cacheService.getFromSources('test-cache', ttl);
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(1);

      // Avança o tempo para além do TTL
      vi.advanceTimersByTime(ttl + 1);

      // Segunda chamada (deve ser MISS novamente)
      await cacheService.getFromSources('test-cache', ttl);
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(2);
    });

    it('não deve recarregar os dados antes do TTL expirar', async () => {
      (fs.default.readFile as vi.Mock).mockResolvedValue(MOCK_CACHE_JSON);
      const ttl = 5000; // 5 segundos

      const cacheService = CacheService.getInstance();
      await cacheService.get(CACHE_KEYS.TEST_KEY, { filePath: CACHE_PATHS[CACHE_KEYS.TEST_KEY], ttl });
      expect(fs.default.readFile).toHaveBeenCalledTimes(1);

      // Avança o tempo, mas não o suficiente para expirar
      vi.advanceTimersByTime(ttl - 1000);

      await cacheService.get(CACHE_KEYS.TEST_KEY, { filePath: CACHE_PATHS[CACHE_KEYS.TEST_KEY], ttl });
      expect(fs.default.readFile).toHaveBeenCalledTimes(1); // Ainda deve ser 1
    });
  });

  describe('Cache Invalidation', () => {
    it('deve limpar um cache específico por chave', async () => {
      (loadCacheByKeyWithSource as vi.Mock).mockResolvedValue({
        data: MOCK_CACHE_DATA,
        source: 'etl-monorepo',
        durationMs: 10,
        sizeBytes: JSON.stringify(MOCK_CACHE_DATA).length,
      })
      const cacheService = CacheService.getInstance();

      // Carrega o cache
      await cacheService.getFromSources('test-cache');
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(1);

      // Limpa o cache
      cacheService.clearCache(CACHE_KEYS.TEST_KEY);

      // Tenta obter novamente, deve ser um MISS
      await cacheService.getFromSources('test-cache');
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(2);
    });

    it('deve limpar todos os caches quando nenhuma chave é fornecida', async () => {
      (loadCacheByKeyWithSource as vi.Mock).mockResolvedValue({
        data: MOCK_CACHE_DATA,
        source: 'etl-monorepo',
        durationMs: 10,
        sizeBytes: JSON.stringify(MOCK_CACHE_DATA).length,
      })
      const cacheService = CacheService.getInstance();

      // Carrega dois caches diferentes
      await cacheService.getFromSources('test-cache');
      await cacheService.getFromSources('another-cache');
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(2);

      // Limpa todos
      cacheService.clearCache();

      // Tenta obter ambos novamente, devem ser MISS
      await cacheService.getFromSources('test-cache');
      await cacheService.getFromSources('another-cache');
      expect(loadCacheByKeyWithSource).toHaveBeenCalledTimes(4);
    });
  });
  // Erros específicos de leitura de disco foram removidos junto ao método legacy.

  describe('Metrics and Stats', () => {
    it('deve rastrear hits e misses corretamente', async () => {
      (loadCacheByKeyWithSource as vi.Mock).mockResolvedValue({
        data: MOCK_CACHE_DATA,
        source: 'etl-monorepo',
        durationMs: 10,
        sizeBytes: JSON.stringify(MOCK_CACHE_DATA).length,
      })
      const cacheService = CacheService.getInstance();

      // 1º MISS
      await cacheService.getFromSources('test-cache');
      // 1º HIT
      await cacheService.getFromSources('test-cache');
      // 2º HIT
      await cacheService.getFromSources('test-cache');

      const stats = cacheService.getStats(CACHE_KEYS.TEST_KEY) as any;
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(2);
      expect(stats.totalRequests).toBe(3);
      expect(stats.hitRate).toBeCloseTo(66.67);
    });

    it('deve retornar stats para todos os caches', async () => {
      (fs.default.readFile as vi.Mock).mockResolvedValue(MOCK_CACHE_JSON);
      const cacheService = CacheService.getInstance();

      await cacheService.get(CACHE_KEYS.TEST_KEY, { filePath: CACHE_PATHS[CACHE_KEYS.TEST_KEY] });
      await cacheService.get(CACHE_KEYS.ANOTHER_KEY, { filePath: CACHE_PATHS[CACHE_KEYS.ANOTHER_KEY] });
      await cacheService.get(CACHE_KEYS.ANOTHER_KEY, { filePath: CACHE_PATHS[CACHE_KEYS.ANOTHER_KEY] });

      const allStats = cacheService.getStats() as Map<string, any>;
      
      expect(allStats.size).toBe(2);
      expect(allStats.get(CACHE_KEYS.TEST_KEY)?.misses).toBe(1);
      expect(allStats.get(CACHE_KEYS.TEST_KEY)?.hits).toBe(0);
      expect(allStats.get(CACHE_KEYS.ANOTHER_KEY)?.misses).toBe(1);
      expect(allStats.get(CACHE_KEYS.ANOTHER_KEY)?.hits).toBe(1);
    });
  });
});
