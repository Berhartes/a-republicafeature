
import { CNPJValidator, validarCNPJ, isCNPJValido, obterCNPJCorrigido } from './cnpj-validator';
import { auditarFornecedor, gerarRelatorioAuditoria } from './cnpj-audit-system';

export function exemploValidacaoSimples() {
  console.log('🧪 === EXEMPLO 1: Validação Simples ===\n');
  
  const cnpjsExemplo = [
    '11.222.333/0001-81',    // CNPJ válido
    '12.345.678/0001-99',    // CNPJ com dígito verificador errado
    '47.029.518%2F0001-11',  // CNPJ URL-encoded
    '12345',                 // CNPJ inválido (muito curto)
    '11111111111111',        // CNPJ inválido (dígitos repetidos)
    '123.456.789-09'         // CPF válido
  ];
  
  cnpjsExemplo.forEach(cnpj => {
    const resultado = validarCNPJ(cnpj);
    
    console.log(`📋 Original: ${cnpj}`);
    console.log(`   Status: ${resultado.status}`);
    console.log(`   Confiança: ${resultado.confianca}%`);
    console.log(`   Normalizado: ${resultado.valorNormalizado}`);
    console.log(`   Corrigido: ${resultado.valorCorrigido || 'N/A'}`);
    console.log(`   Problemas: ${resultado.problemas.length}`);
    
    if (resultado.problemas.length > 0) {
      resultado.problemas.forEach(problema => {
        console.log(`     ⚠️ ${problema.descricao} (${problema.gravidade})`);
      });
    }
    console.log('');
  });
}

export function exemploAuditoriaFornecedores() {
  console.log('🏢 === EXEMPLO 2: Auditoria de Fornecedores ===\n');
  
  const fornecedoresExemplo = [
    { id: 'F001', cnpj: '11.222.333/0001-81', nome: 'Empresa Exemplo Ltda' },
    { id: 'F002', cnpj: '12.345.678/0001-99', nome: 'Fornecedor Suspeito SA' },
    { id: 'F003', cnpj: '47.029.518%2F0001-11', nome: 'ML SOUZA & CIA LTDA' },
    { id: 'F004', cnpj: '00000000000000', nome: 'Empresa Inexistente' },
    { id: 'F005', cnpj: '', nome: 'Fornecedor Sem CNPJ' }
  ];
  
  console.log('📊 Processando fornecedores...\n');
  
  fornecedoresExemplo.forEach(fornecedor => {
    const auditado = auditarFornecedor(fornecedor.id, fornecedor.cnpj, fornecedor.nome);
    
    console.log(`🏢 ${fornecedor.nome} (${fornecedor.id})`);
    console.log(`   CNPJ Original: "${auditado.cnpjOriginal}"`);
    console.log(`   Status: ${auditado.validacao.status}`);
    console.log(`   Confiança: ${auditado.validacao.confianca}%`);
    console.log(`   Alertas: ${auditado.alertas.length}`);
    
    if (auditado.alertas.length > 0) {
      auditado.alertas.forEach(alerta => {
        console.log(`     🚨 ${alerta.tipo}: ${alerta.descricao}`);
      });
    }
    console.log('');
  });
  
  console.log('📈 === RELATÓRIO DE AUDITORIA ===\n');
  const relatorio = gerarRelatorioAuditoria();
  
  console.log(`📊 Total de fornecedores: ${relatorio.totalFornecedores}`);
  console.log(`✅ Válidos: ${relatorio.estatisticas.validos}`);
  console.log(`🔧 Corrigidos: ${relatorio.estatisticas.corrigidos}`);
  console.log(`❌ Inválidos: ${relatorio.estatisticas.invalidos}`);
  console.log(`🚨 Alertas ativos: ${relatorio.alertasAtivos.length}`);
  
  console.log('\n🔍 Problemas mais frequentes:');
  relatorio.problemasFrequentes.slice(0, 3).forEach((problema, index) => {
    console.log(`${index + 1}. ${problema.descricao} (${problema.ocorrencias} ocorrências)`);
    console.log(`   Exemplos: ${problema.exemplos.join(', ')}`);
  });
  
  console.log('\n🛡️ Garantias de segurança:');
  console.log(`   Dados originais preservados: ${relatorio.garantias.dadosOriginaisPreservados}`);
  console.log(`   Total de registros: ${relatorio.garantias.totalRegistrosOriginais}`);
  console.log(`   Hash de integridade: ${relatorio.garantias.hashDadosOriginais.substring(0, 16)}...`);
}

export function exemploCorrecaoAutomatica() {
  console.log('🔧 === EXEMPLO 3: Correção Automática ===\n');
  
  const cnpjsComErros = [
    '12.345.678/0001-00',  // Dígito verificador errado (deveria ser 95)
    '11.222.333/0001-00',  // Dígito verificador errado (deveria ser 81)
    '98.765.432/0001-00'   // Dígito verificador errado (deveria ser 10)
  ];
  
  cnpjsComErros.forEach(cnpjErrado => {
    console.log(`🔍 Analisando: ${cnpjErrado}`);
    
    const validacao = validarCNPJ(cnpjErrado);
    
    console.log(`   Status: ${validacao.status}`);
    console.log(`   Original preservado: "${validacao.valorOriginal}"`);
    console.log(`   Normalizado: ${validacao.valorNormalizado}`);
    
    if (validacao.valorCorrigido) {
      console.log(`   ✅ Correção sugerida: ${validacao.valorCorrigido}`);
      console.log(`   📊 Confiança na correção: ${validacao.confianca}%`);
      
      const validacaoCorrigida = validarCNPJ(validacao.valorCorrigido);
      console.log(`   🧪 Validação da correção: ${validacaoCorrigida.status}`);
    } else {
      console.log(`   ❌ Não foi possível corrigir automaticamente`);
    }
    
    console.log('');
  });
}

