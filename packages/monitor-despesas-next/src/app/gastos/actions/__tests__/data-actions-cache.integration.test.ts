import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFornecedores, getDeputados, invalidateCache } from '../data-actions'
import { CacheService } from '@/services/cache-service'

// Mock o módulo 'fs/promises' para espionar as chamadas de leitura de arquivo
vi.mock('fs/promises', () => ({
  default: {
    readFile: vi.fn(),
  },
}));

// Importar o mock após a configuração
const fs = await import('fs/promises');
const readFileSpy = fs.default.readFile as vi.Mock;

// Dados mock para simular o conteúdo dos arquivos de cache
const MOCK_SUPPLIERS_DATA = { fornecedores: [{ id: '1', nome: 'Fornecedor Teste' }] };
const MOCK_DEPUTIES_DATA = { deputados: [{ id: '101', nome: 'Deputado Teste' }] };

describe('Server Actions with CacheService Integration', () => {
  // Helper para resetar o singleton do CacheService e garantir isolamento entre os testes
  const resetCacheServiceSingleton = () => {
    (CacheService as any).instance = null;
  };

  beforeEach(() => {
    // Reseta o singleton e limpa os mocks antes de cada teste
    resetCacheServiceSingleton();
    vi.clearAllMocks();
  });

  describe('getFornecedores Integration', () => {
    it('deve carregar do disco na primeira chamada e do cache na segunda', async () => {
      readFileSpy.mockResolvedValue(JSON.stringify(MOCK_SUPPLIERS_DATA));

      // Primeira chamada - deve acionar o disco (Cache MISS)
      const result1 = await getFornecedores();
      expect(result1.fornecedores.length).toBe(1);
      expect(result1.fornecedores[0].nome).toBe('Fornecedor Teste');
      expect(readFileSpy).toHaveBeenCalledTimes(1);
      expect(readFileSpy).toHaveBeenCalledWith(expect.stringContaining('suppliers-cache.json'), 'utf-8');

      // Segunda chamada - deve vir do cache (Cache HIT)
      const result2 = await getFornecedores();
      expect(result2.fornecedores.length).toBe(1);
      expect(result2.fornecedores[0].nome).toBe('Fornecedor Teste');
      // A contagem de chamadas ao readFile não deve aumentar
      expect(readFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDeputados Integration', () => {
    it('deve carregar do disco na primeira chamada e do cache na segunda', async () => {
      readFileSpy.mockResolvedValue(JSON.stringify(MOCK_DEPUTIES_DATA));

      // Primeira chamada - Cache MISS
      const result1 = await getDeputados();
      expect(result1.deputados.length).toBe(1);
      expect(result1.deputados[0].nomeEleitoral).toBe('Deputado Teste');
      expect(readFileSpy).toHaveBeenCalledTimes(1);
      expect(readFileSpy).toHaveBeenCalledWith(expect.stringContaining('deputies-cache.json'), 'utf-8');

      // Segunda chamada - Cache HIT
      const result2 = await getDeputados();
      expect(result2.deputados.length).toBe(1);
      // A contagem de chamadas ao readFile não deve aumentar
      expect(readFileSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidateCache Integration', () => {
    it('deve forçar uma releitura do disco após a invalidação', async () => {
      readFileSpy.mockResolvedValue(JSON.stringify(MOCK_SUPPLIERS_DATA));

      // Popula o cache
      await getFornecedores();
      expect(readFileSpy).toHaveBeenCalledTimes(1);

      // Busca do cache (HIT)
      await getFornecedores();
      expect(readFileSpy).toHaveBeenCalledTimes(1);

      // Invalida o cache de fornecedores
      const invalidationResult = await invalidateCache('suppliers-cache');
      expect(invalidationResult.success).toBe(true);
      expect(invalidationResult.clearedKeys).toContain('suppliers-cache');

      // Busca novamente, deve ser um MISS e ler do disco
      await getFornecedores();
      expect(readFileSpy).toHaveBeenCalledTimes(2);
    });
  });
});
