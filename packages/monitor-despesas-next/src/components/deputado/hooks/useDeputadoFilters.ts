import { useState, useEffect, useMemo } from 'react'

export interface DeputadoFilters {
  activeTab: string
  
  categoriaEvolucao: string
  filtroFornecedorCategoria: string
  categoriaTransacaoSelecionada: string
  
  loadingComparativo: boolean
  loadingRelacoes: boolean
  loadingFornecedores: boolean
}

export function useDeputadoFilters() {
  const [activeTab, setActiveTab] = useState('visao-geral')
  
  const [categoriaEvolucao, setCategoriaEvolucao] = useState<string>('TODOS')
  const [filtroFornecedorCategoria, setFiltroFornecedorCategoria] = useState<string>('TODAS')
  const [categoriaTransacaoSelecionada, setCategoriaTransacaoSelecionada] = useState<string>('todas')
  
  const [loadingComparativo, setLoadingComparativo] = useState(false)
  const [loadingRelacoes, setLoadingRelacoes] = useState(false)
  const [loadingFornecedores, setLoadingFornecedores] = useState(false)

  const abas = [
    { id: 'visao-geral', nome: 'Visão Geral', icone: '📊' },
    { id: 'transacoes', nome: 'Transações', icone: '💰' },
    { id: 'fornecedores', nome: 'Fornecedores', icone: '🏢' },
    { id: 'evolucao', nome: 'Evolução', icone: '📈' },
    { id: 'comparativo', nome: 'Comparativo', icone: '⚖️' },
    { id: 'relacoes', nome: 'Relacionamentos', icone: '🌐' },
    { id: 'premiacoes', nome: 'Premiações', icone: '🏆' }
  ]

  const navegarParaAba = (abaId: string) => {
    console.log('🔄 [useDeputadoFilters] Navegando para aba:', abaId)
    setActiveTab(abaId)
    
    if (abaId === 'evolucao') {
      setCategoriaEvolucao('TODOS')
    }
    if (abaId === 'fornecedores') {
      setFiltroFornecedorCategoria('TODAS')
    }
    if (abaId === 'transacoes') {
      setCategoriaTransacaoSelecionada('todas')
    }
  }

  const resetarFiltros = () => {
    console.log('🔄 [useDeputadoFilters] Resetando filtros')
    setCategoriaEvolucao('TODOS')
    setFiltroFornecedorCategoria('TODAS')
    setCategoriaTransacaoSelecionada('todas')
  }

  const abaRequerCarregamento = (abaId: string): boolean => {
    return ['comparativo', 'relacoes', 'fornecedores'].includes(abaId)
  }

  const abaAtual = useMemo(() => {
    return abas.find(aba => aba.id === activeTab) || abas[0]
  }, [activeTab])

  const filtrosAtivos = useMemo(() => {
    const filtros: string[] = []
    
    if (categoriaEvolucao !== 'TODOS') {
      filtros.push(`Categoria: ${categoriaEvolucao}`)
    }
    if (filtroFornecedorCategoria !== 'TODAS') {
      filtros.push(`Fornecedor: ${filtroFornecedorCategoria}`)
    }
    if (categoriaTransacaoSelecionada !== 'todas') {
      filtros.push(`Transação: ${categoriaTransacaoSelecionada}`)
    }
    
    return filtros
  }, [categoriaEvolucao, filtroFornecedorCategoria, categoriaTransacaoSelecionada])

  useEffect(() => {
    console.log('📍 [useDeputadoFilters] Aba ativa mudou:', { 
      aba: activeTab, 
      requerCarregamento: abaRequerCarregamento(activeTab),
      filtrosAtivos: filtrosAtivos.length 
    })
  }, [activeTab, filtrosAtivos])

  return {
    activeTab,
    setActiveTab,
    navegarParaAba,
    abas,
    abaAtual,
    
    categoriaEvolucao,
    setCategoriaEvolucao,
    filtroFornecedorCategoria,
    setFiltroFornecedorCategoria,
    categoriaTransacaoSelecionada,
    setCategoriaTransacaoSelecionada,
    
    loadingComparativo,
    setLoadingComparativo,
    loadingRelacoes,
    setLoadingRelacoes,
    loadingFornecedores,
    setLoadingFornecedores,
    
    resetarFiltros,
    abaRequerCarregamento,
    filtrosAtivos,
    
    filtros: {
      activeTab,
      categoriaEvolucao,
      filtroFornecedorCategoria,
      categoriaTransacaoSelecionada,
      loadingComparativo,
      loadingRelacoes,
      loadingFornecedores
    } as DeputadoFilters
  }
}