import { useState } from 'react'

export function useFornecedoresFilters() {
  const [activeTab, setActiveTab] = useState('lista')
  const [showCategoriaSelection, setShowCategoriaSelection] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)

  const abas = [
    { id: 'lista', nome: 'Lista', icone: '📋' },
    { id: 'estatisticas', nome: 'Estatísticas', icone: '📊' },
    { id: 'export', nome: 'Export', icone: '📥' }
  ]

  const navegarParaAba = (abaId: string) => {
    setActiveTab(abaId)
  }

  const toggleCategoriaSelection = () => {
    setShowCategoriaSelection(prev => !prev)
  }

  const aplicarFiltroRapido = (tipo: 'suspeitos' | 'alto-valor' | 'muitas-transacoes' | 'poucos-deputados') => {
    return {
      filtroAplicado: tipo,
      configuracao: {
        'suspeitos': { filtroScore: 'alto', ordenacao: 'score-desc' },
        'alto-valor': { filtroValor: 'acima500k', ordenacao: 'valor-desc' },
        'muitas-transacoes': { filtroTransacoes: 'muitas', ordenacao: 'transacoes-desc' },
        'poucos-deputados': { filtroDeputados: 'poucos', ordenacao: 'score-desc' }
      }[tipo]
    }
  }

  const limparFiltrosVisuais = () => {
    setShowCategoriaSelection(false)
    setLoadingExport(false)
  }

  const opcoesOrdenacao = [
    { valor: 'score-desc', nome: 'Score (Maior → Menor)' },
    { valor: 'score-asc', nome: 'Score (Menor → Maior)' },
    { valor: 'valor-desc', nome: 'Valor (Maior → Menor)' },
    { valor: 'valor-asc', nome: 'Valor (Menor → Maior)' },
    { valor: 'nome-asc', nome: 'Nome (A → Z)' },
    { valor: 'nome-desc', nome: 'Nome (Z → A)' },
    { valor: 'transacoes-desc', nome: 'Transações (Mais → Menos)' },
    { valor: 'transacoes-asc', nome: 'Transações (Menos → Mais)' }
  ]

  const opcoesScore = [
    { valor: 'todos', nome: 'Todos os Scores' },
    { valor: 'alto', nome: 'Score Alto/Crítico' },
    { valor: 'medio', nome: 'Score Médio' },
    { valor: 'baixo', nome: 'Score Baixo' }
  ]

  const opcoesValor = [
    { valor: 'todos', nome: 'Todos os Valores' },
    { valor: 'ate10k', nome: 'Até R$ 10.000' },
    { valor: '10k-50k', nome: 'R$ 10.000 - R$ 50.000' },
    { valor: '50k-100k', nome: 'R$ 50.000 - R$ 100.000' },
    { valor: '100k-500k', nome: 'R$ 100.000 - R$ 500.000' },
    { valor: 'acima500k', nome: 'Acima de R$ 500.000' }
  ]

  const opcoesTransacoes = [
    { valor: 'todas', nome: 'Todas as Quantidades' },
    { valor: 'poucas', nome: 'Poucas (≤ 5)' },
    { valor: 'normais', nome: 'Normais (6-20)' },
    { valor: 'muitas', nome: 'Muitas (> 20)' }
  ]

  const opcoesDeputados = [
    { valor: 'todos', nome: 'Todos' },
    { valor: 'poucos', nome: 'Poucos (≤ 2)' },
    { valor: 'normais', nome: 'Normais (3-10)' },
    { valor: 'muitos', nome: 'Muitos (> 10)' }
  ]

  return {
    activeTab,
    setActiveTab,
    showCategoriaSelection,
    setShowCategoriaSelection,
    loadingExport,
    setLoadingExport,
    
    abas,
    opcoesOrdenacao,
    opcoesScore,
    opcoesValor,
    opcoesTransacoes,
    opcoesDeputados,
    
    navegarParaAba,
    toggleCategoriaSelection,
    aplicarFiltroRapido,
    limparFiltrosVisuais
  }
}