import { useState, useMemo } from 'react'
import type { DeputadoComparisonData, SortConfig, Metrica } from './useCompararDeputadosData.js'

export function useCompararDeputadosFilters() {
  const [metricaSelecionada, setMetricaSelecionada] = useState<Metrica>('gastos')
  const [categoriaEvolucao, setCategoriaEvolucao] = useState<string>('TODOS')
  const [anoEvolucao, setAnoEvolucao] = useState<number>(new Date().getFullYear())
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'totalGasto', direction: 'desc' })

  const handleMetricaChange = (metrica: Metrica) => {
    setMetricaSelecionada(metrica)
    
    switch (metrica) {
      case 'gastos':
        setSortConfig({ key: 'totalGasto', direction: 'desc' })
        break
      case 'alertas':
        setSortConfig({ key: 'numAlertas', direction: 'desc' })
        break
      case 'ranking':
        setSortConfig({ key: 'scoreSuspeicao', direction: 'desc' })
        break
      default:
        setSortConfig({ key: 'totalGasto', direction: 'desc' })
    }
  }

  const handleCategoriaEvolucaoChange = (categoria: string) => {
    setCategoriaEvolucao(categoria)
  }

  const handleAnoEvolucaoChange = (ano: number) => {
    setAnoEvolucao(ano)
  }

  const handleSort = (key: keyof DeputadoComparisonData) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const sortData = (data: DeputadoComparisonData[]): DeputadoComparisonData[] => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' 
          ? aValue - bValue
          : bValue - aValue
      }
      
      return 0
    })
  }

  const resetFilters = () => {
    setMetricaSelecionada('gastos')
    setCategoriaEvolucao('TODOS')
    setAnoEvolucao(new Date().getFullYear())
    setSortConfig({ key: 'totalGasto', direction: 'desc' })
  }

  const metricasDisponiveis = useMemo(() => [
    { value: 'gastos', label: 'Gastos Totais', icon: '💰' },
    { value: 'alertas', label: 'Alertas', icon: '⚠️' },
    { value: 'categorias', label: 'Categorias', icon: '📊' },
    { value: 'evolucao', label: 'Evolução', icon: '📈' },
    { value: 'ranking', label: 'Ranking', icon: '🏆' }
  ] as const, [])

  const categoriasDisponiveis = useMemo(() => [
    { value: 'TODOS', label: 'Todas as categorias' },
    { value: 'ALIMENTACAO', label: 'Alimentação' },
    { value: 'COMBUSTIVEL', label: 'Combustível' },
    { value: 'CONSULTORIA', label: 'Consultoria' },
    { value: 'DIVULGACAO', label: 'Divulgação' },
    { value: 'HOSPEDAGEM', label: 'Hospedagem' },
    { value: 'LOCOMOCAO', label: 'Locomoção' },
    { value: 'MANUTENCAO', label: 'Manutenção' },
    { value: 'PARTICIPACAO', label: 'Participação' },
    { value: 'PASSAGEM', label: 'Passagem' },
    { value: 'POSTAL', label: 'Postal' },
    { value: 'SEGURANCA', label: 'Segurança' },
    { value: 'TELEFONIA', label: 'Telefonia' }
  ], [])

  const anosDisponiveis = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 7 }, (_, i) => currentYear - i)
  }, [])

  const hasActiveFilters = useMemo(() => {
    return (
      metricaSelecionada !== 'gastos' ||
      categoriaEvolucao !== 'TODOS' ||
      anoEvolucao !== new Date().getFullYear()
    )
  }, [metricaSelecionada, categoriaEvolucao, anoEvolucao])

  const filterSummary = useMemo(() => {
    const filters = []
    
    if (metricaSelecionada !== 'gastos') {
      const metrica = metricasDisponiveis.find(m => m.value === metricaSelecionada)
      filters.push(`Métrica: ${metrica?.label}`)
    }
    
    if (categoriaEvolucao !== 'TODOS') {
      filters.push(`Categoria: ${categoriaEvolucao}`)
    }
    
    if (anoEvolucao !== new Date().getFullYear()) {
      filters.push(`Ano: ${anoEvolucao}`)
    }
    
    return filters
  }, [metricaSelecionada, categoriaEvolucao, anoEvolucao, metricasDisponiveis])

  return {
    metricaSelecionada,
    categoriaEvolucao,
    anoEvolucao,
    sortConfig,
    
    hasActiveFilters,
    filterSummary,
    
    metricasDisponiveis,
    categoriasDisponiveis,
    anosDisponiveis,
    
    setMetricaSelecionada: handleMetricaChange,
    setCategoriaEvolucao: handleCategoriaEvolucaoChange,
    setAnoEvolucao: handleAnoEvolucaoChange,
    handleSort,
    
    sortData,
    resetFilters,
    
    setMetricaSelecionadaDirect: setMetricaSelecionada,
    setCategoriaEvolucaoDirect: setCategoriaEvolucao,
    setAnoEvolucaoDirect: setAnoEvolucao,
    setSortConfigDirect: setSortConfig,
    
    filters: {
      metricaSelecionada,
      categoriaEvolucao,
      anoEvolucao,
      sortConfig
    }
  }
}