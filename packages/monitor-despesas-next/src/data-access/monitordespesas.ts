
import { fetchWithCompression } from '@/utils/compression';
import { getEnvVar } from '@/lib/runtime-env';

const DEFAULT_CACHE_PATH = '/cache';

const CACHE_BASE_URL =
  getEnvVar('NEXT_PUBLIC_CACHE_BASE_URL') ||
  getEnvVar('VITE_CACHE_BASE_URL') ||
  DEFAULT_CACHE_PATH;

const LOCAL_CACHE_URL =
  getEnvVar('NEXT_PUBLIC_LOCAL_CACHE_URL') ||
  getEnvVar('VITE_LOCAL_CACHE_URL') ||
  CACHE_BASE_URL;

const STORAGE_BASE_URL =
  getEnvVar('NEXT_PUBLIC_STORAGE_URL') ||
  getEnvVar('VITE_STORAGE_URL') ||
  CACHE_BASE_URL;

const USE_LOCAL_CACHE = (getEnvVar('NEXT_PUBLIC_USE_LOCAL_CACHE') || getEnvVar('VITE_USE_LOCAL_CACHE') || 'true') === 'true';
const USE_REMOTE_STORAGE = (getEnvVar('NEXT_PUBLIC_USE_REMOTE_STORAGE') || getEnvVar('VITE_USE_REMOTE_STORAGE')) === 'true' && !USE_LOCAL_CACHE;

export interface ManifestEntry {
  path: string;
  lastModified: string;
}

export interface Manifest {
  [filename: string]: ManifestEntry;
}

const DB_NAME = 'MonitorDespesasCache';
const DB_VERSION = 2;
const MANIFEST_STORE = 'manifest';
const CACHE_STORE = 'cache';

type CacheSource = 'network' | 'cache';

interface StoredRecord<T> {
  key: string;
  data: T;
  hash?: string;
  storedAt: string;
}

export interface CacheResponse<T> {
  data: T;
  metadata?: unknown;
  filename: string;
  hash?: string;
  fetchedAt: string;
  source: CacheSource;
}

export interface SupplierCacheEntry {
  cnpj: string;
  nome: string;
  nomeEleitoral?: string;
  nomeFornecedor?: string;
  categoria?: string;
  categoriaOriginal?: string;
  categorias?: string[];
  categoriasOriginais?: string[];
  totalTransacionado?: number;
  totalRecebido?: number;
  totalRecebidoTodos?: number;
  transacoes?: number;
  totalTransacoes?: number;
  numeroTransacoes?: number;
  numeroDeputadosAtendidos?: number;
  scoreSuspeicao?: number;
  distribuicaoTipos?: Record<string, { valor: number; quantidade: number }>;
  distribuicaoTiposOriginais?: Record<string, { valor: number; quantidade: number }>;
  deputadosAtendidos?: Array<string | {
    id?: string;
    nome?: string;
    partido?: string;
    siglaPartido?: string;
    siglaUf?: string;
    uf?: string;
    nomeEleitoral?: string;
    nomeCivil?: string;
    urlFoto?: string;
  }>;
  [key: string]: unknown;
}

let db: IDBDatabase;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(new Error('Error opening DB'));

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (database.objectStoreNames.contains(MANIFEST_STORE)) {
        database.deleteObjectStore(MANIFEST_STORE);
      }
      if (database.objectStoreNames.contains(CACHE_STORE)) {
        database.deleteObjectStore(CACHE_STORE);
      }

      database.createObjectStore(MANIFEST_STORE, { keyPath: 'key' });
      database.createObjectStore(CACHE_STORE, { keyPath: 'key' });
    };
  });
}

async function getRecordFromCache<T>(storeName: string, key: string): Promise<StoredRecord<T> | undefined> {
  const database = await openDB();

  return new Promise((resolve) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as StoredRecord<T> | undefined);
    };

    request.onerror = () => resolve(undefined);
  });
}

async function saveRecordToCache<T>(storeName: string, record: StoredRecord<T>): Promise<void> {
  const database = await openDB();

  return new Promise((resolve) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    store.put(record);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => resolve();
  });
}

function normalizeCachePayload<T>(raw: unknown): { data: T; metadata?: unknown } {
  if (raw && typeof raw === 'object') {
    const payload = raw as Record<string, unknown>;

    if ('data' in payload) {
      return { data: payload.data as T, metadata: payload.metadata };
    }

    if ('fornecedores' in payload) {
      return { data: payload.fornecedores as T, metadata: payload.metadata };
    }
  }

  return { data: raw as T };
}

function findEntry(manifest: Manifest, filename: string): ManifestEntry | undefined {
  return manifest[filename];
}

function ensureEntry(manifest: Manifest, baseName: string): { filename: string; entry: ManifestEntry } | undefined {
  // Tentar encontrar arquivo exato
  const exactFilename = `${baseName}.json`;
  if (manifest[exactFilename]) {
    return { filename: exactFilename, entry: manifest[exactFilename] };
  }
  
  // Tentar encontrar arquivo que comece com baseName
  const matchingKey = Object.keys(manifest).find(key => key.startsWith(`${baseName}-`));
  if (matchingKey) {
    return { filename: matchingKey, entry: manifest[matchingKey] };
  }
  
  return undefined;
}

function getCacheBaseUrl(): string {
  if (USE_LOCAL_CACHE) {
    console.info('[MonitordespesasService] Usando cache local prioritário:', LOCAL_CACHE_URL);
    return LOCAL_CACHE_URL;
  }

  if (USE_REMOTE_STORAGE) {
    console.info('[MonitordespesasService] Fallback para storage remoto:', STORAGE_BASE_URL);
    return STORAGE_BASE_URL;
  }

  console.info('[MonitordespesasService] Usando cache base padrão:', CACHE_BASE_URL);
  return CACHE_BASE_URL;
}

