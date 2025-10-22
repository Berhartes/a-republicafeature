
const CDN_CONFIGS = {
  production: {
    baseUrl: 'https://berhartes.github.io/a-republica-brasileira-caches/latest',
    enabled: true,
  },
  staging: {
    baseUrl: 'https://berhartes.github.io/a-republica-brasileira-caches/latest',
    enabled: true,
  },
  development: {
    baseUrl: '/cache', // Local
    enabled: false, // Usa apenas local em dev
  },
};

function getEnvironment(): 'production' | 'staging' | 'development' {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('staging') || hostname.includes('preview')) {
    return 'staging';
  }
  
  return 'production';
}

function getCDNConfig() {
  const env = getEnvironment();
  return CDN_CONFIGS[env];
}

export async function fetchFromCDN<T = unknown>(
  filename: string,
  options: {
    useCDN?: boolean;           // Forçar uso do CDN (padrão: auto)
    timeout?: number;           // Timeout em ms (padrão: 10000)
    retries?: number;           // Tentativas (padrão: 2)
    preferCompressed?: boolean; // Preferir versão comprimida (padrão: true)
  } = {}
): Promise<T> {
  const config = getCDNConfig();
  const {
    useCDN = config.enabled,
    timeout = 10000,
    retries = 2,
    preferCompressed = true,
  } = options;

  if (!useCDN || getEnvironment() === 'development') {
    console.info(`[CDN] Modo local: ${filename}`);
    return fetchLocal(filename, preferCompressed);
  }

  console.info(`[CDN] Buscando de CDN: ${filename}`);
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${config.baseUrl}/${filename}`,
        timeout,
        preferCompressed
      );
      
      if (response.ok) {
        const data = await response.json();
        console.info(`[CDN] ✅ Sucesso (tentativa ${attempt})`);
        return data;
      }
      
      console.warn(`[CDN] ⚠️ Status ${response.status} (tentativa ${attempt})`);
      
    } catch (error) {
      console.warn(`[CDN] ⚠️ Erro na tentativa ${attempt}:`, error);
      
      if (attempt === retries) {
        console.warn('[CDN] ⚠️ Todas tentativas falharam, usando fallback local');
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  console.info(`[CDN] 🔄 Fallback para local: ${filename}`);
  return fetchLocal(filename, preferCompressed);
}

async function fetchLocal<T = unknown>(
  filename: string,
  preferCompressed: boolean = true
): Promise<T> {
  const localUrl = `/cache/${filename}`;
  
  if (preferCompressed) {
    const compressionFormats = ['.br', '.gz', ''];
    
    for (const format of compressionFormats) {
      try {
        const url = format ? `${localUrl}${format}` : localUrl;
        const response = await fetch(url);
        
        if (response.ok) {
          console.info(`[CDN] ✅ Local ${format ? format : 'original'}: ${filename}`);
          
          if (format === '.gz' || format === '.br') {
            const { decompressBuffer } = await import('./compression');
            const buffer = await response.arrayBuffer();
            const decompressed = await decompressBuffer(new Uint8Array(buffer));
            const text = new TextDecoder().decode(decompressed);
            return JSON.parse(text);
          }
          
          return response.json();
        }
      } catch {
        continue;
      }
    }
  }
  
  const response = await fetch(localUrl);
  
  if (!response.ok) {
    throw new Error(`Falha ao buscar local: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

async function fetchWithTimeout(
  url: string,
  timeout: number,
  preferCompressed: boolean
): Promise<Response> {
  if (preferCompressed) {
    const compressionFormats = ['.br', '.gz', ''];
    
    for (const format of compressionFormats) {
      try {
        const compressedUrl = format ? `${url}${format}` : url;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(compressedUrl, {
          signal: controller.signal,
          cache: 'default', // Usa cache do browser
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
      } catch {
        continue;
      }
    }
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'default',
    });
    
    clearTimeout(timeoutId);
    return response;
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Timeout após ${timeout}ms`);
    }
    
    throw error;
  }
}

export async function checkCDNHealth(): Promise<{
  available: boolean;
  latency: number;
  error?: string;
}> {
  const config = getCDNConfig();
  const startTime = performance.now();
  
  try {
    const response = await fetchWithTimeout(
      `${config.baseUrl}/manifest.json`,
      5000,
      false
    );
    
    const latency = performance.now() - startTime;
    
    if (response.ok) {
      return { available: true, latency };
    }
    
    return {
      available: false,
      latency,
      error: `Status ${response.status}`,
    };
    
  } catch (error) {
    const latency = performance.now() - startTime;
    return {
      available: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function preconnectCDN(): void {
  const config = getCDNConfig();
  
  if (!config.enabled || getEnvironment() === 'development') {
    return;
  }
  
  const url = new URL(config.baseUrl);
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url.origin;
  document.head.appendChild(link);
  
  console.info(`[CDN] Preconnect: ${url.origin}`);
}

export function useCDN() {
  const config = getCDNConfig();
  const environment = getEnvironment();
  
  return {
    config,
    environment,
    fetchFromCDN,
    checkCDNHealth,
    isEnabled: config.enabled,
    baseUrl: config.baseUrl,
  };
}

export function getCDNUrl(filename: string): string {
  const config = getCDNConfig();
  
  if (!config.enabled || getEnvironment() === 'development') {
    return `/cache/${filename}`;
  }
  
  return `${config.baseUrl}/${filename}`;
}

if (typeof window !== 'undefined') {
  if (getEnvironment() !== 'development') {
    window.addEventListener('load', () => {
      setTimeout(preconnectCDN, 100);
    });
  }
}
