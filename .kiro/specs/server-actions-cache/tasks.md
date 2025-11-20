# Implementation Plan

## 📊 Status Geral

**Progresso**: 5/9 tarefas core concluídas (55%)

### ✅ Concluído
- CacheService singleton implementado com todas as funcionalidades
- Todas as Server Actions refatoradas para usar CacheService
- Cache invalidation Server Action criada
- Sistema de métricas e logging funcionando
- Tratamento de erros completo

### 🚧 Em Andamento / Pendente
- API route de invalidação HTTP (tarefa 6)
- Performance logging detalhado nas Server Actions (tarefa 7)
- Testes de compatibilidade com Next.js ISR (tarefa 8)
- Validação de performance e benchmarks (tarefa 9)

### 📝 Opcional
- Testes unitários (tarefa 10)
- Testes de integração (tarefa 11)

---

- [x] 1. Create CacheService core implementation
  - Create `packages/monitor-despesas-next/src/services/cache-service.ts` with singleton pattern
  - Implement private constructor and getInstance() method
  - Initialize cacheRegistry Map and metricsRegistry Map
  - Implement defaultTTL configuration with 1 hour default
  - _Requirements: 1.1, 1.2, 2.1_

- [x] 1.1 Implement cache data structures and types
  - Define CacheServiceConfig, CacheConfig, CacheEntry<T>, CacheMetrics, and CacheStats interfaces
  - Create CACHE_KEYS constant object with all cache key names
  - Create CACHE_PATHS constant object mapping keys to file paths
  - Export all types for use in Server Actions
  - _Requirements: 1.5, 2.1, 7.1, 7.2, 7.3, 7.4_

- [x] 1.2 Implement get() method with TTL logic
  - Check if cache entry exists in cacheRegistry Map
  - Implement isExpired() helper to check TTL expiration
  - Return cached data if exists and not expired (cache HIT)
  - Load from disk if cache miss or expired
  - Store loaded data in cacheRegistry with timestamp and TTL
  - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.5_

- [x] 1.3 Implement loadFromDisk() method
  - Use fs/promises readFile to read JSON file from disk
  - Parse JSON content using JSON.parse()
  - Calculate and log file size and load duration
  - Return typed data using generic type parameter
  - _Requirements: 1.2, 5.1_

- [x] 1.4 Implement cache metrics tracking
  - Create recordHit() method to increment hit counter
  - Create recordMiss() method to increment miss counter
  - Update lastAccessTime on each cache access
  - Implement getStats() method to return hit rate, miss rate, and total requests
  - Support getting stats for specific cache key or all caches
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 1.5 Implement cache invalidation
  - Create clearCache() method accepting optional cache key parameter
  - Clear specific cache entry when key provided
  - Clear all cache entries when no key provided
  - Log cache invalidation operations with affected keys
  - Handle clearing non-existent cache gracefully with warning log
  - _Requirements: 4.1, 4.2, 4.3, 6.3_

- [x] 1.6 Implement error handling and logging
  - Create CacheError, CacheLoadError, and CacheParseError classes
  - Implement log() helper method with info/warn/error levels
  - Add try-catch in get() method to handle file read errors
  - Throw CacheLoadError when file not found (ENOENT)
  - Throw CacheParseError when JSON parsing fails
  - Log all cache operations with timestamps and metadata
  - _Requirements: 5.1, 6.1, 6.2, 6.4_

- [x] 1.7 Implement memory monitoring
  - Create getMemoryUsage() method to calculate cache size
  - Iterate through cacheRegistry and estimate size of each entry
  - Log warning when total cache size exceeds 50 MB threshold
  - Return cache count, estimated size, and per-entry breakdown
  - _Requirements: 6.4_

- [x] 2. Refactor getFornecedores Server Action
  - Import CacheService and CACHE_KEYS from cache-service
  - Replace readMaterializeCacheWithSource call with CacheService.getInstance().get()
  - Pass CACHE_KEYS.SUPPLIERS and CACHE_PATHS configuration
  - Verify function signature remains identical (backward compatibility)
  - Verify return type remains identical
  - Test with existing filters (searchTerm, categoria, sortBy, pagination)
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 3. Refactor getDeputados Server Action
  - Import CacheService and CACHE_KEYS from cache-service
  - Replace readMaterializeCacheWithSource call with CacheService.getInstance().get()
  - Pass CACHE_KEYS.DEPUTIES and CACHE_PATHS configuration
  - Verify function signature remains identical (backward compatibility)
  - Verify return type remains identical
  - Test with existing filters (ano, partido, uf, searchTerm, sortBy, pagination)
  - _Requirements: 3.2, 3.3, 3.4_

