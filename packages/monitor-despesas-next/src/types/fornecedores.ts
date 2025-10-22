export interface FornecedorBasico {
  id: string;
  cnpj: string;
  nome: string;
}

export interface FornecedorDadosOriginais {
  id: string;
  cnpjOriginal: string;
  nomeOriginal: string;
}

export interface FornecedorCnpjAlertPayload extends FornecedorDadosOriginais {}
