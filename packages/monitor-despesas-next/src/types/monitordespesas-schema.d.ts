declare module '@a-republica/monitordespesas-schema' {
  export interface DeputadoMonitorDados {
    id: string
    nomeEleitoral?: string
    siglaPartido?: string
    siglaUf?: string
    situacao?: string
    email?: string
    telefone?: string
    foto?: string
  }

  export interface DespesasAnuaisDeputado {
    ano: number
    topFornecedores?: Array<{
      cnpj: string
      nome: string
      valor: number
      transacoes: number
      percentual?: number
    }>
  }

  export interface FornecedorMonitorDados {
    cnpj: string
    nome: string
    categorias?: string[]
    totalTransacionado?: number
    totalRecebidoTodos?: number
    totalTransacoes?: number
    numeroTransacoes?: number
    numeroDeputadosAtendidos?: number
  }

  export interface TransacoesAnuaisFornecedor {
    ano: number
    totalRecebidoTodos?: number
    totalTransacoes?: number
    numeroTransacoes?: number
  }
}