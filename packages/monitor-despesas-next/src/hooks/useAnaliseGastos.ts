import { useCallback } from 'react'


export function useAnaliseGastos() {

  const obterUltimaAnalise = useCallback(() => {
    try {
      const data = localStorage.getItem('ultima-analise')
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error("Erro ao parsear ultima-analise do localStorage:", error)
      return null
    }
  }, [])


  return {
    obterUltimaAnalise,
  }
}
