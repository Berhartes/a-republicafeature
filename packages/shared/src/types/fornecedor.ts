export type FornecedorOrder = 'volume' | 'transacoes' | 'nome' | 'score' | 'ranking';

export interface FornecedoresQueryParams {
  page?: number;
  perPage?: number;
  categoria?: string;
  search?: string;
  q?: string;
  scoreMin?: number;
  scoreMax?: number;
  order?: FornecedorOrder;
}

export interface FornecedorCategoria {
  categoria: string;
  total: number;
  percentual?: number;
}

export interface FornecedorAnoResumo {
  ano: number;
  total: number;
  numeroTransacoes?: number;
  numeroDeputados?: number;
}

export interface FornecedorResumo {
  id: number | string;
  nome: string;
  cnpjCpf: string | null;
  tipoFornecedor: string | null;
  tipoDespesaPrincipal: string | null;
  totalRecebido: number;
  numeroTransacoes: number;
  numeroDeputados: number;
  scoreSuspeicao: number | null;
  ranking: number | null;
  categorias: FornecedorCategoria[];
  anos: FornecedorAnoResumo[];
  createdAt?: string | null;
}

export interface TopFornecedorResumo {
  id: number | string;
  nome: string;
  cnpjCpf: string | null;
  totalRecebido: number;
  numeroTransacoes: number;
  numeroDeputados: number;
  scoreSuspeicao: number | null;
  ranking: number | null;
}

export interface FornecedoresAggregates {
  totalVolume: number;
  totalTransacoes: number;
  mediaIndice: number | null;
  fornecedoresComDeputados: number;
}

export interface FornecedoresMetadata {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    pageCount: number;
  };
  totals: FornecedoresAggregates;
  categories: FornecedorCategoria[];
  topFornecedores: TopFornecedorResumo[];
  filters: FornecedoresQueryParams;
  processedAt: string;
}

export interface FornecedoresResponse {
  data: FornecedorResumo[];
  metadata: FornecedoresMetadata;
}

export interface FornecedoresStatsData {
  totalFornecedores: number;
  valorTotalRecebido: number;
  totalTransacoes: number;
  scoreMedio: number | null;
  anosUnicos: number[];
  topCategorias: FornecedorCategoria[];
}

export interface FornecedoresStatsResponse {
  data: FornecedoresStatsData;
  metadata: {
    generatedAt: string;
    source: 'sqlite';
    filters: FornecedoresQueryParams;
  };
}
