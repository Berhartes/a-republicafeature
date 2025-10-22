import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download, Calendar, User, DollarSign, FileText } from 'lucide-react'

const formatDate = (dateValue: any): string => {
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
    
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString('pt-BR')
    }
    
    return String(dateValue)
  } catch (error) {
    return 'N/A'
  }
}

const getTransactionRisk = (valor: number, ticketMedio: number) => {
  const ratio = ticketMedio > 0 ? valor / ticketMedio : 1
  if (ratio > 3) return { level: 'Alto', color: 'destructive' }
  if (ratio > 1.5) return { level: 'Médio', color: 'default' }
  return { level: 'Baixo', color: 'secondary' }
}

interface PerfilFornecedorTransacoesPageProps {
  transacoesDetalhadas: any[]
  fornecedorData: any
  buscaTransacao: string
  setBuscaTransacao: (busca: string) => void
  ordenacaoTransacoes: 'data' | 'valor' | 'deputado'
  setOrdenacaoTransacoes: (ordenacao: 'data' | 'valor' | 'deputado') => void
  direcaoOrdenacao: 'asc' | 'desc'
  setDirecaoOrdenacao: (direcao: 'asc' | 'desc') => void
  filtroCategoria: string
  setFiltroCategoria: (categoria: string) => void
  filtroRiscoTransacao: 'todos' | 'baixo' | 'medio' | 'alto'
  setFiltroRiscoTransacao: (risco: 'todos' | 'baixo' | 'medio' | 'alto') => void
  transacoesExibidas: number
  setTransacoesExibidas: (quantidade: number) => void
}

