
import { type ProcessedFornecedoresData } from '@/services/global-fornecedores-processor';
import { type ProcessedTransacoesData } from '@/services/global-transacoes-processor';

interface DataComparisonResult {
  isTotalValueConsistent: boolean;
  fornecedoresTotalValue: number;
  transacoesTotalValue: number;
  valueDifference: number;
  
  isTotalTransactionsConsistent: boolean;
  fornecedoresTotalTransactions: number;
  transacoesTotalTransactions: number;
  transactionsDifference: number;

  message: string;
}

export function compareProcessedData(
  fornecedoresData: ProcessedFornecedoresData | null,
  transacoesData: ProcessedTransacoesData | null
): DataComparisonResult {
  const defaultResult: DataComparisonResult = {
    isTotalValueConsistent: false,
    fornecedoresTotalValue: 0,
    transacoesTotalValue: 0,
    valueDifference: 0,
    isTotalTransactionsConsistent: false,
    fornecedoresTotalTransactions: 0,
    transacoesTotalTransactions: 0,
    transactionsDifference: 0,
    message: "Dados insuficientes para comparação."
  };

  if (!fornecedoresData || !transacoesData) {
    return defaultResult;
  }

  const fornecedoresStats = fornecedoresData.estatisticas;
  const transacoesStats = transacoesData.estatisticas;

  if (!fornecedoresStats || !transacoesStats) {
    return { ...defaultResult, message: "Estatísticas não disponíveis em um ou ambos os conjuntos de dados." };
  }

  const fornecedoresTotalValue =
    ('totalVolume' in fornecedoresStats && typeof fornecedoresStats.totalVolume === 'number')
      ? fornecedoresStats.totalVolume
      : (('totalValor' in fornecedoresStats && typeof (fornecedoresStats as any).totalValor === 'number')
        ? (fornecedoresStats as any).totalValor
        : 0);
  const transacoesTotalValue = transacoesStats.valorTotal || 0;
  const valueDifference = Math.abs(fornecedoresTotalValue - transacoesTotalValue);
  const isTotalValueConsistent = valueDifference < 0.01; // Allow for minor floating point differences

  const fornecedoresTotalTransactions =
    ('totalTransacoes' in fornecedoresStats && typeof fornecedoresStats.totalTransacoes === 'number')
      ? fornecedoresStats.totalTransacoes
      : (('numeroTransacoes' in fornecedoresStats && typeof (fornecedoresStats as any).numeroTransacoes === 'number')
        ? (fornecedoresStats as any).numeroTransacoes
        : 0);
  const transacoesTotalTransactions = transacoesStats.totalTransacoes || 0;
  const transactionsDifference = Math.abs(fornecedoresTotalTransactions - transacoesTotalTransactions);
  const isTotalTransactionsConsistent = transactionsDifference === 0;

  let message = "Comparação concluída: ";
  if (isTotalValueConsistent && isTotalTransactionsConsistent) {
    message += "Valores totais e número de transações são consistentes.";
  } else {
    message += "Inconsistências encontradas. ";
    if (!isTotalValueConsistent) {
      message += `Diferença no valor total: ${valueDifference.toFixed(2)}. `;
    }
    if (!isTotalTransactionsConsistent) {
      message += `Diferença no número de transações: ${transactionsDifference}.`;
    }
  }

  return {
    isTotalValueConsistent,
    fornecedoresTotalValue,
    transacoesTotalValue,
    valueDifference,
    isTotalTransactionsConsistent,
    fornecedoresTotalTransactions,
    transacoesTotalTransactions,
    transactionsDifference,
    message
  };
}
