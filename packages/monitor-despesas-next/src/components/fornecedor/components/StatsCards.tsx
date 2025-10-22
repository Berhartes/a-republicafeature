import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, AlertTriangle, Users, Building2 } from 'lucide-react'
import { FornecedorStats } from '@/services/fornecedores-service'

interface StatsCardsProps {
  fornecedorData: FornecedorStats
  transacoesDetalhadas: any[]
  deputadosClientes?: any[]
  anoSelecionado?: number
  dadosHistoricos?: any[]
}

const obterCategoriaRisco = (score: number): string => {
  if (score >= 80) return 'Crítico'
  if (score >= 60) return 'Alto'
  if (score >= 40) return 'Médio'
  return 'Baixo'
}

const obterCorScore = (score: number): string => {
  if (score >= 80) return 'text-red-600'
  if (score >= 60) return 'text-orange-600'
  if (score >= 40) return 'text-yellow-600'
  return 'text-green-600'
}

export function StatsCards({ fornecedorData, transacoesDetalhadas, deputadosClientes, anoSelecionado, dadosHistoricos }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {(() => {
            const todasTransacoes = dadosHistoricos && dadosHistoricos.length > 0 ? dadosHistoricos : transacoesDetalhadas
            
            if (!todasTransacoes || todasTransacoes.length === 0) {
              return (
                <>
                  <div className="text-2xl font-bold text-gray-400">R$ 0</div>
                  <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
                </>
              )
            }
            
            let totalGeral = 0
            let valorAnoAtual = 0
            const anosMap = new Map<number, { valor: number, transacoes: number }>()
            const anoAtual = anoSelecionado || new Date().getFullYear()
            
            todasTransacoes.forEach(t => {
              const valorLiquido = t.valorLiquido || t.vlrLiquido || t.valorDocumento || t.vlrDocumento || 0
              const valor = parseFloat(valorLiquido.toString()) || 0
              
              if (valor <= 0) return // Skip invalid values
              
              totalGeral += valor
              
              let ano = null
              if (t.anoOrigemDocumento) {
                ano = t.anoOrigemDocumento
              } else if (t.ano) {
                ano = t.ano
              } else {
                const dataEmissao = t.dataEmissao || t.dataDocumento || t.datEmissao || t.datDocumento
                if (dataEmissao) {
                  try {
                    const data = dataEmissao.toDate ? dataEmissao.toDate() : new Date(dataEmissao)
                    ano = data.getFullYear()
                  } catch (error) {
                    console.error('Erro ao derivar ano da transação do fornecedor', error)
                  }
                }
              }
              
              if (ano) {
                const anoData = anosMap.get(ano) || { valor: 0, transacoes: 0 }
                anoData.valor += valor
                anoData.transacoes += 1
                anosMap.set(ano, anoData)
              }
            })
            
            transacoesDetalhadas.forEach(t => {
              const valorLiquido = t.valorLiquido || t.vlrLiquido || t.valorDocumento || t.vlrDocumento || 0
              const valor = parseFloat(valorLiquido.toString()) || 0
              if (valor > 0) {
                valorAnoAtual += valor
              }
            })
            
            const anosUnicos = Array.from(anosMap.keys())
            const totalTransacoes = Array.from(anosMap.values()).reduce((sum, data) => sum + data.transacoes, 0)
            
            return (
              <>
                <div className="flex items-end space-x-2">
                  <div className="text-2xl font-bold text-blue-600">
                    R$ {valorAnoAtual.toLocaleString('pt-BR')}
                  </div>
                  <div className="text-sm text-gray-500 pb-1">em {anoAtual}</div>
                </div>
                <div className="mt-1 text-xs text-green-600 font-medium">
                  R$ {totalGeral.toLocaleString('pt-BR')} total geral
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalTransacoes.toLocaleString('pt-BR')} transações • {anosUnicos.length} {anosUnicos.length === 1 ? 'ano' : 'anos'} de histórico
                </p>
              </>
            )
          })()}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score de Suspeição</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${obterCorScore(fornecedorData.scoreSuspeicao || 0)}`}>
            {fornecedorData.scoreSuspeicao}
          </div>
          <p className="text-xs text-muted-foreground">
            {obterCategoriaRisco(fornecedorData.scoreSuspeicao || 0)} • {fornecedorData.alertas?.length || 0} alertas
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Deputados Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              {fornecedorData.deputadosAtendidos?.length || 0}
            </div>
            <div className="text-sm text-gray-500 pb-1">total</div>
          </div>
          {deputadosClientes && (
            <div className="mt-1 text-xs text-green-600 font-medium">
              {deputadosClientes.filter(d => (d.valor || 0) > 0).length} atendidos • {transacoesDetalhadas.length} transações em {anoSelecionado || new Date().getFullYear()}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Relacionamento parlamentar
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <div className="font-bold text-green-700 text-lg">
              R$ {(() => {
                const totalDeputados = fornecedorData.deputadosAtendidos || 1;
                const mesesEstimados = 12;
                const valorTotal = fornecedorData.totalTransacionado || 0;
                const mediaMensal = totalDeputados > 0 && mesesEstimados > 0 ? 
                  valorTotal / (totalDeputados * mesesEstimados) : 0;
                return mediaMensal.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                });
              })()}
            </div>
            <div className="text-xs text-green-600 font-medium">Média Mensal por Deputado</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}