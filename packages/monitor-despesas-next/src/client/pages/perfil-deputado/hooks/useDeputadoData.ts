
import { useState, useEffect } from 'react';
import type { DeputadoData } from '../types.js';

export function useDeputadoData(deputadoId: string) {
  const [deputadoData, setDeputadoData] = useState<DeputadoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deputadoId) return;

    const fetchDeputadoData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log(`🔍 [DEPUTADO] Sistema migrado - dados de deputado não disponíveis para ID: ${deputadoId}`);

        setDeputadoData({
          id: deputadoId,
          nome: 'Sistema Migrado - Dados não disponíveis',
          nomeCivil: 'N/A',
          siglaPartido: 'N/A',
          siglaUf: 'N/A',
          urlFoto: '',
          cpf: '',
          nomeEleitoral: 'N/A',
          email: '',
          redeSocial: [],
          telefone: '',
          dataFalecimento: undefined
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar dados do deputado';
        console.error(`❌ [DEPUTADO] Erro ao buscar dados:`, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchDeputadoData();
  }, [deputadoId]);

  const refetch = () => {
    if (deputadoId) {
      setDeputadoData(null);
      setError(null);
    }
  };

  return {
    deputadoData,
    loading,
    error,
    refetch
  };
}
