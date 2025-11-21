'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DeputadoResumo, DespesaDetalhada } from '@a-republica/shared'

interface PerfilDeputadoClientProps {
  deputado: DeputadoResumo
  transacoesData: {
    transacoes: DespesaDetalhada[]
    total: number
  }
  comparativoData: {
    categorias: Array<{ nome: string; total: number }>
    totalGasto: number
  }
  redePoliticaData?: {
    nodes: Array<any>
    links: Array<any>
  }
  initialFilters: {
    ano: string
    mes: string
    categoria: string
    busca: string
    ordenacao: string
    tab: string
  }
  initialTab: string
}

export function PerfilDeputadoClient({
  deputado,
  transacoesData,
  comparativoData,
  redePoliticaData,
  initialFilters,
  initialTab,
}: PerfilDeputadoClientProps) {
  const [activeTab, setActiveTab] = useState(initialTab)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      {/* Header do Deputado */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {deputado.urlFoto && (
              <img
                src={deputado.urlFoto}
                alt={deputado.nomeEleitoral}
                className="w-20 h-20 rounded-full object-cover"
              />
            )}
            <div>
              <CardTitle className="text-3xl">{deputado.nomeEleitoral}</CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge>{deputado.siglaPartido}</Badge>
                <Badge variant="outline">{deputado.siglaUf}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total de Despesas</p>
              <p className="text-2xl font-bold">{formatCurrency(deputado.totalDespesas)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número de Transações</p>
              <p className="text-2xl font-bold">{transacoesData.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Categorias</p>
              <p className="text-2xl font-bold">{comparativoData.categorias.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          {redePoliticaData && <TabsTrigger value="relacoes">Relações</TabsTrigger>}
        </TabsList>

        <TabsContent value="visao-geral">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Gastos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Top 5 Categorias</h3>
                  {comparativoData.categorias.slice(0, 5).map((cat, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 border-b">
                      <span className="text-sm">{cat.nome}</span>
                      <span className="font-semibold">{formatCurrency(cat.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transacoes">
          <Card>
            <CardHeader>
              <CardTitle>Transações ({transacoesData.total})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transacoesData.transacoes.map((transacao, idx) => (
                  <div key={idx} className="border-b pb-3 mb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{transacao.nomeFornecedor}</p>
                        <p className="text-sm text-muted-foreground">{transacao.tipoDespesa}</p>
                        <p className="text-xs text-muted-foreground">
                          {transacao.dataDocumento && formatDate(transacao.dataDocumento)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(transacao.valorLiquido || 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categorias">
          <Card>
            <CardHeader>
              <CardTitle>Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {comparativoData.categorias.map((cat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span>{cat.nome}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(cat.total / comparativoData.totalGasto) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-semibold w-32 text-right">
                        {formatCurrency(cat.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {redePoliticaData && (
          <TabsContent value="relacoes">
            <Card>
              <CardHeader>
                <CardTitle>Rede de Fornecedores</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {redePoliticaData.nodes.length} fornecedores conectados
                </p>
                <div className="mt-4 space-y-2">
                  {redePoliticaData.nodes
                    .filter(n => n.type === 'fornecedor')
                    .slice(0, 10)
                    .map((node, idx) => (
                      <div key={idx} className="flex justify-between items-center border-b pb-2">
                        <span className="text-sm">{node.name}</span>
                        <span className="font-semibold">{formatCurrency(node.value)}</span>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
