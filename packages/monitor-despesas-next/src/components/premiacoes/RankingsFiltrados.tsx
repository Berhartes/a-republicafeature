
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, Trophy, Users, Eye, ChevronDown } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import BadgesPremiacaoDeputado from '@/components/premiacoes/BadgesPremiacaoDeputado'
import { UnifiedRankingDisplay } from '@/components/unified/UnifiedRankingDisplay'


interface EstatisticasGlobais {
  totalGeral: number
  totalTransacoes: number
  mediaTransacao: number
  totalDeputados: number
  totalFornecedores: number
  totalCategorias: number
  anosDisponiveis: number[]
  estatisticasPorAno: Record<string, any>
  estatisticasPorCategoria: Record<string, any>
  top10Geral: DeputadoRanking[]
  top10PorCategoria: Record<string, DeputadoRanking[]>
  ultimaAtualizacao: Date
}

interface RankingsFiltradosProps {
  rankingGeral: DeputadoRanking[]
  loading: boolean
  anoSelecionado: string
  categoriaSelecionada: string
  estatisticas: EstatisticasGlobais | null
}

export function RankingsFiltrados({
  rankingGeral,
  loading,
  anoSelecionado,
  categoriaSelecionada,
  estatisticas
}: RankingsFiltradosProps) {
  const [deputadosExibidos, setDeputadosExibidos] = useState(20)
  const DEPUTADOS_POR_PAGINA = 20

  React.useEffect(() => {
    setDeputadosExibidos(20)
  }, [anoSelecionado, categoriaSelecionada])

  return (
    <div className="space-y-6">
      {/* 🏆 RANKING UNIFICADO */}
      <UnifiedRankingDisplay
        ranking={rankingGeral}
        loading={loading}
        categoria={categoriaSelecionada === 'TODAS' ? undefined : categoriaSelecionada}
        ano={anoSelecionado === 'todos' ? undefined : anoSelecionado}
        deputadosExibidos={deputadosExibidos}
        setDeputadosExibidos={setDeputadosExibidos}
        mostrarControles={true}
        mostrarEstatisticas={true}
        tamanhoCard="lg"
        titulo={`Ranking ${categoriaSelecionada === 'TODAS' ? 'Geral' : categoriaSelecionada} - ${anoSelecionado === 'todos' ? 'Todos os anos' : anoSelecionado}`}
        descricao={categoriaSelecionada === 'TODAS' ? 'Top deputados por gastos totais' : `Top deputados na categoria: ${categoriaSelecionada}`}
      />


      {/* Card quando não há dados */}
      {rankingGeral.length === 0 && !loading && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Trophy className="h-12 w-12 text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-800">
                  Dados não disponíveis
                </h3>
                <p className="text-sm text-orange-700 mt-2">
                  Não foram encontrados dados de rankings para:
                </p>
                <div className="mt-3 text-sm text-orange-800 font-medium">
                  📊 <strong>Categoria:</strong> {categoriaSelecionada === 'TODAS' ? 'Ranking Geral' : categoriaSelecionada}<br/>
                  📅 <strong>Período:</strong> {anoSelecionado === 'todos' ? 'Histórico' : `Ano ${anoSelecionado}`}
                </div>
                <p className="text-xs text-orange-600 mt-3">
                  Os rankings são calculados automaticamente a partir dos dados de transações do .<br/>
                  Se você esperava ver dados aqui, verifique se o processamento ETL foi executado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}

export default RankingsFiltrados