export function PerfilFornecedorTransacoesPage({
  transacoesDetalhadas,
  fornecedorData,
  buscaTransacao,
  setBuscaTransacao,
  ordenacaoTransacoes,
  setOrdenacaoTransacoes,
  direcaoOrdenacao,
  setDirecaoOrdenacao,
  filtroCategoria,
  setFiltroCategoria,
  filtroRiscoTransacao,
  setFiltroRiscoTransacao,
  transacoesExibidas,
  setTransacoesExibidas
}: PerfilFornecedorTransacoesPageProps) {
  const [mostrarDetalhes, setMostrarDetalhes] = useState<Set<string>>(new Set())

  const totalTransacoesFornecedor = fornecedorData
    ? fornecedorData.totalTransacoes ?? fornecedorData.transacoes ?? fornecedorData.numeroTransacoes ?? 0
    : 0
  const ticketMedio = fornecedorData && totalTransacoesFornecedor > 0
    ? (fornecedorData.totalTransacionado || 0) / totalTransacoesFornecedor
    : 0

  const transacoesFiltradas = useMemo(() => {
    let filtradas = [...transacoesDetalhadas]

    if (buscaTransacao.trim()) {
      const busca = buscaTransacao.toLowerCase()
      filtradas = filtradas.filter(t => 
        (t.nomeDeputado || t.txNomeParlamentar || '').toLowerCase().includes(busca) ||
        (t.categoria || t.tipoDespesa || '').toLowerCase().includes(busca) ||
        (t.numeroDocumento || '').toString().includes(busca)
      )
    }

    if (filtroCategoria !== 'todas') {
      filtradas = filtradas.filter(t => 
        (t.categoria || t.tipoDespesa || '').toLowerCase().includes(filtroCategoria.toLowerCase())
      )
    }

    if (filtroRiscoTransacao !== 'todos') {
      filtradas = filtradas.filter(t => {
        const valor = t.valorLiquido || t.vlrLiquido || 0
        const risk = getTransactionRisk(valor, ticketMedio)
        return risk.level.toLowerCase() === filtroRiscoTransacao
      })
    }

    filtradas.sort((a, b) => {
      let comparison = 0
      
      switch (ordenacaoTransacoes) {
        case 'data':
          const dataA = new Date(a.dataEmissao || a.dataDocumento || a.datEmissao || 0)
          const dataB = new Date(b.dataEmissao || b.dataDocumento || b.datEmissao || 0)
          comparison = dataA.getTime() - dataB.getTime()
          break
        case 'valor':
          const valorA = a.valorLiquido || a.vlrLiquido || 0
          const valorB = b.valorLiquido || b.vlrLiquido || 0
          comparison = valorA - valorB
          break
        case 'deputado':
          const deputadoA = a.nomeDeputado || a.txNomeParlamentar || ''
          const deputadoB = b.nomeDeputado || b.txNomeParlamentar || ''
          comparison = deputadoA.localeCompare(deputadoB)
          break
      }
      
      return direcaoOrdenacao === 'asc' ? comparison : -comparison
    })

    return filtradas.slice(0, transacoesExibidas)
  }, [
    transacoesDetalhadas, 
    buscaTransacao, 
    filtroCategoria, 
    filtroRiscoTransacao, 
    ordenacaoTransacoes, 
    direcaoOrdenacao, 
    transacoesExibidas,
    ticketMedio
  ])

  const categoriasDisponiveis = useMemo(() => {
    const categorias = new Set<string>()
    transacoesDetalhadas.forEach(t => {
      const categoria = t.categoria || t.tipoDespesa
      if (categoria) categorias.add(categoria)
    })
    return Array.from(categorias).sort()
  }, [transacoesDetalhadas])

  const toggleDetalhes = (transacaoId: string) => {
    const newSet = new Set(mostrarDetalhes)
    if (newSet.has(transacaoId)) {
      newSet.delete(transacaoId)
    } else {
      newSet.add(transacaoId)
    }
    setMostrarDetalhes(newSet)
  }

  const exportarTransacoes = () => {
    const dadosExport = transacoesFiltradas.map(t => ({
      data: formatDate(t.dataEmissao || t.dataDocumento),
      deputado: t.nomeDeputado || t.txNomeParlamentar,
      categoria: t.categoria || t.tipoDespesa,
      valor: t.valorLiquido || t.vlrLiquido,
      documento: t.numeroDocumento,
      descricao: t.txtDescricao || t.descricao
    }))

    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacoes-fornecedor-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ordenação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar:</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Deputado, categoria, documento..."
                  value={buscaTransacao}
                  onChange={(e) => setBuscaTransacao(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria:</label>
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categoriasDisponiveis.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Risco */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Risco:</label>
              <Select value={filtroRiscoTransacao} onValueChange={setFiltroRiscoTransacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="baixo">Baixo Risco</SelectItem>
                  <SelectItem value="medio">Médio Risco</SelectItem>
                  <SelectItem value="alto">Alto Risco</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Ordenar por:</label>
              <div className="flex gap-1">
                <Select value={ordenacaoTransacoes} onValueChange={setOrdenacaoTransacoes}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="valor">Valor</SelectItem>
                    <SelectItem value="deputado">Deputado</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc')}
                >
                  {direcaoOrdenacao === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>
          </div>

          {/* Controles de Exibição */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm">Mostrar:</label>
                <Select 
                  value={transacoesExibidas.toString()} 
                  onValueChange={(value) => setTransacoesExibidas(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                {transacoesFiltradas.length} de {transacoesDetalhadas.length} transações
              </div>
            </div>

            <Button onClick={exportarTransacoes} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações */}
      <div className="space-y-4">
        {transacoesFiltradas.map((transacao, index) => {
          const transacaoId = `${transacao.numeroDocumento || index}_${transacao.dataEmissao || index}`
          const valor = transacao.valorLiquido || transacao.vlrLiquido || 0
          const risco = getTransactionRisk(valor, ticketMedio)
          const mostrandoDetalhes = mostrarDetalhes.has(transacaoId)

          return (
            <Card key={transacaoId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Linha principal */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDate(transacao.dataEmissao || transacao.dataDocumento)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {transacao.nomeDeputado || transacao.txNomeParlamentar || 'N/A'}
                        </span>
                      </div>
                      
                      <Badge variant="outline">
                        {transacao.categoria || transacao.tipoDespesa || 'Sem categoria'}
                      </Badge>
                      
                      <Badge variant={risco.color as any}>
                        {risco.level} Risco
                      </Badge>
                    </div>

                    {/* Valor e documento */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-lg font-bold text-green-600">
                          R$ {valor.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      
                      {transacao.numeroDocumento && (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Doc: {transacao.numeroDocumento}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detalhes expandidos */}
                    {mostrandoDetalhes && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <strong>Descrição:</strong>
                            <div className="text-muted-foreground">
                              {transacao.txtDescricao || transacao.descricao || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <strong>Fornecedor CNPJ:</strong>
                            <div className="text-muted-foreground">
                              {transacao.cnpjFornecedor || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <strong>Valor Documento:</strong>
                            <div className="text-muted-foreground">
                              R$ {(transacao.valorDocumento || 0).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <div>
                            <strong>Data Documento:</strong>
                            <div className="text-muted-foreground">
                              {formatDate(transacao.dataDocumento)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de detalhes */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleDetalhes(transacaoId)}
                    className="ml-4"
                  >
                    {mostrandoDetalhes ? 'Ocultar' : 'Detalhes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Paginação/Load More */}
      {transacoesFiltradas.length >= transacoesExibidas && transacoesExibidas < transacoesDetalhadas.length && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => setTransacoesExibidas(transacoesExibidas + 100)}
          >
            Carregar Mais Transações
          </Button>
        </div>
      )}

      {/* Resumo */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {transacoesFiltradas.length}
              </div>
              <div className="text-sm text-muted-foreground">Transações Exibidas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                R$ {transacoesFiltradas.reduce((acc, t) => acc + (t.valorLiquido || t.vlrLiquido || 0), 0).toLocaleString('pt-BR')}
              </div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-700 text-lg">
                R$ {(() => {
                  if (transacoesFiltradas.length === 0) return '0';
                  const valorTotal = transacoesFiltradas.reduce((acc, t) => acc + (t.valorLiquido || t.vlrLiquido || 0), 0);
                  const mesesEstimados = 12;
                  const mediaMensal = valorTotal / mesesEstimados;
                  return mediaMensal.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  });
                })()}
              </div>
              <div className="text-xs text-green-600 font-medium">Média Mensal por Deputado</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}