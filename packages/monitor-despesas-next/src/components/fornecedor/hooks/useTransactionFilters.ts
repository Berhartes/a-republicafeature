import { useState, useEffect } from 'react'

export function useTransactionFilters() {
  const [filtroOrdenacao, setFiltroOrdenacao] = useState<'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc' | 'deputado'>('data-desc')
  const [filtroDeputado, setFiltroDeputado] = useState<string>('todos')
  const [filtroDataInicio, setFiltroDataInicio] = useState<string>('')
  const [filtroDataFim, setFiltroDataFim] = useState<string>('')
  const [itensPerPage, setItensPerPage] = useState<number>(20)
  const [paginaAtual, setPaginaAtual] = useState<number>(1)
  const [mostrarDuplicatas, setMostrarDuplicatas] = useState<boolean>(false)

  const [anoTransacoesSelecionado, setAnoTransacoesSelecionado] = useState<string>('todos')
  const [expandirAnosTransacoes, setExpandirAnosTransacoes] = useState<boolean>(false)
  const [agruparPorMes, setAgruparPorMes] = useState<boolean>(true)

  const [modalDeputadoAberto, setModalDeputadoAberto] = useState<boolean>(false)
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<any>(null)
  const [transacoesDeputado, setTransacoesDeputado] = useState<any[]>([])
  const [transacoesDeputadoCompletas, setTransacoesDeputadoCompletas] = useState<any[]>([])
  const [anoModalSelecionado, setAnoModalSelecionado] = useState<string>('todos')
  const [expandirAnosModal, setExpandirAnosModal] = useState<boolean>(false)

  const filtrarEOrdenarTransacoes = (transacoes: any[], dadosHistoricos: any[]) => {
    const todasTransacoes = dadosHistoricos.length > 0 ? dadosHistoricos : transacoes
    
    let transacoesFiltradas = todasTransacoes
    if (anoTransacoesSelecionado !== 'todos') {
      const anoNumero = parseInt(anoTransacoesSelecionado)
      transacoesFiltradas = todasTransacoes.filter(transacao => {
        const dataDoc = transacao.dataDocumento || transacao.datEmissao || transacao.dataEmissao
        if (!dataDoc) return false
        
        try {
          const data = dataDoc.toDate ? dataDoc.toDate() : new Date(dataDoc)
          return data.getFullYear() === anoNumero
        } catch {
          return false
        }
      })
    }
    
    if (filtroDeputado !== 'todos') {
      transacoesFiltradas = transacoesFiltradas.filter(transacao => {
        const deputadoNome = transacao.deputadoNome || transacao.nomeDeputado || transacao.txNomeParlamentar || 'N/A'
        return deputadoNome === filtroDeputado
      })
    }
    
    if (filtroDataInicio) {
      const dataInicio = new Date(filtroDataInicio)
      transacoesFiltradas = transacoesFiltradas.filter(transacao => {
        const dataDoc = transacao.dataDocumento || transacao.datEmissao || transacao.dataEmissao
        if (!dataDoc) return false
        
        try {
          const data = dataDoc.toDate ? dataDoc.toDate() : new Date(dataDoc)
          return data >= dataInicio
        } catch {
          return false
        }
      })
    }
    
    if (filtroDataFim) {
      const dataFim = new Date(filtroDataFim)
      transacoesFiltradas = transacoesFiltradas.filter(transacao => {
        const dataDoc = transacao.dataDocumento || transacao.datEmissao || transacao.dataEmissao
        if (!dataDoc) return false
        
        try {
          const data = dataDoc.toDate ? dataDoc.toDate() : new Date(dataDoc)
          return data <= dataFim
        } catch {
          return false
        }
      })
    }
    
    return transacoesFiltradas.sort((a, b) => {
      switch (filtroOrdenacao) {
        case 'data-desc': {
          const dataA = a.dataDocumento || a.datEmissao || a.dataEmissao
          const dataB = b.dataDocumento || b.datEmissao || b.dataEmissao
          if (!dataA && !dataB) return 0
          if (!dataA) return 1
          if (!dataB) return -1
          const dateA = dataA.toDate ? dataA.toDate() : new Date(dataA)
          const dateB = dataB.toDate ? dataB.toDate() : new Date(dataB)
          return dateB.getTime() - dateA.getTime()
        }
        case 'data-asc': {
          const dataA = a.dataDocumento || a.datEmissao || a.dataEmissao
          const dataB = b.dataDocumento || b.datEmissao || b.dataEmissao
          if (!dataA && !dataB) return 0
          if (!dataA) return 1
          if (!dataB) return -1
          const dateA = dataA.toDate ? dataA.toDate() : new Date(dataA)
          const dateB = dataB.toDate ? dataB.toDate() : new Date(dataB)
          return dateA.getTime() - dateB.getTime()
        }
        case 'valor-desc': {
          const valorA = parseFloat((a.valorLiquido || a.vlrLiquido || a.valorDocumento || a.vlrDocumento || 0).toString())
          const valorB = parseFloat((b.valorLiquido || b.vlrLiquido || b.valorDocumento || b.vlrDocumento || 0).toString())
          return valorB - valorA
        }
        case 'valor-asc': {
          const valorA = parseFloat((a.valorLiquido || a.vlrLiquido || a.valorDocumento || a.vlrDocumento || 0).toString())
          const valorB = parseFloat((b.valorLiquido || b.vlrLiquido || b.valorDocumento || b.vlrDocumento || 0).toString())
          return valorA - valorB
        }
        case 'deputado': {
          const nomeA = a.deputadoNome || a.nomeDeputado || a.txNomeParlamentar || 'N/A'
          const nomeB = b.deputadoNome || b.nomeDeputado || b.txNomeParlamentar || 'N/A'
          return nomeA.localeCompare(nomeB)
        }
        default:
          return 0
      }
    })
  }

  const obterDeputadosUnicos = (transacoes: any[]) => {
    const deputados = new Set<string>()
    transacoes.forEach(transacao => {
      const deputadoNome = transacao.deputadoNome || transacao.nomeDeputado || transacao.txNomeParlamentar || 'N/A'
      if (deputadoNome !== 'N/A') {
        deputados.add(deputadoNome)
      }
    })
    return Array.from(deputados).sort()
  }

  const deduplicarTransacoes = (transacoes: any[]) => {
    const transacoesUnicas = new Map()
    const transacoesDuplicadas: any[] = []
    
    transacoes.forEach(transacao => {
      const chave = `${transacao.valorLiquido || transacao.vlrLiquido || transacao.valorDocumento}_${transacao.dataDocumento || transacao.datEmissao}_${transacao.deputadoNome || transacao.nomeDeputado || transacao.txNomeParlamentar}`
      
      if (transacoesUnicas.has(chave)) {
        transacoesDuplicadas.push(transacao)
      } else {
        transacoesUnicas.set(chave, transacao)
      }
    })
    
    return {
      transacoesUnicas: Array.from(transacoesUnicas.values()),
      transacoesDuplicadas
    }
  }

  const abrirModalDeputado = (deputado: any, dadosHistoricos: any[], transacoesDetalhadas: any[]) => {
    console.log('🔍 Abrindo modal para deputado:', deputado.nomeEleitoral)
    
    const todasTransacoes = dadosHistoricos.length > 0 ? dadosHistoricos : transacoesDetalhadas
    
    const transacoesDoDeputado = todasTransacoes.filter(transacao => {
      const deputadoNome = transacao.deputadoNome || transacao.nomeDeputado || transacao.txNomeParlamentar || 'N/A'
      return deputadoNome === deputado.nomeEleitoral
    })
    
    transacoesDoDeputado.sort((a, b) => {
      const dataA = a.dataDocumento || a.datEmissao || a.dataEmissao
      const dataB = b.dataDocumento || b.datEmissao || b.dataEmissao
      if (!dataA && !dataB) return 0
      if (!dataA) return 1
      if (!dataB) return -1
      const dateA = dataA.toDate ? dataA.toDate() : new Date(dataA)
      const dateB = dataB.toDate ? dataB.toDate() : new Date(dataB)
      return dateB.getTime() - dateA.getTime()
    })
    
    console.log(`🔍 Encontradas ${transacoesDoDeputado.length} transações históricas para ${deputado.nomeEleitoral}`)
    
    setDeputadoSelecionado(deputado)
    setTransacoesDeputadoCompletas(transacoesDoDeputado)
    setAnoModalSelecionado('todos')
    setTransacoesDeputado(transacoesDoDeputado) // Inicialmente mostrar todas
    setModalDeputadoAberto(true)
  }

  const fecharModalDeputado = () => {
    setModalDeputadoAberto(false)
    setDeputadoSelecionado(null)
    setTransacoesDeputado([])
    setTransacoesDeputadoCompletas([])
    setAnoModalSelecionado('todos')
    setExpandirAnosModal(false)
  }

  const filtrarTransacoesPorAnoModal = (ano: string) => {
    setAnoModalSelecionado(ano)
    
    if (ano === 'todos') {
      setTransacoesDeputado(transacoesDeputadoCompletas)
    } else {
      const anoNumero = parseInt(ano)
      const transacoesFiltradas = transacoesDeputadoCompletas.filter(transacao => {
        const dataDoc = transacao.dataDocumento || transacao.datEmissao || transacao.dataEmissao
        if (!dataDoc) return false
        
        try {
          const data = dataDoc.toDate ? dataDoc.toDate() : new Date(dataDoc)
          return data.getFullYear() === anoNumero
        } catch {
          return false
        }
      })
      setTransacoesDeputado(transacoesFiltradas)
    }
  }

  const resetarFiltros = () => {
    setFiltroOrdenacao('data-desc')
    setFiltroDeputado('todos')
    setFiltroDataInicio('')
    setFiltroDataFim('')
    setPaginaAtual(1)
    setMostrarDuplicatas(false)
    setAnoTransacoesSelecionado('todos')
    setExpandirAnosTransacoes(false)
    setAgruparPorMes(true)
  }

  const calcularPaginacao = (transacoes: any[]) => {
    const totalPaginas = Math.ceil(transacoes.length / itensPerPage)
    const transacoesPaginadas = transacoes.slice(
      (paginaAtual - 1) * itensPerPage,
      paginaAtual * itensPerPage
    )
    
    return { totalPaginas, transacoesPaginadas }
  }

  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroOrdenacao, filtroDeputado, filtroDataInicio, filtroDataFim, anoTransacoesSelecionado, mostrarDuplicatas])

  return {
    filtroOrdenacao,
    setFiltroOrdenacao,
    filtroDeputado,
    setFiltroDeputado,
    filtroDataInicio,
    setFiltroDataInicio,
    filtroDataFim,
    setFiltroDataFim,
    itensPerPage,
    setItensPerPage,
    paginaAtual,
    setPaginaAtual,
    mostrarDuplicatas,
    setMostrarDuplicatas,
    anoTransacoesSelecionado,
    setAnoTransacoesSelecionado,
    expandirAnosTransacoes,
    setExpandirAnosTransacoes,
    agruparPorMes,
    setAgruparPorMes,
    
    modalDeputadoAberto,
    setModalDeputadoAberto,
    deputadoSelecionado,
    setDeputadoSelecionado,
    transacoesDeputado,
    setTransacoesDeputado,
    transacoesDeputadoCompletas,
    setTransacoesDeputadoCompletas,
    anoModalSelecionado,
    setAnoModalSelecionado,
    expandirAnosModal,
    setExpandirAnosModal,
    
    filtrarEOrdenarTransacoes,
    obterDeputadosUnicos,
    deduplicarTransacoes,
    abrirModalDeputado,
    fecharModalDeputado,
    filtrarTransacoesPorAnoModal,
    resetarFiltros,
    calcularPaginacao
  }
}