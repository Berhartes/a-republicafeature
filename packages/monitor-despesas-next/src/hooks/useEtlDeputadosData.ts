
import { useState, useEffect, useCallback } from 'react'
import { etlCacheService } from '@/services/etl-cache.service'
import {
  DeputadoProcessado,
  RankingDeputados,
  PremiacoesProcessadas,
  EtlCacheStatus,
  EtlSearchResult
} from '@/types/etl-deputados.types'

export interface UseEtlDeputadosDataReturn {
  deputados: DeputadoProcessado[]
  loading: boolean
  error: string | null

  rankings: RankingDeputados | null
  premiacoes: PremiacoesProcessadas | null

  cacheStatus: EtlCacheStatus

  carregarDeputados: () => Promise<void>
  carregarRankings: () => Promise<void>
  carregarPremiacoes: () => Promise<void>
  buscarDeputado: (id: string) => Promise<DeputadoProcessado | null>
  limparCache: () => void

  totalDeputados: number
  totalGastos: number
  mediaGastos: number

  partidosDisponiveis: string[]
  ufsDisponiveis: string[]
  anosDisponiveis: number[]

  ultimaAtualizacao: Date | null
  fonteAtual: string
}

export function useEtlDeputadosData(): UseEtlDeputadosDataReturn {
  const [deputados, setDeputados] = useState<DeputadoProcessado[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [rankings, setRankings] = useState<RankingDeputados | null>(null)
  const [premiacoes, setPremiacoes] = useState<PremiacoesProcessadas | null>(null)
  const [cacheStatus, setCacheStatus] = useState<EtlCacheStatus>({
    connected: false,
    lastUpdate: null,
    totalDeputados: 0,
    anosDisponiveis: [],
    source: 'none',
    dataAge: 'Nunca'
  })

  const carregarDeputados = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 [useEtlDeputadosData] Iniciando carregamento de deputados...')

      const result: EtlSearchResult = await etlCacheService.buscarTodosDeputados()

      console.log(`✅ [useEtlDeputadosData] ${result.deputados.length} deputados carregados (fonte: ${result.source})`)

      console.log(`✅ [useEtlDeputadosData] Setando ${result.deputados.length} deputados no estado`)
      setDeputados(result.deputados)
      setCacheStatus(etlCacheService.getStatus())

      try {
        localStorage.setItem('deputados_etl_backup', JSON.stringify(result.deputados))
      } catch (storageError) {
        console.warn('⚠️ [useEtlDeputadosData] Não foi possível salvar backup no localStorage')
      }

    } catch (err) {
      console.error('❌ [useEtlDeputadosData] Erro ao carregar deputados:', err)
      setError('Erro ao carregar dados de deputados')

      await carregarBackupLocalStorage()

    } finally {
      setLoading(false)
    }
  }, [])

  const carregarRankings = useCallback(async () => {
    try {
      console.log('🔄 [useEtlDeputadosData] Gerando rankings...')

      const rankingsData = await etlCacheService.gerarRankings()
      setRankings(rankingsData)

      console.log('✅ [useEtlDeputadosData] Rankings gerados com sucesso')

    } catch (err) {
      console.error('❌ [useEtlDeputadosData] Erro ao gerar rankings:', err)
      setError('Erro ao gerar rankings')
    }
  }, [])

  const carregarPremiacoes = useCallback(async () => {
    try {
      console.log('🔄 [useEtlDeputadosData] Gerando premiações...')

      const premiacoesData = await etlCacheService.gerarPremiacoes()
      setPremiacoes(premiacoesData)

      console.log('✅ [useEtlDeputadosData] Premiações geradas com sucesso')

    } catch (err) {
      console.error('❌ [useEtlDeputadosData] Erro ao gerar premiações:', err)
      setError('Erro ao gerar premiações')
    }
  }, [])

  const buscarDeputado = useCallback(async (id: string): Promise<DeputadoProcessado | null> => {
    try {
      console.log(`🔍 [useEtlDeputadosData] Buscando deputado ${id}...`)

      const deputado = await etlCacheService.buscarDeputado(id)

      if (deputado) {
        console.log(`✅ [useEtlDeputadosData] Deputado ${deputado.nome} encontrado`)
      } else {
        console.log(`⚠️ [useEtlDeputadosData] Deputado ${id} não encontrado`)
      }

      return deputado
    } catch (err) {
      console.error(`❌ [useEtlDeputadosData] Erro ao buscar deputado ${id}:`, err)
      return null
    }
  }, [])

  const limparCache = useCallback(() => {
    etlCacheService.limparCache()
    setCacheStatus(etlCacheService.getStatus())
    console.log('🗑️ [useEtlDeputadosData] Cache limpo')
  }, [])

  const carregarBackupLocalStorage = useCallback(async () => {
    try {
      const backup = localStorage.getItem('deputados_etl_backup')
      if (backup) {
        const deputadosBackup = JSON.parse(backup)
        setDeputados(deputadosBackup)
        console.log(`🔄 [useEtlDeputadosData] ${deputadosBackup.length} deputados carregados do backup`)
      }
    } catch (backupError) {
      console.error('❌ [useEtlDeputadosData] Erro ao carregar backup:', backupError)
    }
  }, [])

  useEffect(() => {
    carregarDeputados()
  }, [carregarDeputados])

  const totalDeputados = deputados.length
  const totalGastos = deputados.reduce((sum, d) => sum + d.totalGastos, 0)
  const mediaGastos = totalDeputados > 0 ? totalGastos / totalDeputados : 0

  const partidosDisponiveis = [...new Set(deputados.map(d => d.siglaPartido))].filter(Boolean).sort()
  const ufsDisponiveis = [...new Set(deputados.map(d => d.siglaUf))].filter(Boolean).sort()
  const anosDisponiveis = [2023, 2024, 2025]

  const ultimaAtualizacao = cacheStatus.lastUpdate

  return {
    deputados,
    loading,
    error,

    rankings,
    premiacoes,

    cacheStatus,

    carregarDeputados,
    carregarRankings,
    carregarPremiacoes,
    buscarDeputado,
    limparCache,

    totalDeputados,
    totalGastos,
    mediaGastos,

    partidosDisponiveis,
    ufsDisponiveis,
    anosDisponiveis,

    ultimaAtualizacao,
    fonteAtual: cacheStatus.source
  }
}