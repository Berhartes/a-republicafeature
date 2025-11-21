/**
 * Error Boundaries para o sistema de fornecedores
 * Exporta todos os error boundaries disponíveis
 */

export { 
  FornecedoresErrorBoundary, 
  FornecedoresErrorWrapper,
  useFornecedoresErrorBoundary 
} from './FornecedoresErrorBoundary'

export { 
  DataLoadingErrorBoundary, 
  DataLoadingErrorWrapper 
} from './DataLoadingErrorBoundary'

// Re-export types if needed
export type { ErrorInfo } from 'react'