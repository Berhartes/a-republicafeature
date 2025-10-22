import { useState, useEffect } from 'react'
import { Configuracoes, LimitesAnalise } from '@/types'

const configuracoesDefault: Configuracoes = {
  notificacoes: true,
  alertasAutomaticos: true,
  temaEscuro: false,
  idiomaPortugues: true,
  exportarComGraficos: true,
  salvarNuvem: false,
  analiseTempReal: false,
  limitesPersonalizados: false
}

const limitesDefault: LimitesAnalise = {
  limiteMensal: 45000,
  limiteCombustivel: 1000,
  limiteAbastecimento: 2000,
  minDeputadosFornecedor: 5
}

export function useConfiguracoes() {
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(configuracoesDefault)
  const [limites, setLimites] = useState<LimitesAnalise>(limitesDefault)
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    try {
      const configSalvas = localStorage.getItem('configuracoes')
      if (configSalvas) {
        setConfiguracoes(JSON.parse(configSalvas))
      }

      const limitesSalvos = localStorage.getItem('limites-analise')
      if (limitesSalvos) {
        setLimites(JSON.parse(limitesSalvos))
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setCarregado(true)
    }
  }, [])

  const salvarConfiguracoes = (novasConfiguracoes: Partial<Configuracoes>) => {
    const configAtualizadas = { ...configuracoes, ...novasConfiguracoes }
    setConfiguracoes(configAtualizadas)
    localStorage.setItem('configuracoes', JSON.stringify(configAtualizadas))
  }

  const salvarLimites = (novosLimites: Partial<LimitesAnalise>) => {
    const limitesAtualizados = { ...limites, ...novosLimites }
    setLimites(limitesAtualizados)
    localStorage.setItem('limites-analise', JSON.stringify(limitesAtualizados))
  }

  const resetConfiguracoes = () => {
    setConfiguracoes(configuracoesDefault)
    setLimites(limitesDefault)
    localStorage.removeItem('configuracoes')
    localStorage.removeItem('limites-analise')
  }

  useEffect(() => {
    if (carregado) {
      if (configuracoes.temaEscuro) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [configuracoes.temaEscuro, carregado])

  return {
    configuracoes,
    limites,
    carregado,
    salvarConfiguracoes,
    salvarLimites,
    resetConfiguracoes
  }
}
