
export interface CNPJValidationResult {
  valorOriginal: string;
  
  valorNormalizado: string | null;
  valorCorrigido: string | null;
  
  status: 'VALIDO' | 'CORRIGIDO' | 'INVALIDO' | 'SUSPEITO';
  confianca: number; // 0-100%
  
  problemas: {
    codigo: string;
    descricao: string;
    gravidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  }[];
  
  dataValidacao: Date;
  algoritmoUsado: string;
}

export class CNPJValidator {
  
  static validate(valorOriginal: string): CNPJValidationResult {
    const resultado: CNPJValidationResult = {
      valorOriginal,
      valorNormalizado: null,
      valorCorrigido: null,
      status: 'INVALIDO',
      confianca: 0,
      problemas: [],
      dataValidacao: new Date(),
      algoritmoUsado: 'CNPJValidator_v1.0'
    };

    if (!valorOriginal || valorOriginal.trim() === '') {
      resultado.problemas.push({
        codigo: 'VALOR_VAZIO',
        descricao: 'CNPJ/CPF não informado',
        gravidade: 'MEDIA'
      });
      return resultado;
    }

    const valorLimpo = this.normalizar(valorOriginal);
    resultado.valorNormalizado = valorLimpo;

    const tipo = this.detectarTipo(valorLimpo);
    
    if (tipo === 'CNPJ') {
      return this.validarCNPJ(resultado, valorLimpo);
    } else if (tipo === 'CPF') {
      return this.validarCPF(resultado, valorLimpo);
    } else {
      resultado.problemas.push({
        codigo: 'FORMATO_INVALIDO',
        descricao: `Formato inválido: esperado 11 (CPF) ou 14 (CNPJ) dígitos, encontrado ${valorLimpo.length}`,
        gravidade: 'ALTA'
      });
      return resultado;
    }
  }

  private static normalizar(valor: string): string {
    return valor.replace(/\D/g, '');
  }

  private static detectarTipo(valorLimpo: string): 'CNPJ' | 'CPF' | 'INVALIDO' {
    if (valorLimpo.length === 14) return 'CNPJ';
    if (valorLimpo.length === 11) return 'CPF';
    return 'INVALIDO';
  }

  private static validarCNPJ(resultado: CNPJValidationResult, cnpjLimpo: string): CNPJValidationResult {
    if (this.temDigitosRepetidos(cnpjLimpo)) {
      resultado.problemas.push({
        codigo: 'DIGITOS_REPETIDOS',
        descricao: 'CNPJ com todos os dígitos iguais',
        gravidade: 'CRITICA'
      });
      resultado.status = 'INVALIDO';
      return resultado;
    }

    const digitosValidos = this.validarDigitosVerificadoresCNPJ(cnpjLimpo);
    
    if (digitosValidos) {
      resultado.status = 'VALIDO';
      resultado.confianca = 100;
    } else {
      const cnpjCorrigido = this.tentarCorrigirCNPJ(cnpjLimpo);
      
      if (cnpjCorrigido) {
        resultado.valorCorrigido = cnpjCorrigido;
        resultado.status = 'CORRIGIDO';
        resultado.confianca = 85;
        resultado.problemas.push({
          codigo: 'DIGITO_VERIFICADOR_CORRIGIDO',
          descricao: `Dígitos verificadores corrigidos de ${cnpjLimpo.slice(-2)} para ${cnpjCorrigido.slice(-2)}`,
          gravidade: 'MEDIA'
        });
      } else {
        resultado.status = 'INVALIDO';
        resultado.problemas.push({
          codigo: 'DIGITO_VERIFICADOR_INVALIDO',
          descricao: 'Dígitos verificadores inválidos e não foi possível corrigir',
          gravidade: 'ALTA'
        });
      }
    }

    return resultado;
  }

  private static validarCPF(resultado: CNPJValidationResult, cpfLimpo: string): CNPJValidationResult {
    if (this.temDigitosRepetidos(cpfLimpo)) {
      resultado.problemas.push({
        codigo: 'DIGITOS_REPETIDOS',
        descricao: 'CPF com todos os dígitos iguais',
        gravidade: 'CRITICA'
      });
      resultado.status = 'INVALIDO';
      return resultado;
    }

    const digitosValidos = this.validarDigitosVerificadoresCPF(cpfLimpo);
    
    if (digitosValidos) {
      resultado.status = 'VALIDO';
      resultado.confianca = 100;
    } else {
      const cpfCorrigido = this.tentarCorrigirCPF(cpfLimpo);
      
      if (cpfCorrigido) {
        resultado.valorCorrigido = cpfCorrigido;
        resultado.status = 'CORRIGIDO';
        resultado.confianca = 85;
        resultado.problemas.push({
          codigo: 'DIGITO_VERIFICADOR_CORRIGIDO',
          descricao: `Dígitos verificadores corrigidos de ${cpfLimpo.slice(-2)} para ${cpfCorrigido.slice(-2)}`,
          gravidade: 'MEDIA'
        });
      } else {
        resultado.status = 'INVALIDO';
        resultado.problemas.push({
          codigo: 'DIGITO_VERIFICADOR_INVALIDO',
          descricao: 'Dígitos verificadores inválidos e não foi possível corrigir',
          gravidade: 'ALTA'
        });
      }
    }

    return resultado;
  }

