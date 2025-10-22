
import { useState, useEffect, useCallback } from 'react';

import type { DespesaDetalhada } from '../types.js';

export function useDespesasData(deputadoId: string, anoSelecionado: number | 'todos', mesSelecionado: string) {
  const [despesasDetalhadas, setDespesasDetalhadas] = useState<DespesaDetalhada[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDespesas = useCallback(async () => {
    if (!deputadoId) return;

    setLoadingDespesas(true);
    setError(null);

    try {
      console.log(`🔍 [DESPESAS] Sistema migrado - dados de despesas não disponíveis para deputado ${deputadoId}, ano ${anoSelecionado}`);

      setDespesasDetalhadas([]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar despesas';
      console.error(`❌ [DESPESAS] Erro:`, err);
      setError(errorMessage);
    } finally {
      setLoadingDespesas(false);
    }
  }, [deputadoId, anoSelecionado, mesSelecionado]);

  useEffect(() => {
    fetchDespesas();
  }, [fetchDespesas]);

  const parseValorLiquido = (valor: DespesaDetalhada['valorLiquido']) => {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') return parseFloat(valor) || 0;
    return 0;
  };

  const totalGasto = despesasDetalhadas.reduce((sum, despesa) => {
    return sum + parseValorLiquido(despesa.valorLiquido);
  }, 0);

  const numeroTransacoes = despesasDetalhadas.length;

  const categorias = Array.from(new Set(
    despesasDetalhadas
      .map(d => (typeof d.tipoDespesa === 'string' ? d.tipoDespesa : typeof d.categoria === 'string' ? d.categoria : null))
      .filter((valor): valor is string => Boolean(valor))
  ));

  const fornecedores = Array.from(new Set(
    despesasDetalhadas
      .map(d => (typeof d.nomeFornecedor === 'string' ? d.nomeFornecedor : null))
      .filter((valor): valor is string => Boolean(valor))
  ));

  return {
    despesasDetalhadas,
    loadingDespesas,
    error,
    refetch: fetchDespesas,
    totalGasto,
    numeroTransacoes,
    categorias,
    fornecedores
  };
}
