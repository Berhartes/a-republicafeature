
import { useState, useEffect, useCallback } from 'react';
import type { PerfilComportamentalDeputado, DespesaDetalhada } from '../types.js';

export function usePerfilComportamental(deputadoId: string, despesasDetalhadas: DespesaDetalhada[]) {
  const [perfilComportamental, setPerfilComportamental] = useState<PerfilComportamentalDeputado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analisarPerfil = useCallback(async () => {
    if (!deputadoId || despesasDetalhadas.length === 0) {
      setPerfilComportamental(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 [PERFIL] Analisando perfil comportamental para deputado ${deputadoId}`);

      const parseValor = (valor: DespesaDetalhada['valorLiquido']) => {
        if (typeof valor === 'number') return valor;
        if (typeof valor === 'string') return parseFloat(valor) || 0;
        return 0;
      };

      const totalGasto = despesasDetalhadas.reduce((sum, d) => sum + parseValor(d.valorLiquido), 0);
      const numeroTransacoes = despesasDetalhadas.length;
      
      const categorias = despesasDetalhadas.reduce((acc, d) => {
        const categoria = typeof d.tipoDespesa === 'string' ? d.tipoDespesa : 'Não especificada';
        if (!acc[categoria]) acc[categoria] = { valor: 0, count: 0 };
        acc[categoria].valor += parseValor(d.valorLiquido);
        acc[categoria].count += 1;
        return acc;
      }, {} as Record<string, { valor: number; count: number }>);

      const fornecedores = despesasDetalhadas.reduce((acc, d) => {
        const fornecedor = typeof d.nomeFornecedor === 'string' ? d.nomeFornecedor : 'Não informado';
        if (!acc[fornecedor]) acc[fornecedor] = { valor: 0, count: 0 };
        acc[fornecedor].valor += parseValor(d.valorLiquido);
        acc[fornecedor].count += 1;
        return acc;
      }, {} as Record<string, { valor: number; count: number }>);

      const categoriasOrdenadas = Object.entries(categorias) as Array<[string, { valor: number; count: number }]>;
      const categoriaPreferida = categoriasOrdenadas
        .sort(([, a], [, b]) => b.valor - a.valor)[0]?.[0] || 'Não especificada';
      
      const fornecedoresOrdenados = Object.entries(fornecedores) as Array<[string, { valor: number; count: number }]>;
      const fornecedorPrincipal = fornecedoresOrdenados
        .sort(([, a], [, b]) => b.valor - a.valor)[0]?.[0] || 'Não informado';

      const concentracaoCategoria = categorias[categoriaPreferida] ? 
        (categorias[categoriaPreferida].valor / totalGasto) * 100 : 0;
      
      const concentracaoFornecedor = fornecedores[fornecedorPrincipal] ? 
        (fornecedores[fornecedorPrincipal].valor / totalGasto) * 100 : 0;

      const despesasPorMes = despesasDetalhadas.reduce((acc, d) => {
        const data = d.dataDocumento || d.data;
        if (data && typeof data === 'object' && typeof data.seconds === 'number') {
          const dataDate = new Date(data.seconds * 1000);
          const mesAno = `${dataDate.getMonth() + 1}/${dataDate.getFullYear()}`;
          if (!acc[mesAno]) acc[mesAno] = 0;
          acc[mesAno] += parseValor(d.valorLiquido);
        }
        return acc;
      }, {} as Record<string, number>);

      const valoresMensais = Object.values(despesasPorMes) as number[];
      const mediaMensal = valoresMensais.reduce((sum, v) => sum + v, 0) / valoresMensais.length || 0;
      const variabilidade = valoresMensais.length > 1 ? 
        (Math.sqrt(valoresMensais.reduce((sum, v) => sum + Math.pow(v - mediaMensal, 2), 0) / valoresMensais.length) / mediaMensal) * 100 : 0;

      let tendencia: PerfilComportamentalDeputado['comportamentoTemporal']['tendencia'] = 'ESTAVEL';
      if (valoresMensais.length >= 2) {
        const primeiro = valoresMensais[0];
        const ultimo = valoresMensais[valoresMensais.length - 1];
        const crescimento = ((ultimo - primeiro) / primeiro) * 100;
        if (crescimento > 10) tendencia = 'CRESCENTE';
        else if (crescimento < -10) tendencia = 'DECRESCENTE';
      }

      const fatoresRisco: string[] = [];
      let scoreRisco = 0;
      let nivelRisco: PerfilComportamentalDeputado['riscos']['nivel'] = 'BAIXO';

      if (concentracaoFornecedor > 70) {
        fatoresRisco.push('Alta concentração em fornecedor único');
        scoreRisco += 25;
      }
      if (totalGasto > 1000000) {
        fatoresRisco.push('Volume de gastos muito elevado');
        scoreRisco += 20;
      }
      if (variabilidade > 80) {
        fatoresRisco.push('Alta variabilidade temporal');
        scoreRisco += 15;
      }
      if (numeroTransacoes < 10 && totalGasto > 500000) {
        fatoresRisco.push('Poucas transações de alto valor');
        scoreRisco += 20;
      }

      if (scoreRisco >= 60) nivelRisco = 'CRITICO';
      else if (scoreRisco >= 40) nivelRisco = 'ALTO';
      else if (scoreRisco >= 20) nivelRisco = 'MEDIO';

      const indicadoresAnomalia = [] as PerfilComportamentalDeputado['indicadoresAnomalia'];
      if (concentracaoFornecedor > 80) {
        indicadoresAnomalia.push({
          tipo: 'Concentração Excessiva',
          descricao: `${concentracaoFornecedor.toFixed(1)}% dos gastos concentrados em um fornecedor`,
          severidade: 'ALTA',
          confianca: 85
        });
      }
      if (variabilidade > 100) {
        indicadoresAnomalia.push({
          tipo: 'Padrão Irregular',
          descricao: 'Gastos mensais com alta variabilidade temporal',
          severidade: 'MEDIA',
          confianca: 70
        });
      }

      const perfil: PerfilComportamentalDeputado = {
        scoreComportamental: Math.max(0, 100 - scoreRisco),
        confiabilidadeAnalise: Math.min(95, 60 + (numeroTransacoes * 2)),
        classificacaoRisco: nivelRisco as PerfilComportamentalDeputado['classificacaoRisco'],
        padraoGastos: {
          categoriaPreferida,
          concentracaoCategoria,
          fornecedorPrincipal,
          concentracaoFornecedor,
          valorMedio: totalGasto / numeroTransacoes,
          frequenciaTransacoes: numeroTransacoes / Math.max(1, valoresMensais.length),
          sazonalidade: variabilidade > 50
        },
        comportamentoTemporal: {
          tendencia,
          variabilidade,
          picosAnomalia: valoresMensais.filter(v => v > mediaMensal * 2).length
        },
        riscos: {
          nivel: nivelRisco,
          score: scoreRisco,
          fatores: fatoresRisco,
          descricao: `Perfil de risco ${nivelRisco.toLowerCase()} baseado em ${fatoresRisco.length} fatores identificados`
        },
        indicadoresAnomalia
      };

      console.log(`✅ [PERFIL] Análise concluída com score ${perfil.scoreComportamental} e risco ${nivelRisco}`);
      setPerfilComportamental(perfil);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na análise comportamental';
      console.error(`❌ [PERFIL] Erro:`, err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [deputadoId, despesasDetalhadas]);

  useEffect(() => {
    analisarPerfil();
  }, [analisarPerfil]);

  return {
    perfilComportamental,
    loading,
    error,
    refetch: analisarPerfil
  };
}
