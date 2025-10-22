import React, { createContext, useContext, useReducer, useEffect, useMemo, useRef, useCallback, type ReactNode } from 'react';
import { fetchManifest, fetchDeputiesCache } from '@/data-access/monitordespesas';
import { GastoDeputado, AlertaSuspeito, FornecedorSuspeito } from '@/types/gastos';

import { generateMockDeputados } from '@/lib/mocks/global-mocks';

interface CoroaDeputado {
  deputadoId: string
  deputadoNome: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  valor: number
  dataConquista: string
}

interface TrofeuDeputado {
  deputadoId: string
  deputadoNome: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  valor: number
  ano: number
  dataConquista: string
}

interface MedalhaDeputado {
  deputadoId: string
  deputadoNome: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  valor: number
  posicao: 2 | 3 // Apenas 2º e 3º lugar
  ano?: number // Para medalhas anuais
  dataConquista: string
}

interface PremiacoesGlobais {
  coroas: CoroaDeputado[]
  campeaoGeral: CoroaDeputado | null
  campeoesCategorias: CoroaDeputado[]
  trofeus: TrofeuDeputado[]
  campeoesPorAno: { [ano: string]: TrofeuDeputado[] }
  medalhas: MedalhaDeputado[]
  medalhasHistoricas: MedalhaDeputado[] // 2º e 3º de todos os tempos
  medalhasPorAno: { [ano: string]: MedalhaDeputado[] }
}

interface GlobalDataState {
  deputados: GastoDeputado[];
  loading: boolean;
  error: string | null;
  filteredDeputados: GastoDeputado[];
  searchTerm: string;
  selectedYear: string;
  alertas: AlertaSuspeito[];
  fornecedoresSuspeitos: FornecedorSuspeito[];
  analiseCompleta: any;
  premiacoesGlobais: PremiacoesGlobais | null;
}