export async function fetchManifest(): Promise<Manifest | null> {
  console.info('[MonitordespesasService] Fetching manifest...')

  try {
    const baseUrl = getCacheBaseUrl();
    
    const timestamp = Date.now()
    const manifestUrl = `${baseUrl}/caches-manifest.json?t=${timestamp}`;
    
    console.info('[MonitordespesasService] Fetching from:', manifestUrl);
    
    const response = await fetchWithCompression(manifestUrl).catch(() => 
      fetch(manifestUrl) // Fallback para versão não comprimida
    );

    if (!response.ok) {
      console.warn('[MonitordespesasService] Failed to fetch manifest from network.')
      const cachedRecord = await getRecordFromCache<Manifest>(MANIFEST_STORE, 'latest')
      return cachedRecord?.data ?? null
    }

    const manifest = (await response.json()) as Manifest
    await saveRecordToCache(MANIFEST_STORE, {
      key: 'latest',
      data: manifest,
      storedAt: new Date().toISOString(),
    })

    console.info('[MonitordespesasService] Manifest loaded', manifest)
    return manifest
  } catch (error) {
    console.error('[MonitordespesasService] Error fetching manifest:', error)
    const cachedRecord = await getRecordFromCache<Manifest>(MANIFEST_STORE, 'latest')
    return cachedRecord?.data ?? null
  }
}

async function fetchCacheEntry<T>(filename: string, entry: ManifestEntry): Promise<CacheResponse<T> | null> {

  console.info(`[MonitordespesasService] Fetching ${filename} from network...`)
  
  const baseUrl = getCacheBaseUrl();
  const timestamp = Date.now()
  const cacheUrl = `${baseUrl}${entry.path}?t=${timestamp}`;
  
  console.info(`[MonitordespesasService] Fetching from:`, cacheUrl);
  
  let response;
  try {
    response = await fetchWithCompression(cacheUrl);
  } catch (error) {
    console.warn(`[MonitordespesasService] fetchWithCompression failed, trying regular fetch:`, error);
    response = await fetch(cacheUrl);
  }

  if (!response.ok) {
    console.warn(`[MonitordespesasService] Failed to fetch ${filename}: ${response.status}`)
    return null
  }

  const raw = await response.json()
  const { data, metadata } = normalizeCachePayload<T>(raw)
  const storedAt = new Date().toISOString()

  await saveRecordToCache(CACHE_STORE, {
    key: filename,
    data: raw,
    hash: entry.lastModified,
    storedAt,
  })

  return {
    data,
    metadata,
    filename: filename,
    hash: entry.lastModified,
    fetchedAt: storedAt,
    source: 'network',
  }
}

export async function fetchSuppliersCache(manifest: Manifest): Promise<CacheResponse<SupplierCacheEntry[]> | null> {
  const result = ensureEntry(manifest, 'suppliers-cache');

  if (!result) {
    console.warn('[MonitordespesasService] suppliers-cache entry not found in manifest');
    return null;
  }

  return fetchCacheEntry<SupplierCacheEntry[]>(result.filename, result.entry);
}

export async function fetchDashboardCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'dashboard-cache');
  if (!result) {
    console.warn('[MonitordespesasService] dashboard-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchAnalysisCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'analysis-cache');
  if (!result) {
    console.warn('[MonitordespesasService] analysis-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchDeputiesCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'deputies-cache');
  if (!result) {
    console.warn('[MonitordespesasService] deputies-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchRankingsCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'rankings-cache');
  if (!result) {
    console.warn('[MonitordespesasService] rankings-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchEnhancedSuppliersCache(manifest: Manifest): Promise<CacheResponse<SupplierCacheEntry[]> | null> {
  // Enhanced cache foi consolidado no suppliers-cache principal
  console.info('[MonitordespesasService] enhanced-suppliers-cache agora está consolidado em suppliers-cache');
  return fetchSuppliersCache(manifest);
}

export async function fetchFornecedorDetailsCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'fornecedor-details-cache');
  if (!result) {
    console.warn('[MonitordespesasService] fornecedor-details-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchCategoriasAnalysisCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  // Categorias analysis foi consolidado no analysis-cache principal
  console.info('[MonitordespesasService] categorias-analysis-cache agora está consolidado em analysis-cache');
  const analysisCache = await fetchAnalysisCache(manifest);
  if (analysisCache && analysisCache.data.categorias) {
    return {
      ...analysisCache,
      data: analysisCache.data.categorias
    };
  }
  return null;
}

export async function fetchPremiacoesCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'premiacoes-cache');
  if (!result) {
    console.warn('[MonitordespesasService] premiacoes-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchTransacoesCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'transacoes-cache');
  if (!result) {
    console.warn('[MonitordespesasService] transacoes-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchCategoriasCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'categorias-cache');
  if (!result) {
    console.warn('[MonitordespesasService] categorias-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function fetchSenadoCache(manifest: Manifest): Promise<CacheResponse<any> | null> {
  const result = ensureEntry(manifest, 'senado-cache');
  if (!result) {
    console.warn('[MonitordespesasService] senado-cache entry not found in manifest');
    return null;
  }
  return fetchCacheEntry<any>(result.filename, result.entry);
}

export async function prefetchAll(manifest: Manifest): Promise<void> {
  console.info('[MonitordespesasService] Prefetching all caches...');
  await Promise.all([
    fetchSuppliersCache(manifest),
    fetchDashboardCache(manifest),
    fetchAnalysisCache(manifest),
    fetchDeputiesCache(manifest),
    fetchRankingsCache(manifest),
  ]);
  console.info('[MonitordespesasService] All caches prefetched.');
}
