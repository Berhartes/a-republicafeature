export interface DeputadoNomeLike {
  nomeEleitoral?: string | null;
  nome?: string | null;
}

export function getDeputadoDisplayName(input: DeputadoNomeLike, fallback = 'Deputado'): string {
  const nomeEleitoral = typeof input?.nomeEleitoral === 'string' ? input.nomeEleitoral.trim() : '';
  const nome = typeof input?.nome === 'string' ? input.nome.trim() : '';

  if (nomeEleitoral) {
    return nomeEleitoral;
  }

  if (nome) {
    return nome;
  }

  return fallback;
}