type GlobalDataAction =
  | { type: 'SET_DEPUTADOS'; payload: GastoDeputado[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SELECTED_YEAR'; payload: string }
  | { type: 'SET_FILTERED_DEPUTADOS'; payload: GastoDeputado[] }
  | { type: 'SET_ALERTAS'; payload: AlertaSuspeito[] }
  | { type: 'SET_FORNECEDORES_SUSPEITOS'; payload: FornecedorSuspeito[] }
  | { type: 'SET_ANALISE_COMPLETA'; payload: any }
  | { type: 'SET_PREMIACOES_GLOBAIS'; payload: PremiacoesGlobais };

const initialState: GlobalDataState = {
  deputados: [],
  loading: false,
  error: null,
  filteredDeputados: [],
  searchTerm: '',
  selectedYear: '2025',
  alertas: [],
  fornecedoresSuspeitos: [],
  analiseCompleta: null,
  premiacoesGlobais: null
};

function globalDataReducer(state: GlobalDataState, action: GlobalDataAction): GlobalDataState {
  switch (action.type) {
    case 'SET_DEPUTADOS':
      return { ...state, deputados: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_SELECTED_YEAR':
      return { ...state, selectedYear: action.payload };
    case 'SET_FILTERED_DEPUTADOS':
      return { ...state, filteredDeputados: action.payload };
    case 'SET_ALERTAS':
      return { ...state, alertas: action.payload };
    case 'SET_FORNECEDORES_SUSPEITOS':
      return { ...state, fornecedoresSuspeitos: action.payload };
    case 'SET_ANALISE_COMPLETA':
      return { ...state, analiseCompleta: action.payload };
    case 'SET_PREMIACOES_GLOBAIS':
      return { ...state, premiacoesGlobais: action.payload };
    default:
      return state;
  }
}

const GlobalDataContext = createContext<{
  state: GlobalDataState;
  dispatch: React.Dispatch<GlobalDataAction>;
  loadDeputados: () => Promise<void>;
} | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalDataReducer, initialState);


  const deputadosCarregamentoRef = useRef<Promise<void> | null>(null);

  const loadDeputados = useCallback(async () => {
    if (deputadosCarregamentoRef.current) {
      console.log('⏳ [GlobalDataContext] Reutilizando carregamento de deputados em andamento...')
      return deputadosCarregamentoRef.current
    }

    const executarCarregamento = async () => {
      console.log('🔄 [GlobalDataContext] Carregando deputados do cache ETL...')
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })

      try {
        let cacheData: any | null = null

        try {
          const manifest = await fetchManifest()
          if (manifest) {
            const cacheResponse = await fetchDeputiesCache(manifest)
            cacheData = cacheResponse?.data ?? null
          }
        } catch (manifestError) {
          console.warn('⚠️ [GlobalDataContext] Falha ao carregar manifest de cache:', manifestError)
        }

        if (!cacheData) {
          console.log('📂 [GlobalDataContext] Tentando fallback direto para /cache/deputies-cache.json')
          try {
            const response = await fetch(`/cache/deputies-cache.json?t=${Date.now()}`)
            if (response.ok) {
              const raw = await response.json()
              cacheData = raw?.data ?? raw ?? null
            } else {
              console.warn('⚠️ [GlobalDataContext] Fallback direto falhou com status', response.status)
            }
          } catch (fallbackError) {
            console.error('❌ [GlobalDataContext] Erro no fallback direto do cache:', fallbackError)
          }
        }

        if (cacheData && Array.isArray(cacheData.deputados) && cacheData.deputados.length > 0) {
          const deputados: GastoDeputado[] = cacheData.deputados.map((dep: any): GastoDeputado => ({
            id: dep.id || dep.codigo || '',
            nomeEleitoral: dep.nomeEleitoral || dep.nome || '',
            nomeCivil: dep.nomeCivil,
            siglaPartido: dep.siglaPartido || 'SEM PARTIDO',
            siglaUf: dep.siglaUf || 'N/A',
            totalGasto: dep.totalGasto ?? dep.valorTotal ?? 0,
            gastos: Array.isArray(dep.gastos) ? dep.gastos : [],
            urlFoto: dep.urlFoto || dep.foto || dep.imagem || undefined,
            situacao: dep.situacao,
            condicaoEleitoral: dep.condicaoEleitoral,
            scoreSuspeicao: dep.scoreSuspeicao ?? dep.score ?? 0,
            alertas: Array.isArray(dep.alertas) ? dep.alertas : [],
            numTransacoes: dep.transacoes ?? dep.numeroTransacoes ?? dep.totalTransacoes ?? 0,
            ranking: dep.ranking,
            rankingAnual: dep.rankingAnual,
          }))

          const totalGasto = deputados.reduce((sum, dep) => sum + (dep.totalGasto || 0), 0)
          const deputadosAnalise = deputados.map(dep => ({
            id: dep.id,
            nomeEleitoral: dep.nomeEleitoral || dep.nome,
            siglaPartido: dep.siglaPartido,
            siglaUf: dep.siglaUf,
            totalGasto: dep.totalGasto,
            numTransacoes: dep.numTransacoes ?? 0,
            scoreSuspeicao: dep.scoreSuspeicao ?? 0,
            alertas: dep.alertas ?? [],
            gastos: dep.gastos ?? [],
            foto: dep.urlFoto,
          }))

          const analiseCompleta = {
            deputadosAnalise,
            alertas: gerarAlertasExemplo(),
            fornecedoresSuspeitos: cacheData.fornecedoresSuspeitos ?? [],
            estatisticas: {
              totalGasto,
              numDeputados: deputados.length,
              gastosOriginais: cacheData.gastosOriginais ?? [],
            },
            metadata: cacheData.metadata,
          }

          dispatch({ type: 'SET_DEPUTADOS', payload: deputados })
          dispatch({ type: 'SET_ANALISE_COMPLETA', payload: analiseCompleta })
          dispatch({ type: 'SET_ALERTAS', payload: analiseCompleta.alertas })
          dispatch({ type: 'SET_FORNECEDORES_SUSPEITOS', payload: analiseCompleta.fornecedoresSuspeitos })

          try {
            localStorage.setItem('ultima-analise', JSON.stringify({
              deputadosAnalise,
              analise: analiseCompleta,
            }))
          } catch (storageError) {
            console.warn('⚠️ [GlobalDataContext] Não foi possível salvar ultima-analise no localStorage:', storageError)
          }

          console.log(`✅ [GlobalDataContext] ${deputados.length} deputados carregados do cache ETL`)
          return
        }

        const ultimaAnalise = typeof window !== 'undefined' ? localStorage.getItem('ultima-analise') : null
        if (ultimaAnalise) {
          try {
            const dadosAnalise = JSON.parse(ultimaAnalise)
            if (dadosAnalise?.deputadosAnalise && Array.isArray(dadosAnalise.deputadosAnalise)) {
              const deputados = dadosAnalise.deputadosAnalise.map((dep: any): GastoDeputado => ({
                id: dep.id || '',
                nomeEleitoral: dep.nomeEleitoral || dep.nome || '',
                siglaPartido: dep.siglaPartido || 'SEM PARTIDO',
                estado: dep.uf || dep.siglaUf || 'N/A',
                uf: dep.uf || dep.siglaUf || 'N/A',
                totalGasto: dep.totalGasto || 0,
                gastos: dep.gastos || [],
                urlFoto: dep.foto || dep.urlFoto,
                scoreSuspeicao: dep.scoreSuspeicao || 0,
                alertas: dep.alertas || [],
                numTransacoes: dep.numTransacoes || dep.numeroTransacoes || 0,
              }))

              dispatch({ type: 'SET_DEPUTADOS', payload: deputados })
              dispatch({ type: 'SET_ANALISE_COMPLETA', payload: dadosAnalise.analise || null })
              dispatch({ type: 'SET_ALERTAS', payload: dadosAnalise.analise?.alertas || gerarAlertasExemplo() })
              dispatch({ type: 'SET_FORNECEDORES_SUSPEITOS', payload: dadosAnalise.analise?.fornecedoresSuspeitos || [] })

              console.log(`📦 [GlobalDataContext] ${deputados.length} deputados carregados do localStorage`)
              return
            }
          } catch (parseError) {
            console.warn('⚠️ [GlobalDataContext] Erro ao parsear ultima-analise do localStorage:', parseError)
          }
        }

        console.log('🎭 [GlobalDataContext] Usando dados mock como fallback...')
        const mockDeputados = generateMockDeputados() as GastoDeputado[]
        dispatch({ type: 'SET_DEPUTADOS', payload: mockDeputados })
        dispatch({ type: 'SET_ALERTAS', payload: gerarAlertasExemplo() })
        dispatch({ type: 'SET_ANALISE_COMPLETA', payload: null })

      } catch (error) {
        console.error('❌ [GlobalDataContext] Erro ao carregar deputados:', error)
        dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Erro ao carregar deputados' })
        const mockDeputados = generateMockDeputados() as GastoDeputado[]
        dispatch({ type: 'SET_DEPUTADOS', payload: mockDeputados })
        dispatch({ type: 'SET_ALERTAS', payload: gerarAlertasExemplo() })
        dispatch({ type: 'SET_ANALISE_COMPLETA', payload: null })

      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    deputadosCarregamentoRef.current = executarCarregamento()
    try {
      await deputadosCarregamentoRef.current
    } finally {
      deputadosCarregamentoRef.current = null
    }
  }, [dispatch])


  useEffect(() => {
    let filtered = state.deputados;
    
    if (state.searchTerm) {
      filtered = filtered.filter(deputado => 
        deputado.nome?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        deputado.partido?.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        deputado.estado?.toLowerCase().includes(state.searchTerm.toLowerCase())
      );
    }
    
    dispatch({ type: 'SET_FILTERED_DEPUTADOS', payload: filtered });
  }, [state.deputados, state.searchTerm]);

  return (
    <GlobalDataContext.Provider value={{ state, dispatch, loadDeputados }}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }

  const { state, dispatch, loadDeputados } = context;

  const setPremiacoesGlobais = useCallback((premiações: PremiacoesGlobais) => {
    dispatch({ type: 'SET_PREMIACOES_GLOBAIS', payload: premiações });
  }, [dispatch]);

  const getDeputadoCoroas = useCallback((deputadoId: string): CoroaDeputado[] => {
    return state.premiacoesGlobais?.coroas?.filter(coroa => coroa.deputadoId === deputadoId) || [];
  }, [state.premiacoesGlobais?.coroas]);

  const temCoroa = useCallback((deputadoId: string): boolean => {
    return (state.premiacoesGlobais?.coroas?.some(coroa => coroa.deputadoId === deputadoId)) || false;
  }, [state.premiacoesGlobais?.coroas]);

  const temCoroaGeral = useCallback((deputadoId: string): boolean => {
    return state.premiacoesGlobais?.campeaoGeral?.deputadoId === deputadoId;
  }, [state.premiacoesGlobais?.campeaoGeral]);

  const getCoroasCategoria = useCallback((deputadoId: string): CoroaDeputado[] => {
    return state.premiacoesGlobais?.campeoesCategorias?.filter(coroa => coroa.deputadoId === deputadoId) || [];
  }, [state.premiacoesGlobais?.campeoesCategorias]);

  const getDeputadoTrofeus = useCallback((deputadoId: string): TrofeuDeputado[] => {
    const trofeus = state.premiacoesGlobais?.trofeus?.filter(trofeu => trofeu.deputadoId === deputadoId) || [];
    if (trofeus.length > 0) {
      console.log(`🏆 [UnifiedMicroContextProvider] Troféus encontrados para deputado ${deputadoId}:`, trofeus.map(t => `${t.tipo} ${t.ano} ${t.categoria || 'geral'}`));
    }
    return trofeus;
  }, [state.premiacoesGlobais?.trofeus]);

  const temTrofeu = useCallback((deputadoId: string): boolean => {
    return (state.premiacoesGlobais?.trofeus?.some(trofeu => trofeu.deputadoId === deputadoId)) || false;
  }, [state.premiacoesGlobais?.trofeus]);

  const getTrofeusPorAno = useCallback((ano: number): TrofeuDeputado[] => {
    return state.premiacoesGlobais?.trofeus?.filter(trofeu => trofeu.ano === ano) || [];
  }, [state.premiacoesGlobais?.trofeus]);

  const getDeputadoMedalhas = useCallback((deputadoId: string): MedalhaDeputado[] => {
    return state.premiacoesGlobais?.medalhas?.filter(medalha => medalha.deputadoId === deputadoId) || [];
  }, [state.premiacoesGlobais?.medalhas]);

  const temMedalha = useCallback((deputadoId: string): boolean => {
    return (state.premiacoesGlobais?.medalhas?.some(medalha => medalha.deputadoId === deputadoId)) || false;
  }, [state.premiacoesGlobais?.medalhas]);

  const getMedalhasPorAno = useCallback((ano: number): MedalhaDeputado[] => {
    return state.premiacoesGlobais?.medalhasPorAno?.[ano.toString()] || [];
  }, [state.premiacoesGlobais?.medalhasPorAno]);

  const getMedalhasHistoricas = useCallback((): MedalhaDeputado[] => {
    return state.premiacoesGlobais?.medalhasHistoricas || [];
  }, [state.premiacoesGlobais?.medalhasHistoricas]);

  const refetch = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('🔄 Reloading data...');
      
      const dadosSalvos = localStorage.getItem('ultima-analise');
      if (dadosSalvos) {
        try {
          const dadosParseados = JSON.parse(dadosSalvos);
          if (dadosParseados.analise) {
            dispatch({ type: 'SET_ANALISE_COMPLETA', payload: dadosParseados.analise });
            
            if (dadosParseados.analise.alertas) {
              dispatch({ type: 'SET_ALERTAS', payload: dadosParseados.analise.alertas });
            }
            
            if (dadosParseados.analise.fornecedoresSuspeitos) {
              dispatch({ type: 'SET_FORNECEDORES_SUSPEITOS', payload: dadosParseados.analise.fornecedoresSuspeitos });
            }
          }
        } catch (e) {
          console.warn('⚠️ Error loading cached data:', e);
        }
      }
      
      console.log('🚨 Generating fallback alerts...');
      const alertasExemplo = gerarAlertasExemplo();
      dispatch({ type: 'SET_ALERTAS', payload: alertasExemplo });
      
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('❌ Error reloading data:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Error reloading data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const atualizarDados = useCallback(() => {
    dispatch({ type: 'SET_LOADING', payload: true });
    setTimeout(() => {
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000);
  }, [dispatch]);


  return {
    state,
    dispatch,
    data: state.deputados.length > 0 || state.analiseCompleta ? {
      deputados: state.deputados,
      analise: state.analiseCompleta || {
        deputadosAnalise: state.deputados.map(dep => ({
          id: dep.nome, 
          nome: dep.nome,
          partido: dep.partido,
          uf: dep.estado,
          totalGasto: dep.totalGasto,
          numTransacoes: dep.gastos?.length || 0,
          scoreSuspeicao: 0,
          alertas: []
        })),
        fornecedoresSuspeitos: state.fornecedoresSuspeitos,
        alertas: state.alertas,
        estatisticas: {
          totalGasto: state.deputados.reduce((sum, dep) => sum + dep.totalGasto, 0),
          numDeputados: state.deputados.length
        }
      }
    } : null,
    isLoading: state.loading,
    error: state.error,
    premiacoesGlobais: state.premiacoesGlobais,
    setPremiacoesGlobais,
    getDeputadoCoroas,
    temCoroa,
    temCoroaGeral,
    getCoroasCategoria,
    getDeputadoTrofeus,
    temTrofeu,
    getTrofeusPorAno,
    getDeputadoMedalhas,
    temMedalha,
    getMedalhasPorAno,
    getMedalhasHistoricas,
    refetch,
    isConnected: true,
    atualizarDados,
    loadDeputados,
  };
}
export function useDeputados() {
  const { state } = useGlobalData();
  return useMemo(() => ({
    deputados: state.deputados,
    loading: state.loading,
    error: state.error,
    filteredDeputados: state.filteredDeputados
  }), [state.deputados, state.loading, state.error, state.filteredDeputados]);
}

export function useDeputadoDetalhes(deputadoId?: string) {
  const { state } = useGlobalData();
  
  const deputado = useMemo(() => {
    if (!deputadoId) return null;
    
    let encontrado = state.deputados.find(d => 
      String(d.id) === String(deputadoId) ||
      String(d.id) === String(deputadoId)
    );
    
    if (!encontrado) {
      encontrado = state.deputados.find(d => 
        d.nome.toLowerCase().includes(deputadoId.toLowerCase()) ||
        deputadoId === 'geral'
      );
    }
    
    return encontrado;
  }, [deputadoId, state.deputados]);

  return {
    deputado,
    loading: state.loading,
    error: state.error
  };
}

export interface DeputadoData {
  id?: string;
  nomeEleitoral: string;
  nomeCivil?: string;
  siglaPartido: string;
  siglaUf: string;
  totalGasto: number;
  gastos: any[];
  alertas?: any[];
  scoreSuspeicao?: number;
  gastoMedio?: number;
  numTransacoes?: number;
}

function gerarAlertasExemplo(): AlertaSuspeito[] {
  return [
    {
      id: 'EXEMPLO-001',
      tipo: 'SUPERFATURAMENTO',
      gravidade: 'ALTA',
      deputado: 'João da Silva',
      deputadoId: '12345',
      descricao: 'Abastecimento suspeito de R$ 3.500,00 em um único dia (normal: R$ 300-500)',
      valor: 3500,
      detalhes: {
        fornecedor: 'Posto Central LTDA',
        data: '2025-01-15',
        cnpj: '12.345.678/0001-99',
        valorNormal: 400,
        percentualAcima: '775.0'
      },
      dataDeteccao: new Date()
    },
    {
      id: 'EXEMPLO-002',
      tipo: 'LIMITE_EXCEDIDO',
      gravidade: 'ALTA',
      deputado: 'Maria Santos',
      deputadoId: '54321',
      descricao: 'Gastos mensais de R$ 52.000,00 excedem o limite legal de R$ 45.000,00',
      valor: 52000,
      detalhes: {
        mes: 1,
        ano: 2025,
        limite: 45000,
        percentualExcedido: '15.6',
        numTransacoes: 23
      },
      dataDeteccao: new Date()
    },
    {
      id: 'EXEMPLO-003',
      tipo: 'FORNECEDOR_SUSPEITO',
      gravidade: 'MEDIA',
      deputado: 'MÚLTIPLOS',
      descricao: 'Fornecedor atende apenas 2 deputados mas recebeu R$ 250.000,00',
      valor: 250000,
      detalhes: {
        fornecedor: 'Consultoria ABC LTDA',
        cnpj: '98.765.432/0001-11',
        deputadosAtendidos: [
          { id: '12345', nome: 'João da Silva' },
          { id: '54321', nome: 'Maria Santos' }
        ],
        mediaTransacao: 12500
      },
      dataDeteccao: new Date()
    },
    {
      id: 'EXEMPLO-004',
      tipo: 'CONCENTRACAO_TEMPORAL',
      gravidade: 'MEDIA',
      deputado: 'Carlos Oliveira',
      deputadoId: '67890',
      descricao: 'Realizadas 8 transações no mesmo dia totalizando R$ 15.000,00',
      valor: 15000,
      detalhes: {
        data: '2025-01-20',
        numTransacoes: 8,
        fornecedores: ['Fornecedor A', 'Fornecedor B', 'Fornecedor C']
      },
      dataDeteccao: new Date()
    },
    {
      id: 'EXEMPLO-005',
      tipo: 'VALOR_REPETIDO',
      gravidade: 'BAIXA',
      deputado: 'MÚLTIPLOS',
      descricao: 'Valor de R$ 1.999,90 repetido 15 vezes por diferentes deputados',
      valor: 29998.50,
      detalhes: {
        ocorrencias: 15,
        deputados: 8,
        fornecedores: 3
      },
      dataDeteccao: new Date()
    }
  ];
}
