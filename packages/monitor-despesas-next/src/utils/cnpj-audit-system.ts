
import { CNPJValidator, CNPJValidationResult } from './cnpj-validator';
import { SHA256 } from 'crypto-js';
import { FornecedorBasico, FornecedorCnpjAlertPayload, FornecedorDadosOriginais } from '../types/fornecedores';

export interface FornecedorAuditado {
  id: string;
  cnpjOriginal: string;
  nomeOriginal: string;
  
  validacao: CNPJValidationResult;
  
  audit: {
    dataProcessamento: Date;
    versaoValidador: string;
    statusAnterior?: string;
    historicoValidacoes: ValidationHistory[];
  };
  
  alertas: Alert[];
}

export interface ValidationHistory {
  data: Date;
  statusAnterior: string;
  statusNovo: string;
  motivoMudanca: string;
  versaoValidador: string;
}

export interface Alert {
  id: string;
  tipo: 'CNPJ_INVALIDO' | 'CNPJ_SUSPEITO' | 'CNPJ_CORRIGIDO' | 'MULTIPLOS_FORMATOS';
  gravidade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  descricao: string;
  dadosOriginais: FornecedorCnpjAlertPayload;
  dataDeteccao: Date;
  resolvido: boolean;
}

export interface AuditReport {
  dataGeracao: Date;
  totalFornecedores: number;
  
  estatisticas: {
    validos: number;
    corrigidos: number;
    invalidos: number;
    suspeitos: number;
    naoVerificados: number;
  };
  
  problemasFrequentes: {
    codigo: string;
    descricao: string;
    ocorrencias: number;
    exemplos: string[];
  }[];
  
  alertasAtivos: Alert[];
  
  garantias: {
    dadosOriginaisPreservados: boolean;
    totalRegistrosOriginais: number;
    hashDadosOriginais: string;
  };
}

export class CNPJAuditSystem {
  private fornecedoresAuditados: Map<string, FornecedorAuditado> = new Map();
  private alertas: Alert[] = [];
  
  processarFornecedor(
    id: string,
    cnpjOriginal: string,
    nomeOriginal: string
  ): FornecedorAuditado {
    
    const existente = this.fornecedoresAuditados.get(id);
    
    const validacao = CNPJValidator.validate(cnpjOriginal);
    
    const fornecedorAuditado: FornecedorAuditado = {
      id,
      cnpjOriginal,
      nomeOriginal,
      
      validacao,
      
      audit: {
        dataProcessamento: new Date(),
        versaoValidador: 'CNPJValidator_v1.0',
        statusAnterior: existente?.validacao.status,
        historicoValidacoes: existente?.audit.historicoValidacoes || []
      },
      
      alertas: []
    };
    
    if (existente && existente.validacao.status !== validacao.status) {
      fornecedorAuditado.audit.historicoValidacoes.push({
        data: new Date(),
        statusAnterior: existente.validacao.status,
        statusNovo: validacao.status,
        motivoMudanca: 'Reprocessamento com nova versão do validador',
        versaoValidador: 'CNPJValidator_v1.0'
      });
    }
    
    this.gerarAlertas(fornecedorAuditado);
    
    this.fornecedoresAuditados.set(id, fornecedorAuditado);
    
    return fornecedorAuditado;
  }
  
  private gerarAlertas(fornecedor: FornecedorAuditado): void {
    const { validacao } = fornecedor;
    
    if (validacao.status === 'INVALIDO') {
      const alerta: Alert = {
        id: `${fornecedor.id}_cnpj_invalido_${Date.now()}`,
        tipo: 'CNPJ_INVALIDO',
        gravidade: 'ALTA',
        descricao: `CNPJ inválido: ${fornecedor.cnpjOriginal}. Problemas: ${validacao.problemas.map(p => p.descricao).join(', ')}`,
        dadosOriginais: {
          id: fornecedor.id,
          cnpjOriginal: fornecedor.cnpjOriginal,
          nomeOriginal: fornecedor.nomeOriginal
        },
        dataDeteccao: new Date(),
        resolvido: false
      };
      
      fornecedor.alertas.push(alerta);
      this.alertas.push(alerta);
    }
    
    if (validacao.status === 'CORRIGIDO') {
      const alerta: Alert = {
        id: `${fornecedor.id}_cnpj_corrigido_${Date.now()}`,
        tipo: 'CNPJ_CORRIGIDO',
        gravidade: 'MEDIA',
        descricao: `CNPJ corrigido automaticamente: ${fornecedor.cnpjOriginal} → ${validacao.valorCorrigido}`,
        dadosOriginais: {
          id: fornecedor.id,
          cnpjOriginal: fornecedor.cnpjOriginal,
          nomeOriginal: fornecedor.nomeOriginal
        },
        dataDeteccao: new Date(),
        resolvido: false
      };
      
      fornecedor.alertas.push(alerta);
      this.alertas.push(alerta);
    }
    
    const problemasCriticos = validacao.problemas.filter(p => p.gravidade === 'CRITICA');
    if (problemasCriticos.length > 0) {
      const alerta: Alert = {
        id: `${fornecedor.id}_critico_${Date.now()}`,
        tipo: 'CNPJ_SUSPEITO',
        gravidade: 'CRITICA',
        descricao: `Problemas críticos detectados: ${problemasCriticos.map(p => p.descricao).join(', ')}`,
        dadosOriginais: {
          id: fornecedor.id,
          cnpjOriginal: fornecedor.cnpjOriginal,
          nomeOriginal: fornecedor.nomeOriginal
        },
        dataDeteccao: new Date(),
        resolvido: false
      };
      
      fornecedor.alertas.push(alerta);
      this.alertas.push(alerta);
    }
  }
  
