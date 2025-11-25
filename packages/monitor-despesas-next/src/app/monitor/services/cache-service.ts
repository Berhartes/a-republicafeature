import { loadCacheByKeyWithSource, type CacheSourceLabel } from '@/lib/cache/cache-sources';
export class CacheError extends Error {
  constructor(
    message: string,
    public readonly cacheKey: string,
    public readonly operation: 'load' | 'parse' | 'clear',
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'CacheError';
  }
}


// Configuration for the entire cache service
interface CacheServiceConfig {
  defaultTTL?: number; // Default TTL in milliseconds
  maxEntrySizeBytes?: number; // If exceeded, skip storing in memory
}

// Configuration for individual cache entries
export interface CacheConfig {
  filePath: string; // Path to JSON file
  ttl?: number; // Override default TTL
}

// Internal cache entry structure
interface CacheEntry<T> {
  data: T;
  loadedAt: number; // Timestamp when loaded
  ttl: number; // TTL for this entry
}

// Metrics for monitoring
interface CacheMetrics {
  hits: number;
  misses: number;
  lastAccessTime: number;
  sourceHits: Record<string, number>;
  sourceMisses: Record<string, number>;
  lastSource?: CacheSourceLabel;
  lastLatencyMs?: number;
  lastSizeBytes?: number;
}

// Statistics returned to callers
export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number; // Percentage
  totalRequests: number;
  lastAccessTime: Date;
  isLoaded: boolean;
  loadedAt?: Date;
  lastSource?: CacheSourceLabel;
  lastLatencyMs?: number;
  lastSizeBytes?: number;
  sourceHits?: Record<string, number>;
}
// #endregion

export class CacheService {
  private static instance: CacheService | null = null;
  private cacheRegistry: Map<string, CacheEntry<any>>;
  private metricsRegistry: Map<string, CacheMetrics>;
  private defaultTTL: number;
  private maxEntrySizeBytes: number;
  private memoryBudgetBytes: number;
  private memoryWarnBytes: number;

  private constructor(config?: CacheServiceConfig) {
    this.cacheRegistry = new Map();
    this.metricsRegistry = new Map();
    this.defaultTTL = config?.defaultTTL || 3600000; // 1 hour
    this.maxEntrySizeBytes = typeof config?.maxEntrySizeBytes === 'number'
      ? config!.maxEntrySizeBytes
      : (Number(process.env.CACHE_MAX_ENTRY_MB || 8) * 1024 * 1024); // default 8MB
    this.memoryBudgetBytes = 50 * 1024 * 1024; // 50MB
    this.memoryWarnBytes = 40 * 1024 * 1024; // 40MB
  }

  public static getInstance(config?: CacheServiceConfig): CacheService {
    if (!CacheService.instance) {
      const newInstance = new CacheService(config);
      CacheService.instance = newInstance;
      if (process.env.NODE_ENV !== 'production') {
        newInstance.log('info', 'CacheService initialized');
      }
    }
    return CacheService.instance;
  }


