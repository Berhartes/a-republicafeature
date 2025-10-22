
import { useState, useEffect, useCallback } from 'react';
import type { RankingData } from '../types.js';

export function useRankingData(deputadoId: string, anoSelecionado: number | 'todos') {
  const [rankingDeputado, setRankingDeputado] = useState<RankingData | null>(null);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    if (!deputadoId || anoSelecionado === 'todos') {
      setRankingDeputado(null);
      return;
    }

    setLoadingRanking(true);
    setError(null);

    try {
      console.log(`🏆 [RANKING] Sistema migrado - dados de ranking não disponíveis para deputado ${deputadoId}, ano ${anoSelecionado}`);
      
      setRankingDeputado(null);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao calcular ranking';
      console.error(`❌ [RANKING] Erro:`, err);
      setError(errorMessage);
      setRankingDeputado(null);
    } finally {
      setLoadingRanking(false);
    }
  }, [deputadoId, anoSelecionado]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const getRankingStatus = (posicao: number, total: number) => {
    const percentile = (posicao / total) * 100;
    
    if (percentile <= 10) return { status: 'top', color: 'text-red-600', description: 'Top 10%' };
    if (percentile <= 25) return { status: 'high', color: 'text-orange-600', description: 'Top 25%' };
    if (percentile <= 50) return { status: 'medium', color: 'text-yellow-600', description: 'Top 50%' };
    if (percentile <= 75) return { status: 'low', color: 'text-green-600', description: 'Abaixo da média' };
    return { status: 'bottom', color: 'text-green-700', description: 'Gastos baixos' };
  };

  return {
    rankingDeputado,
    loadingRanking,
    error,
    refetch: fetchRanking,
    getRankingStatus: rankingDeputado 
      ? () => getRankingStatus(rankingDeputado.posicao, rankingDeputado.totalDeputados)
      : null
  };
}