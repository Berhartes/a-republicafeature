
export interface DeputadoData {
  id: string;
  nome: string;
  nomeCivil?: string;
  siglaPartido?: string;
  siglaUf?: string;
  urlFoto?: string;
  cpf?: string;
  nomeEleitoral?: string;
  email?: string;
  redeSocial?: string[];
  telefone?: string;
  dataFalecimento?: string;
}

export interface IndicadorAnomalia {
  tipo: string;
  descricao: string;
  severidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  confianca: number;
}

export interface DespesaDetalhadaUI {
  id?: string | number;
  valorLiquido?: number | string;
  tipoDespesa?: string;
  categoria?: string;
  nomeFornecedor?: string;
  dataDocumento?: { seconds?: number } | null;
  data?: { seconds?: number } | null;
  [key: string]: unknown;
}

export type DespesaDetalhada = DespesaDetalhadaUI;

export interface PerfilComportamentalDeputadoUI {
  scoreComportamental: number;
  confiabilidadeAnalise: number;
  classificacaoRisco: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  padraoGastos: {
    categoriaPreferida: string;
    valorMedio: number;
    frequenciaTransacoes: number;
    fornecedorPrincipal: string;
    concentracaoCategoria: number;
    concentracaoFornecedor: number;
    sazonalidade: boolean;
  };
  comportamentoTemporal: {
    tendencia: 'CRESCENTE' | 'DECRESCENTE' | 'ESTAVEL' | 'VOLATIL';
    variabilidade: number;
    picosAnomalia: number;
    sazonalidade?: boolean;
    picos?: Array<{ mes: number; valor: number }>;
  };
  riscos: {
    nivel: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO';
    fatores: string[];
    score: number;
    descricao: string;
  };
  indicadoresAnomalia: IndicadorAnomalia[];
}

export type PerfilComportamentalDeputado = PerfilComportamentalDeputadoUI;

export interface FornecedorRanking {
  nome: string;
  valor: number;
  cnpj?: string;
  numeroTransacoes: number;
  categorias: string[];
  categoriaPrincipal: string;
}

export interface ComparativoPartido {
  deputado: string;
  totalGasto: number;
  categoria: string;
  valor: number;
}

export interface TabState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface TimeFilters {
  anoSelecionado: number | 'todos';
  mesSelecionado: string;
  setAnoSelecionado: (ano: number | 'todos') => void;
  setMesSelecionado: (mes: string) => void;
  anosDisponiveis: number[];
  mesesDisponiveis: Array<{ valor: string; nome: string }>;
}

export interface CategoryFilters {
  categoriaTop5Selecionada: string;
  setCategoriaTop5Selecionada: (categoria: string) => void;
  filtroFornecedorCategoria: string;
  setFiltroFornecedorCategoria: (categoria: string) => void;
  categoriaEvolucao: string;
  setCategoriaEvolucao: (categoria: string) => void;
  categoriaTransacaoSelecionada: string;
  setCategoriaTransacaoSelecionada: (categoria: string) => void;
  categoriasDisponiveis: string[];
}

export interface LoadingStates {
  loadingDespesas: boolean;
  loadingComparativo: boolean;
  loadingRelacoes: boolean;
  loadingFornecedores: boolean;
  loadingRanking: boolean;
}

export interface RankingData {
  posicao: number;
  totalDeputados: number;
}

export interface AlertaConformidade {
  id: string;
  tipo: string;
  descricao: string;
  severidade: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categoria?: string;
  valor?: number;
}

export interface NetworkData {
  nodes: Array<{
    id: string;
    label: string;
    tipo: 'DEPUTADO' | 'FORNECEDOR';
    valor?: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    value: number;
    label?: string;
  }>;
}

export interface ChartOptions {
  mostrarGraficoPizza: boolean;
  setMostrarGraficoPizza: (show: boolean) => void;
  mostrarGraficoPizzaFornecedores: boolean;
  setMostrarGraficoPizzaFornecedores: (show: boolean) => void;
}
