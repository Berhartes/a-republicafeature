export interface FornecedorStats {
  cnpj: string
  nome: string
  nomeEleitoral?: string
  nomeFornecedor?: string
  categoria?: string
  categoriaOriginal?: string
  categorias?: string[]
  categoriasOriginais?: string[]
  totalTransacionado?: number
  totalRecebido?: number
  totalRecebidoTodos?: number
  transacoes?: number
  totalTransacoes?: number
  numeroTransacoes?: number
  numeroDeputadosAtendidos?: number
  scoreSuspeicao?: number
  distribuicaoTipos?: Record<string, { valor: number; quantidade: number }>
  distribuicaoTiposOriginais?: Record<string, { valor: number; quantidade: number }>
  deputadosAtendidos?: Array<string | {
    id?: string
    nome?: string
    partido?: string
    siglaPartido?: string
    siglaUf?: string
    uf?: string
    nomeEleitoral?: string
    nomeCivil?: string
    urlFoto?: string
  }>
  [key: string]: unknown
}

export class FornecedoresService {
  private fornecedores: FornecedorStats[] = []

  setFornecedores(fornecedores: FornecedorStats[]): void {
    this.fornecedores = fornecedores
  }

  getFornecedores(): FornecedorStats[] {
    return this.fornecedores
  }

  getFornecedorByCnpj(cnpj: string): FornecedorStats | undefined {
    return this.fornecedores.find(f => f.cnpj === cnpj)
  }

  getFornecedoresByCategoria(categoria: string): FornecedorStats[] {
    return this.fornecedores.filter(f => 
      f.categoria === categoria || f.categorias?.includes(categoria)
    )
  }

  calcularEstatisticas() {
    const total = this.fornecedores.length
    const totalTransacionado = this.fornecedores.reduce(
      (acc, f) => acc + (f.totalRecebido || f.totalTransacionado || 0),
      0
    )
    const comAlertas = this.fornecedores.filter(f => (f.scoreSuspeicao || 0) > 70).length

    return {
      total,
      totalTransacionado,
      comAlertas,
      percentualComAlertas: total > 0 ? (comAlertas / total) * 100 : 0
    }
  }
}

export const fornecedoresService = new FornecedoresService()
