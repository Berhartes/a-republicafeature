import { useMemo } from 'react'
import { useGlobalData } from '@/contexts/GlobalDataContext'
import { AlertaSuspeito } from '@/types/gastos'



export interface AlertasMetrics {
  total: number
  alta: number
  media: number
  baixa: number
  valorTotal: number
  deputadosUnicos: number
  porTipo: Record<string, number>
  combustivel: {
    total: number
    extremo: number
    alto: number
    moderado: number
    valorTotal: number
    topDeputados: DeputadoAlertaCombustivel[]
  }
}

interface DeputadoAlertaCombustivel {
  nome: string;
  alertas: number;
  valorTotal: number;
  extremos: number;
  deputadoId: string;
}

export function useAlertasData() {
  const { state, isLoading: loading, error, refetch, isConnected } = useGlobalData()
  
  
  
  const alertas = useMemo(() => {
    const alertasData = state?.alertas || []
    console.log('useAlertasData - Alertas processados:', alertasData.length)
    return alertasData
  }, [state?.alertas])

  const getTipoLabel = useMemo(() => {
    return (tipo: string) => {
      const labels: Record<string, string> = {
        'SUPERFATURAMENTO': 'Superfaturamento',
        'LIMITE_EXCEDIDO': 'Limite Excedido',
        'FORNECEDOR_SUSPEITO': 'Fornecedor Suspeito',
        'CONCENTRACAO_TEMPORAL': 'Concentração Temporal',
        'VALOR_REPETIDO': 'Valor Repetido'
      }
      return labels[tipo] || tipo
    }
  }, [])

  const metricas = useMemo((): AlertasMetrics => {
    const total = alertas.length
    const alta = alertas.filter((a: any) => a.gravidade === 'ALTA').length
    const media = alertas.filter((a: any) => a.gravidade === 'MEDIA').length
    const baixa = alertas.filter((a: any) => a.gravidade === 'BAIXA').length
    
    const valorTotal = alertas.reduce((sum: number, a: any) => sum + (a.valor || 0), 0)
    const deputadosUnicos = new Set(alertas.map((a: any) => a.deputadoId)).size
    
    const porTipo = alertas.reduce((acc: Record<string, number>, a: any) => {
      acc[a.tipo] = (acc[a.tipo] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const alertasCombustivel = alertas.filter((a: any) => {
      const descricaoLower = (a.descricao || '').toLowerCase()
      const fornecedorLower = (a.detalhes?.fornecedor || '').toLowerCase()
      
      return a.tipo === 'SUPERFATURAMENTO' && (
        descricaoLower.includes('combustível') || 
        descricaoLower.includes('combustivel') ||
        descricaoLower.includes('abastecimento') ||
        descricaoLower.includes('lubrificante') ||
        descricaoLower.includes('gasolina') ||
        descricaoLower.includes('diesel') ||
        descricaoLower.includes('etanol') ||
        
        fornecedorLower.includes('posto') ||
        fornecedorLower.includes('shell') ||
        fornecedorLower.includes('petrobras') ||
        fornecedorLower.includes('ipiranga') ||
        fornecedorLower.includes('br distribuidora') ||
        fornecedorLower.includes('ale combustíveis') ||
        fornecedorLower.includes('combustível') ||
        fornecedorLower.includes('combustivel')
      )
    })
    
    const combustivelExtremo = alertasCombustivel.filter((a: any) => {
      return (a.valor || 0) > 3000
    }).length
    
    const combustivelAlto = alertasCombustivel.filter((a: any) => {
      return (a.valor || 0) > 1500 && (a.valor || 0) <= 3000
    }).length
    
    const combustivelModerado = alertasCombustivel.filter((a: any) => {
      return (a.valor || 0) > 800 && (a.valor || 0) <= 1500
    }).length
    
    const combustivelTotal = alertasCombustivel.reduce((sum: number, a: any) => sum + (a.valor || 0), 0)
    
    const deputadosCombustivel = alertasCombustivel.reduce((acc: Record<string, DeputadoAlertaCombustivel>, a: any) => {
      const deputado = a.deputado
      if (!acc[deputado]) {
        acc[deputado] = { 
          nome: deputado, 
          alertas: 0, 
          valorTotal: 0, 
          extremos: 0,
          deputadoId: a.deputadoId 
        }
      }
      acc[deputado].alertas += 1
      acc[deputado].valorTotal += (a.valor || 0)
      if ((a.valor || 0) > 2000) acc[deputado].extremos += 1
      return acc
    }, {} as Record<string, DeputadoAlertaCombustivel>)
    
    const topDeputadosCombustivel = (Object.values(deputadosCombustivel) as DeputadoAlertaCombustivel[])
      .sort((a: DeputadoAlertaCombustivel, b: DeputadoAlertaCombustivel) => b.valorTotal - a.valorTotal)
      .slice(0, 5)
    
    return {
      total,
      alta,
      media,
      baixa,
      valorTotal,
      deputadosUnicos,
      porTipo,
      combustivel: {
        total: alertasCombustivel.length,
        extremo: combustivelExtremo,
        alto: combustivelAlto,
        moderado: combustivelModerado,
        valorTotal: combustivelTotal,
        topDeputados: topDeputadosCombustivel
      }
    }
  }, [alertas])

  const exportarAlertas = () => {
    const dados = alertas.map((alerta: AlertaSuspeito) => ({
      'ID': alerta.id,
      'Deputado': alerta.deputado,
      'Tipo': getTipoLabel(alerta.tipo),
      'Gravidade': alerta.gravidade,
      'Descrição': alerta.descricao,
      'Valor': alerta.valor,
      'Data': alerta.dataDeteccao, // Corrected: Use dataDeteccao
      'Fornecedor': alerta.detalhes?.fornecedor || ''
    }))

    const csv = [
      Object.keys(dados[0] || {}).join(','),
      ...dados.map(linha => Object.values(linha).map(valor => 
        typeof valor === 'string' && valor.includes(',') ? `"${valor}"` : valor
      ).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `alertas_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    alertas,
    loading,
    error,
    isConnected,
    
    metricas,
    
    refetch,
    exportarAlertas,
    getTipoLabel
  }
}