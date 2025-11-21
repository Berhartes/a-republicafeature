# Design Document

## Overview

This document describes the design of an in-memory cache system to optimize Next.js Server Actions performance. The current implementation reads large JSON files (suppliers-cache.json: 5.2 MB, deputies-cache.json: 1.8 MB) from disk on every request, causing 85-180ms response times. The new design implements a singleton CacheService that loads data once per TTL period and maintains it in memory using Map data structures, reducing response times to 6-12ms (10-15x improvement).

The solution maintains full backward compatibility with existing Server Actions while providing significant performance improvements through intelligent caching, TTL-based expiration, and manual invalidation capabilities.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server Actions                    │
│  getFornecedores() │ getDeputados() │ getPremiacoes()       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    CacheService (Singleton)                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cache Registry (Map<string, CacheEntry<T>>)         │   │
│  │  ├─ suppliers-cache → { data, loadedAt, ttl }       │   │
│  │  ├─ deputies-cache → { data, loadedAt, ttl }        │   │
│  │  └─ categories-cache → { data, loadedAt, ttl }      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Metrics (Map<string, CacheMetrics>)                 │   │
│  │  ├─ hits: number                                     │   │
│  │  ├─ misses: number                                   │   │
│  │  └─ lastAccessTime: number                           │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    File System (fs/promises)                 │
│  public/cache/                                               │
│  ├─ suppliers-cache.json (5.2 MB)                           │
│  ├─ deputies-cache.json (1.8 MB)                            │
│  └─ categories-cache.json                                   │
└─────────────────────────────────────────────────────────────┘
```

### Singleton Pattern

The CacheService uses the singleton pattern to ensure only one instance exists per Node.js process:

```typescript
class CacheService {
  private static instance: CacheService | null = null;
  
  private constructor() {
    // Private constructor prevents direct instantiation
  }
  
  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }
}
```

### Cache Flow Diagram

```
Request → Server Action
            ↓
    CacheService.get(key)
            ↓
    ┌───────────────┐
    │ Cache exists? │
    └───────┬───────┘
            │
    ┌───────┴───────┐
    │               │
   YES             NO
    │               │
    ↓               ↓
┌─────────┐   ┌──────────┐
│ Expired?│   │Load from │
└────┬────┘   │   disk   │
     │        └────┬─────┘
  ┌──┴──┐         │
  │     │         │
 YES   NO         │
  │     │         │
  │     ↓         │
  │  Return ←─────┘
  │  cached
  │  data
  │  (HIT)
  │
  ↓
Load from
  disk
  (MISS)
```

## Components and Interfaces

### 1. CacheService Class

The core singleton service that manages all cache operations.

```typescript
export class CacheService {
  private static instance: CacheService | null = null;
  private cacheRegistry: Map<string, CacheEntry<any>>;
  private metricsRegistry: Map<string, CacheMetrics>;
  private defaultTTL: number;

  private constructor(config?: CacheServiceConfig) {
    this.cacheRegistry = new Map();
    this.metricsRegistry = new Map();
    this.defaultTTL = config?.defaultTTL || 3600000; // 1 hour
  }

  public static getInstance(config?: CacheServiceConfig): CacheService;
  public async get<T>(cacheKey: string, config?: CacheConfig): Promise<T | null>;
  public clearCache(cacheKey?: string): void;
  public getStats(cacheKey?: string): CacheStats | Map<string, CacheStats>;
  private async loadFromDisk<T>(filePath: string): Promise<T>;
  private isExpired(entry: CacheEntry<any>): boolean;
  private recordHit(cacheKey: string): void;
  private recordMiss(cacheKey: string): void;
}
```

### 2. Type Definitions

```typescript
// Configuration for the entire cache service
interface CacheServiceConfig {
  defaultTTL?: number; // Default TTL in milliseconds
}

// Configuration for individual cache entries
interface CacheConfig {
  filePath: string;    // Path to JSON file
  ttl?: number;        // Override default TTL
}

// Internal cache entry structure
interface CacheEntry<T> {
  data: T;
  loadedAt: number;    // Timestamp when loaded
  ttl: number;         // TTL for this entry
}