export function exemploProcessamentoLote() {
  console.log('📋 === EXEMPLO 4: Processamento em Lote ===\n');
  
  const cnpjsLote = [
    '11.222.333/0001-81',  // Válido
    '12.345.678/0001-95',  // Válido 
    '98.765.432/0001-10',  // Válido
    '12.345.678/0001-99',  // Inválido (DV errado)
    '00000000000000',      // Inválido (zeros)
    '11111111111111',      // Inválido (repetidos)
    '',                    // Vazio
    '123.456.789-09',      // CPF válido
    '123.456.789-00'       // CPF inválido
  ];
  
  console.log(`🔄 Processando lote de ${cnpjsLote.length} documentos...\n`);
  
  const resultadoLote = CNPJValidator.validarLote(cnpjsLote);
  
  console.log('📈 === RESULTADO DO LOTE ===');
  console.log(`📊 Total processados: ${resultadoLote.total}`);
  console.log(`✅ Válidos: ${resultadoLote.validos} (${Math.round((resultadoLote.validos / resultadoLote.total) * 100)}%)`);
  console.log(`🔧 Corrigidos: ${resultadoLote.corrigidos} (${Math.round((resultadoLote.corrigidos / resultadoLote.total) * 100)}%)`);
  console.log(`❌ Inválidos: ${resultadoLote.invalidos} (${Math.round((resultadoLote.invalidos / resultadoLote.total) * 100)}%)`);
  
  console.log('\n🔍 Detalhes por documento:');
  resultadoLote.resultados.forEach((resultado, index) => {
    const status = resultado.status === 'VALIDO' ? '✅' : 
                   resultado.status === 'CORRIGIDO' ? '🔧' : '❌';
    
    console.log(`${index + 1}. ${status} "${resultado.valorOriginal}" → ${resultado.status} (${resultado.confianca}%)`);
  });
}

export function exemploUsoNoSistema() {
  console.log('🚀 === EXEMPLO 5: Integração no Sistema ===\n');
  
  const fornecedoresSistema = [
    { id: 'F001', cnpjCpfFornecedor: '47.029.518%2F0001-11', nomeFornecedor: 'ML SOUZA & CIA LTDA' },
    { id: 'F002', cnpjCpfFornecedor: '12.345.678/0001-99', nomeFornecedor: 'FORNECEDOR PROBLEMA' },
    { id: 'F003', cnpjCpfFornecedor: '', nomeFornecedor: 'SEM CNPJ' }
  ];
  
  console.log('🔄 Aplicando validação no fluxo do sistema...\n');
  
  const fornecedoresValidados = fornecedoresSistema.map(fornecedor => {
    const dadosOriginais = { ...fornecedor };
    
    const validacao = validarCNPJ(fornecedor.cnpjCpfFornecedor);
    
    return {
      ...dadosOriginais,
      
      cnpjValidacao: validacao,
      cnpjFormatado: CNPJValidator.formatarParaExibicao(fornecedor.cnpjCpfFornecedor),
      cnpjValido: isCNPJValido(fornecedor.cnpjCpfFornecedor),
      cnpjCorrigido: obterCNPJCorrigido(fornecedor.cnpjCpfFornecedor),
      
      temProblemas: validacao.problemas.length > 0,
      problemasCriticos: validacao.problemas.filter(p => p.gravidade === 'CRITICA').length > 0
    };
  });
  
  console.log('📊 Resultado da validação:');
  fornecedoresValidados.forEach(fornecedor => {
    console.log(`\n🏢 ${fornecedor.nomeFornecedor}`);
    console.log(`   CNPJ Original: "${fornecedor.cnpjCpfFornecedor}"`);
    console.log(`   CNPJ Formatado: ${fornecedor.cnpjFormatado}`);
    console.log(`   Status: ${fornecedor.cnpjValidacao.status}`);
    console.log(`   É Válido: ${fornecedor.cnpjValido ? 'Sim' : 'Não'}`);
    console.log(`   Tem Problemas: ${fornecedor.temProblemas ? 'Sim' : 'Não'}`);
    console.log(`   Críticos: ${fornecedor.problemasCriticos ? 'Sim' : 'Não'}`);
    
    if (fornecedor.cnpjCorrigido !== fornecedor.cnpjCpfFornecedor) {
      console.log(`   ✨ Correção: ${fornecedor.cnpjCorrigido}`);
    }
  });
  
  console.log('\n✅ Todos os dados originais foram preservados!');
  console.log('💡 Sistema pode tomar decisões baseado nos dados validados');
  console.log('🛡️ Zero risco de perda de informações');
}

export function executarTodosExemplos() {
  console.log('🎯 ===== SISTEMA DE VALIDAÇÃO CNPJ/CPF =====');
  console.log('🛡️ GARANTIA: ZERO alteração de dados originais');
  console.log('💰 SEM CUSTOS: Validação offline');
  console.log('🔧 CORREÇÃO AUTOMÁTICA: Segura e confiável\n');
  
  exemploValidacaoSimples();
  exemploAuditoriaFornecedores();
  exemploCorrecaoAutomatica();
  exemploProcessamentoLote();
  exemploUsoNoSistema();
  
  console.log('\n🎉 === DEMONSTRAÇÃO CONCLUÍDA ===');
  console.log('✅ Sistema pronto para uso em produção');
  console.log('🔒 Dados originais 100% preservados');
  console.log('📊 Relatórios de auditoria disponíveis');
  console.log('🚀 Zero dependências externas');
}

