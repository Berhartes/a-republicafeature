
import {
  EtlDeputadoArquivo,
  DeputadoProcessado,
  RankingDeputados,
  PremiacoesProcessadas,
  EtlCacheConfig,
  EtlCacheStatus,
  EtlSearchResult
} from '@/types/etl-deputados.types'
import { fetchManifest, fetchRankingsCache, fetchDeputiesCache, fetchPremiacoesCache, fetchTransacoesCache, fetchCategoriasCache, fetchSenadoCache } from '@/data-access/monitordespesas'

export class EtlCacheService {  private cache: Map<string, any> = new Map()
  private lastUpdate: Date | null = null


  async fetchPremiacoesCache(): Promise<PremiacoesProcessadas | null> {
    const cacheKey = 'premiacoes_cache';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached.data;
    }

    try {
      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest não encontrado');
      }

      const response = await fetchPremiacoesCache(manifest);
      if (response && response.data) {
        this.cache.set(cacheKey, { data: response.data, timestamp: new Date() });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao buscar premiações do cache ETL:', error);
      return null;
    }
  }

  async fetchTransacoesCache(): Promise<any | null> {
    const cacheKey = 'transacoes_cache';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached.data;
    }

    try {
      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest não encontrado');
      }

      const response = await fetchTransacoesCache(manifest);
      if (response && response.data) {
        this.cache.set(cacheKey, { data: response.data, timestamp: new Date() });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao buscar transações do cache ETL:', error);
      return null;
    }
  }

  async fetchCategoriasCache(): Promise<any | null> {
    const cacheKey = 'categorias_cache';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached.data;
    }

    try {
      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest não encontrado');
      }

      const response = await fetchCategoriasCache(manifest);
      if (response && response.data) {
        this.cache.set(cacheKey, { data: response.data, timestamp: new Date() });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao buscar categorias do cache ETL:', error);
      return null;
    }
  }

  async fetchSenadoCache(): Promise<any | null> {
    const cacheKey = 'senado_cache';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return cached.data;
    }

    try {
      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest não encontrado');
      }

      const response = await fetchSenadoCache(manifest);
      if (response && response.data) {
        this.cache.set(cacheKey, { data: response.data, timestamp: new Date() });
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao buscar senadores do cache ETL:', error);
      return null;
    }
  }

  getStatus(): EtlCacheStatus {
    const totalDeputados = this.cache.has('todos_deputados')
      ? this.cache.get('todos_deputados').data.length
      : 0

    return {
      connected: true,
      lastUpdate: this.lastUpdate,
      totalDeputados,
      anosDisponiveis: [2023, 2024, 2025],
      source: 'etl',
      dataAge: this.lastUpdate
        ? `${Math.floor((Date.now() - this.lastUpdate.getTime()) / (1000 * 60))} min atrás`
        : 'Nunca'
    }
  }

  async buscarTodosDeputados(): Promise<EtlSearchResult> {
    const cacheKey = 'todos_deputados';
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return {
        deputados: cached.data,
        source: 'cache',
        timestamp: cached.timestamp
      };
    }

    try {
      const manifest = await fetchManifest();
      if (!manifest) {
        throw new Error('Manifest não encontrado');
      }

      const response = await fetchDeputiesCache(manifest);
      if (response && response.data && response.data.deputados) {
        const deputadosRaw = response.data.deputados;

        console.log(`🔍 [ETL-Cache] Estrutura do cache encontrada:`, {
          totalDeputados: deputadosRaw.length,
          primeiroDeputado: deputadosRaw[0]?.nomeEleitoral
        });

        // Mapear dados do cache para o formato esperado pelo frontend
        const deputados = deputadosRaw.map((dep: any) => ({
          id: dep.id.toString(),
          nomeEleitoral: dep.nomeEleitoral || 'Nome não disponível',
          nomeCivil: dep.nomeCivil || dep.nomeEleitoral || '',
          siglaPartido: dep.siglaPartido || 'SEM PARTIDO',
          siglaUf: dep.siglaUf || 'BR',
          foto: dep.urlFoto || '',

          totalGastos: dep.totalGasto || 0,
          totalTransacoes: dep.transacoes || 0,
          mediaTransacao: dep.mediaTransacao || (dep.transacoes ? (dep.totalGasto / dep.transacoes) : 0),

          gastosPorAno: dep.gastosPorAno || {},
          transacoesPorAno: dep.transacoesPorAno || {},

          topCategorias: dep.distribuicaoTipos ? Object.entries(dep.distribuicaoTipos).map(([tipo, dados]: [string, any]) => ({
            categoria: tipo,
            valor: dados.valor || 0,
            percentual: dados.quantidade ? ((dados.valor / dep.totalGasto) * 100) : 0
          })).slice(0, 5) : [],

          topFornecedores: [], // Campo não disponível na estrutura atual

          scoreSuspeicao: dep.scoreSuspeicao || 0,
          classificacaoRisco: dep.scoreSuspeicao > 25 ? 'Crítico' :
                              dep.scoreSuspeicao > 15 ? 'Alto' :
                              dep.scoreSuspeicao > 5 ? 'Médio' : 'Baixo',
          alertas: dep.alertas?.map((alert: any) =>
            typeof alert === 'string' ? alert : alert.descricao || alert.tipo || ''
          ) || [],

          ultimaAtualizacao: new Date().toISOString(),
          anosDisponiveis: [2023, 2024, 2025], // Anos da legislatura 57
          dadosCompletos: true
        }));

        this.cache.set(cacheKey, { data: deputados, timestamp: new Date() });
        this.lastUpdate = new Date();

        console.log(`✅ [ETL-Cache] ${deputados.length} deputados carregados e mapeados do cache`);

        return {
          deputados,
          source: 'etl-cache',
          timestamp: new Date()
        };
      }

      throw new Error('Dados de deputados não encontrados no cache');
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao buscar deputados:', error);
      throw error;
    }
  }

  limparCache(): void {
    this.cache.clear()
    this.lastUpdate = null
    console.log('🗑️ [ETL-Cache] Cache limpo')
  }













}

export const etlCacheService = new EtlCacheService()