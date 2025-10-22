import { useState, useMemo } from 'react'

export interface PerfilFornecedorFiltersState {
  activeTab: string
  
  anoSelecionado: number
  mesSelecionado: string
  anoFiltroDeputado: number
  
  tipoDistribuicao: 'categoria' | 'partido'
  filtroPartido: string
  filtroUF: string
  filtroValorMinimo: number
  filtroValorMaximo: number
  mostrarApenasTop: boolean
  mostrarApenasVIP: boolean
  
  deputadosExibidos: number
  fornecedoresExibidos: number
  transacoesExibidas: number
  
  mostrarLabelsValores: boolean
  mostrarGraficoEvolucao: boolean
  mostrarRedeRelacoes: boolean
  
  ordenacaoTransacoes: 'data' | 'valor' | 'deputado'
  direcaoOrdenacao: 'asc' | 'desc'
  buscaDeputado: string
  buscaTransacao: string
  
  filtroCategoria: string
  filtroRiscoTransacao: 'todos' | 'baixo' | 'medio' | 'alto'
  filtroTipoDocumento: string
  
  tipoGraficoEvolucao: 'linha' | 'area' | 'barra'
  agrupamentoTemporal: 'mensal' | 'trimestral' | 'anual'
  mostrarTendencia: boolean
  
  abas: Array<{
    id: string
    nome: string
    icone: string
    ativo: boolean
  }>
}

export interface PerfilFornecedorFiltersActions {
  navegarParaAba: (aba: string) => void
  
  setAnoSelecionado: (ano: number) => void
  setMesSelecionado: (mes: string) => void
  setAnoFiltroDeputado: (ano: number) => void
  
  setTipoDistribuicao: (tipo: 'categoria' | 'partido') => void
  setFiltroPartido: (partido: string) => void
  setFiltroUF: (uf: string) => void
  setFiltroValorMinimo: (valor: number) => void
  setFiltroValorMaximo: (valor: number) => void
  setMostrarApenasTop: (valor: boolean) => void
  setMostrarApenasVIP: (valor: boolean) => void
  
  setDeputadosExibidos: (quantidade: number) => void
  setFornecedoresExibidos: (quantidade: number) => void
  setTransacoesExibidas: (quantidade: number) => void
  
  setMostrarLabelsValores: (valor: boolean) => void
  setMostrarGraficoEvolucao: (valor: boolean) => void
  setMostrarRedeRelacoes: (valor: boolean) => void
  
  setOrdenacaoTransacoes: (ordenacao: 'data' | 'valor' | 'deputado') => void
  setDirecaoOrdenacao: (direcao: 'asc' | 'desc') => void
  setBuscaDeputado: (busca: string) => void
  setBuscaTransacao: (busca: string) => void
  
  setFiltroCategoria: (categoria: string) => void
  setFiltroRiscoTransacao: (risco: 'todos' | 'baixo' | 'medio' | 'alto') => void
  setFiltroTipoDocumento: (tipo: string) => void
  
  setTipoGraficoEvolucao: (tipo: 'linha' | 'area' | 'barra') => void
  setAgrupamentoTemporal: (agrupamento: 'mensal' | 'trimestral' | 'anual') => void
  setMostrarTendencia: (valor: boolean) => void
  
  aplicarFiltroRapido: (filtro: 'top10' | 'vip' | 'suspeitos' | 'recentes') => void
  resetarFiltros: () => void
  resetarFiltrosVisualizacao: () => void
}

