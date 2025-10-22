
function supportsBrotli(): boolean {
  return typeof CompressionStream !== 'undefined' && 
         'br' in CompressionStream.prototype;
}

export async function fetchWithCompression(url: string): Promise<Response> {
  try {
    console.info(`[Compression] Tentando versão não comprimida: ${url}`);
    const response = await fetch(url);

    if (response.ok) {
      console.info(`[Compression] ✅ Usando versão não comprimida (${response.headers.get('content-length') || 'unknown'} bytes)`);
      return response;
    }
  } catch (error) {
    console.warn(`[Compression] Falha ao buscar versão não comprimida:`, error);
  }

  const acceptEncoding: string[] = ['gzip'];

  if (supportsBrotli()) {
    acceptEncoding.unshift('br'); // Brotli tem prioridade (melhor compressão)
  }

  for (const encoding of acceptEncoding) {
    try {
      const compressedUrl = `${url}.${encoding === 'br' ? 'br' : 'gz'}`;

      console.info(`[Compression] Tentando buscar: ${compressedUrl}`);

      const response = await fetch(compressedUrl, {
        headers: {
          'Accept-Encoding': encoding,
        },
      });

      if (response.ok) {
        console.info(`[Compression] ✅ Encontrada versão ${encoding.toUpperCase()} (${response.headers.get('content-length') || 'unknown'} bytes)`);

        try {
          const buffer = await response.arrayBuffer();
          const decompressed = await decompressBuffer(buffer, encoding as 'gzip' | 'br');

          const blob = new Blob([decompressed.buffer.slice(0) as ArrayBuffer]);
          return new Response(blob, {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              'X-Compression': encoding,
            },
          });
        } catch (decompressionError) {
          console.warn(`[Compression] Falha na descompressão ${encoding}:`, decompressionError);
        }
      }
    } catch (error) {
      console.warn(`[Compression] Falha ao buscar versão ${encoding}:`, error);
    }
  }

  console.warn(`[Compression] Todas as tentativas falharam, tentando novamente versão não comprimida: ${url}`);
  return fetch(url);
}

export async function decompressBuffer(
  buffer: Uint8Array | ArrayBuffer,
  algorithm?: 'gzip' | 'br'
): Promise<Uint8Array> {
  const arrayBuffer = buffer instanceof Uint8Array ? buffer.buffer : buffer;
  const uint8Array = new Uint8Array(arrayBuffer);

  let detectedAlgorithm = algorithm;

  if (!detectedAlgorithm) {
    if (uint8Array.length >= 2 && uint8Array[0] === 0x1f && uint8Array[1] === 0x8b) {
      detectedAlgorithm = 'gzip';
    }
    else {
      detectedAlgorithm = 'br';
    }
  }

  console.log(`[Compression] Tentando descomprimir ${uint8Array.length} bytes usando ${detectedAlgorithm}`);

  try {
    const pako = await import('pako');

    if (detectedAlgorithm === 'gzip') {
      if (uint8Array.length < 10 || uint8Array[0] !== 0x1f || uint8Array[1] !== 0x8b) {
        throw new Error('Arquivo não é gzip válido');
      }
      const decompressed = pako.ungzip(uint8Array);
      console.log(`[Compression] ✅ Gzip descomprimido: ${uint8Array.length} → ${decompressed.length} bytes`);
      return decompressed;
    } else {
      try {
        const decompressed = pako.inflate(uint8Array);
        console.log(`[Compression] ✅ Brotli/deflate descomprimido: ${uint8Array.length} → ${decompressed.length} bytes`);
        return decompressed;
      } catch (brError) {
        console.warn(`[Compression] Falha no brotli/deflate, retornando dados originais:`, brError);
        return uint8Array;
      }
    }
  } catch (error) {
    try {
      const textDecoder = new TextDecoder();
      const text = textDecoder.decode(uint8Array);
      JSON.parse(text); // Verificar se é JSON válido

      console.warn(`[Compression] Dados parecem não estar comprimidos, retornando originais`);
      return uint8Array;
    } catch (jsonError) {
      throw new Error(`Falha na descompressão (${detectedAlgorithm}): ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function calculateSavings(
  originalSize: number,
  compressedSize: number
): { savings: number; percent: number; formatted: string } {
  const savings = originalSize - compressedSize;
  const percent = (savings / originalSize) * 100;
  
  return {
    savings,
    percent,
    formatted: `${formatBytes(savings)} (${percent.toFixed(1)}%)`,
  };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function useCompressionStats() {
  const stats = {
    totalOriginal: 0,
    totalCompressed: 0,
    totalSavings: 0,
    requests: [] as Array<{ url: string; original: number; compressed: number; encoding: string }>,
  };
  
  const recordRequest = (url: string, original: number, compressed: number, encoding: string) => {
    stats.requests.push({ url, original, compressed, encoding });
    stats.totalOriginal += original;
    stats.totalCompressed += compressed;
    stats.totalSavings = stats.totalOriginal - stats.totalCompressed;
  };
  
  return { stats, recordRequest };
}