- [x] 4. Refactor remaining cache-reading Server Actions
  - Update getDeputadoById() to use CacheService
  - Update getPremiacoes() to use CacheService
  - Update getAnalisesSuspeitas() to use CacheService
  - Update getPremiacoesGlobais() to use CacheService
  - Update getDeputadosByIds() to use CacheService
  - Update getDashboardData() to use CacheService
  - Verify all function signatures remain identical
  - _Requirements: 3.3, 3.4_

- [x] 5. Create cache invalidation Server Action
  - Create `packages/monitor-despesas-next/src/app/gastos/actions/cache-actions.ts` file
  - Add 'use server' directive at top of file
  - Implement invalidateCache(cacheKey?: string) Server Action
  - Call CacheService.getInstance().clearCache(cacheKey)
  - Return success status, message, and list of cleared keys
  - Export function for use in API routes and components
  - _Requirements: 4.4_

- [ ] 6. Create cache invalidation API route
  - Create `packages/monitor-despesas-next/src/app/api/cache/invalidate/route.ts` file
  - Implement POST handler that accepts cacheKey in request body
  - Call invalidateCache Server Action with provided cacheKey
  - Return JSON response with success status and message
  - Add error handling for invalid requests
  - Add authentication/authorization check for security
  - _Requirements: 4.5_

- [ ] 7. Add performance logging to Server Actions
  - Add performance.now() timing to getFornecedores before and after cache access
  - Log response time with cache hit/miss status
  - Add performance.now() timing to getDeputados before and after cache access
  - Log response time with cache hit/miss status
  - Include cache stats (hit rate) in periodic logs
  - Create performance comparison report (before/after cache)
  - _Requirements: 5.5_

- [ ] 8. Verify Next.js ISR compatibility
  - Test CacheService with pages using revalidate configuration
  - Verify cache TTL works independently from ISR revalidate
  - Test manual cache invalidation does not break ISR
  - Verify cache works in both development and production builds
  - Test with Next.js streaming and suspense features
  - Document any edge cases or limitations found
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Performance validation and optimization
  - Measure getFornecedores response time with cache MISS (first load)
  - Measure getFornecedores response time with cache HIT (target: 6-12ms)
  - Measure getDeputados response time with cache MISS (first load)
  - Measure getDeputados response time with cache HIT (target: 5-10ms)
  - Monitor cache hit rate over time (target: > 95%)
  - Monitor memory usage with getMemoryUsage() (target: < 50 MB)
  - Document performance improvements and create comparison report
  - _Requirements: 3.5_

- [ ]* 10. Write unit tests for CacheService
  - Test singleton pattern returns same instance
  - Test cache HIT returns data without disk read
  - Test cache MISS loads data from disk
  - Test TTL expiration triggers reload
  - Test clearCache removes specific entry
  - Test clearCache with no key clears all entries
  - Test metrics tracking (hits, misses, hit rate)
  - Test error handling for missing files
  - Test error handling for invalid JSON
  - Test memory usage calculation
  - _Requirements: 6.1, 6.2, 7.5_

- [ ]* 11. Write integration tests for Server Actions
  - Test getFornecedores maintains identical response structure
  - Test getDeputados maintains identical response structure
  - Test concurrent requests to same Server Action
  - Test cache invalidation via Server Action
  - Test cache invalidation via API route
  - Test performance improvement is 10x or better
  - _Requirements: 3.3, 3.4, 3.5_


---

## 🎯 Próximos Passos Recomendados

### Prioridade Alta

1. **Tarefa 6: API Route de Invalidação**
   - Criar endpoint HTTP para invalidação de cache
   - Útil para integração com ETL e ferramentas externas
   - Adicionar autenticação para segurança

2. **Tarefa 9: Validação de Performance**
   - Medir tempos de resposta reais (HIT vs MISS)
   - Confirmar melhoria de 10-15x
   - Monitorar hit rate e uso de memória

### Prioridade Média

3. **Tarefa 7: Performance Logging**
   - Adicionar timing detalhado nas Server Actions
   - Criar relatório de comparação antes/depois
   - Facilita debugging e otimização

4. **Tarefa 8: Testes de Compatibilidade**
   - Validar integração com Next.js ISR
   - Testar em desenvolvimento e produção
   - Documentar edge cases

