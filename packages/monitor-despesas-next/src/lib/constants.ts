export const VALORES_COTA_PARLAMENTAR_POR_UF: Record<string, number> = {
  AC: 50426.26,
  DF: 36582.46,
  MT: 45221.83,
  RJ: 41553.77,
  SE: 45933.06,
  AL: 46737.90,
  ES: 43217.71,
  PA: 48021.25,
  RN: 48525.79,
  SP: 42837.33,
  AM: 49363.92,
  GO: 41300.86,
  PB: 47826.36,
  RO: 49466.29,
  TO: 45297.41,
  AP: 49168.58,
  MA: 47945.49,
  PE: 47470.60,
  RR: 51406.33,
  BA: 44804.65,
  MG: 41886.51,
  PI: 46765.57,
  RS: 46669.70,
  CE: 48245.57,
  MS: 46336.64,
  PR: 44665.66,
  SC: 45671.58,
};

export const LIMITES_MENSAIS_DESPESAS: Record<string, { limite: number; descricao: string }> = {
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES': {
    limite: 12713.00,
    descricao: 'Locação ou fretamento de veículos automotores',
  },
  'SERVIÇOS DE TÁXI, PEDÁGIO E ESTACIONAMENTO': {
    limite: 2700.00,
    descricao: 'Serviços de táxi, pedágio e estacionamento',
  },
  'COMBUSTÍVEIS E LUBRIFICANTES.': {
    limite: 9392.00,
    descricao: 'Combustíveis e lubrificantes',
  },
  'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA.': {
    limite: 8700.00,
    descricao: 'Serviços de segurança de empresas especializadas',
  },
  'PARTICIPAÇÃO EM CURSO, PALESTRA, EVENTO OU SIMILAR': {
    limite: 7697.17, // 25% da menor cota (DF)
    descricao: 'Participação em cursos, congressos ou eventos',
  },
  'COMPLEMENTAÇÃO DO AUXÍLIO-MORADIA': {
    limite: 4148.80,
    descricao: 'Complementação de auxílio-moradia',
  },
};

export const DESPESAS_NAO_PERMITIDAS_KEYWORDS: string[] = [
  'gêneros alimentícios', // Permitido 'alimentação do parlamentar', mas não 'gêneros alimentícios'
  'material permanente',
  'caráter eleitoral',
  'educação básica',
  'graduação',
  'pós-graduação',
];