  processarLote(fornecedores: FornecedorBasico[]): AuditReport {
    console.log(`🔍 Iniciando auditoria de ${fornecedores.length} fornecedores...`);
    
    fornecedores.forEach(fornecedor => {
      this.processarFornecedor(fornecedor.id, fornecedor.cnpj, fornecedor.nome);
    });
    
    return this.gerarRelatorio();
  }
  
  gerarRelatorio(): AuditReport {
    const fornecedores = Array.from(this.fornecedoresAuditados.values());
    
    const estatisticas = {
      validos: fornecedores.filter(f => f.validacao.status === 'VALIDO').length,
      corrigidos: fornecedores.filter(f => f.validacao.status === 'CORRIGIDO').length,
      invalidos: fornecedores.filter(f => f.validacao.status === 'INVALIDO').length,
      suspeitos: fornecedores.filter(f => f.validacao.status === 'SUSPEITO').length,
      naoVerificados: fornecedores.filter(f => f.validacao.status === 'INVALIDO' && f.validacao.problemas.some(p => p.codigo === 'VALOR_VAZIO')).length
    };
    
    const problemasMap = new Map<string, {codigo: string, descricao: string, ocorrencias: number, exemplos: string[]}>();
    
    fornecedores.forEach(fornecedor => {
      fornecedor.validacao.problemas.forEach(problema => {
        const key = problema.codigo;
        if (!problemasMap.has(key)) {
          problemasMap.set(key, {
            codigo: problema.codigo,
            descricao: problema.descricao,
            ocorrencias: 0,
            exemplos: []
          });
        }
        
        const registro = problemasMap.get(key)!;
        registro.ocorrencias++;
        
        if (registro.exemplos.length < 3) {
          registro.exemplos.push(fornecedor.cnpjOriginal);
        }
      });
    });
    
    const problemasFrequentes = Array.from(problemasMap.values())
      .sort((a, b) => b.ocorrencias - a.ocorrencias)
      .slice(0, 10);
    
    const dadosOriginais: FornecedorDadosOriginais[] = fornecedores.map(f => ({
      id: f.id,
      cnpjOriginal: f.cnpjOriginal,
      nomeOriginal: f.nomeOriginal
    }));
    const hashDadosOriginais = this.calcularHashDados(dadosOriginais);
    
    return {
      dataGeracao: new Date(),
      totalFornecedores: fornecedores.length,
      estatisticas,
      problemasFrequentes,
      alertasAtivos: this.alertas.filter(a => !a.resolvido),
      garantias: {
        dadosOriginaisPreservados: true,
        totalRegistrosOriginais: fornecedores.length,
        hashDadosOriginais
      }
    };
  }
  
  buscarProblematicos(filtros: {
    status?: string[];
    gravidade?: string[];
    codigo?: string[];
  }): FornecedorAuditado[] {
    return Array.from(this.fornecedoresAuditados.values()).filter(fornecedor => {
      if (filtros.status && !filtros.status.includes(fornecedor.validacao.status)) {
        return false;
      }
      
      if (filtros.gravidade) {
        const temGravidade = fornecedor.validacao.problemas.some(p => 
          filtros.gravidade!.includes(p.gravidade)
        );
        if (!temGravidade) return false;
      }
      
      if (filtros.codigo) {
        const temCodigo = fornecedor.validacao.problemas.some(p => 
          filtros.codigo!.includes(p.codigo)
        );
        if (!temCodigo) return false;
      }
      
      return true;
    });
  }
  
  exportarDadosOriginais(): FornecedorDadosOriginais[] {
    return Array.from(this.fornecedoresAuditados.values()).map(f => ({
      id: f.id,
      cnpjOriginal: f.cnpjOriginal,
      nomeOriginal: f.nomeOriginal
    }));
  }
  
  private calcularHashDados(dados: FornecedorDadosOriginais[]): string {
    const dadosString = JSON.stringify(
      dados.map(item => ({
        id: item.id,
        cnpjOriginal: item.cnpjOriginal,
        nomeOriginal: item.nomeOriginal
      }))
    );
    return SHA256(dadosString).toString();
  }
  
  obterEstatisticasRapidas(): {
    total: number;
    percentualValidos: number;
    percentualProblemas: number;
    alertasCriticos: number;
  } {
    const total = this.fornecedoresAuditados.size;
    const validos = Array.from(this.fornecedoresAuditados.values())
      .filter(f => f.validacao.status === 'VALIDO').length;
    const alertasCriticos = this.alertas.filter(a => a.gravidade === 'CRITICA' && !a.resolvido).length;
    
    return {
      total,
      percentualValidos: total > 0 ? Math.round((validos / total) * 100) : 0,
      percentualProblemas: total > 0 ? Math.round(((total - validos) / total) * 100) : 0,
      alertasCriticos
    };
  }
}

export const cnpjAuditSystem = new CNPJAuditSystem();

export function auditarFornecedor(id: string, cnpj: string, nome: string): FornecedorAuditado {
  return cnpjAuditSystem.processarFornecedor(id, cnpj, nome);
}

export function gerarRelatorioAuditoria(): AuditReport {
  return cnpjAuditSystem.gerarRelatorio();
}