### Prioridade Baixa (Opcional)

5. **Tarefas 10-11: Testes Automatizados**
   - Testes unitários do CacheService
   - Testes de integração das Server Actions
   - Aumenta confiabilidade do código

## 📈 Resultados Esperados

Com a implementação atual (tarefas 1-5 concluídas), você já deve ter:

- ✅ **Performance 10-15x melhor** (85-180ms → 6-12ms esperado)
- ✅ **Cache em memória funcionando** com TTL de 1 hora
- ✅ **Zero breaking changes** - todas as APIs mantidas
- ✅ **Invalidação manual** via Server Action
- ✅ **Métricas e logging** para monitoramento

## 🔍 Como Validar

Execute estes comandos para verificar a implementação:

```bash
# 1. Verificar se os arquivos existem
ls packages/monitor-despesas-next/src/services/cache-service.ts
ls packages/monitor-despesas-next/src/constants/cache.ts
ls packages/monitor-despesas-next/src/app/gastos/actions/cache-actions.ts

# 2. Verificar imports no data-actions.ts
grep "CacheService" packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts

# 3. Rodar a aplicação e testar
cd packages/monitor-despesas-next
pnpm dev

# 4. Verificar logs do cache no console
# Procure por: [CacheService ...] Cache HIT/MISS
```

## ⚠️ Cuidados e Riscos

### 🚨 Risco Crítico: Ambientes Serverless

**Problema**: Em deploys serverless (Vercel, AWS Lambda), cada função tem seu próprio cache em memória e pode ser reciclada frequentemente.

**Impacto**:
- Cache não é compartilhado entre múltiplas instâncias
- Cold starts perdem todo o cache
- Hit rate pode ser muito menor que esperado
- Performance inconsistente entre requisições

**Mitigações**:
```typescript
// Opção 1: Verificar ambiente e ajustar TTL
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const cacheService = CacheService.getInstance({
  defaultTTL: isServerless ? 300000 : 3600000, // 5min vs 1h
});

// Opção 2: Considerar Redis para cache distribuído (futuro)
// Ver design.md seção "Future Enhancements"
```

**Recomendação**: 
- ✅ Validar se a aplicação roda em ambiente Node "long-lived" (servidor dedicado)
- ⚠️ Se usar serverless, considerar antecipar implementação de Redis
- 📊 Monitorar hit rate em produção para detectar problema

### 🔄 Risco Alto: Sincronização com ETL

**Problema**: Se o ETL Python gera novos JSONs fora do app Next.js, o cache pode servir dados desatualizados durante o TTL.

**Impacto**:
- Dados podem ficar desatualizados por até 1 hora (TTL padrão)
- Usuários veem informações antigas após atualização do ETL
- Inconsistência entre diferentes partes do sistema

**Mitigações**:
```bash
# Opção 1: ETL chama API de invalidação após gerar caches
curl -X POST http://localhost:3000/api/cache/invalidate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SECRET_TOKEN}" \
  -d '{"cacheKey": "suppliers-cache"}'

# Opção 2: Script de deploy invalida cache
pnpm run cache:invalidate:all

# Opção 3: Reduzir TTL para sincronização mais frequente
# (trade-off: mais disk reads, menos performance)
```

**Recomendação**:
- ✅ **CRÍTICO**: Implementar tarefa 6 (API route) com autenticação
- ✅ Integrar chamada de invalidação no pipeline do ETL
- ✅ Documentar processo de sincronização para equipe
- 📝 Considerar webhook ou file watcher para invalidação automática

### 💾 Risco Médio: Crescimento de Arquivos

**Problema**: JSONs de 5.2 MB são gerenciáveis, mas se crescerem significativamente, podem causar problemas de memória.

**Impacto Atual**:
- suppliers-cache.json: 5.2 MB
- deputies-cache.json: 1.8 MB
- Total estimado: ~7-10 MB em memória
- Com múltiplos caches: pode chegar a 50 MB (limite configurado)

**Cenários de Risco**:
```typescript
// Se arquivos crescerem 5x (ex: 5 anos de dados)
// suppliers-cache.json: 26 MB
// deputies-cache.json: 9 MB
// Total: 35+ MB por cache
// Com 3 caches simultâneos: 105 MB (excede limite!)
```

