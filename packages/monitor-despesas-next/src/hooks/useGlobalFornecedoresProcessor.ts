import { useState, useEffect } from 'react'
import { type FornecedorStats, fornecedoresService } from '@/services/fornecedores-service'
import { useGlobalData } from '@/contexts/GlobalDataContext'

export interface GlobalFornecedoresProcessorState {
  fornecedores: FornecedorStats[]
  loading: boolean
  error: string | null
  estatisticas: {
    total: number
    totalTransacionado: number
    comAlertas: number
    percentualComAlertas: number
  }
}

export function useGlobalFornecedoresProcessor(): GlobalFornecedoresProcessorState {
  const { state } = useGlobalData()
  const [fornecedores, setFornecedores] = useState<FornecedorStats[]>([])

  useEffect(() => {
    // Extract fornecedores from analiseCompleta if available
    if (!state.loading && state.analiseCompleta?.fornecedoresSuspeitos) {
      const fornecedoresArray = (state.analiseCompleta.fornecedoresSuspeitos as any[]) || []
      fornecedoresService.setFornecedores(fornecedoresArray as FornecedorStats[])
      setFornecedores(fornecedoresArray as FornecedorStats[])
    } else if (!state.loading && state.fornecedoresSuspeitos) {
      const fornecedoresArray = (state.fornecedoresSuspeitos as any[]) || []
      fornecedoresService.setFornecedores(fornecedoresArray as FornecedorStats[])
      setFornecedores(fornecedoresArray as FornecedorStats[])
    }
  }, [state.loading, state.analiseCompleta, state.fornecedoresSuspeitos])

  const estatisticas = fornecedoresService.calcularEstatisticas()

  return {
    fornecedores,
    loading: state.loading,
    error: state.error,
    estatisticas
  }
}