// Metrics for monitoring
interface CacheMetrics {
  hits: number;
  misses: number;
  lastAccessTime: number;
}

// Statistics returned to callers
interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;     // Percentage
  totalRequests: number;
  lastAccessTime: Date;
  isLoaded: boolean;
  loadedAt?: Date;
}
```

### 3. Cache Key Constants

```typescript
export const CACHE_KEYS = {
  SUPPLIERS: 'suppliers-cache',
  DEPUTIES: 'deputies-cache',
  CATEGORIES: 'categories-cache',
  ANALYSIS: 'analysis-cache',
  PREMIACOES: 'premiacoes-cache',
} as const;

export const CACHE_PATHS = {
  [CACHE_KEYS.SUPPLIERS]: 'public/cache/suppliers-cache.json',
  [CACHE_KEYS.DEPUTIES]: 'public/cache/deputies-cache.json',
  [CACHE_KEYS.CATEGORIES]: 'public/cache/categories-cache.json',
  [CACHE_KEYS.ANALYSIS]: 'public/cache/analysis-cache.json',
  [CACHE_KEYS.PREMIACOES]: 'public/cache/premiacoes-cache.json',
} as const;
```

### 4. Server Action Integration

Server Actions will be refactored to use CacheService instead of direct file reads:

```typescript
// BEFORE (current implementation)
const readCacheFile = cache(async <T>(cacheName: string): Promise<T | null> => {
  const path = getPath(cacheName);
  const data = await readFile(path, 'utf-8');
  return JSON.parse(data);
});

// AFTER (with CacheService)
export async function getFornecedores(filters: GetFornecedoresFilters = {}) {
  const cacheService = CacheService.getInstance();
  const rawCacheData = await cacheService.get<{ fornecedores: any[] }>(
    CACHE_KEYS.SUPPLIERS,
    { filePath: CACHE_PATHS[CACHE_KEYS.SUPPLIERS] }
  );
  
  // Rest of the logic remains unchanged
  let rawFornecedores: any[] = [];
  if (rawCacheData) {
    if (Array.isArray(rawCacheData.fornecedores)) {
      rawFornecedores = rawCacheData.fornecedores;
    }
  }
  // ... filtering, sorting, pagination logic
}
```

### 5. Cache Invalidation API

```typescript
// Server Action for manual invalidation
'use server';
export async function invalidateCache(cacheKey?: string): Promise<{
  success: boolean;
  message: string;
  clearedKeys: string[];
}> {
  const cacheService = CacheService.getInstance();
  cacheService.clearCache(cacheKey);
  
  return {
    success: true,
    message: cacheKey 
      ? `Cache cleared for: ${cacheKey}` 
      : 'All caches cleared',
    clearedKeys: cacheKey ? [cacheKey] : Array.from(CACHE_KEYS.values()),
  };
}

// API Route for HTTP-based invalidation
// app/api/cache/invalidate/route.ts
export async function POST(request: Request) {
  const { cacheKey } = await request.json();
  const result = await invalidateCache(cacheKey);
  return Response.json(result);
}
```

## Data Models

### Cache Entry Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Cache Entry States                        │
└─────────────────────────────────────────────────────────────┘

NOT_LOADED → LOADING → LOADED → EXPIRED → LOADING → LOADED
                ↓                   ↓
              ERROR              CLEARED
                                    ↓
                              NOT_LOADED
```

### Data Structures

#### 1. Suppliers Cache Data

```typescript
interface SuppliersCache {
  fornecedores: Array<{
    id: string;
    nome: string;
    documento: string | null;
    tipo_despesa_principal: string | null;
    totalRecebidoPorAno: Record<number, number>;
    transacoesPorAno: Record<number, number>;
    deputadosPorAno: Record<number, number>;
    anosDisponiveis: number[];
    total_recebido: number;
    numero_transacoes: number;
    numero_legisladores: number;
    categorias: string[];
    anos: Array<{
      ano: number;
      total: number;
      numeroTransacoes: number;
      numeroDeputados: number;
    }>;
  }>;
  metadata: {
    totalFornecedores: number;
    anosDisponiveis: number[];
    generatedAt: string;
  };
}
```

#### 2. Deputies Cache Data

