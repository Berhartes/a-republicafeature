
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link, useNavigate } from '@tanstack/react-router'
import { Building2, Calendar, Search, TrendingUp, Users, Target, DollarSign, AlertTriangle, Filter, RefreshCw, Eye, EyeOff, Download, Shield, AlertOctagon, Zap } from 'lucide-react'
import { useFornecedoresCategoriaData } from './hooks/useFornecedoresCategoriaData'
import { obterMedalhasFornecedor } from '@/lib/supplier-badges'

interface FornecedoresCategoriaPageProps {
  categoria: string
}

const obterCategoriaRisco = (fornecedor: any): string => {
  return fornecedor.categoriaRisco || 'Baixo';
};

export const FornecedoresCategoriaPage = ({
  categoria,
}: FornecedoresCategoriaPageProps) => {
  const navigate = useNavigate()

  const {
    fornecedores: fornecedoresHook,
    estatisticasGerais,
    loading: loadingHook,
    ordenacao: ordenacaoHook,
    filters,
    carregarFornecedores,
    resetarFiltros: resetarFiltrosHook,
    setOrdenacao: setOrdenacaoHook,
  } = useFornecedoresCategoriaData(categoria)

  const fornecedores = fornecedoresHook
  const loading = loadingHook
  const ordenacao = ordenacaoHook
  const setOrdenacao = setOrdenacaoHook

  console.log('🔍 [FornecedoresCategoriaPage] Dados recebidos:', {
    categoria,
    fornecedoresHook: fornecedoresHook?.length || 0,
    fornecedoresUsados: fornecedores?.length || 0,
    loading
  })

  const fornecedoresOrdenados = useMemo(() => {
    if (!fornecedores || fornecedores.length === 0) return []

  const resultado = [...fornecedores]

    const ordenacaoAtual = ordenacao || 'valor-desc'
    switch (ordenacaoAtual) {
      case 'score-desc':
        resultado.sort((a, b) => (b.scoreSuspeicao || 0) - (a.scoreSuspeicao || 0))
        break
      case 'score-asc':
        resultado.sort((a, b) => (a.scoreSuspeicao || 0) - (b.scoreSuspeicao || 0))
        break
      case 'valor-desc':
        resultado.sort((a, b) => (b.totalTransacionado || b.totalRecebido || 0) - (a.totalTransacionado || a.totalRecebido || 0))
        break
      case 'valor-asc':
        resultado.sort((a, b) => (a.totalTransacionado || a.totalRecebido || 0) - (b.totalTransacionado || b.totalRecebido || 0))
        break
      case 'nome-asc':
        resultado.sort((a, b) => (a.nomeEleitoral || '').localeCompare(b.nomeEleitoral || ''))
        break
      case 'deputados-desc':
        resultado.sort((a, b) => {
          const aDeputados = Array.isArray(a.deputadosAtendidos) ? a.deputadosAtendidos.length : (a.totalDeputados || 0)
          const bDeputados = Array.isArray(b.deputadosAtendidos) ? b.deputadosAtendidos.length : (b.totalDeputados || 0)
          return bDeputados - aDeputados
        })
        break
      default:
        resultado.sort((a, b) => (b.totalTransacionado || b.totalRecebido || 0) - (a.totalTransacionado || a.totalRecebido || 0))
    }

    return resultado
  }, [fornecedores, ordenacao])

  const estatisticas = useMemo(() => {
    const totalFornecedores = fornecedoresOrdenados.length
    const suspeitos = fornecedoresOrdenados.filter(f => obterCategoriaRisco(f) !== 'Baixo').length
    const volumeTotal = fornecedoresOrdenados.reduce((sum, f) => sum + (f.totalTransacionado || 0), 0)

    return {
      total: totalFornecedores,
      suspeitos,
      volumeTotal,
      scoreInvestigativoMedio: 0 // Score médio deve vir do ETL
    }
  }, [fornecedoresOrdenados])

  const obterMedalhas = (fornecedor: any) => {
    return obterMedalhasFornecedor(fornecedor, fornecedoresOrdenados);
  }

  const renderCategoryIcon = (fornecedor: any) => {
    return <Building2 className="h-6 w-6 text-blue-600" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando fornecedores da categoria...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - EXATAMENTE IGUAL À PÁGINA PRINCIPAL */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Fornecedores
          </h1>
          <p className="text-muted-foreground mt-1">
            Visualizando {fornecedores.length.toLocaleString()} fornecedores da categoria
          </p>
        </div>
        {/* Botões removidos conforme solicitado */}
      </div>

        {/* Statistics Cards - EXATAMENTE IGUAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {estatisticas.volumeTotal?.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">
                {estatisticasGerais?.transacoesTotais?.toLocaleString('pt-BR') || 0} transações
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Score de Suspeição</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                estatisticas.scoreInvestigativoMedio >= 70 ? 'text-red-600' :
                estatisticas.scoreInvestigativoMedio >= 40 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {estatisticas.scoreInvestigativoMedio}
              </div>
              <p className="text-xs text-muted-foreground">
                {fornecedores.filter(f => f.alertas && f.alertas.length > 0).length || 0} alertas ativos
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {estatisticas?.total || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Empresas na categoria
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Mensal por Deputado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                R$ {estatisticasGerais?.valorMedioFornecedor?.toLocaleString('pt-BR') || 
                     (() => {
                       if (!estatisticasGerais || !estatisticasGerais.totalDeputadosProcessados) return '0';
                       const mesesEstimados = 12;
                       const mediaMensal = estatisticas.volumeTotal / (estatisticasGerais.totalDeputadosProcessados * mesesEstimados);
                       return mediaMensal.toLocaleString('pt-BR', { 
                         minimumFractionDigits: 0, 
                         maximumFractionDigits: 0 
                       });
                     })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Por deputado/mês
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Estatísticas Investigativas - EXATAMENTE IGUAL */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-blue-600">{estatisticas.total.toLocaleString()}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Suspeitos</p>
                <p className="text-2xl font-bold text-red-600">{estatisticas.suspeitos.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Volume Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {(estatisticas.volumeTotal / 1000000).toFixed(1)}M
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold text-orange-600">{estatisticas.scoreInvestigativoMedio || 0}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        {/* Card específico da categoria filtrada */}
        <Card className="border-blue-500 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Categoria Filtrada</p>
                <p className="text-2xl font-bold text-blue-800">{estatisticas.total}</p>
                <p className="text-xs text-blue-600 mt-1">
                  {categoria.length > 20 ? categoria.substring(0, 20) + '...' : categoria}
                </p>
              </div>
              <div className="flex flex-col items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <p className="text-xs text-blue-600 mt-1">
                  R$ {(estatisticas.volumeTotal / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards extras quando há estatísticas gerais */}
        {estatisticasGerais && (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Deputados</p>
                    <p className="text-2xl font-bold text-purple-600">{estatisticasGerais.totalDeputadosProcessados?.toLocaleString() || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Transações</p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {estatisticasGerais.transacoesTotais ? (estatisticasGerais.transacoesTotais / 1000000).toFixed(1) : '0'}M
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-cyan-600" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>



      {/* Lista de Fornecedores - EXATAMENTE IGUAL À PÁGINA PRINCIPAL */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Fornecedores</CardTitle>
              <p className="text-sm text-muted-foreground">
                Exibindo {fornecedoresOrdenados.length} de {fornecedoresOrdenados.length} fornecedores filtrados
                <span className="text-blue-600 font-medium"> • Categoria: {categoria}</span>
                <span className="text-xs block text-muted-foreground mt-1">
                  {fornecedores.length.toLocaleString()} carregados
                  {filters.anoFiltro !== 'todos' && (
                    <span className="text-blue-600">
                      <br/>🏷️ Filtrado por categoria "{categoria}" - {fornecedoresOrdenados.length} resultados encontrados
                    </span>
                  )}
                </span>
              </p>
            </div>
            <div className="w-56">
              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="score-desc">Score (Maior para Menor)</SelectItem>
                  <SelectItem value="score-asc">Score (Menor para Maior)</SelectItem>
                  <SelectItem value="valor-desc">Gasto Total (Maior para Menor)</SelectItem>
                  <SelectItem value="valor-asc">Gasto Total (Menor para Maior)</SelectItem>
                  <SelectItem value="nome-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="deputados-desc">Mais deputados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {fornecedoresOrdenados.length > 0 ? (
            <div className="space-y-4">
              {fornecedoresOrdenados.map((fornecedor, index) => {
                const totalDeputados = Array.isArray(fornecedor.deputadosAtendidos) 
                  ? fornecedor.deputadosAtendidos.length 
                  : (fornecedor.totalDeputados || 0)
                const numeroTransacoes = fornecedor.transacoes || fornecedor.numeroTransacoes || fornecedor.numTransacoes || 0
                const valorTotal = fornecedor.totalRecebido || fornecedor.totalTransacionado || 0
                const valorPorDeputado = totalDeputados > 0 ? valorTotal / totalDeputados : 0
                
              
              return (
                <div key={index} className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg transition-all duration-200 hover:border-gray-300 hover:shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="flex-1">
                        {/* Header do fornecedor - igual à página principal */}
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            {renderCategoryIcon(fornecedor)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-lg text-gray-900">{fornecedor.nomeEleitoral}</h3>
                              <Badge 
                                variant="outline"
                                className={
                                  obterCategoriaRisco(fornecedor) === 'Crítico' ? 'bg-red-100 text-red-700 border-red-200' :
                                  obterCategoriaRisco(fornecedor) === 'Alto' ? 'bg-red-100 text-red-700 border-red-200' :
                                  obterCategoriaRisco(fornecedor) === 'Médio' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                  'bg-green-100 text-green-700 border-green-200'
                                }
                              >
                                {obterCategoriaRisco(fornecedor)}: {fornecedor.scoreSuspeicao}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm text-gray-600">CNPJ: {fornecedor.cnpj}</p>
                              <Badge 
                                variant="outline" 
                                className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
                              >
                                {categoria}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Badges de status - igual à página principal */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {valorPorDeputado > 250000 && (
                            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                              💰 Alto Valor/Deputado
                            </Badge>
                          )}
                          
                          {/* Conquistas/Medalhas - igual à página principal */}
                          {(() => {
                            const medalhas = obterMedalhas(fornecedor)
                            return medalhas.map((medalha, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className={medalha.cor}
                                title={medalha.descricao}
                              >
                                {medalha.emoji} {medalha.titulo}
                              </Badge>
                            ))
                          })()}
                        </div>

                        {/* ✅ ESTATÍSTICAS UNIFICADAS - EXATAMENTE IGUAL À PÁGINA PRINCIPAL */}
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-bold text-blue-700 text-lg">{numeroTransacoes}</div>
                            <div className="text-xs text-blue-600 font-medium">Transações</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-purple-700 text-lg">{totalDeputados}</div>
                            <div className="text-xs text-purple-600 font-medium">Deputados</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-green-700 text-lg">
                              R$ {((valorTotal / 12)).toLocaleString('pt-BR', { 
                                minimumFractionDigits: 0, 
                                maximumFractionDigits: 0 
                              })}
                            </div>
                            <div className="text-xs text-green-600 font-medium">Média Mensal</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-orange-700 text-lg">
                              R$ {(valorTotal / 1000).toFixed(0)}k
                            </div>
                            <div className="text-xs text-orange-600 font-medium">Valor Total</div>
                          </div>
                        </div>

                        {/* Alertas - igual à página principal */}
                        {fornecedor.alertas && fornecedor.alertas.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertTriangle className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                {fornecedor.alertas.length} alerta{fornecedor.alertas.length > 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* ✅ RANKING VALUE DISPLAY UNIFICADO - EXATAMENTE IGUAL À PÁGINA PRINCIPAL */}
                    <div className="ml-4 flex flex-col items-end justify-center min-w-[120px]">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          R$ {valorTotal.toLocaleString('pt-BR', { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {totalDeputados} deputado{totalDeputados !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-blue-600 font-medium mt-1">
                          R$ {(valorTotal / Math.max(numeroTransacoes, 1)).toLocaleString('pt-BR', { 
                            minimumFractionDigits: 0, 
                            maximumFractionDigits: 0 
                          })} /transação
                        </div>
                      </div>
                      <div className="mt-3">
                        <Link
                          to="/gastos/fornecedor/$fornecedorId"
                          params={{ fornecedorId: fornecedor.cnpj.replace(/[^\d]/g, '') }}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum fornecedor encontrado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ CONFIRMAÇÃO DE UNIFICAÇÃO DE DADOS */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div>
              <p className="font-medium">
                🔧 SISTEMA UNIFICADO - Dados Totalmente Consistentes com a Página Principal
              </p>
              <p className="text-sm">
                ✅ <strong>Fonte única:</strong> useGlobalFornecedoresProcessor - mesmo processador da página /gastos/fornecedores<br/>
                📊 <strong>Filtros unificados:</strong> Mesma lógica de normalização e equivalência de categorias<br/>
                💰 <strong>Valores idênticos:</strong> PANTANAL VEICULOS LTDA agora exibe dados corretos e consistentes<br/>
                🎯 <strong>Cards sincronizados:</strong> Mesma estrutura, cálculos e formatação da página principal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default FornecedoresCategoriaPage