  /**
   * Carrega o cache usando fontes unificadas (ETL/Test/Backup/CDN),
   * aplica TTL e respeita limite por entrada.
   * Mantém compatibilidade com ambientes serverless (cache por-lambda).
  */
  public async getFromSources<T>(
    cacheKey: string,
    ttl?: number,
  ): Promise<T | null> {
    try {
      const cached = this.cacheRegistry.get(cacheKey);
      const isDev = process.env.NODE_ENV !== 'production'
      // In development, bypass in-memory cache to reflect source changes immediately
      if (!isDev && cached && !this.isExpired(cached)) {
        this.recordHit(cacheKey);
        return cached.data as T;
      }

      this.recordMiss(cacheKey);
      const result = await loadCacheByKeyWithSource<T>(cacheKey);
      const data = result.data;

      if (data != null) {
        const serializedSize = Buffer.byteLength(JSON.stringify(data), 'utf-8');
        const shouldStore = serializedSize <= this.maxEntrySizeBytes;
        if (!shouldStore) {
          this.log('warn', `Entry too large, skipping in-memory store`, {
            cacheKey,
            sizeMB: (serializedSize / 1024 / 1024).toFixed(2),
            maxMB: (this.maxEntrySizeBytes / 1024 / 1024).toFixed(2),
          });
          this.recordSource(cacheKey, result.source, result.durationMs, result.sizeBytes ?? serializedSize);
          return data as T;
        }

        this.cacheRegistry.set(cacheKey, {
          data,
          loadedAt: Date.now(),
          ttl: typeof ttl === 'number' ? ttl : this.defaultTTL,
        });
        this.recordSource(cacheKey, result.source, result.durationMs, result.sizeBytes ?? serializedSize);
        this.enforceMemoryBudget();
        this.log('info', `Cache loaded from source`, {
          cacheKey,
          source: result.source,
          latencyMs: Number(result.durationMs?.toFixed?.(2) ?? result.durationMs),
          sizeKB: Number(((result.sizeBytes ?? serializedSize) / 1024).toFixed(2)),
        });
      }

      return data;
    } catch (error) {
      this.log('error', `Operation failed for cache key: ${cacheKey}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  public clearCache(cacheKey?: string): void {
    if (cacheKey) {
      const wasDeleted = this.cacheRegistry.delete(cacheKey);
      this.metricsRegistry.delete(cacheKey);

      if (wasDeleted) {
        this.log('info', `Cache cleared for key: ${cacheKey}`);
      } else {
        this.log('warn', `Attempted to clear non-existent cache key: ${cacheKey}`);
      }
    } else {
      this.cacheRegistry.clear();
      this.metricsRegistry.clear();
      this.log('info', 'All caches cleared');
    }
    this.enforceMemoryBudget();
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.loadedAt + entry.ttl;
  }


  private log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
    if (process.env.NODE_ENV === 'production' && level !== 'error') return
    const timestamp = new Date().toISOString();
    const prefix = `[CacheService ${timestamp}]`;

    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`, meta || '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, meta || '');
        break;
      case 'error':
        console.error(`${prefix} ${message}`, meta || '');
        break;
    }
  }

  private recordHit(cacheKey: string): void {
    const metrics = this.getOrCreateMetrics(cacheKey);
    metrics.hits++;
    metrics.lastAccessTime = Date.now();
    this.log('info', `Cache HIT for key: ${cacheKey}`);
  }

  private recordMiss(cacheKey: string): void {
    const metrics = this.getOrCreateMetrics(cacheKey);
    metrics.misses++;
    metrics.lastAccessTime = Date.now();
    this.log('warn', `Cache MISS for key: ${cacheKey}`);
  }

  private recordSource(cacheKey: string, source?: CacheSourceLabel, latencyMs?: number, sizeBytes?: number): void {
    const metrics = this.getOrCreateMetrics(cacheKey);
    if (source) {
      metrics.sourceHits[source] = (metrics.sourceHits[source] || 0) + 1;
      metrics.lastSource = source;
    } else {
      metrics.sourceMisses['unknown'] = (metrics.sourceMisses['unknown'] || 0) + 1;
    }
    metrics.lastLatencyMs = latencyMs;
    metrics.lastSizeBytes = sizeBytes;
  }

  private getOrCreateMetrics(cacheKey: string): CacheMetrics {
    if (!this.metricsRegistry.has(cacheKey)) {
      this.metricsRegistry.set(cacheKey, {
        hits: 0,
        misses: 0,
        lastAccessTime: 0,
        sourceHits: {},
        sourceMisses: {},
      });
    }
    return this.metricsRegistry.get(cacheKey)!;
  }

  public getStats(
    cacheKey?: string,
  ): CacheStats | Map<string, CacheStats> | undefined {
    if (cacheKey) {
      if (!this.metricsRegistry.has(cacheKey)) {
        return undefined;
      }
      return this.getStatsForKey(cacheKey);
    }

    const allStats = new Map<string, CacheStats>();
    for (const key of this.metricsRegistry.keys()) {
      allStats.set(key, this.getStatsForKey(key));
    }
    return allStats;
  }

  public getMemoryUsage(): {
    cacheCount: number;
    estimatedSize: number; // in bytes
    entries: Array<{ key: string; size: number }>;
  } {
    const entries = Array.from(this.cacheRegistry.entries()).map(
      ([key, entry]) => {
        const size = Buffer.byteLength(JSON.stringify(entry.data), 'utf-8');
        return { key, size };
      },
    );

    const estimatedSize = entries.reduce((sum, e) => sum + e.size, 0);
    if (estimatedSize > this.memoryWarnBytes) {
      this.log('warn', 'Cache memory usage exceeds warn threshold', {
        size: `${(estimatedSize / 1024 / 1024).toFixed(2)} MB`,
        entries: entries.length,
      });
    }

    return {
      cacheCount: this.cacheRegistry.size,
      estimatedSize,
      entries,
    };
  }

  private enforceMemoryBudget(): void {
    const usage = this.getMemoryUsage();
    if (usage.estimatedSize <= this.memoryBudgetBytes) return;
    const keyedLastAccess: Array<{ key: string; lastAccess: number; size: number }> = []
    for (const key of this.cacheRegistry.keys()) {
      const m = this.metricsRegistry.get(key)
      const lastAccess = m?.lastAccessTime || 0
      const size = usage.entries.find(e => e.key === key)?.size || 0
      keyedLastAccess.push({ key, lastAccess, size })
    }
    keyedLastAccess.sort((a, b) => a.lastAccess - b.lastAccess)
    let freed = 0
    for (const k of keyedLastAccess) {
      if (usage.estimatedSize - freed <= this.memoryBudgetBytes) break
      const deleted = this.cacheRegistry.delete(k.key)
      if (deleted) {
        freed += k.size
        this.log('warn', 'Evicted cache entry due to memory budget', { key: k.key, sizeKB: (k.size/1024).toFixed(2) })
      }
    }
  }

  private getStatsForKey(cacheKey: string): CacheStats {
    const metrics = this.metricsRegistry.get(cacheKey)!;
    const cacheEntry = this.cacheRegistry.get(cacheKey);
    const totalRequests = metrics.hits + metrics.misses;
    const hitRate = totalRequests > 0 ? (metrics.hits / totalRequests) * 100 : 0;

    return {
      hits: metrics.hits,
      misses: metrics.misses,
      totalRequests,
      hitRate,
      lastAccessTime: new Date(metrics.lastAccessTime),
      isLoaded: this.cacheRegistry.has(cacheKey),
      loadedAt: cacheEntry ? new Date(cacheEntry.loadedAt) : undefined,
      lastSource: metrics.lastSource,
      lastLatencyMs: metrics.lastLatencyMs,
      lastSizeBytes: metrics.lastSizeBytes,
      sourceHits: metrics.sourceHits,
    };
  }
}


