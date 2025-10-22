
import { useState, useEffect, useCallback, useRef } from 'react';
import type { FornecedorRanking, DespesaDetalhada } from '../types.js';

export function useFornecedoresData(
  deputadoId: string, 
  despesasDetalhadas: DespesaDetalhada[], 
  filtroCategorieFornecedores: string = 'TODAS'
) {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [loadingFornecedores, setLoadingFornecedores] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [top5Fornecedores, setTop5Fornecedores] = useState<FornecedorRanking[]>([]);
  
  const fornecedoresPromiseRef = useRef<Promise<void> | null>(null);

  const fetchFornecedores = useCallback(async () => {
    if (!deputadoId) return;

    if (fornecedoresPromiseRef.current) {
      await fornecedoresPromiseRef.current;
      return;
    }

    setLoadingFornecedores(true);
    setError(null);

    const fetchPromise = (async () => {
      try {
        console.log(`🏢 [FORNECEDORES] Sistema migrado - dados de fornecedores não disponíveis para deputado ${deputadoId}`);

        setFornecedores([]);
        setTop5Fornecedores([]);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar fornecedores';
        console.error(`❌ [FORNECEDORES] Erro:`, err);
        setError(errorMessage);
      } finally {
        setLoadingFornecedores(false);
        fornecedoresPromiseRef.current = null;
      }
    })();

    fornecedoresPromiseRef.current = fetchPromise;
    await fetchPromise;
  }, [deputadoId, filtroCategorieFornecedores]);

  const processFornecedoresFromDespesas = useCallback(() => {
    if (despesasDetalhadas.length === 0) return [];

    console.log(`📊 [FORNECEDORES] Processando fornecedores a partir de ${despesasDetalhadas.length} despesas`);

    const despesasFiltradas = filtroCategorieFornecedores === 'TODAS'
      ? despesasDetalhadas
      : despesasDetalhadas.filter(d => d.tipoDespesa === filtroCategorieFornecedores);

    const fornecedoresMap: Record<string, {
      nome: string;
      cnpj: string;
      valor: number;
      count: number;
      categorias: Set<string>;
    }> = {};

    const parseValor = (valor: DespesaDetalhada['valorLiquido']) => {
      if (typeof valor === 'number') return valor;
      if (typeof valor === 'string') return parseFloat(valor) || 0;
      return 0;
    };

    despesasFiltradas.forEach((despesa) => {
      const fornecedor = typeof despesa.nomeFornecedor === 'string' ? despesa.nomeFornecedor : 'Não informado';
      const cnpj = typeof despesa.cnpjCpfFornecedor === 'string' ? despesa.cnpjCpfFornecedor : '';
      const valor = parseValor(despesa.valorLiquido);

      const chaveAgrupamento = `${fornecedor}|${cnpj}`;

      if (!fornecedoresMap[chaveAgrupamento]) {
        fornecedoresMap[chaveAgrupamento] = { 
          nome: fornecedor,
          cnpj: cnpj,
          valor: 0, 
          count: 0,
          categorias: new Set<string>()
        };
      }
      
      fornecedoresMap[chaveAgrupamento].valor += valor;
      fornecedoresMap[chaveAgrupamento].count += 1;
      
      if (typeof despesa.tipoDespesa === 'string') {
        fornecedoresMap[chaveAgrupamento].categorias.add(despesa.tipoDespesa);
      }
    });

    const fornecedoresArray: FornecedorRanking[] = Object.values(fornecedoresMap)
      .map((forn) => ({
        nome: forn.nomeEleitoral,
        cnpj: forn.cnpj,
        valor: forn.valor,
        numeroTransacoes: forn.count,
        categorias: Array.from(forn.categorias) as string[],
        categoriaPrincipal: Array.from(forn.categorias)[0] || 'Não especificada'
      }))
      .sort((a, b) => b.valor - a.valor);

    return fornecedoresArray;
  }, [despesasDetalhadas, filtroCategorieFornecedores]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  useEffect(() => {
    if (fornecedores.length === 0 && despesasDetalhadas.length > 0) {
      const fornecedoresFromDespesas = processFornecedoresFromDespesas();
      setTop5Fornecedores(fornecedoresFromDespesas.slice(0, 5));
    }
  }, [despesasDetalhadas, fornecedores.length, processFornecedoresFromDespesas]);

  return {
    fornecedores,
    loadingFornecedores,
    error,
    top5Fornecedores,
    refetch: fetchFornecedores,
    totalFornecedores: fornecedores.length || processFornecedoresFromDespesas().length,
    fornecedoresFromDespesas: processFornecedoresFromDespesas()
  };
}
