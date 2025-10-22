
import { PremiacoesDeputado } from '@/components/premiacoes/PremiacoesDeputado';
import type { DeputadoData } from '../types.js';

interface PremiacoesTabProps {
  deputadoData: DeputadoData | null;
}

export function PremiacoesTab({
  deputadoData
}: PremiacoesTabProps) {
  if (!deputadoData) {
    return (
      <div className="text-center text-gray-500 p-8">
        Dados do deputado não disponíveis para exibir premiações
      </div>
    );
  }

  return (
    <PremiacoesDeputado 
      deputadoId={deputadoData.id} 
      deputadoNome={deputadoData.nomeEleitoral} 
    />
  );
}
