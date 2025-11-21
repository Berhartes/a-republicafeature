/**
 * Interfaces compartilhadas para o sistema de fornecedores
 * Padroniza contratos de dados entre páginas e serviços
 */

// Estrutura básica de um fornecedor simplificado
export interface FornecedorSimples {
  cnpj: string
  nome: string
  totalTransacionado: number
  transacoes: number
  scoreSuspeicao: number
  categoria: string
  deputadosAtendidos: number
  evolucaoAnual?: Record<string, { valor: number; transacoes: number; deputados: number }>
}

// Estatísticas agregadas dos fornecedores
export interface EstatisticasSimples {
  totalFornecedores: number
  totalVolume: number
  mediaScore: number
  fornecedoresSuspeitos: number
}

// Dados para gráficos de fornecedores
export interface FornecedorRanking {
  nome: string
  cnpj: string
  valor: number
  numeroTransacoes: number
  categoriaPrincipal: string
  categorias: string[]
  deputadosAtendidos: number
}

// Dados para gráfico de distribuição por categoria
export interface CategoryData {
  categoria: string
  valor: number
  count: number
  percentual: string
}

// Estrutura completa de dados para gráficos
export interface DadosGraficos {
  top5Fornecedores: FornecedorRanking[]
  categoriaData: CategoryData[]
}

// Filtros para gráficos
export interface FiltrosGraficos {
  anoSelecionado: number | 'todos'
  categoriaSelecionada: string
}

// Parâmetros de filtro para fornecedores
export interface FiltrosFornecedores {
  busca?: string
  categoria?: string
  scoreRange?: 'alto' | 'medio' | 'baixo' | ''
  ano?: number | 'todos'
}

// Parâmetros de paginação
export interface ParametrosPaginacao {
  paginaAtual: number
  itensPorPagina: number
}

// Interface do serviço de dados de fornecedores
export interface IFornecedoresDataService {
  /**
   * Carrega todos os fornecedores do cache ETL
   */
  carregarTodosFornecedores(): Promise<FornecedorSimples[]>

  /**
   * Carrega fornecedores filtrados por categoria específica
   */
  carregarFornecedoresPorCategoria(categoria: string): Promise<FornecedorSimples[]>

  /**
   * Calcula estatísticas agregadas dos fornecedores
   */
  calcularEstatisticas(fornecedores: FornecedorSimples[]): EstatisticasSimples

  /**
   * Processa dados para gráficos com filtros aplicados
   */
  processarDadosParaGraficos(
    fornecedores: FornecedorSimples[], 
    filtros?: FiltrosGraficos
  ): DadosGraficos

  /**
   * Aplica filtros aos fornecedores
   */
  aplicarFiltros(
    fornecedores: FornecedorSimples[], 
    filtros: FiltrosFornecedores
  ): FornecedorSimples[]

  /**
   * Obtém anos disponíveis nos dados
   */
  obterAnosDisponiveis(fornecedores: FornecedorSimples[]): number[]
}

// Interface do serviço de filtro de categoria
export interface ICategoryFilterService {
  /**
   * Valida se uma categoria existe nos dados
   */
  validarCategoria(categoria: string, fornecedores: FornecedorSimples[]): boolean

  /**
   * Normaliza nome de categoria (slug para nome completo)
   */
  normalizarCategoria(categoria: string): string

  /**
   * Aplica filtro de categoria aos fornecedores
   */
  aplicarFiltroCategoria(
    fornecedores: FornecedorSimples[], 
    categoria: string
  ): FornecedorSimples[]

  /**
   * Obtém lista de categorias disponíveis
   */
  obterCategoriasDisponiveis(fornecedores: FornecedorSimples[]): string[]

  /**
   * Converte slug de categoria para nome de exibição
   */
  slugParaNome(slug: string): string

  /**
   * Converte nome de categoria para slug
   */
  nomeParaSlug(nome: string): string

  /**
   * Verifica se uma categoria é válida para navegação
   */
  ehCategoriaValida(categoria: string): boolean
}

// Resultado de carregamento de dados
export interface ResultadoCarregamento<T> {
  dados: T
  metadata?: {
    source: string
    filename?: string
    fetchedAt?: string
    hash?: string
  }
  sucesso: boolean
  erro?: string
}

// Configurações do cache
export interface ConfiguracaoCache {
  ttl: number // Time to live em milissegundos
  maxSize: number // Tamanho máximo do cache
}