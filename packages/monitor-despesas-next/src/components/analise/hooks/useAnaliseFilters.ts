import { useState } from 'react'

export function useAnaliseFilters() {
  const [mostrarTodosFornecedores, setMostrarTodosFornecedores] = useState(false)
  const [filtroRisco, setFiltroRisco] = useState<'todos' | 'baixo' | 'medio' | 'alto'>('todos')
  const [ordenacaoFornecedores, setOrdenacaoFornecedores] = useState<'nome' | 'valor' | 'risco' | 'transacoes'>('valor')

  const [filtroPartido, setFiltroPartido] = useState('TODOS')
  const [filtroUF, setFiltroUF] = useState('TODAS')
  const [ordenacaoDeputados, setOrdenacaoDeputados] = useState<'nome' | 'gasto' | 'transacoes' | 'risco'>('gasto')

  const [activeTab, setActiveTab] = useState('visao-geral')
  const [loadingExport, setLoadingExport] = useState(false)

  const abas = [
    { id: 'visao-geral', nome: 'Visão Geral', icone: '📊' },
    { id: 'deputados', nome: 'Deputados', icone: '👤' },
    { id: 'fornecedores', nome: 'Fornecedores', icone: '🏢' },
    { id: 'relatorios', nome: 'Relatórios', icone: '📋' }
  ]

  const navegarParaAba = (abaId: string) => {
    setActiveTab(abaId)
  }

  const resetarFiltros = () => {
    setFiltroRisco('todos')
    setOrdenacaoFornecedores('valor')
    setFiltroPartido('TODOS')
    setFiltroUF('TODAS')
    setOrdenacaoDeputados('gasto')
    setMostrarTodosFornecedores(false)
  }

  const aplicarFiltroRapido = (tipo: 'alto-risco' | 'maior-gasto' | 'mais-transacoes') => {
    switch (tipo) {
      case 'alto-risco':
        setFiltroRisco('alto')
        setOrdenacaoFornecedores('risco')
        setOrdenacaoDeputados('risco')
        setActiveTab('fornecedores')
        break
      case 'maior-gasto':
        setOrdenacaoDeputados('gasto')
        setOrdenacaoFornecedores('valor')
        setActiveTab('deputados')
        break
      case 'mais-transacoes':
        setOrdenacaoDeputados('transacoes')
        setOrdenacaoFornecedores('transacoes')
        break
    }
  }

  return {
    mostrarTodosFornecedores,
    setMostrarTodosFornecedores,
    filtroRisco,
    setFiltroRisco,
    ordenacaoFornecedores,
    setOrdenacaoFornecedores,
    filtroPartido,
    setFiltroPartido,
    filtroUF,
    setFiltroUF,
    ordenacaoDeputados,
    setOrdenacaoDeputados,
    
    activeTab,
    setActiveTab,
    loadingExport,
    setLoadingExport,
    
    abas,
    
    navegarParaAba,
    resetarFiltros,
    aplicarFiltroRapido
  }
}