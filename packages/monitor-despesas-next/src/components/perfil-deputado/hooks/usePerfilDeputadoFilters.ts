import { useState, useMemo } from 'react'

export interface PerfilDeputadoFilters {
  activeTab: string
  anoSelecionado: number
  mesSelecionado: string
  categoriaEvolucao: string
  filtroFornecedorCategoria: string
  categoriaTransacaoSelecionada: string
}

export function usePerfilDeputadoFilters(anosDisponiveis: number[] = []) {
  const [activeTab, setActiveTab] = useState('visao-geral')
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2024)
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos')
  const [categoriaEvolucao, setCategoriaEvolucao] = useState<string>('TODOS')
  const [filtroFornecedorCategoria, setFiltroFornecedorCategoria] = useState<string>('TODAS')
  const [categoriaTransacaoSelecionada, setCategoriaTransacaoSelecionada] = useState<string>('todas')

  useMemo(() => {
    if (anosDisponiveis.length > 0 && !anosDisponiveis.includes(anoSelecionado)) {
      setAnoSelecionado(anosDisponiveis[0]) // Selecionar o ano mais recente
    }
  }, [anosDisponiveis, anoSelecionado])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
  }

  const handleAnoChange = (ano: number) => {
    setAnoSelecionado(ano)
    setMesSelecionado('todos')
  }

  const handleMesChange = (mes: string) => {
    setMesSelecionado(mes)
  }

  const handleCategoriaEvolucaoChange = (categoria: string) => {
    setCategoriaEvolucao(categoria)
  }

  const handleFiltroFornecedorCategoriaChange = (categoria: string) => {
    setFiltroFornecedorCategoria(categoria)
  }

  const handleCategoriaTransacaoChange = (categoria: string) => {
    setCategoriaTransacaoSelecionada(categoria)
  }

  const resetFilters = () => {
    setActiveTab('visao-geral')
    setAnoSelecionado(anosDisponiveis[0] || 2024)
    setMesSelecionado('todos')
    setCategoriaEvolucao('TODOS')
    setFiltroFornecedorCategoria('TODAS')
    setCategoriaTransacaoSelecionada('todas')
  }

  const hasActiveFilters = useMemo(() => {
    return (
      mesSelecionado !== 'todos' ||
      categoriaEvolucao !== 'TODOS' ||
      filtroFornecedorCategoria !== 'TODAS' ||
      categoriaTransacaoSelecionada !== 'todas'
    )
  }, [mesSelecionado, categoriaEvolucao, filtroFornecedorCategoria, categoriaTransacaoSelecionada])

  const filterSummary = useMemo(() => {
    const filters = []
    
    if (mesSelecionado !== 'todos') {
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      filters.push(`Mês: ${meses[parseInt(mesSelecionado)]}`)
    }
    
    if (categoriaEvolucao !== 'TODOS') {
      filters.push(`Evolução: ${categoriaEvolucao}`)
    }
    
    if (filtroFornecedorCategoria !== 'TODAS') {
      filters.push(`Fornecedor: ${filtroFornecedorCategoria}`)
    }
    
    if (categoriaTransacaoSelecionada !== 'todas') {
      filters.push(`Transação: ${categoriaTransacaoSelecionada}`)
    }
    
    return filters
  }, [mesSelecionado, categoriaEvolucao, filtroFornecedorCategoria, categoriaTransacaoSelecionada])

  const periodDescription = useMemo(() => {
    if (mesSelecionado === 'todos') {
      return `Ano completo de ${anoSelecionado}`
    } else {
      const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      return `${meses[parseInt(mesSelecionado)]} de ${anoSelecionado}`
    }
  }, [anoSelecionado, mesSelecionado])

  return {
    activeTab,
    anoSelecionado,
    mesSelecionado,
    categoriaEvolucao,
    filtroFornecedorCategoria,
    categoriaTransacaoSelecionada,
    
    hasActiveFilters,
    filterSummary,
    periodDescription,
    
    setActiveTab: handleTabChange,
    setAnoSelecionado: handleAnoChange,
    setMesSelecionado: handleMesChange,
    setCategoriaEvolucao: handleCategoriaEvolucaoChange,
    setFiltroFornecedorCategoria: handleFiltroFornecedorCategoriaChange,
    setCategoriaTransacaoSelecionada: handleCategoriaTransacaoChange,
    
    resetFilters,
    
    setActiveTabDirect: setActiveTab,
    setAnoSelecionadoDirect: setAnoSelecionado,
    setMesSelecionadoDirect: setMesSelecionado,
    setCategoriaEvolucaoDirect: setCategoriaEvolucao,
    setFiltroFornecedorCategoriaDirect: setFiltroFornecedorCategoria,
    setCategoriaTransacaoSelecionadaDirect: setCategoriaTransacaoSelecionada,
    
    filters: {
      activeTab,
      anoSelecionado,
      mesSelecionado, 
      categoriaEvolucao,
      filtroFornecedorCategoria,
      categoriaTransacaoSelecionada
    }
  }
}