```typescript
interface DeputiesCache {
  deputados: Array<{
    id: number;
    nome: string;
    nomeEleitoral: string;
    siglaPartido: string;
    siglaUf: string;
    urlFoto: string;
    totalGastos: number;
    totalTransacoes: number;
    gastosPorAno: Record<number, number>;
    transacoesPorAno: Record<number, number>;
    categoriasPorAno: Record<number, Record<string, number>>;
    fornecedoresPorAno: Record<number, number>;
    anosDisponiveis: number[];
    scoreSuspeicao: number;
    alertas: any[];
  }>;
  metadata: {
    totalDeputados: number;
    anosDisponiveis: number[];
    generatedAt: string;
  };
}
```

## Error Handling

### Error Types

```typescript
export class CacheError extends Error {
  constructor(
    message: string,
    public readonly cacheKey: string,
    public readonly operation: 'load' | 'parse' | 'clear',
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'CacheError';
  }
}

export class CacheLoadError extends CacheError {
  constructor(cacheKey: string, filePath: string, originalError: Error) {
    super(
      `Failed to load cache from disk: ${filePath}`,
      cacheKey,
      'load',
      originalError
    );
    this.name = 'CacheLoadError';
  }
}

export class CacheParseError extends CacheError {
  constructor(cacheKey: string, filePath: string, originalError: Error) {
    super(
      `Failed to parse JSON from cache file: ${filePath}`,
      cacheKey,
      'parse',
      originalError
    );
    this.name = 'CacheParseError';
  }
}
```

### Error Handling Strategy

```typescript
public async get<T>(cacheKey: string, config: CacheConfig): Promise<T | null> {
  try {
    // Check cache first
    const cached = this.cacheRegistry.get(cacheKey);
    
    if (cached && !this.isExpired(cached)) {
      this.recordHit(cacheKey);
      return cached.data as T;
    }
    
    // Load from disk
    this.recordMiss(cacheKey);
    const data = await this.loadFromDisk<T>(config.filePath);
    
    // Store in cache
    this.cacheRegistry.set(cacheKey, {
      data,
      loadedAt: Date.now(),
      ttl: config.ttl || this.defaultTTL,
    });
    
    return data;
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('ENOENT')) {
        throw new CacheLoadError(cacheKey, config.filePath, error);
      } else if (error instanceof SyntaxError) {
        throw new CacheParseError(cacheKey, config.filePath, error);
      }
    }
    throw error;
  }
}
```

### Logging Strategy

```typescript
private log(level: 'info' | 'warn' | 'error', message: string, meta?: any) {
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

// Usage examples:
this.log('info', `Cache HIT for key: ${cacheKey}`, { 
  hitRate: stats.hitRate 
});

this.log('warn', `Cache MISS for key: ${cacheKey}`, { 
  loadTime: `${duration}ms` 
});

this.log('error', `Failed to load cache: ${cacheKey}`, { 
  error: error.message,
  filePath: config.filePath 
});
```

## Testing Strategy

### Unit Tests

```typescript
describe('CacheService', () => {
  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls');
    it('should initialize with default configuration');
    it('should accept custom configuration');
  });

  describe('Cache Operations', () => {
    it('should load data from disk on first access (MISS)');
    it('should return cached data on subsequent access (HIT)');
    it('should reload data when TTL expires');
    it('should handle multiple cache keys independently');
  });

  describe('TTL Management', () => {
    it('should use default TTL when not specified');
    it('should use custom TTL when provided');
    it('should correctly identify expired entries');
  });

  describe('Cache Invalidation', () => {
    it('should clear specific cache by key');
    it('should clear all caches when no key provided');
    it('should handle clearing non-existent cache gracefully');
  });

  describe('Metrics and Stats', () => {
    it('should track hits and misses correctly');
    it('should calculate hit rate accurately');
    it('should return stats for specific cache key');
    it('should return stats for all caches');
  });

  describe('Error Handling', () => {
    it('should throw CacheLoadError when file not found');
    it('should throw CacheParseError when JSON is invalid');
    it('should log errors appropriately');
  });
});
```

### Integration Tests

