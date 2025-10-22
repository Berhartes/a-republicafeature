import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Filter, Calendar, Building2 } from 'lucide-react'
import type { DespesaDetalhada } from '../hooks/useDeputadoData.js'

const checkLegacyFields = (_data: any, context: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [Legacy Check] ${context}: Verificação de campos legados (mock)`)
  }
}

interface DeputadoTransacoesPageProps {
  despesasDetalhadas: DespesaDetalhada[]
  categoriaTransacaoSelecionada: string
  setCategoriaTransacaoSelecionada: (categoria: string) => void
  anoSelecionado: number
  mesSelecionado: string
}

type SortOption = 'data-desc' | 'data-asc' | 'valor-desc' | 'valor-asc' | 'fornecedor'

export function DeputadoTransacoesPage({
  despesasDetalhadas,
  categoriaTransacaoSelecionada,
  setCategoriaTransacaoSelecionada,
  anoSelecionado,
  mesSelecionado
}: DeputadoTransacoesPageProps) {
  const [busca, setBusca] = useState('')
  const [ordenacao, setOrdenacao] = useState<SortOption>('data-desc')
  const [itensPorPagina, setItensPorPagina] = useState(20)
  const [paginaAtual, setPaginaAtual] = useState(1)

  const categoriasDisponiveis = useMemo(() => {
    const categorias = Array.from(new Set(
      despesasDetalhadas
        .map(d => d.tipoDespesa)
        .filter(Boolean)
    )).sort()
    
    return [
      { valor: 'todas', nome: 'Todas as Categorias' },
      ...categorias.map(cat => ({ valor: cat, nome: cat }))
    ]
  }, [despesasDetalhadas])

  const transacoesFiltradas = useMemo(() => {
    let filtradas = despesasDetalhadas

    if (categoriaTransacaoSelecionada !== 'todas') {
      filtradas = filtradas.filter(t => t.tipoDespesa === categoriaTransacaoSelecionada)
    }

    if (busca.trim()) {
      const termoBusca = busca.toLowerCase()
      filtradas = filtradas.filter(t => {
        checkLegacyFields(t, 'deputado-transacoes-page-busca');
        
        return t.nomeFornecedor?.toLowerCase().includes(termoBusca) ||
          t.tipoDespesa?.toLowerCase().includes(termoBusca) ||
          t.numeroDocumento?.toLowerCase().includes(termoBusca)
      })
    }

    filtradas.sort((a, b) => {
      switch (ordenacao) {
        case 'data-desc': {
          const dataA = a.dataDocumento ? new Date(a.dataDocumento) : new Date(0)
          const dataB = b.dataDocumento ? new Date(b.dataDocumento) : new Date(0)
          return dataB.getTime() - dataA.getTime()
        }
        case 'data-asc': {
          const dataA = a.dataDocumento ? new Date(a.dataDocumento) : new Date(0)
          const dataB = b.dataDocumento ? new Date(b.dataDocumento) : new Date(0)
          return dataA.getTime() - dataB.getTime()
        }
        case 'valor-desc':
          return (b.valorLiquido || 0) - (a.valorLiquido || 0)
        case 'valor-asc':
          return (a.valorLiquido || 0) - (b.valorLiquido || 0)
        case 'fornecedor':
          return (a.nomeFornecedor || '').localeCompare(b.nomeFornecedor || '')
        default:
          return 0
      }
    })

    return filtradas
  }, [despesasDetalhadas, categoriaTransacaoSelecionada, busca, ordenacao])

  const totalPaginas = Math.ceil(transacoesFiltradas.length / itensPorPagina)
  const transacoesPaginadas = transacoesFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  )

  const estatisticasFiltradas = useMemo(() => {
    const total = transacoesFiltradas.reduce((acc, t) => acc + (t.valorLiquido || 0), 0)
    const media = transacoesFiltradas.length > 0 ? total / transacoesFiltradas.length : 0
    return { total, media, quantidade: transacoesFiltradas.length }
  }, [transacoesFiltradas])

  const formatarData = (data: any): string => {
    if (!data) return 'N/A'
    try {
      const dataObj = data.toDate ? data.toDate() : new Date(data)
      return dataObj.toLocaleDateString('pt-BR')
    } catch {
      return 'N/A'
    }
  }

  const exportarTransacoes = () => {
    const dadosExport = {
      periodo: `${mesSelecionado === 'todos' ? 'Ano' : 'Mês'} ${mesSelecionado !== 'todos' ? mesSelecionado + '/' : ''}${anoSelecionado}`,
      categoria: categoriaTransacaoSelecionada === 'todas' ? 'Todas' : categoriaTransacaoSelecionada,
      estatisticas: estatisticasFiltradas,
      transacoes: transacoesFiltradas.map(t => ({
        data: formatarData(t.dataDocumento),
        categoria: t.tipoDespesa,
        fornecedor: t.nomeFornecedor,
        cnpj: t.cnpjCpfFornecedor,
        valor: t.valorLiquido,
        documento: t.numeroDocumento
      }))
    }

    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `transacoes_${categoriaTransacaoSelecionada}_${anoSelecionado}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
          <CardDescription>
            Filtre e busque nas transações do deputado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar fornecedor, categoria..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categoria */}
            <Select value={categoriaTransacaoSelecionada} onValueChange={setCategoriaTransacaoSelecionada}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoriasDisponiveis.map(cat => (
                  <SelectItem key={cat.valor} value={cat.valor}>
                    {cat.nomeEleitoral.length > 30 ? cat.nomeEleitoral.substring(0, 30) + '...' : cat.nomeEleitoral}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={ordenacao} onValueChange={(value) => setOrdenacao(value as SortOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="data-desc">Mais Recente</SelectItem>
                <SelectItem value="data-asc">Mais Antigo</SelectItem>
                <SelectItem value="valor-desc">Maior Valor</SelectItem>
                <SelectItem value="valor-asc">Menor Valor</SelectItem>
                <SelectItem value="fornecedor">Fornecedor A-Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Itens por página */}
            <Select value={itensPorPagina.toString()} onValueChange={(value) => setItensPorPagina(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 por página</SelectItem>
                <SelectItem value="20">20 por página</SelectItem>
                <SelectItem value="50">50 por página</SelectItem>
                <SelectItem value="100">100 por página</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas das Transações Filtradas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {estatisticasFiltradas.quantidade}
            </div>
            <p className="text-sm text-muted-foreground">Transações Encontradas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              R$ {estatisticasFiltradas.total.toLocaleString('pt-BR')}
            </div>
            <p className="text-sm text-muted-foreground">Valor Total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              R$ {estatisticasFiltradas.media.toLocaleString('pt-BR')}
            </div>
            <p className="text-sm text-muted-foreground">Valor Médio</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Transações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transações</CardTitle>
              <CardDescription>
                Mostrando {transacoesPaginadas.length} de {transacoesFiltradas.length} transação(ões)
              </CardDescription>
            </div>
            <Button onClick={exportarTransacoes} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transacoesPaginadas.length > 0 ? (
            <div className="space-y-4">
              {transacoesPaginadas.map((transacao, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{formatarData(transacao.dataDocumento)}</span>
                        {transacao.numeroDocumento && (
                          <Badge variant="outline" className="text-xs">
                            Doc: {transacao.numeroDocumento}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {transacao.nomeFornecedor || 'Fornecedor não informado'}
                        </span>
                      </div>
                      
                      {transacao.cnpjCpfFornecedor && (
                        <div className="text-xs text-muted-foreground mb-2">
                          CNPJ: {transacao.cnpjCpfFornecedor}
                        </div>
                      )}
                      
                      <Badge variant="secondary" className="text-xs">
                        {transacao.tipoDespesa || 'Categoria não informada'}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold">
                        R$ {(transacao.valorLiquido || 0).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhuma transação encontrada com os filtros aplicados.</p>
            </div>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Página {paginaAtual} de {totalPaginas}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}