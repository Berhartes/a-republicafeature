import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, FileText, Search, Download, AlertTriangle, Calendar, Building2, User, DollarSign, ArrowUpDown, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import { getCategoriaColor } from '@/lib/categoria-colors'

interface TransacaoGlobal {
  id?: string
  dataDocumento: string
  nomeDeputado: string
  idDeputado: string
  nomeFornecedor: string
  cnpjCpfFornecedor: string
  valorLiquido: number
  tipoDespesa: string
  tipoDocumento?: string
  numDocumento?: string
  urlDocumento?: string
  ano: number
  mes: number
}

interface TransacoesGlobaisProps {
  loading?: boolean
  isProcessing?: boolean
  dadosProcessados?: any
  temCacheValidoTransacoes?: boolean
  temCacheAceitavelTransacoes?: boolean
  estatisticasTransacoes?: any
}

const TransacoesGlobaisComponent = function({ 
  loading = false, 
  isProcessing = false,
  dadosProcessados,
  temCacheValidoTransacoes = false,
  temCacheAceitavelTransacoes = false,
  estatisticasTransacoes
}: TransacoesGlobaisProps) {
  const navigate = useNavigate()

  const [transacoes, setTransacoes] = useState<TransacaoGlobal[]>([])
  const [transacoesFiltradas, setTransacoesFiltradas] = useState<TransacaoGlobal[]>([])
  const [loadingTransacoes, setLoadingTransacoes] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroDeputado, setFiltroDeputado] = useState<string>('todos')
  const [filtroAno, setFiltroAno] = useState<number | 'todos'>('todos')
  const [filtroMes, setFiltroMes] = useState<number | 'todos'>('todos')
  
  const [primeiraCarregamento, setPrimeiraCarregamento] = useState(true)
  
  const [detecaoInicialCompleta, setDetecaoInicialCompleta] = useState(false)
  
  const [ordenacao, setOrdenacao] = useState<{campo: keyof TransacaoGlobal, direcao: 'asc' | 'desc'}>({ campo: 'dataDocumento', direcao: 'desc' })
  const [paginaAtual, setPaginaAtual] = useState(1)
  const ITENS_POR_PAGINA = 50

  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<string[]>([])
  const [deputadosDisponiveis, setDeputadosDisponiveis] = useState<{nome: string, id: string}[]>([])
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])

  const formatarData = useCallback((dateValue: any): string => {
    if (!dateValue) return 'N/A'
    
    try {
      if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
        const date = new Date(dateValue.seconds * 1000)
        return date.toLocaleDateString('pt-BR')
      }
      
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString('pt-BR')
      }
      
      if (typeof dateValue === 'string') {
        const date = new Date(dateValue)
        return isNaN(date.getTime()) ? dateValue : date.toLocaleDateString('pt-BR')
      }
      
      return String(dateValue)
    } catch (error) {
      console.warn('Error formatting date:', error)
      return 'N/A'
    }
  }, [])

  const anosDisponiveis2 = anosDisponiveis.length > 0 
    ? anosDisponiveis 
    : [2025, 2024, 2023, 2022, 2021, 2020, 2019] // Fallback estático
  
  const mesesDisponiveis = [
    { valor: 1, nome: 'Janeiro' },
    { valor: 2, nome: 'Fevereiro' },
    { valor: 3, nome: 'Março' },
    { valor: 4, nome: 'Abril' },
    { valor: 5, nome: 'Maio' },
    { valor: 6, nome: 'Junho' },
    { valor: 7, nome: 'Julho' },
    { valor: 8, nome: 'Agosto' },
    { valor: 9, nome: 'Setembro' },
    { valor: 10, nome: 'Outubro' },
    { valor: 11, nome: 'Novembro' },
    { valor: 12, nome: 'Dezembro' }
  ]

  const carregarTransacoes = useCallback(async () => {
    try {
      setLoadingTransacoes(true)
      setErro(null)
      console.log('🎭 [TransacoesGlobais] Gerando dados mock de transações...')

      const anosParaBuscar = filtroAno === 'todos'
        ? [2025, 2024, 2023, 2022, 2021]
        : [filtroAno as number]

      const mesesParaBuscar = filtroMes === 'todos'
        ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        : [filtroMes as number]

      console.log(`📅 [TransacoesGlobais] Gerando dados para anos: [${anosParaBuscar.join(', ')}]${mesesParaBuscar.length === 1 ? `, mês: ${mesesParaBuscar[0]}` : ''}`)

  const todasTransacoes: TransacaoGlobal[] = []
      const categoriasMock = ['COMBUSTÍVEIS E LUBRIFICANTES', 'LOCAÇÃO DE VEÍCULOS', 'ALIMENTAÇÃO', 'PASSAGENS AÉREAS', 'CONSULTORIAS']
      const deputadosMock = Array.from({ length: 20 }, (_, i) => ({
        id: `dep_${i}`,
        nome: `Deputado ${i + 1}`
      }))

      for (const ano of anosParaBuscar) {
        for (const mes of mesesParaBuscar) {
          const numTransacoes = Math.floor(Math.random() * 20) + 10

          for (let i = 0; i < numTransacoes; i++) {
            const deputado = deputadosMock[Math.floor(Math.random() * deputadosMock.length)]
            const categoria = categoriasMock[Math.floor(Math.random() * categoriasMock.length)]

            todasTransacoes.push({
              id: `${ano}_${mes}_${i}_${Math.random().toString(36).substr(2, 9)}`,
              dataDocumento: new Date(ano, mes - 1, Math.floor(Math.random() * 28) + 1).toISOString(),
              nomeDeputado: deputado.nome,
              idDeputado: deputado.id,
              nomeFornecedor: `Fornecedor ${Math.floor(Math.random() * 100) + 1} Ltda`,
              cnpjCpfFornecedor: `${Math.floor(Math.random() * 100000000).toString().padStart(11, '0')}`,
              valorLiquido: Math.random() * 10000,
              tipoDespesa: categoria,
              tipoDocumento: 'NOTA_FISCAL',
              numDocumento: `NF${Math.floor(Math.random() * 10000)}`,
              ano: ano,
              mes: mes
            })
          }
        }
      }

      todasTransacoes.sort((a, b) => {
        const dataA = new Date(a.dataDocumento).getTime()
        const dataB = new Date(b.dataDocumento).getTime()
        return dataB - dataA
      })

      setTransacoes(todasTransacoes)

      const categoriasEncontradas = [...new Set(todasTransacoes.map(t => t.tipoDespesa).filter(Boolean))].sort()
      const deputadosEncontrados = [...new Set(todasTransacoes.map(t => ({
        id: t.idDeputado,
        nome: t.nomeDeputado
      })).filter(d => d.id && d.nome))]
      const anosEncontrados = [...new Set(todasTransacoes.map(t => t.ano))].sort((a, b) => b - a)

      setCategoriasDisponiveis(categoriasEncontradas)
      setDeputadosDisponiveis(deputadosEncontrados)
      setAnosDisponiveis(anosEncontrados)

      console.log(`✅ [TransacoesGlobais] Dados mock gerados:`, {
        transacoes: todasTransacoes.length,
        categorias: categoriasEncontradas.length,
        deputados: deputadosEncontrados.length,
        anos: anosEncontrados
      })

    } catch (error) {
      console.error('❌ [TransacoesGlobais] Erro na geração mock:', error)
      setErro('Erro ao gerar dados de transações.')
    } finally {
      setLoadingTransacoes(false)
    }
  }, [filtroAno, filtroMes])

  const detectarAnosDisponiveis = useCallback(async () => {
    if (detecaoInicialCompleta) return

    try {
      console.log('🔍 [TransacoesGlobais] Configurando anos disponíveis (mock)...')

      const anosOrdenados = [2025, 2024, 2023, 2022, 2021, 2020]
      setAnosDisponiveis(anosOrdenados)

      console.log(`📅 [TransacoesGlobais] Anos configurados: [${anosOrdenados.join(', ')}]`)
      setDetecaoInicialCompleta(true)

    } catch (error) {
      console.warn('⚠️ [TransacoesGlobais] Erro na configuração de anos:', error)
      setDetecaoInicialCompleta(true)
    }
  }, [detecaoInicialCompleta])

  useEffect(() => {
    detectarAnosDisponiveis()
  }, [detectarAnosDisponiveis])


  useEffect(() => {
    if (temCacheValidoTransacoes && dadosProcessados?.transacoes) {
      console.log('✅ [TransacoesGlobais] Usando dados processados do cache global')
      setTransacoes(dadosProcessados.transacoes)
      
      if (estatisticasTransacoes) {
        setCategoriasDisponiveis(estatisticasTransacoes.categorias || [])
        setAnosDisponiveis(estatisticasTransacoes.anosDisponiveis || [])
        
        if (primeiraCarregamento && estatisticasTransacoes.anosDisponiveis?.length > 0) {
          const anosDisponiveis = estatisticasTransacoes.anosDisponiveis.sort((a, b) => b - a)
          const anoMaisRecente = anosDisponiveis[0]
          
          console.log(`📅 [TransacoesGlobais] Anos disponíveis no cache: [${anosDisponiveis.join(', ')}], ajustando para: ${anoMaisRecente}`)
          setFiltroAno(anoMaisRecente)
          setPrimeiraCarregamento(false)
        }
      }
      
      setLoadingTransacoes(false)
      setErro(null)
      return
    }
    
    if (temCacheAceitavelTransacoes && !loading && !isProcessing) {
      console.log('⚡ [TransacoesGlobais] Usando cache aceitável de transações')
      carregarTransacoes() // Ainda usar fallback mas com aviso
      return
    }
    
    if (loading || isProcessing) {
      console.log('⏳ [TransacoesGlobais] Aguardando processamento global terminar...')
      
      const timeoutId = setTimeout(() => {
        console.log('⏰ [TransacoesGlobais] Timeout de processamento - carregando dados diretamente')
        carregarTransacoes()
      }, 30000) // 30 segundos
      
      return () => clearTimeout(timeoutId)
    }
    
    console.log('🚀 [TransacoesGlobais] Nenhum cache disponível - carregando dados diretamente...')
    carregarTransacoes()
    
  }, [carregarTransacoes, loading, isProcessing, primeiraCarregamento, temCacheValidoTransacoes, temCacheAceitavelTransacoes, dadosProcessados, estatisticasTransacoes])

  const transacoesComFiltros = useMemo(() => {
    let resultado = transacoes

    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim()
      resultado = resultado.filter(t =>
        t.nomeFornecedor?.toLowerCase().includes(termoBusca) ||
        t.nomeDeputado?.toLowerCase().includes(termoBusca) ||
        t.cnpjCpfFornecedor?.includes(termoBusca) ||
        t.tipoDespesa?.toLowerCase().includes(termoBusca)
      )
    }

    if (filtroCategoria !== 'todas') {
      resultado = resultado.filter(t => t.tipoDespesa === filtroCategoria)
    }

    if (filtroDeputado !== 'todos') {
      resultado = resultado.filter(t => t.idDeputado === filtroDeputado)
    }

    if (filtroAno !== 'todos') {
      resultado = resultado.filter(t => t.ano === filtroAno)
    }
    
    if (filtroMes !== 'todos') {
      resultado = resultado.filter(t => t.mes === filtroMes)
    }

    return resultado
  }, [transacoes, busca, filtroCategoria, filtroDeputado, filtroAno, filtroMes])

  const transacoesOrdenadas = useMemo(() => {
    return [...transacoesComFiltros].sort((a, b) => {
      const valorA = a[ordenacao.campo]
      const valorB = b[ordenacao.campo]

      let comparacao = 0
      
      if (typeof valorA === 'number' && typeof valorB === 'number') {
        comparacao = valorA - valorB
      } else {
        comparacao = String(valorA).localeCompare(String(valorB))
      }

      return ordenacao.direcao === 'desc' ? -comparacao : comparacao
    })
  }, [transacoesComFiltros, ordenacao])

  const totalPaginas = Math.ceil(transacoesOrdenadas.length / ITENS_POR_PAGINA)
  const indiceInicio = (paginaAtual - 1) * ITENS_POR_PAGINA
  const transacoesPaginadas = transacoesOrdenadas.slice(indiceInicio, indiceInicio + ITENS_POR_PAGINA)

  useEffect(() => {
    setTransacoesFiltradas(transacoesOrdenadas)
  }, [transacoesOrdenadas])

  const alternarOrdenacao = (campo: keyof TransacaoGlobal) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportarCSV = () => {
    const csvContent = [
      'Data,Deputado,Fornecedor,CNPJ,Categoria,Valor,Documento',
      ...transacoesOrdenadas.map(t => 
        `"${formatarData(t.dataDocumento)}","${t.nomeDeputado}","${t.nomeFornecedor}","${t.cnpjCpfFornecedor}","${t.tipoDespesa}","R$ ${t.valorLiquido.toLocaleString('pt-BR')}","${t.numDocumento || ''}"`
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transacoes_fornecedores_${filtroAno}_${filtroMes}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const estatisticas = useMemo(() => {
    return {
      totalTransacoes: transacoesOrdenadas.length,
      valorTotal: transacoesOrdenadas.reduce((sum, t) => sum + t.valorLiquido, 0),
      fornecedoresUnicos: new Set(transacoesOrdenadas.map(t => t.cnpjCpfFornecedor)).size,
      deputadosUnicos: new Set(transacoesOrdenadas.map(t => t.idDeputado)).size
    }
  }, [transacoesOrdenadas])

  if (loading || isProcessing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-medium mb-2">Aguardando processamento...</h3>
            <p className="text-muted-foreground">
              As transações serão carregadas após o processamento dos fornecedores.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Transações</p>
                <p className="text-2xl font-bold">{estatisticas.totalTransacoes.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {estatisticas.valorTotal.toLocaleString('pt-BR')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fornecedores</p>
                <p className="text-2xl font-bold text-purple-600">{estatisticas.fornecedoresUnicos}</p>
              </div>
              <Building2 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Deputados</p>
                <p className="text-2xl font-bold text-orange-600">{estatisticas.deputadosUnicos}</p>
              </div>
              <User className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros Temporais Separados */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Filtros de Período
            </h4>
            <div className="flex gap-4 flex-wrap items-end">
              <div className="flex flex-col">
                <label className="text-xs text-blue-700 mb-1 font-medium">Ano</label>
                <Select 
                  value={filtroAno === 'todos' ? 'todos' : filtroAno.toString()} 
                  onValueChange={(value) => setFiltroAno(value === 'todos' ? 'todos' : parseInt(value))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {anosDisponiveis2
                      .filter(ano => ano != null && ano !== undefined)
                      .map((ano) => (
                      <SelectItem key={ano} value={ano?.toString() || 'ano-indefinido'}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-blue-700 mb-1 font-medium">Mês</label>
                <Select 
                  value={filtroMes === 'todos' ? 'todos' : filtroMes.toString()} 
                  onValueChange={(value) => setFiltroMes(value === 'todos' ? 'todos' : parseInt(value))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {mesesDisponiveis
                      .filter(mes => mes && mes.valor != null && mes.valor !== undefined)
                      .map((mes) => (
                      <SelectItem key={mes.valor} value={mes.valor?.toString() || 'mes-indefinido'}>
                        {mes.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(filtroAno !== 'todos' || filtroMes !== 'todos') && (
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  📅 {filtroAno !== 'todos' ? filtroAno : 'Todos'}
                  {filtroMes !== 'todos' && ` / ${mesesDisponiveis.find(m => m.valor === filtroMes)?.nome || filtroMes}`}
                </Badge>
              )}
            </div>
          </div>

          {/* Filtros Gerais */}
          <div className="flex gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar por fornecedor, deputado, CNPJ ou categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categoriasDisponiveis
                  .filter(categoria => categoria && categoria.trim().length > 0)
                  .map((categoria) => (
                  <SelectItem key={categoria} value={categoria || 'categoria-indefinida'}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroDeputado} onValueChange={setFiltroDeputado}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Deputado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os deputados</SelectItem>
                {deputadosDisponiveis
                  .filter(deputado => deputado && deputado.id && deputado.id.trim().length > 0)
                  .map((deputado) => (
                  <SelectItem key={deputado.id} value={deputado.id || 'deputado-indefinido'}>
                    {deputado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportarCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>

            <Button 
              onClick={() => {
                setBusca('')
                setFiltroCategoria('todas')
                setFiltroDeputado('todos')
                setFiltroAno('todos')
                setFiltroMes('todos')
              }} 
              variant="outline" 
              size="sm"
              className="text-red-600 hover:text-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline">{transacoesOrdenadas.length} resultado(s)</Badge>
            
            {filtroAno !== 'todos' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Calendar className="h-3 w-3 mr-1" />
                Ano: {filtroAno}
              </Badge>
            )}
            
            {filtroMes !== 'todos' && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                <Calendar className="h-3 w-3 mr-1" />
                Mês: {mesesDisponiveis.find(m => m.valor === filtroMes)?.nome || filtroMes}
              </Badge>
            )}
            
            {filtroCategoria !== 'todas' && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700">
                Categoria: {filtroCategoria}
              </Badge>
            )}
            
            {filtroDeputado !== 'todos' && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                Deputado: {deputadosDisponiveis.find(d => d.id === filtroDeputado)?.nome || filtroDeputado}
              </Badge>
            )}
            
            {busca.trim() && (
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                Busca: "{busca.trim()}"
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de transações */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Transações</CardTitle>
          <CardDescription>
            {transacoesPaginadas.length} de {transacoesOrdenadas.length} transação(ões) 
            {filtroAno !== 'todos' || filtroMes !== 'todos' ? ` (${filtroAno !== 'todos' ? filtroAno : 'Todos'}${filtroMes !== 'todos' ? `/${filtroMes.toString().padStart(2, '0')}` : ''})` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {erro ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-red-600 font-medium">{erro}</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button onClick={carregarTransacoes} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Certifique-se de que os dados foram processados no  antes de usar esta funcionalidade.
              </p>
            </div>
          ) : loadingTransacoes ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-4" />
              <p className="text-muted-foreground">Carregando transações...</p>
            </div>
          ) : transacoesPaginadas.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => alternarOrdenacao('dataDocumento')}
                      >
                        <div className="flex items-center gap-1">
                          Data
                          {ordenacao.campo === 'dataDocumento' && (
                            ordenacao.direcao === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => alternarOrdenacao('nomeDeputado')}
                      >
                        <div className="flex items-center gap-1">
                          Deputado
                          {ordenacao.campo === 'nomeDeputado' && (
                            ordenacao.direcao === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => alternarOrdenacao('nomeFornecedor')}
                      >
                        <div className="flex items-center gap-1">
                          Fornecedor
                          {ordenacao.campo === 'nomeFornecedor' && (
                            ordenacao.direcao === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => alternarOrdenacao('tipoDespesa')}
                      >
                        <div className="flex items-center gap-1">
                          Categoria
                          {ordenacao.campo === 'tipoDespesa' && (
                            ordenacao.direcao === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 text-right"
                        onClick={() => alternarOrdenacao('valorLiquido')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Valor
                          {ordenacao.campo === 'valorLiquido' && (
                            ordenacao.direcao === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoesPaginadas.map((transacao, index) => (
                      <TableRow key={transacao.id || index} className="hover:bg-gray-50">
                        <TableCell className="font-mono text-sm">
                          {formatarData(transacao.dataDocumento)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                            onClick={() => navigate({ 
                              to: '/gastos/perfil/$deputadoId', 
                              params: { deputadoId: transacao.idDeputado } 
                            })}
                          >
                            {transacao.nomeDeputado}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <Button
                              variant="link"
                              className="p-0 h-auto font-medium text-purple-600 hover:text-purple-800"
                              onClick={() => {
                                if (transacao.cnpjCpfFornecedor) {
                                  navigate({ 
                                    to: '/gastos/fornecedor/$fornecedorId', 
                                    params: { fornecedorId: transacao.cnpjCpfFornecedor.replace(/[^\d]/g, '') }
                                  })
                                }
                              }}
                            >
                              {transacao.nomeFornecedor}
                            </Button>
                            {transacao.cnpjCpfFornecedor && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {transacao.cnpjCpfFornecedor}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${getCategoriaColor(transacao.tipoDespesa)}15`,
                              borderColor: getCategoriaColor(transacao.tipoDespesa)
                            }}
                          >
                            {transacao.tipoDespesa}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className="font-bold text-green-600">
                            R$ {transacao.valorLiquido.toLocaleString('pt-BR', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {transacao.urlDocumento && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(transacao.urlDocumento, '_blank')}
                            >
                              Ver
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {indiceInicio + 1} a {Math.min(indiceInicio + ITENS_POR_PAGINA, transacoesOrdenadas.length)} de {transacoesOrdenadas.length} resultados
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                      disabled={paginaAtual <= 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                      disabled={paginaAtual >= totalPaginas}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {busca || filtroCategoria !== 'todas' || filtroDeputado !== 'todos' || filtroAno !== 'todos' || filtroMes !== 'todos'
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Não há transações disponíveis para o período selecionado.'
                }
              </p>
              {(busca || filtroCategoria !== 'todas' || filtroDeputado !== 'todos' || filtroAno !== 'todos' || filtroMes !== 'todos') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBusca('')
                    setFiltroCategoria('todas')
                    setFiltroDeputado('todos')
                    setFiltroAno('todos')
                    setFiltroMes('todos')
                  }}
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const TransacoesGlobais = React.memo(TransacoesGlobaisComponent)