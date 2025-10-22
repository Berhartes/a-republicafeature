export interface MedalhaFornecedor {
  emoji: string;
  titulo: string;
  descricao: string;
  cor: string;
}

export interface FornecedorBadges {
  cnpj?: string;
  nome: string;
  totalGasto?: number;
  totalTransacionado?: number;
  numeroTransacoes?: number;
  transacoes?: number;
  deputadosAtendidos: any[] | string[] | number;
  categorias?: string[];
  scoreSuspeicao?: number;
  medalhas?: MedalhaFornecedor[];
}

export const obterMedalhasFornecedor = (
  fornecedor: FornecedorBadges
): MedalhaFornecedor[] => {
  return fornecedor.medalhas || [];
};