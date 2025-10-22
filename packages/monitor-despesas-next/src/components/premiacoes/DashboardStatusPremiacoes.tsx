
import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Crown, Trophy, Medal, Users, Target, TrendingUp, Star, Award } from 'lucide-react'
import { type PremiacoesGlobais } from '@/services/premiacao-unificada'

interface DashboardStatusPremiacoesProps {
  premiacoes: PremiacoesGlobais | null
  rankingCount: number
  estatisticas?: any
}

interface EstatisticasPremiacoes {
  coroas: number
  trofeus: number
  medalhas: number
  deputadosPremiados: number
  totalPremiacoes: number
  deputadosComMultiplasPremiacoes: number
  valorTotalPremiados: number
  scoreMedio: number
  totalGeral: number
  totalDeputados: number
  totalCategorias: number
  anosDisponiveis: number
  ultimaAtualizacao: Date | null
}

export function DashboardStatusPremiacoes({
  premiacoes,
  rankingCount,
  estatisticas
}: DashboardStatusPremiacoesProps) {
  
  console.log('🔍 [DashboardStatus] Props recebidas:', {
    'estatisticas?.totalDeputados': estatisticas?.totalDeputados,
    'rankingCount': rankingCount,
    'premiacoes existe': !!premiacoes
  })
  
  const estatisticasPremiacoes: EstatisticasPremiacoes = useMemo(() => {
    console.log('🔄 [DashboardStatus] Recalculando useMemo - estatisticas mudaram:', {
      'estatisticas?.totalDeputados': estatisticas?.totalDeputados,
      'tipo de estatisticas': typeof estatisticas?.totalDeputados,
      'rankingCount': rankingCount
    })
    
    if (!premiacoes) {
      const totalDeputadosSemPremiacoes = estatisticas?.totalDeputados || rankingCount || 0
      console.log('⚠️ [DashboardStatus] SEM premiações - totalDeputados escolhido:', totalDeputadosSemPremiacoes)
      
      return {
        coroas: 0,
        trofeus: 0,
        medalhas: 0,
        deputadosPremiados: 0,
        totalPremiacoes: 0,
        deputadosComMultiplasPremiacoes: 0,
        valorTotalPremiados: 0,
        scoreMedio: 0,
        totalGeral: estatisticas?.totalGeral || 0,
        totalDeputados: totalDeputadosSemPremiacoes,
        totalCategorias: estatisticas?.totalCategorias || Object.keys(estatisticas?.estatisticasPorCategoria || {}).length || 20,
        anosDisponiveis: estatisticas?.anosDisponiveis?.length || (estatisticas?.anosDisponiveis ? estatisticas.anosDisponiveis.length : 3),
        ultimaAtualizacao: null
      }
    }

    const deputadosUnicos = new Set()
    const deputadosContador = new Map()
    let valorTotal = 0
    
    premiacoes.coroas.forEach(c => {
      deputadosUnicos.add(c.deputadoId)
      deputadosContador.set(c.deputadoId, (deputadosContador.get(c.deputadoId) || 0) + 1)
      valorTotal += c.valor || 0
    })
    premiacoes.trofeus.forEach(t => {
      deputadosUnicos.add(t.deputadoId)
      deputadosContador.set(t.deputadoId, (deputadosContador.get(t.deputadoId) || 0) + 1)
      valorTotal += t.valor || 0
    })
    premiacoes.medalhas.forEach(m => {
      deputadosUnicos.add(m.deputadoId)
      deputadosContador.set(m.deputadoId, (deputadosContador.get(m.deputadoId) || 0) + 1)
      valorTotal += m.valor || 0
    })

    const deputadosMultiplos = Array.from(deputadosContador.values()).filter(count => count > 1).length
    
    const totalPremiacoes = premiacoes.coroas.length + premiacoes.trofeus.length + premiacoes.medalhas.length
    const scoreMedio = totalPremiacoes > 0 ? Math.round((valorTotal / totalPremiacoes) / 10000) : 0

    const totalDeputadosComPremiacoes = estatisticas?.totalDeputados || deputadosUnicos.size || rankingCount || 0
    console.log('✅ [DashboardStatus] COM premiações - totalDeputados escolhido:', {
      'estatisticas?.totalDeputados': estatisticas?.totalDeputados,
      'deputadosUnicos.size': deputadosUnicos.size,
      'rankingCount': rankingCount,
      'valor final': totalDeputadosComPremiacoes
    })

    return {
      coroas: premiacoes.coroas.length,
      trofeus: premiacoes.trofeus.length,
      medalhas: premiacoes.medalhas.length,
      deputadosPremiados: deputadosUnicos.size,
      totalPremiacoes,
      deputadosComMultiplasPremiacoes: deputadosMultiplos,
      valorTotalPremiados: valorTotal,
      scoreMedio,
      totalGeral: estatisticas?.totalGeral || valorTotal,
      totalDeputados: totalDeputadosComPremiacoes,
      totalCategorias: estatisticas?.totalCategorias || Object.keys(estatisticas?.estatisticasPorCategoria || {}).length || 20,
      anosDisponiveis: estatisticas?.anosDisponiveis?.length || (estatisticas?.anosDisponiveis ? estatisticas.anosDisponiveis.length : 3),
      ultimaAtualizacao: premiacoes.ultimaAtualizacao ? new Date(premiacoes.ultimaAtualizacao) : new Date()
    }
  }, [premiacoes, estatisticas])

  return (
    <div className="space-y-4">
      {/* Grid Principal de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Geral do Sistema */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-emerald-700">
              R$ {(estatisticasPremiacoes.totalGeral / 1000000).toFixed(1)}M
            </div>
            <div className="text-xs text-emerald-600 font-medium">Total Geral</div>
          </CardContent>
        </Card>

        {/* Total Deputados no Sistema */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-blue-700">
              {estatisticasPremiacoes.totalDeputados}
            </div>
            <div className="text-xs text-blue-600 font-medium">Deputados</div>
          </CardContent>
        </Card>

        {/* Total Transações */}
        <Card className="bg-gradient-to-br from-violet-50 to-purple-100 border-violet-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-violet-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-violet-700">
              {(estatisticas?.totalTransacoes || 0).toLocaleString()}
            </div>
            <div className="text-xs text-violet-600 font-medium">Transações</div>
          </CardContent>
        </Card>

        {/* Total Categorias */}
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-teal-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-teal-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-teal-700">
              {estatisticasPremiacoes.totalCategorias}
            </div>
            <div className="text-xs text-teal-600 font-medium">Categorias</div>
          </CardContent>
        </Card>

        {/* Anos Disponíveis */}
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Award className="w-4 h-4 text-amber-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-amber-700">
              {estatisticasPremiacoes.anosDisponiveis}
            </div>
            <div className="text-xs text-amber-600 font-medium">Anos</div>
          </CardContent>
        </Card>

        {/* Total de Premiações */}
        <Card className="bg-gradient-to-br from-cyan-50 to-teal-100 border-cyan-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Award className="w-4 h-4 text-cyan-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-cyan-700">
              {estatisticasPremiacoes.totalPremiacoes.toLocaleString()}
            </div>
            <div className="text-xs text-cyan-600 font-medium">Total Prêmios</div>
          </CardContent>
        </Card>

        {/* Deputados Premiados */}
        <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-rose-200">
          <CardContent className="p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Star className="w-4 h-4 text-rose-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-rose-700">
              {estatisticasPremiacoes.deputadosPremiados}
            </div>
            <div className="text-xs text-rose-600 font-medium">Premiados</div>
          </CardContent>
        </Card>

        {/* Cards de Premiações Empilhados */}
        <div className="space-y-1">
          {/* Coroas */}
          <Card className="bg-gradient-to-r from-purple-50 to-violet-100 border-purple-200">
            <CardContent className="p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Crown className="w-3 h-3 text-purple-600" />
                <div className="text-sm font-bold text-purple-700">{estatisticasPremiacoes.coroas}</div>
                <div className="text-xs text-purple-600">Coroas</div>
              </div>
            </CardContent>
          </Card>

          {/* Troféus */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-100 border-yellow-200">
            <CardContent className="p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-600" />
                <div className="text-sm font-bold text-yellow-700">{estatisticasPremiacoes.trofeus}</div>
                <div className="text-xs text-yellow-600">Troféus</div>
              </div>
            </CardContent>
          </Card>

          {/* Medalhas */}
          <Card className="bg-gradient-to-r from-orange-50 to-red-100 border-orange-200">
            <CardContent className="p-2 text-center">
              <div className="flex items-center justify-center gap-1">
                <Medal className="w-3 h-3 text-orange-600" />
                <div className="text-sm font-bold text-orange-700">{estatisticasPremiacoes.medalhas}</div>
                <div className="text-xs text-orange-600">Medalhas</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Informações de Última Atualização */}
      {estatisticasPremiacoes.ultimaAtualizacao && (
        <div className="bg-gray-50/50 border border-gray-100 rounded p-2 mt-2">
          <div className="text-xs text-gray-500 opacity-70">
            Última atualização das premiações: {estatisticasPremiacoes.ultimaAtualizacao.toLocaleDateString('pt-BR')} às {estatisticasPremiacoes.ultimaAtualizacao.toLocaleTimeString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardStatusPremiacoes