import { useState } from 'react'

export interface CategoriaFiltersState {
  activeTab: string
  anoSelecionado: number | 'todos'
  mesSelecionado: string
  
  anoFiltroDeputado: number | 'todos'
  tipoDistribuicao: 'categoria' | 'partido'
  filtroPartido: string
  filtroUF: string
  filtroValorMinimo: number
  filtroValorMaximo: number
  mostrarApenasTop: boolean
  mostrarApenasVIP: boolean
  deputadosExibidos: number
  
  buscaFornecedor: string
  ordenacaoFornecedor: 'nome' | 'valor' | 'transacoes' | 'deputados' | 'score' | 'ticketMedio' | 'valorPorDeputado'
  direcaoOrdenacao: 'asc' | 'desc'
  filtroRiscoFornecedor: 'todos' | 'alto' | 'medio' | 'baixo'
  filtroScore: { min: number; max: number }
  filtroTicketMedio: { min: number; max: number }
  filtroValorPorDeputado: { min: number; max: number }
  fornecedoresExibidos: number
  
  mostrarLabelsValores: boolean
  deputadosVisiveisEvolucao: Set<string>
  
  deputadoModalAberto: boolean
  deputadoSelecionado: any
  transacoesDeputado: any[]
  anoUtilizadoDeputados: string | number
}

