
interface CacheOptions {
  ttl?: number // Time to live em millisegundos
  tags?: string[] // Tags para organização
  compress?: boolean // Compressão de dados
}

interface CacheEntry<T> {
  key: string
  data: T
  createdAt: number
  expiresAt?: number
  tags?: string[]
  compressed?: boolean
}

class UnifiedCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private dbName = 'MonitorDespesasUnifiedCache'
  private dbVersion = 1
  private storeName = 'unified-cache'
  private db: IDBDatabase | null = null

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)

      request.onerror = () => reject(new Error('Erro ao abrir IndexedDB'))

      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('tags', 'tags', { multiEntry: true })
          store.createIndex('expiresAt', 'expiresAt')
        }
      }
    })
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const now = Date.now()
    const entry: CacheEntry<T> = {
      key,
      data,
      createdAt: now,
      expiresAt: options.ttl ? now + options.ttl : undefined,
      tags: options.tags,
      compressed: options.compress
    }

    this.memoryCache.set(key, entry)

    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      await new Promise<void>((resolve, reject) => {
        const request = store.put(entry)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log(`[UnifiedCache] Salvo: ${key}`)
    } catch (error) {
      console.error(`[UnifiedCache] Erro ao salvar ${key}:`, error)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      console.log(`[UnifiedCache] Hit memória: ${key}`)
      return memoryEntry.data
    }

    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      const entry = await new Promise<CacheEntry<T> | undefined>((resolve, reject) => {
        const request = store.get(key)
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

      if (entry && !this.isExpired(entry)) {
        this.memoryCache.set(key, entry)
        console.log(`[UnifiedCache] Hit IndexedDB: ${key}`)
        return entry.data
      }

      if (entry && this.isExpired(entry)) {
        await this.delete(key)
      }

    } catch (error) {
      console.error(`[UnifiedCache] Erro ao buscar ${key}:`, error)
    }

    console.log(`[UnifiedCache] Miss: ${key}`)
    return null
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)

    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log(`[UnifiedCache] Removido: ${key}`)
    } catch (error) {
      console.error(`[UnifiedCache] Erro ao remover ${key}:`, error)
    }
  }

  async getByTag(tag: string): Promise<string[]> {
    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('tags')

      const keys = await new Promise<string[]>((resolve, reject) => {
        const request = index.getAllKeys(tag)
        request.onsuccess = () => resolve(request.result as string[])
        request.onerror = () => reject(request.error)
      })

      return keys
    } catch (error) {
      console.error(`[UnifiedCache] Erro ao buscar por tag ${tag}:`, error)
      return []
    }
  }

  async cleanup(): Promise<number> {
    let removedCount = 0

    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      const now = Date.now()
      const index = store.index('expiresAt')
      const range = IDBKeyRange.upperBound(now)

      const request = index.openCursor(range)

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result
          if (cursor) {
            cursor.delete()
            removedCount++
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })

      console.log(`[UnifiedCache] Cleanup: ${removedCount} itens removidos`)
    } catch (error) {
      console.error('[UnifiedCache] Erro no cleanup:', error)
    }

    return removedCount
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()

    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)

      await new Promise<void>((resolve, reject) => {
        const request = store.clear()
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })

      console.log('[UnifiedCache] Cache completamente limpo')
    } catch (error) {
      console.error('[UnifiedCache] Erro ao limpar cache:', error)
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.expiresAt) return false
    return Date.now() > entry.expiresAt
  }

  async getStats() {
    const memoryCount = this.memoryCache.size

    let persistentCount = 0
    let totalSize = 0

    try {
      const db = await this.initDB()
      const transaction = db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)

      persistentCount = await new Promise<number>((resolve, reject) => {
        const request = store.count()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      })

    } catch (error) {
      console.error('[UnifiedCache] Erro ao obter estatísticas:', error)
    }

    return {
      memoryItems: memoryCount,
      persistentItems: persistentCount,
      totalSize: totalSize
    }
  }
}

export const unifiedCacheManager = new UnifiedCacheManager()
export default unifiedCacheManager