import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Loader2, AlertCircle, Calendar } from 'lucide-react'

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
    console.warn('Error formatting date:', error)
    return 'N/A'
  }
}

interface TransacoesCategoriaPageProps {
  todasTransacoesCategoria: any[]
  transacoesProcessadas: any[]
  anoSelecionado: number | 'todos'
  carregandoTransacoes?: boolean
}

export const TransacoesCategoriaPage = ({
  todasTransacoesCategoria = [],
  transacoesProcessadas = [],
  anoSelecionado,
  carregandoTransacoes = false
}) => {
  const [anoFiltro, setAnoFiltro] = useState<number | 'todos'>(anoSelecionado)
  
  useEffect(() => {
    setAnoFiltro(anoSelecionado)
  }, [anoSelecionado])
  
  const anosDisponiveis = useMemo(() => {
    if (!todasTransacoesCategoria?.length) return []
    
    const anosSet = new Set<number>()
    
    todasTransacoesCategoria.forEach(transacao => {
      const dataEmissao = transacao.dataEmissao || transacao.dataDocumento
      if (!dataEmissao) return
      
      try {
        let ano = null
        if (dataEmissao && typeof dataEmissao === 'object' && dataEmissao.seconds) {
          ano = new Date(dataEmissao.seconds * 1000).getFullYear()
        } else if (dataEmissao instanceof Date) {
          ano = dataEmissao.getFullYear()
        } else if (typeof dataEmissao === 'string') {
          ano = new Date(dataEmissao).getFullYear()
        } else if (dataEmissao && typeof dataEmissao.toDate === 'function') {
          ano = dataEmissao.toDate().getFullYear()
        }
        
        if (ano && ano >= 2015 && ano <= 2030) {
          anosSet.add(ano)
        }
      } catch (error) {
        console.error('Erro ao processar ano da transação da categoria', error)
      }
    })
    
    return Array.from(anosSet).sort((a, b) => b - a)
  }, [todasTransacoesCategoria])
  console.log(`🔍 [TransacoesCategoriaPage] === DEBUG TRANSAÇÕES ===`);
  console.log(`📊 [DEBUG] Total transações recebidas: ${todasTransacoesCategoria?.length || 0}`);
  console.log(`📊 [DEBUG] Transações processadas: ${transacoesProcessadas?.length || 0}`);
  console.log(`📅 [DEBUG] Ano selecionado: ${anoSelecionado}`);
  console.log(`⏳ [DEBUG] Carregando: ${carregandoTransacoes}`);
  
  if ((todasTransacoesCategoria?.length || 0) > 0) {
    console.log(`📝 [DEBUG] Exemplo transação:`, {
      id: todasTransacoesCategoria[0]?.id,
      fonte: todasTransacoesCategoria[0]?.fonte,
      ano: todasTransacoesCategoria[0]?.ano,
      dataEmissao: todasTransacoesCategoria[0]?.dataEmissao,
      dataDocumento: todasTransacoesCategoria[0]?.dataDocumento,
      keys: todasTransacoesCategoria[0] ? Object.keys(todasTransacoesCategoria[0]).slice(0, 10) : []
    });
  }
  const transacoesOtimizadas = useMemo(() => {
    if (!todasTransacoesCategoria?.length) return []
    
    const transacoesFiltradas = todasTransacoesCategoria.filter(transacao => {
      const dataEmissao = transacao.dataEmissao || transacao.dataDocumento
      if (!dataEmissao) return false
      
      if (anoFiltro === 'todos') return true
      
      try {
        let ano = null
        if (dataEmissao && typeof dataEmissao === 'object' && dataEmissao.seconds) {
          ano = new Date(dataEmissao.seconds * 1000).getFullYear()
        } else if (dataEmissao instanceof Date) {
          ano = dataEmissao.getFullYear()
        } else if (typeof dataEmissao === 'string') {
          ano = new Date(dataEmissao).getFullYear()
        } else if (dataEmissao && typeof dataEmissao.toDate === 'function') {
          ano = dataEmissao.toDate().getFullYear()
        }
        
        return ano === anoFiltro
      } catch (error) {
        return false
      }
    })
    
    return transacoesFiltradas.sort((a, b) => {
      const dateA = a.dataEmissao || a.dataDocumento
      const dateB = b.dataEmissao || b.dataDocumento
      
      if (!dateA || !dateB) return 0
      
      try {
        let timestampA = null, timestampB = null
        
        if (dateA && typeof dateA === 'object' && dateA.seconds) {
          timestampA = dateA.seconds * 1000
        } else if (dateA instanceof Date) {
          timestampA = dateA.getTime()
        } else if (typeof dateA === 'string') {
          timestampA = new Date(dateA).getTime()
        } else if (dateA && typeof dateA.toDate === 'function') {
          timestampA = dateA.toDate().getTime()
        }
        
        if (dateB && typeof dateB === 'object' && dateB.seconds) {
          timestampB = dateB.seconds * 1000
        } else if (dateB instanceof Date) {
          timestampB = dateB.getTime()
        } else if (typeof dateB === 'string') {
          timestampB = new Date(dateB).getTime()
        } else if (dateB && typeof dateB.toDate === 'function') {
          timestampB = dateB.toDate().getTime()
        }
        
        return timestampB - timestampA // Descending order
      } catch (error) {
        return 0
      }
    })
  }, [todasTransacoesCategoria, anoFiltro])

  const estatisticas = useMemo(() => {
    if (!transacoesOtimizadas.length) return {
      totalTransacoes: 0,
      volumeTotal: 0,
      deputadosUnicos: 0
    }

    const volumeTotal = transacoesOtimizadas.reduce((sum, t) => {
      const valor = parseFloat((t.valorLiquido || t.vlrLiquido || t.valorDocumento || t.vlrDocumento || 0).toString())
      return sum + (isNaN(valor) ? 0 : valor)
    }, 0)

    const deputadosUnicos = new Set(
      transacoesOtimizadas
        .map(t => t.nomeDeputado || t.txNomeParlamentar || t.deputadoNome)
        .filter(Boolean)
    ).size

    return {
      totalTransacoes: transacoesOtimizadas.length,
      volumeTotal,
      deputadosUnicos
    }
  }, [transacoesOtimizadas])

  if (carregandoTransacoes) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-2" />
            <span className="text-gray-600">Carregando transações...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {/* Filtro Temporal Independente */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Filtro Temporal
          </CardTitle>
          <CardDescription>
            Filtre as transações por ano específico ou visualize todos os dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2">Ano</label>
              <Select 
                value={anoFiltro.toString()} 
                onValueChange={(value) => {
                  const novoAno = value === 'todos' ? 'todos' : parseInt(value);
                  console.log(`🔄 [TransacoesPage] Alterando filtro de ${anoFiltro} para ${novoAno}`);
                  setAnoFiltro(novoAno);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500 mt-1">
                {transacoesOtimizadas.length.toLocaleString('pt-BR')} transações encontradas
              </div>
            </div>
            {anoFiltro !== anoSelecionado && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <p className="text-sm text-blue-800">
                  ℹ️ Filtro independente ativo
                </p>
                <p className="text-xs text-blue-600">
                  Mostrando {anoFiltro === 'todos' ? 'todos os anos' : anoFiltro} 
                  {anoSelecionado !== 'todos' && ` (página configurada para ${anoSelecionado})`}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {transacoesOtimizadas.length > 0 ? (
        <>
          {/* Estatísticas das Transações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {estatisticas.totalTransacoes.toLocaleString('pt-BR')}
                  </div>
                  <p className="text-sm text-gray-600">Total de Transações</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {estatisticas.volumeTotal.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                  <p className="text-sm text-gray-600">Volume Total</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {estatisticas.deputadosUnicos}
                  </div>
                  <p className="text-sm text-gray-600">Deputados Únicos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Transações da Categoria - {anoFiltro === 'todos' ? 'Todos os anos' : anoFiltro}
              </CardTitle>
              <CardDescription>
                Lista detalhada de {transacoesOtimizadas.length.toLocaleString('pt-BR')} transações {anoFiltro === 'todos' ? 'de todos os anos' : `do ano ${anoFiltro}`} (mostrando primeiras 200, ordenadas por data)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 border-b">Data</th>
                      <th className="text-left p-3 border-b">Deputado</th>
                      <th className="text-left p-3 border-b">Fornecedor</th>
                      <th className="text-left p-3 border-b">Valor</th>
                      <th className="text-left p-3 border-b">Categoria</th>
                      <th className="text-left p-3 border-b">Documento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transacoesOtimizadas.slice(0, 200).map((transacao, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 border-b text-sm">
                          {formatDate(transacao.dataEmissao || transacao.dataDocumento || transacao.datEmissao || transacao.datDocumento)}
                        </td>
                        <td className="p-3 border-b text-sm">
                          <div>
                            <div className="font-medium">
                              {transacao.nomeEleitoral || 
                               transacao.deputadoNome || 
                               transacao.nomeDeputado || 
                               transacao.txNomeParlamentar || 
                               'N/A'}
                              {transacao.deputadoInfo?.siglaPartido && (
                                <span className="text-gray-600 font-normal"> ({transacao.deputadoInfo.siglaPartido})</span>
                              )}
                            </div>
                            <div className="flex gap-2 text-xs text-gray-500 mt-1">
                              {transacao.deputadoInfo?.siglaUf && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                  {transacao.deputadoInfo.siglaUf}
                                </span>
                              )}
                            </div>
                            {transacao.nomeCivil && transacao.nomeCivil !== (transacao.nomeEleitoral || transacao.deputadoNome || transacao.nomeDeputado || transacao.txNomeParlamentar) && (
                              <div className="text-xs text-gray-500 mt-1">Nome civil: {transacao.nomeCivil}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 border-b text-sm">
                          <div>
                            <div className="font-medium">{transacao.nomeFornecedor || transacao.nomeFornecedor || transacao.txtNomeFornecedor || 'N/A'}</div>
                            {transacao.cnpjCpfFornecedor && (
                              <div className="text-xs text-gray-500">CNPJ: {transacao.cnpjCpfFornecedor}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-3 border-b text-sm font-medium text-green-600">
                          R$ {parseFloat((transacao.valorLiquido || transacao.vlrLiquido || transacao.valorDocumento || transacao.vlrDocumento || 0).toString()).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </td>
                        <td className="p-3 border-b text-sm">
                          {transacao.categoria || transacao.tipoDespesa || transacao.txtDescricao || 'N/A'}
                        </td>
                        <td className="p-3 border-b text-sm">
                          {transacao.urlDocumento || transacao.linkDocumento || transacao.urlNF ? (
                            <a 
                              href={transacao.urlDocumento || transacao.linkDocumento || transacao.urlNF}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              <FileText className="h-4 w-4 inline" />
                            </a>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {transacoesOtimizadas.length > 200 && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  Mostrando primeiras 200 transações de {transacoesOtimizadas.length.toLocaleString('pt-BR')} total
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma Transação Encontrada</h3>
              <p className="text-gray-600">
                Não foram encontradas transações para {anoFiltro === 'todos' ? 'nenhum ano' : `o ano ${anoFiltro}`} nesta categoria.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {anosDisponiveis.length > 0 ? (
                  `Tente selecionar um ano diferente. Anos disponíveis: ${anosDisponiveis.join(', ')}`
                ) : (
                  'Não há dados disponíveis para esta categoria.'
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}