export function usePerfilFornecedorFilters(): PerfilFornecedorFiltersState & PerfilFornecedorFiltersActions {
  const [activeTab, setActiveTab] = useState('visao-geral')
  
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear())
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos')
  const [anoFiltroDeputado, setAnoFiltroDeputado] = useState<number>(new Date().getFullYear())
  
  const [tipoDistribuicao, setTipoDistribuicao] = useState<'categoria' | 'partido'>('categoria')
  const [filtroPartido, setFiltroPartido] = useState<string>('todos')
  const [filtroUF, setFiltroUF] = useState<string>('todos')
  const [filtroValorMinimo, setFiltroValorMinimo] = useState<number>(0)
  const [filtroValorMaximo, setFiltroValorMaximo] = useState<number>(1000000)
  const [mostrarApenasTop, setMostrarApenasTop] = useState<boolean>(false)
  const [mostrarApenasVIP, setMostrarApenasVIP] = useState<boolean>(false)
  
  const [deputadosExibidos, setDeputadosExibidos] = useState<number>(50)
  const [fornecedoresExibidos, setFornecedoresExibidos] = useState<number>(100)
  const [transacoesExibidas, setTransacoesExibidas] = useState<number>(200)
  
  const [mostrarLabelsValores, setMostrarLabelsValores] = useState<boolean>(true)
  const [mostrarGraficoEvolucao, setMostrarGraficoEvolucao] = useState<boolean>(true)
  const [mostrarRedeRelacoes, setMostrarRedeRelacoes] = useState<boolean>(false)
  
  const [ordenacaoTransacoes, setOrdenacaoTransacoes] = useState<'data' | 'valor' | 'deputado'>('data')
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc')
  const [buscaDeputado, setBuscaDeputado] = useState<string>('')
  const [buscaTransacao, setBuscaTransacao] = useState<string>('')
  
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroRiscoTransacao, setFiltroRiscoTransacao] = useState<'todos' | 'baixo' | 'medio' | 'alto'>('todos')
  const [filtroTipoDocumento, setFiltroTipoDocumento] = useState<string>('todos')
  
  const [tipoGraficoEvolucao, setTipoGraficoEvolucao] = useState<'linha' | 'area' | 'barra'>('linha')
  const [agrupamentoTemporal, setAgrupamentoTemporal] = useState<'mensal' | 'trimestral' | 'anual'>('mensal')
  const [mostrarTendencia, setMostrarTendencia] = useState<boolean>(true)

  const abas = useMemo(() => [
    { id: 'visao-geral', nome: 'Visão Geral', icone: '📊', ativo: activeTab === 'visao-geral' },
    { id: 'transacoes', nome: 'Transações', icone: '💰', ativo: activeTab === 'transacoes' },
    { id: 'deputados', nome: 'Deputados', icone: '👥', ativo: activeTab === 'deputados' },
    { id: 'evolucao', nome: 'Evolução', icone: '📈', ativo: activeTab === 'evolucao' },
    { id: 'analise', nome: 'Análise', icone: '🔍', ativo: activeTab === 'analise' },
    { id: 'relacionamentos', nome: 'Relacionamentos', icone: '🕸️', ativo: activeTab === 'relacionamentos' },
    { id: 'alertas', nome: 'Alertas', icone: '⚠️', ativo: activeTab === 'alertas' }
  ], [activeTab])

  const navegarParaAba = (aba: string) => {
    setActiveTab(aba)
    console.log(`🧭 [usePerfilFornecedorFilters] Navegando para aba: ${aba}`)
  }

  const aplicarFiltroRapido = (filtro: 'top10' | 'vip' | 'suspeitos' | 'recentes') => {
    console.log(`⚡ [usePerfilFornecedorFilters] Aplicando filtro rápido: ${filtro}`)
    
    switch (filtro) {
      case 'top10':
        setDeputadosExibidos(10)
        setMostrarApenasTop(true)
        setOrdenacaoTransacoes('valor')
        setDirecaoOrdenacao('desc')
        break
        
      case 'vip':
        setMostrarApenasVIP(true)
        setDeputadosExibidos(20)
        break
        
      case 'suspeitos':
        setFiltroRiscoTransacao('alto')
        setTransacoesExibidas(100)
        setOrdenacaoTransacoes('valor')
        break
        
      case 'recentes':
        setAnoSelecionado(new Date().getFullYear())
        setMesSelecionado('todos')
        setOrdenacaoTransacoes('data')
        setDirecaoOrdenacao('desc')
        break
    }
  }

  const resetarFiltros = () => {
    console.log('🔄 [usePerfilFornecedorFilters] Resetando todos os filtros')
    
    setAnoSelecionado(new Date().getFullYear())
    setMesSelecionado('todos')
    setAnoFiltroDeputado(new Date().getFullYear())
    
    setTipoDistribuicao('categoria')
    setFiltroPartido('todos')
    setFiltroUF('todos')
    setFiltroValorMinimo(0)
    setFiltroValorMaximo(1000000)
    setMostrarApenasTop(false)
    setMostrarApenasVIP(false)
    
    setDeputadosExibidos(50)
    setFornecedoresExibidos(100)
    setTransacoesExibidas(200)
    
    setOrdenacaoTransacoes('data')
    setDirecaoOrdenacao('desc')
    setBuscaDeputado('')
    setBuscaTransacao('')
    
    setFiltroCategoria('todas')
    setFiltroRiscoTransacao('todos')
    setFiltroTipoDocumento('todos')
  }

  const resetarFiltrosVisualizacao = () => {
    console.log('🔄 [usePerfilFornecedorFilters] Resetando filtros de visualização')
    
    setMostrarLabelsValores(true)
    setMostrarGraficoEvolucao(true)
    setMostrarRedeRelacoes(false)
    setTipoGraficoEvolucao('linha')
    setAgrupamentoTemporal('mensal')
    setMostrarTendencia(true)
  }

  return {
    activeTab,
    anoSelecionado,
    mesSelecionado,
    anoFiltroDeputado,
    tipoDistribuicao,
    filtroPartido,
    filtroUF,
    filtroValorMinimo,
    filtroValorMaximo,
    mostrarApenasTop,
    mostrarApenasVIP,
    deputadosExibidos,
    fornecedoresExibidos,
    transacoesExibidas,
    mostrarLabelsValores,
    mostrarGraficoEvolucao,
    mostrarRedeRelacoes,
    ordenacaoTransacoes,
    direcaoOrdenacao,
    buscaDeputado,
    buscaTransacao,
    filtroCategoria,
    filtroRiscoTransacao,
    filtroTipoDocumento,
    tipoGraficoEvolucao,
    agrupamentoTemporal,
    mostrarTendencia,
    abas,

    navegarParaAba,
    setAnoSelecionado,
    setMesSelecionado,
    setAnoFiltroDeputado,
    setTipoDistribuicao,
    setFiltroPartido,
    setFiltroUF,
    setFiltroValorMinimo,
    setFiltroValorMaximo,
    setMostrarApenasTop,
    setMostrarApenasVIP,
    setDeputadosExibidos,
    setFornecedoresExibidos,
    setTransacoesExibidas,
    setMostrarLabelsValores,
    setMostrarGraficoEvolucao,
    setMostrarRedeRelacoes,
    setOrdenacaoTransacoes,
    setDirecaoOrdenacao,
    setBuscaDeputado,
    setBuscaTransacao,
    setFiltroCategoria,
    setFiltroRiscoTransacao,
    setFiltroTipoDocumento,
    setTipoGraficoEvolucao,
    setAgrupamentoTemporal,
    setMostrarTendencia,
    aplicarFiltroRapido,
    resetarFiltros,
    resetarFiltrosVisualizacao
  }
}