
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
      if (response && response.data) {
        // O cache pode ter a estrutura { data: [...] } ou { metadata: {...}, data: [...] }
        const deputadosRaw = response.data.data || response.data;

        console.log(`🔍 [ETL-Cache] Estrutura do cache encontrada:`, {
          totalDeputados: deputadosRaw.length,
          primeiroDeputado: deputadosRaw[0]?.nome,
          estrutura: Object.keys(deputadosRaw[0] || {})
        });

        // Mapear dados do cache para o formato esperado pelo frontend
        const deputados = deputadosRaw.map((dep: any) => ({
          id: dep.id?.toString() || '',
          nomeEleitoral: dep.nome || 'Nome não disponível',
          nomeCivil: dep.nome || '',
          siglaPartido: dep.partido || 'SEM PARTIDO',
          siglaUf: dep.uf || 'BR',
          foto: dep.urlFoto || '',

          totalGastos: dep.totalDespesas || 0,
          totalTransacoes: dep.numeroDespesas || 0,
          mediaTransacao: dep.numeroDespesas ? ((dep.totalDespesas || 0) / dep.numeroDespesas) : 0,

          gastosPorAno: dep.gastosPorAno || {},
          transacoesPorAno: dep.transacoesPorAno || {},

          topCategorias: [],

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

  async gerarRankings(): Promise<any> {
    try {
      console.log('🔄 [ETL-Cache] Buscando rankings do cache...')
      
      const manifest = await fetchManifest()
      if (!manifest) {
        throw new Error('Manifest não encontrado')
      }

      const response = await fetchRankingsCache(manifest)
      if (response && response.data) {
        console.log('✅ [ETL-Cache] Rankings carregados do cache')
        return response.data
      }

      // Se não houver rankings-cache, gerar a partir dos deputados
      console.log('⚠️ [ETL-Cache] rankings-cache não encontrado, gerando a partir dos deputados...')
      const deputadosResult = await this.buscarTodosDeputados()
      const deputados = deputadosResult.deputados

      // Ranking geral (ordenado por total de gastos)
      const rankingGeral = [...deputados].sort((a, b) => (b.totalGastos || 0) - (a.totalGastos || 0))

      // Rankings por ano
      const rankingsPorAno: Record<number, any[]> = {}
      const anos = [2023, 2024, 2025]
      anos.forEach(ano => {
        rankingsPorAno[ano] = [...deputados]
          .map(dep => ({
            ...dep,
            totalGastos: dep.gastosPorAno?.[ano] || 0,
            totalTransacoes: dep.transacoesPorAno?.[ano] || 0
          }))
          .filter(dep => dep.totalGastos > 0)
          .sort((a, b) => b.totalGastos - a.totalGastos)
      })

      // Rankings por categoria (simplificado)
      const rankingsPorCategoria: Record<string, any[]> = {}
      
      return {
        geral: rankingGeral,
        porAno: rankingsPorAno,
        porCategoria: rankingsPorCategoria
      }
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao gerar rankings:', error)
      throw error
    }
  }

  async gerarPremiacoes(): Promise<any> {
    try {
      console.log('🔄 [ETL-Cache] Buscando premiações do cache...')
      
      const premiacoesData = await this.fetchPremiacoesCache()
      if (premiacoesData) {
        console.log('✅ [ETL-Cache] Premiações carregadas do cache')
        
        // Organizar premiações por tipo
        const coroas: any[] = []
        const trofeus: any[] = []
        const medalhas: any[] = []
        let campeaoGeral: any = null

        premiacoesData.forEach((premiacao: any) => {
          const item = {
            tipo: premiacao.tipo,
            deputado: premiacao.entidadeNome,
            deputadoId: premiacao.entidadeId,
            valor: premiacao.valor,
            unidade: premiacao.unidade,
            descricao: premiacao.descricao,
            dataReferencia: premiacao.dataReferencia
          }

          if (premiacao.tipo === 'MAIOR_GASTO') {
            coroas.push(item)
            if (!campeaoGeral) {
              campeaoGeral = {
                nomeEleitoral: premiacao.entidadeNome,
                siglaPartido: 'N/A',
                siglaUf: 'N/A',
                valorTotal: premiacao.valor
              }
            }
          } else if (premiacao.tipo === 'MENOR_GASTO') {
            medalhas.push(item)
          } else {
            trofeus.push(item)
          }
        })

        return {
          coroas,
          trofeus,
          medalhas,
          campeaoGeral
        }
      }

      console.log('⚠️ [ETL-Cache] Nenhuma premiação encontrada no cache')
      return {
        coroas: [],
        trofeus: [],
        medalhas: [],
        campeaoGeral: null
      }
    } catch (error) {
      console.error('❌ [ETL-Cache] Erro ao gerar premiações:', error)
      throw error
    }
  }

  limparCache(): void {
    this.cache.clear()
    this.lastUpdate = null
    console.log('🗑️ [ETL-Cache] Cache limpo')
  }
}

export const etlCacheService = new EtlCacheService()