import { useState, useMemo } from 'react'
import { AlertaSuspeito } from '@/types/gastos'

export interface AlertasFilters {
  filtroTipo: string
  filtroGravidade: string
  buscaTexto: string
  abaSelecionada: string
}

export function useAlertasFilters(
  alertas: AlertaSuspeito[], 
  getTipoLabel: (tipo: string) => string
) {
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')
  const [filtroGravidade, setFiltroGravidade] = useState<string>('TODOS')
  const [buscaTexto, setBuscaTexto] = useState<string>('')
  const [abaSelecionada, setAbaSelecionada] = useState<string>('dashboard')

  const alertasFiltrados = useMemo(() => {
    let filtrados = [...alertas]
    
    if (filtroTipo !== 'TODOS') {
      if (filtroTipo === 'COMBUSTIVEL') {
        filtrados = filtrados.filter((a: AlertaSuspeito) => {
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
      } else {
        filtrados = filtrados.filter((a: AlertaSuspeito) => a.tipo === filtroTipo)
      }
    }
    
    if (filtroGravidade !== 'TODOS') {
      filtrados = filtrados.filter((a: AlertaSuspeito) => a.gravidade === filtroGravidade)
    }
    
    if (buscaTexto.trim()) {
      const termo = buscaTexto.toLowerCase()
      filtrados = filtrados.filter((a: AlertaSuspeito) => 
        a.deputado.toLowerCase().includes(termo) ||
        a.descricao.toLowerCase().includes(termo) ||
        getTipoLabel(a.tipo).toLowerCase().includes(termo) ||
        (a.detalhes?.fornecedor && a.detalhes.fornecedor.toLowerCase().includes(termo))
      )
    }
    
    return filtrados
  }, [alertas, filtroTipo, filtroGravidade, buscaTexto, getTipoLabel])

  const resetFilters = () => {
    setFiltroTipo('TODOS')
    setFiltroGravidade('TODOS')
    setBuscaTexto('')
  }

  const aplicarFiltroTipo = (tipo: string) => {
    setFiltroTipo(tipo)
  }

  const aplicarFiltroGravidade = (gravidade: string) => {
    setFiltroGravidade(gravidade)
  }

  const buscarTexto = (texto: string) => {
    setBuscaTexto(texto)
  }

  const trocarAba = (aba: string) => {
    setAbaSelecionada(aba)
  }

  const tiposDisponiveis = useMemo(() => {
    const tipos = [...new Set(alertas.map(a => a.tipo))]
    return [
      { value: 'TODOS', label: 'Todos os tipos' },
      { value: 'COMBUSTIVEL', label: 'Combustível' },
      ...tipos.map(tipo => ({
        value: tipo,
        label: getTipoLabel(tipo)
      }))
    ]
  }, [alertas, getTipoLabel])

  const gravidadesDisponiveis = [
    { value: 'TODOS', label: 'Todas as gravidades' },
    { value: 'ALTA', label: 'Alta' },
    { value: 'MEDIA', label: 'Média' },
    { value: 'BAIXA', label: 'Baixa' }
  ]

  const filtrosStats = useMemo(() => {
    return {
      totalOriginal: alertas.length,
      totalFiltrado: alertasFiltrados.length,
      percentualFiltrado: alertas.length > 0 ? (alertasFiltrados.length / alertas.length) * 100 : 0
    }
  }, [alertas.length, alertasFiltrados.length])

  return {
    filtroTipo,
    filtroGravidade,
    buscaTexto,
    abaSelecionada,
    
    alertasFiltrados,
    
    tiposDisponiveis,
    gravidadesDisponiveis,
    
    filtrosStats,
    
    setFiltroTipo: aplicarFiltroTipo,
    setFiltroGravidade: aplicarFiltroGravidade,
    setBuscaTexto: buscarTexto,
    setAbaSelecionada: trocarAba,
    resetFilters,
    
    filters: {
      filtroTipo,
      filtroGravidade,
      buscaTexto,
      abaSelecionada
    }
  }
}