  private static temDigitosRepetidos(valor: string): boolean {
    return /^(\d)\1+$/.test(valor);
  }

  private static validarDigitosVerificadoresCNPJ(cnpj: string): boolean {
    if (cnpj.length < 14) return false;

    const base = cnpj.substring(0, 12);
    const dv1Esperado = this.calcularDigitoVerificadorCNPJ(base, [5,4,3,2,9,8,7,6,5,4,3,2]);
    const dv2Esperado = this.calcularDigitoVerificadorCNPJ(base + dv1Esperado, [6,5,4,3,2,9,8,7,6,5,4,3,2]);

    const dv1Atual = parseInt(cnpj[12]);
    const dv2Atual = parseInt(cnpj[13]);
    
    return dv1Atual === dv1Esperado && dv2Atual === dv2Esperado;
  }

  private static validarDigitosVerificadoresCPF(cpf: string): boolean {
    if (cpf.length < 11) return false;

    const base = cpf.substring(0, 9);
    const dv1Esperado = this.calcularDigitoVerificadorCPF(base, [10,9,8,7,6,5,4,3,2]);
    const dv2Esperado = this.calcularDigitoVerificadorCPF(base + dv1Esperado, [11,10,9,8,7,6,5,4,3,2]);

    const dv1Atual = parseInt(cpf[9]);
    const dv2Atual = parseInt(cpf[10]);
    
    return dv1Atual === dv1Esperado && dv2Atual === dv2Esperado;
  }

  private static calcularDigitoVerificadorCNPJ(base: string, pesos: number[]): number {
    const soma = base.split('').reduce((acc, digito, index) => {
      return acc + parseInt(digito) * (pesos[index] || 0);
    }, 0);
    
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  private static calcularDigitoVerificadorCPF(base: string, pesos: number[]): number {
    const soma = base.split('').reduce((acc, digito, index) => {
      return acc + parseInt(digito) * (pesos[index] || 0);
    }, 0);
    
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  }

  private static tentarCorrigirCNPJ(cnpjInvalido: string): string | null {
    try {
      const base = cnpjInvalido.substring(0, 12);
      const dv1 = this.calcularDigitoVerificadorCNPJ(base, [5,4,3,2,9,8,7,6,5,4,3,2]);
      const dv2 = this.calcularDigitoVerificadorCNPJ(base + dv1, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
      
      return base + dv1.toString() + dv2.toString();
    } catch {
      return null;
    }
  }

  private static tentarCorrigirCPF(cpfInvalido: string): string | null {
    try {
      const base = cpfInvalido.substring(0, 9);
      const dv1 = this.calcularDigitoVerificadorCPF(base, [10,9,8,7,6,5,4,3,2]);
      const dv2 = this.calcularDigitoVerificadorCPF(base + dv1, [11,10,9,8,7,6,5,4,3,2]);
      
      return base + dv1.toString() + dv2.toString();
    } catch {
      return null;
    }
  }

  static formatarParaExibicao(valor: string): string {
    const valorLimpo = valor.replace(/\D/g, '');
    
    if (valorLimpo.length === 14) {
      return valorLimpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    if (valorLimpo.length === 11) {
      return valorLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    return valor; // Retorna original se não puder formatar
  }

  static validarLote(valores: string[]): {
    total: number;
    validos: number;
    corrigidos: number;
    invalidos: number;
    resultados: CNPJValidationResult[];
  } {
    const resultados = valores.map(valor => this.validate(valor));
    
    return {
      total: resultados.length,
      validos: resultados.filter(r => r.status === 'VALIDO').length,
      corrigidos: resultados.filter(r => r.status === 'CORRIGIDO').length,
      invalidos: resultados.filter(r => r.status === 'INVALIDO').length,
      resultados
    };
  }
}

export function validarCNPJ(cnpj: string): CNPJValidationResult {
  return CNPJValidator.validate(cnpj);
}

export function isCNPJValido(cnpj: string): boolean {
  const resultado = CNPJValidator.validate(cnpj);
  return resultado.status === 'VALIDO' || resultado.status === 'CORRIGIDO';
}

export function obterCNPJCorrigido(cnpj: string): string {
  const resultado = CNPJValidator.validate(cnpj);
  return resultado.valorCorrigido || resultado.valorNormalizado || resultado.valorOriginal;
}