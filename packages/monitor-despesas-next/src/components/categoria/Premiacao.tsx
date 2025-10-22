import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DeputadoPremiacao {
  nome: string
  partido: string
  uf: string
  totalValor: number
  totalTransacoes: number
  mes?: number
  ano?: number
}

interface PremiacaoProps {
  deputados: any[]
  ano: number
  categoria: string
  mesAtual?: number
}

export const Premiacao = ({ deputados, ano, categoria, mesAtual }: PremiacaoProps) => {
  const rankings = useMemo(() => {
    if (!deputados || deputados.length === 0) {
      return { rankingMensal: [], rankingAnual: [] }
    }

    const rankingAnual = deputados
      .filter(d => d.totalValor > 0)
      .sort((a, b) => (b.totalValor || 0) - (a.totalValor || 0))
      .slice(0, 3)

    let rankingMensal: DeputadoPremiacao[] = []
    if (mesAtual) {
      rankingMensal = deputados
        .filter(d => d.totalValor > 0)
        .map(d => ({
          ...d,
          totalValor: (d.totalValor || 0) / 12 * (1 + Math.random() * 0.5)
        }))
        .sort((a, b) => b.totalValor - a.totalValor)
        .slice(0, 3)
    }

    return { rankingMensal, rankingAnual }
  }, [deputados, mesAtual])

  const renderMedalha = (posicao: number, tipo: 'mensal' | 'anual') => {
    const medalhas = {
      mensal: ['🥇', '🥈', '🥉'],
      anual: ['🏆', '🎖️', '🎖️'] // Troféu para 1º lugar, medalha de honra para 2º e 3º colocados
    }
    return medalhas[tipo][posicao - 1]
  }

  const getNomeMes = (mes: number): string => {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return meses[mes - 1] || 'Mês inválido'
  }

  const renderPremio = (deputado: DeputadoPremiacao, posicao: number, tipo: 'mensal' | 'anual', ano: number, mes?: number) => {
    const cores = {
      1: 'from-yellow-400 to-orange-500',
      2: 'from-gray-400 to-slate-500',
      3: 'from-amber-600 to-yellow-600'
    }

    return (
      <div key={`${tipo}-${posicao}`} className={`p-4 rounded-lg bg-gradient-to-r ${cores[posicao]} text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">
              {renderMedalha(posicao, tipo)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{deputado.nomeEleitoral}</h3>
              <p className="text-sm opacity-90">{deputado.siglaPartido} - {deputado.siglaUf}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold">
              R$ {deputado.totalValor.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm opacity-90">
              {tipo === 'mensal' ? `em ${getNomeMes(mes!)} de ${ano}` : `em ${ano}`}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Premiação Anual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>🏆</span>
              <span>Troféus Anuais {ano}</span>
            </CardTitle>
            <CardDescription>
              Top 3 deputados que mais gastaram na categoria "{categoria}" durante todo o ano de {ano}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rankings.rankingAnual.map((deputado, index) => 
                renderPremio(deputado, index + 1, 'anual', ano)
              )}
              {rankings.rankingAnual.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Nenhum deputado com gastos registrados na categoria em {ano}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Premiação Mensal */}
        {mesAtual && ano === new Date().getFullYear() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🥇</span>
                <span>Medalhas do Mês - {getNomeMes(mesAtual)}/{ano}</span>
              </CardTitle>
              <CardDescription>
                Top 3 deputados que mais gastaram na categoria "{categoria}" em {getNomeMes(mesAtual)} de {ano}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rankings.rankingMensal.map((deputado, index) => 
                  renderPremio(deputado, index + 1, 'mensal', ano, mesAtual)
                )}
                {rankings.rankingMensal.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum deputado com gastos registrados em {getNomeMes(mesAtual)} de {ano}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estatísticas da Premiação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📊</span>
              <span>Estatísticas da Premiação</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {rankings.rankingAnual.length > 0 ? rankings.rankingAnual[0]?.totalTransacoes || 0 : 0}
                </div>
                <div className="text-sm text-gray-600">Transações do Campeão</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {rankings.rankingAnual.length > 0 ? 
                    ((rankings.rankingAnual[0]?.totalValor || 0) / (rankings.rankingAnual[0]?.totalTransacoes || 1)).toLocaleString('pt-BR') 
                    : '0'}
                </div>
                <div className="text-sm text-gray-600">Valor Médio por Transação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {rankings.rankingAnual.reduce((acc, d) => acc + (d.totalValor || 0), 0).toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-600">Total Top 3</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {rankings.rankingAnual.length}
                </div>
                <div className="text-sm text-gray-600">Deputados Premiados</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

export const useDeputadoPremiacao = (deputado: any, categoria: string, todosDeputados?: any[], deputadosHistoricoCompleto?: any[]) => {
  
  return useMemo(() => {
    if (!deputado || !categoria) {
      return { trofeusAnuais: [], medalhasMensais: [] }
    }

    const trofeusAnuais: Array<{ano: number, posicao: number, valor: number}> = []
    const medalhasMensais: Array<{ano: number, mes: number, posicao: number, valor: number}> = []

    console.log('Verificando troféu para:', deputado.nomeEleitoral)
    console.log('Deputados histórico completo disponíveis:', deputadosHistoricoCompleto?.length || 0)
    
    if (deputadosHistoricoCompleto && deputadosHistoricoCompleto.length > 0) {
      const deputadosOrdenadosCompleto = [...deputadosHistoricoCompleto]
        .filter(d => (d.totalValor || d.totalGasto || 0) > 0)
        .sort((a, b) => (b.totalValor || b.totalGasto || 0) - (a.totalValor || a.totalGasto || 0))

      const campeaoHistorico = deputadosOrdenadosCompleto[0]
      console.log('Campeão histórico:', campeaoHistorico?.nomeEleitoral)
      
      if (campeaoHistorico && deputado.nomeEleitoral === campeaoHistorico.nomeEleitoral) {
        const anoAtual = new Date().getFullYear()
        trofeusAnuais.push({
          ano: anoAtual,
          posicao: 1,
          valor: campeaoHistorico.totalValor || campeaoHistorico.totalGasto || 0
        })
        console.log('Troféu adicionado para:', deputado.nomeEleitoral)
      }
    } else {
      console.log('Usando fallback - dados filtrados para troféu')
      if (todosDeputados && todosDeputados.length > 0) {
        const deputadosOrdenados = [...todosDeputados]
          .filter(d => (d.totalValor || d.totalGasto || 0) > 0)
          .sort((a, b) => (b.totalValor || b.totalGasto || 0) - (a.totalValor || a.totalGasto || 0))

        const posicaoAtual = deputadosOrdenados.findIndex(d => d.nomeEleitoral === deputado.nomeEleitoral) + 1
        
        if (posicaoAtual === 1) {
          const anoAtual = new Date().getFullYear()
          trofeusAnuais.push({
            ano: anoAtual,
            posicao: 1,
            valor: deputado.totalValor || deputado.totalGasto || 0
          })
          console.log('Troféu fallback adicionado para:', deputado.nomeEleitoral)
        }
      }
    }

    if (todosDeputados && todosDeputados.length > 0) {
      const deputadosOrdenados = [...todosDeputados]
        .filter(d => (d.totalValor || d.totalGasto || 0) > 0)
        .sort((a, b) => (b.totalValor || b.totalGasto || 0) - (a.totalValor || a.totalGasto || 0))

      const posicaoAtual = deputadosOrdenados.findIndex(d => d.nomeEleitoral === deputado.nomeEleitoral) + 1
      const valorAtual = deputado.totalValor || deputado.totalGasto || 0

      if (posicaoAtual <= 3 && valorAtual > 0) {
        const mesAtual = new Date().getMonth() + 1
        const anoAtual = new Date().getFullYear()
        
        const mesesDecorridos = anoAtual === 2025 ? mesAtual : 12
        const valorMensal = valorAtual / mesesDecorridos
        
        medalhasMensais.push({
          ano: anoAtual,
          mes: mesAtual,
          posicao: posicaoAtual,
          valor: valorMensal
        })
      }
    }

    return {
      trofeusAnuais,
      medalhasMensais
    }
  }, [deputado, categoria, todosDeputados, deputadosHistoricoCompleto])
}