# Requirements Document

## Introduction

This specification defines the requirements for implementing an in-memory cache system to optimize Next.js Server Actions performance. Currently, Server Actions read large JSON files (5.2 MB for suppliers, 1.8 MB for deputies) from disk on every request, causing performance bottlenecks of 85-180ms per request. The solution will implement a singleton cache service that loads data once and maintains it in memory with configurable TTL (Time To Live), reducing response times to 6-12ms (10-15x improvement) while maintaining full backward compatibility with existing code.

## Glossary

- **CacheService**: A singleton service class that manages in-memory data caches with TTL and invalidation capabilities
- **Server Actions**: Next.js server-side functions that handle data fetching and mutations
- **TTL (Time To Live)**: The duration in milliseconds that cached data remains valid before requiring refresh
- **Cache Hit**: When requested data is found in memory cache, avoiding disk read
- **Cache Miss**: When requested data is not in cache or expired, requiring disk read
- **Singleton Pattern**: Design pattern ensuring only one instance of a class exists
- **Map Data Structure**: JavaScript Map object providing O(1) lookup performance
- **Cache Invalidation**: Process of manually clearing cached data to force refresh
- **ISR (Incremental Static Regeneration)**: Next.js feature for revalidating static pages

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the cache service to load large JSON files from disk only once per TTL period, so that repeated requests do not cause redundant disk I/O operations.

#### Acceptance Criteria

1. WHEN the CacheService is instantiated, THE CacheService SHALL implement the singleton pattern to ensure only one instance exists per Node.js process
2. WHEN a cache entry does not exist in memory, THE CacheService SHALL read the JSON file from disk and parse it into memory
3. WHEN a cache entry exists in memory and the TTL has not expired, THE CacheService SHALL return the cached data without disk access
4. WHEN a cache entry exists in memory and the TTL has expired, THE CacheService SHALL reload the data from disk and update the cache
5. THE CacheService SHALL support configurable TTL with a default value of 3600000 milliseconds (1 hour)

### Requirement 2

**User Story:** As a developer, I want the cache service to use efficient data structures for lookups, so that data retrieval operations complete in constant time.

#### Acceptance Criteria

1. THE CacheService SHALL use JavaScript Map data structure for storing cached entries to achieve O(1) lookup complexity
2. WHEN storing supplier data, THE CacheService SHALL maintain the complete data structure including metadata
3. WHEN storing deputy data, THE CacheService SHALL maintain the complete data structure including metadata
4. THE CacheService SHALL support multiple independent cache namespaces (suppliers-cache, deputies-cache, categories-cache)
5. WHEN retrieving cached data, THE CacheService SHALL return the data within 2 milliseconds for cache hits

### Requirement 3

**User Story:** As a developer, I want to refactor existing Server Actions to use the cache service, so that performance improves without breaking existing functionality.

#### Acceptance Criteria

1. WHEN getFornecedores Server Action is called, THE Server Action SHALL retrieve data from CacheService instead of reading from disk
2. WHEN getDeputados Server Action is called, THE Server Action SHALL retrieve data from CacheService instead of reading from disk
3. THE refactored Server Actions SHALL maintain identical function signatures to ensure backward compatibility
4. THE refactored Server Actions SHALL return identical data types and structures as the original implementation
5. WHEN Server Actions use CacheService, THE response time SHALL be reduced from 85-180ms to 6-12ms

### Requirement 4

**User Story:** As a system administrator, I want the ability to manually invalidate cached data, so that I can force data refresh when JSON files are updated by the ETL process.

#### Acceptance Criteria

1. THE CacheService SHALL provide a clearCache method that accepts a cache key parameter
2. WHEN clearCache is called with a specific cache key, THE CacheService SHALL remove that cache entry from memory
3. WHEN clearCache is called without parameters, THE CacheService SHALL remove all cache entries from memory
4. THE system SHALL provide a Server Action named invalidateCache that calls CacheService.clearCache
5. THE system SHALL provide an API route at /api/cache/invalidate that triggers cache invalidation

### Requirement 5

**User Story:** As a developer, I want comprehensive logging and metrics for cache operations, so that I can monitor cache performance and troubleshoot issues.

#### Acceptance Criteria

1. WHEN CacheService loads data from disk, THE CacheService SHALL log the cache key, file size, and load duration
2. WHEN CacheService serves data from cache, THE CacheService SHALL increment a hit counter for that cache key
3. WHEN CacheService loads data from disk due to miss or expiration, THE CacheService SHALL increment a miss counter for that cache key
4. THE CacheService SHALL provide a getStats method that returns hit rate, miss rate, and total requests per cache key
5. WHEN cache operations complete, THE CacheService SHALL log performance metrics including response time improvement

### Requirement 6

**User Story:** As a system operator, I want the cache service to handle errors gracefully, so that application failures in cache operations do not crash the server.

#### Acceptance Criteria

1. WHEN a JSON file read operation fails, THE CacheService SHALL log the error and throw a descriptive exception
2. WHEN JSON parsing fails, THE CacheService SHALL log the error with file path and throw a descriptive exception
3. WHEN cache invalidation is requested for a non-existent key, THE CacheService SHALL log a warning and return without error
4. WHEN memory usage exceeds safe thresholds, THE CacheService SHALL log a warning with current memory statistics
5. THE CacheService SHALL implement proper TypeScript error types for all error conditions

### Requirement 7

**User Story:** As a developer, I want the cache implementation to be fully type-safe, so that I can catch errors at compile time and maintain code quality.

#### Acceptance Criteria

1. THE CacheService SHALL define TypeScript interfaces for all cache entry structures
2. THE CacheService SHALL use generic types to support different cache data types
3. THE CacheService SHALL define a CacheConfig interface with properties for TTL and file paths
4. THE CacheService SHALL export all public types for use in Server Actions
5. WHEN TypeScript compilation runs, THE code SHALL produce zero type errors related to cache operations

### Requirement 8

**User Story:** As a system administrator, I want the cache service to integrate seamlessly with Next.js ISR, so that static page regeneration triggers cache refresh when needed.

#### Acceptance Criteria

1. THE cache implementation SHALL not interfere with Next.js revalidate configuration
2. WHEN a page with revalidate setting regenerates, THE Server Actions SHALL use current cached data
3. THE cache TTL SHALL be configurable independently from Next.js revalidate settings
4. THE system SHALL support manual cache invalidation without affecting Next.js ISR behavior
5. THE cache service SHALL work correctly in both development and production Next.js environments