**Mitigações**:
```typescript
// Opção 1: Implementar cache seletivo por ano
const cacheService = CacheService.getInstance();
const data = await cacheService.get(`suppliers-cache-${year}`, {
  filePath: `public/cache/suppliers-${year}.json`,
  ttl: 3600000,
});

// Opção 2: Streaming/partial loading para arquivos grandes
// (requer refatoração significativa)

// Opção 3: Aumentar limite de memória
const memory = cacheService.getMemoryUsage();
if (memory.estimatedSize > 100 * 1024 * 1024) { // 100 MB
  cacheService.clearCache(); // Limpar caches menos usados
}
```

**Recomendação**:
- 📊 Monitorar tamanho dos arquivos JSON ao longo do tempo
- ⚠️ Estabelecer alertas quando arquivos ultrapassarem 10 MB
- 🔄 Considerar estratégia de particionamento por ano/período
- 💡 Avaliar compressão (gzip) para arquivos em disco

### 🔐 Risco Médio: Segurança da API de Invalidação

**Problema**: API de invalidação sem autenticação permite que qualquer um limpe o cache.

**Impacto**:
- Ataque de negação de serviço (DoS) limpando cache repetidamente
- Performance degradada forçando disk reads constantes
- Possível vazamento de informações sobre estrutura do sistema

**Mitigações**:
```typescript
// app/api/cache/invalidate/route.ts
export async function POST(request: Request) {
  // Validar token de autenticação
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (token !== process.env.CACHE_INVALIDATION_SECRET) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Rate limiting
  // TODO: Implementar rate limiting por IP
  
  // Continuar com invalidação...
}
```

**Recomendação**:
- ✅ **CRÍTICO**: Adicionar autenticação na tarefa 6
- ✅ Implementar rate limiting (ex: 10 requisições/minuto)
- ✅ Logar todas as tentativas de invalidação
- 🔒 Usar variável de ambiente para secret token
- 📝 Documentar processo de rotação de tokens

### 📊 Checklist de Validação em Produção

Antes de considerar a implementação completa, validar:

- [ ] **Ambiente**: Confirmar se é Node long-lived ou serverless
- [ ] **Hit Rate**: Monitorar por 24h, deve ser > 95%
- [ ] **Memória**: Verificar uso real, deve ser < 50 MB
- [ ] **Sincronização**: ETL invalida cache após gerar novos dados
- [ ] **Segurança**: API de invalidação tem autenticação
- [ ] **Performance**: Confirmar melhoria de 10-15x em produção
- [ ] **Logs**: Verificar logs de cache HIT/MISS funcionando
- [ ] **Alertas**: Configurar alertas para uso de memória alto

## 💡 Dicas de Uso

### Invalidar Cache Manualmente

```typescript
import { invalidateCache } from '@/app/gastos/actions/cache-actions';

// Invalidar cache específico
await invalidateCache('suppliers-cache');

// Invalidar todos os caches
await invalidateCache();
```

### Monitorar Performance

```typescript
import { CacheService } from '@/services/cache-service';

const cacheService = CacheService.getInstance();

// Ver estatísticas
const stats = cacheService.getStats('suppliers-cache');
console.log(`Hit Rate: ${stats.hitRate}%`);

// Ver uso de memória
const memory = cacheService.getMemoryUsage();
console.log(`Cache Size: ${(memory.estimatedSize / 1024 / 1024).toFixed(2)} MB`);
```

### Ajustar TTL

```typescript
// No CacheService.getInstance()
const cacheService = CacheService.getInstance({
  defaultTTL: 1800000, // 30 minutos
});

// Ou por cache específico
await cacheService.get(CACHE_KEYS.SUPPLIERS, {
  filePath: CACHE_PATHS[CACHE_KEYS.SUPPLIERS],
  ttl: 600000, // 10 minutos
});
```

### Integrar com ETL Python

```python
# etl_pipeline.py
import requests
import os

def invalidate_cache_after_generation():
    """Invalida cache do Next.js após gerar novos JSONs"""
    api_url = os.getenv('NEXTJS_API_URL', 'http://localhost:3000')
    secret = os.getenv('CACHE_INVALIDATION_SECRET')
    
    response = requests.post(
        f'{api_url}/api/cache/invalidate',
        headers={
            'Authorization': f'Bearer {secret}',
            'Content-Type': 'application/json'
        },
        json={'cacheKey': None}  # Invalida todos os caches
    )
    
    if response.status_code == 200:
        print('✅ Cache invalidado com sucesso')
    else:
        print(f'❌ Erro ao invalidar cache: {response.text}')

# Chamar após gerar caches
generate_suppliers_cache()
generate_deputies_cache()
invalidate_cache_after_generation()
```
