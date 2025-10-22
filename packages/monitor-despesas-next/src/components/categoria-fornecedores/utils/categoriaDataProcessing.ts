export interface CategoriaEstatisticas {
  totalFornecedores: number
  totalTransacionado: number
  totalTransacoes: number
  mediaTransacaoPorFornecedor: number
  fornecedoresComAlertas: number
}

export class CategoriaDataProcessing {
  static calcularEstatisticasCategoria(
    fornecedores: any[],
    categoria?: string
  ): CategoriaEstatisticas {
    const fornecedoresFiltrados = categoria
      ? fornecedores.filter(f => f.categoria === categoria || f.categorias?.includes(categoria))
      : fornecedores

    const totalTransacionado = fornecedoresFiltrados.reduce(
      (acc, f) => acc + (f.totalRecebido || f.totalTransacionado || 0),
      0
    )

    const totalTransacoes = fornecedoresFiltrados.reduce(
      (acc, f) => acc + (f.transacoes || f.totalTransacoes || f.numeroTransacoes || 0),
      0
    )

    const fornecedoresComAlertas = fornecedoresFiltrados.filter(
      f => (f.scoreSuspeicao || 0) > 70
    ).length

    return {
      totalFornecedores: fornecedoresFiltrados.length,
      totalTransacionado,
      totalTransacoes,
      mediaTransacaoPorFornecedor: fornecedoresFiltrados.length > 0
        ? totalTransacionado / fornecedoresFiltrados.length
        : 0,
      fornecedoresComAlertas
    }
  }

  static exportarDadosCategoria(
    fornecedores: any[],
    categoria?: string
  ): any[] {
    const fornecedoresFiltrados = categoria
      ? fornecedores.filter(f => f.categoria === categoria || f.categorias?.includes(categoria))
      : fornecedores

    return fornecedoresFiltrados.map(f => ({
      cnpj: f.cnpj,
      nome: f.nome || f.nomeFornecedor,
      categoria: f.categoria,
      totalRecebido: f.totalRecebido || f.totalTransacionado || 0,
      transacoes: f.transacoes || f.totalTransacoes || f.numeroTransacoes || 0,
      deputadosAtendidos: f.numeroDeputadosAtendidos || 0,
      scoreSuspeicao: f.scoreSuspeicao || 0
    }))
  }
}
