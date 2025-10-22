const partidos = ['PT', 'PL', 'MDB', 'PSD', 'PP', 'REPUBLICANOS', 'UNIÃO', 'PDT', 'PSDB', 'PSB']
const ufs = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'GO', 'PE', 'CE']
const nomes = [
  'General Pazuello', 'Dilvanda Faro', 'João Silva', 'Maria Santos', 'Pedro Oliveira',
  'Ana Costa', 'Carlos Rodrigues', 'Lucia Ferreira', 'Roberto Lima', 'Fernanda Alves',
  'Deputado Mock 11', 'Deputado Mock 12', 'Deputado Mock 13', 'Deputado Mock 14', 'Deputado Mock 15',
  'Deputado Mock 16', 'Deputado Mock 17', 'Deputado Mock 18', 'Deputado Mock 19', 'Deputado Mock 20',
]

export function generateMockDeputados(count = 20) {
  return nomes.slice(0, count).map((nome, index) => ({
    id: index + 1,
    nome,
    partido: partidos[index % partidos.length],
    estado: ufs[index % ufs.length],
    totalGasto: Math.random() * 500000 + 10000,
    gastos: [],
    urlFoto: undefined,
    email: `${nome.toLowerCase().replace(/\s+/g, '.')}@camara.leg.br`,
  }))
}