export function useCategoriaFilters() {
  const [activeTab, setActiveTab] = useState('visao-geral')
  const [anoSelecionado, setAnoSelecionado] = useState<number | 'todos'>(new Date().getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos')
  
  const [anoFiltroDeputado, setAnoFiltroDeputado] = useState<number | 'todos'>(new Date().getFullYear())
  const [tipoDistribuicao, setTipoDistribuicao] = useState<'categoria' | 'partido'>('categoria')
  const [filtroPartido, setFiltroPartido] = useState<string>('todos')
  const [filtroUF, setFiltroUF] = useState<string>('todos')
  const [filtroValorMinimo, setFiltroValorMinimo] = useState<number>(0)
  const [filtroValorMaximo, setFiltroValorMaximo] = useState<number>(0)
  const [mostrarApenasTop, setMostrarApenasTop] = useState<boolean>(false)
  const [mostrarApenasVIP, setMostrarApenasVIP] = useState<boolean>(false)
  const [deputadosExibidos, setDeputadosExibidos] = useState<number>(20)
  
  const [buscaFornecedor, setBuscaFornecedor] = useState<string>('')
  const [ordenacaoFornecedor, setOrdenacaoFornecedor] = useState<'nome' | 'valor' | 'transacoes' | 'deputados' | 'score' | 'ticketMedio' | 'valorPorDeputado'>('valor')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc')
  const [filtroRiscoFornecedor, setFiltroRiscoFornecedor] = useState<'todos' | 'alto' | 'medio' | 'baixo'>('todos')
  const [filtroScore, setFiltroScore] = useState<{ min: number; max: number }>({ min: 0, max: 100 })
  const [filtroTicketMedio, setFiltroTicketMedio] = useState<{ min: number; max: number }>({ min: 0, max: 1000000 })
  const [filtroValorPorDeputado, setFiltroValorPorDeputado] = useState<{ min: number; max: number }>({ min: 0, max: 500000 })
  const [fornecedoresExibidos, setFornecedoresExibidos] = useState<number>(20)
  
  const [mostrarLabelsValores, setMostrarLabelsValores] = useState<boolean>(true)
  const [deputadosVisiveisEvolucao, setDeputadosVisiveisEvolucao] = useState<Set<string>>(new Set())
  
  const [deputadoModalAberto, setDeputadoModalAberto] = useState<boolean>(false)
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<any>(null)
  const [transacoesDeputado, setTransacoesDeputado] = useState<any[]>([])
  const [anoUtilizadoDeputados, setAnoUtilizadoDeputados] = useState<string | number>(new Date().getFullYear())

  const abas = [
    { id: 'visao-geral', nome: 'Visão Geral', icone: '📊', descricao: 'Estatísticas gerais da categoria' },
    { id: 'transacoes', nome: 'Transações', icone: '💰', descricao: 'Lista detalhada de transações' },
    { id: 'fornecedores', nome: 'Fornecedores', icone: '🏢', descricao: 'Fornecedores da categoria' },
    { id: 'deputados', nome: 'Deputados', icone: '👤', descricao: 'Deputados que utilizam a categoria' },
    { id: 'evolucao', nome: 'Evolução', icone: '📈', descricao: 'Evolução temporal dos gastos' },
    { id: 'relacoes', nome: 'Relacionamentos', icone: '🔗', descricao: 'Rede de relacionamentos' },
    { id: 'alertas', nome: 'Alertas', icone: '⚠️', descricao: 'Alertas e anomalias detectadas' }
  ]

  const navegarParaAba = (abaId: string) => {
    setActiveTab(abaId)
  }

  const resetarFiltrosDeputados = () => {
    setFiltroPartido('todos')
    setFiltroUF('todos')
    setFiltroValorMinimo(0)
    setFiltroValorMaximo(0)
    setMostrarApenasTop(false)
    setMostrarApenasVIP(false)
    setDeputadosExibidos(20)
  }

  const resetarFiltrosFornecedores = () => {
    setBuscaFornecedor('')
    setOrdenacaoFornecedor('valor')
    setDirecaoOrdenacao('desc')
    setFiltroRiscoFornecedor('todos')
    setFiltroScore({ min: 0, max: 100 })
    setFiltroTicketMedio({ min: 0, max: 1000000 })
    setFiltroValorPorDeputado({ min: 0, max: 500000 })
    setFornecedoresExibidos(20)
  }

  const aplicarFiltroRapido = (tipo: 'top-deputados' | 'vips' | 'fornecedores-suspeitos' | 'alto-valor') => {
    switch (tipo) {
      case 'top-deputados':
        setMostrarApenasTop(true)
        setDeputadosExibidos(10)
        break
      case 'vips':
        setMostrarApenasVIP(true)
        break
      case 'fornecedores-suspeitos':
        setFiltroRiscoFornecedor('alto')
        setOrdenacaoFornecedor('score')
        break
      case 'alto-valor':
        setFiltroValorMinimo(100000)
        setOrdenacaoFornecedor('valor')
        break
    }
  }

  const abrirModalDeputado = (deputado: any) => {
    setDeputadoSelecionado(deputado)
    setDeputadoModalAberto(true)
  }

  const fecharModalDeputado = () => {
    setDeputadoModalAberto(false)
    setDeputadoSelecionado(null)
    setTransacoesDeputado([])
  }

  const alternarVisibilidadeDeputado = (deputadoId: string) => {
    setDeputadosVisiveisEvolucao(prev => {
      const novo = new Set(prev)
      if (novo.has(deputadoId)) {
        novo.delete(deputadoId)
      } else {
        novo.add(deputadoId)
      }
      return novo
    })
  }

  const limparEvolucaoVisivel = () => {
    setDeputadosVisiveisEvolucao(new Set())
  }

  return {
    activeTab,
    setActiveTab,
    anoSelecionado,
    setAnoSelecionado,
    mesSelecionado,
    setMesSelecionado,
    
    anoFiltroDeputado,
    setAnoFiltroDeputado,
    tipoDistribuicao,
    setTipoDistribuicao,
    filtroPartido,
    setFiltroPartido,
    filtroUF,
    setFiltroUF,
    filtroValorMinimo,
    setFiltroValorMinimo,
    filtroValorMaximo,
    setFiltroValorMaximo,
    mostrarApenasTop,
    setMostrarApenasTop,
    mostrarApenasVIP,
    setMostrarApenasVIP,
    deputadosExibidos,
    setDeputadosExibidos,
    
    buscaFornecedor,
    setBuscaFornecedor,
    ordenacaoFornecedor,
    setOrdenacaoFornecedor,
    direcaoOrdenacao,
    setDirecaoOrdenacao,
    filtroRiscoFornecedor,
    setFiltroRiscoFornecedor,
    filtroScore,
    setFiltroScore,
    filtroTicketMedio,
    setFiltroTicketMedio,
    filtroValorPorDeputado,
    setFiltroValorPorDeputado,
    fornecedoresExibidos,
    setFornecedoresExibidos,
    
    mostrarLabelsValores,
    setMostrarLabelsValores,
    deputadosVisiveisEvolucao,
    setDeputadosVisiveisEvolucao,
    
    deputadoModalAberto,
    deputadoSelecionado,
    transacoesDeputado,
    setTransacoesDeputado,
    anoUtilizadoDeputados,
    setAnoUtilizadoDeputados,
    
    abas,
    
    navegarParaAba,
    resetarFiltrosDeputados,
    resetarFiltrosFornecedores,
    aplicarFiltroRapido,
    abrirModalDeputado,
    fecharModalDeputado,
    alternarVisibilidadeDeputado,
    limparEvolucaoVisivel
  }
}