import { useState, useCallback } from 'react'
import { FornecedorStats } from '../types/gastos'
import { fornecedoresETLService } from '../services/fornecedores-etl-service'

export function useFornecedoresReais() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedData, setProcessedData] = useState<FornecedorStats[]>([])
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<'' | 'public-cache' | 'error' | null>(null)

  const processarFornecedores = useCallback(async () => {
    setIsProcessing(true)
    setError(null)
    setSource(null)

    try {
      console.log('🚀 [FornecedoresReais] Iniciando processamento via Sistema ETL...')

      const resultado = await fornecedoresETLService.buscarFornecedores()

      if (resultado.success) {
        console.log(`✅ [FornecedoresReais] ${resultado.total} fornecedores carregados via Sistema ETL`)
        console.log('📊 [FornecedoresReais] Fonte:', resultado.source)
        console.log('📊 [FornecedoresReais] Versão ETL:', resultado.etlVersion || 'N/A')
        console.log('📊 [FornecedoresReais] Amostra:',
          resultado.data.slice(0, 3).map(f => ({
            cnpj: f.cnpj.substring(0, 14),
            nome: f.nome.substring(0, 30),
            total: f.totalRecebido || f.totalTransacionado || 0
          }))
        )

        setProcessedData(resultado.data)
        setSource(resultado.source === '-etl' ? '' : resultado.source === 'public-cache' ? 'public-cache' : 'error')

        return {
          success: true,
          totalFornecedores: resultado.total,
          fornecedores: resultado.data,
          message: resultado.message,
          source: resultado.source === '-etl' ? '' : resultado.source
        }
      } else {
        throw new Error(resultado.message)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
      console.error('❌ [FornecedoresReais] Erro:', errorMessage)
      setError(errorMessage)
      setSource('error')

      return {
        success: false,
        totalFornecedores: 0,
        fornecedores: [],
        message: `❌ Erro: ${errorMessage}`,
        source: 'error'
      }
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const testarConectividade = useCallback(async () => {
    try {
      console.log('🔍 [FornecedoresReais] Testando conectividade via Sistema ETL...')
      const resultados = await fornecedoresETLService.testarConectividade()

      console.log('📊 [FornecedoresReais] Resultados dos testes Sistema ETL:', resultados)
      return {
        api: resultados.api,
        publicCache: resultados.publicCache,
        auth: resultados.auth
      }
    } catch (error) {
      console.error('❌ [FornecedoresReais] Erro no teste Sistema ETL:', error)
      return {
        api: false,
        publicCache: true,
        auth: false
      }
    }
  }, [])

  const salvarBackup = useCallback(async () => {
    if (!processedData || processedData.length === 0) {
      throw new Error('Nenhum dado para fazer backup')
    }

    try {
      console.log('💾 [FornecedoresReais] Iniciando backup...')

      const backup = {
        timestamp: new Date().toISOString(),
        totalFornecedores: processedData.length,
        fonte: 'sistema-etl',
        versaoETL: '3.0.0',
        dados: processedData
      }

      const dataStr = JSON.stringify(backup, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = `backup-fornecedores-sistema-etl-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      console.log('✅ [FornecedoresReais] Backup salvo com sucesso')
      return true

    } catch (error) {
      console.error('❌ [FornecedoresReais] Erro ao salvar backup:', error)
      throw new Error(`Falha ao salvar backup: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [processedData])

  return {
    processarFornecedores,
    testarConectividade,
    salvarBackup,
    isProcessing,
    processedData,
    error,
    source,
    totalProcessados: fornecedoresETLService.getTotalProcessados(),
    hasData: fornecedoresETLService.hasData()
  }
}