```typescript
describe('Server Actions with CacheService', () => {
  it('should improve getFornecedores performance by 10x');
  it('should improve getDeputados performance by 10x');
  it('should maintain identical response structure');
  it('should handle concurrent requests correctly');
  it('should work with Next.js ISR revalidation');
});
```

### Performance Tests

```typescript
describe('Performance Benchmarks', () => {
  it('should complete cache HIT in < 2ms');
  it('should complete cache MISS in < 100ms');
  it('should handle 1000 concurrent requests');
  it('should maintain memory usage < 50MB');
});
```

## Performance Considerations

### Memory Management

```typescript
// Monitor memory usage
public getMemoryUsage(): {
  cacheCount: number;
  estimatedSize: number;
  entries: Array<{ key: string; size: number }>;
} {
  const entries = Array.from(this.cacheRegistry.entries()).map(([key, entry]) => ({
    key,
    size: JSON.stringify(entry.data).length,
  }));
  
  const estimatedSize = entries.reduce((sum, e) => sum + e.size, 0);
  
  if (estimatedSize > 50 * 1024 * 1024) { // 50 MB
    this.log('warn', 'Cache memory usage exceeds 50MB', {
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
```

### Performance Metrics

| Metric | Current (No Cache) | Target (With Cache) | Improvement |
|--------|-------------------|---------------------|-------------|
| getFornecedores() | 85-150ms | 6-12ms | 10-15x |
| getDeputados() | 70-120ms | 5-10ms | 12-14x |
| Memory Usage | ~0 MB | < 50 MB | Acceptable |
| Hit Rate | N/A | > 95% | Target |

### Optimization Strategies

1. **Lazy Loading**: Only load caches when first requested
2. **TTL Configuration**: Balance freshness vs performance (default 1 hour)
3. **Selective Caching**: Only cache large, frequently accessed files
4. **Memory Monitoring**: Log warnings when memory usage is high
5. **Graceful Degradation**: Fall back to disk reads on cache errors

## Integration with Next.js

### Compatibility with ISR

The cache system works seamlessly with Next.js Incremental Static Regeneration:

```typescript
// Page with ISR
export const revalidate = 3600; // 1 hour

export default async function FornecedoresPage() {
  // CacheService TTL (1 hour) aligns with ISR revalidate
  const { fornecedores } = await getFornecedores();
  return <FornecedoresList data={fornecedores} />;
}
```

### Development vs Production

```typescript
// Adjust TTL based on environment
const config: CacheServiceConfig = {
  defaultTTL: process.env.NODE_ENV === 'development' 
    ? 60000      // 1 minute in dev
    : 3600000,   // 1 hour in production
};

const cacheService = CacheService.getInstance(config);
```

### Server Actions Compatibility

The cache service maintains full compatibility with Next.js Server Actions:

- Uses `'use server'` directive
- Returns serializable data only
- Works with React's `cache()` wrapper
- Compatible with streaming and suspense

## Migration Path

### Phase 1: Create CacheService

1. Create `src/services/cache-service.ts`
2. Implement singleton pattern
3. Add type definitions
4. Write unit tests

### Phase 2: Refactor Server Actions

1. Update `getFornecedores()` to use CacheService
2. Update `getDeputados()` to use CacheService
3. Update other cache-reading functions
4. Verify backward compatibility

### Phase 3: Add Invalidation

1. Create `invalidateCache()` Server Action
2. Create `/api/cache/invalidate` route
3. Add manual invalidation UI (optional)

### Phase 4: Monitoring

1. Add performance logging
2. Monitor hit rates
3. Track memory usage
4. Optimize TTL values

## Security Considerations

1. **File Path Validation**: Ensure cache file paths are within allowed directories
2. **API Route Protection**: Add authentication to invalidation endpoint
3. **Memory Limits**: Monitor and limit cache memory usage
4. **Error Information**: Don't expose sensitive file paths in errors
5. **Input Validation**: Validate cache keys to prevent injection

## Future Enhancements

1. **Redis Integration**: Optional Redis backend for distributed caching
2. **Compression**: Compress cached data in memory
3. **Partial Updates**: Update specific cache entries without full reload
4. **Cache Warming**: Pre-load caches on server startup
5. **Advanced Metrics**: Detailed performance analytics dashboard
