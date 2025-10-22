
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Crown, Trophy, Medal, Award, Star, Loader2 } from 'lucide-react'
import { deputadoPremiacaoUnificado } from '@/services/deputado-premiacao-unificado'

interface CoroaDeputado {
  deputadoId: string
  deputadoNome: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  valor: number
  dataConquista: string
}

interface TrofeuDeputado {
  deputadoId: string
  deputadoNome: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  ano: number
  valor: number
  posicao: number
  dataConquista: string
}

interface MedalhaDeputado {
  deputadoId: string
  deputadoNome: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  ano?: number
  valor: number
  posicao: number
  dataConquista: string
}

interface PremiacoesDeputadoProps {
  deputadoId: string
  deputadoNome: string
}

export function PremiacoesDeputado({ deputadoId, deputadoNome }: PremiacoesDeputadoProps) {
  const [coroas, setCoroas] = useState<CoroaDeputado[]>([])
  const [trofeus, setTrofeus] = useState<TrofeuDeputado[]>([])
  const [medalhas, setMedalhas] = useState<MedalhaDeputado[]>([])
  const [loading, setLoading] = useState(true)

  const carregarPremiacoes = useCallback(async () => {
    try {
      setLoading(true)
      console.log(`🏆 [Premiações Deputado] Carregando premiações para ${deputadoNome} (${deputadoId})`)
      
      const premiacoes = await deputadoPremiacaoUnificado.buscarPremiacoesDeputado(deputadoId)
      
      setCoroas(premiacoes.coroas)
      setTrofeus(premiacoes.trofeus)
      setMedalhas(premiacoes.medalhas)
      
      console.log(`✅ [Premiações Deputado] Carregadas: ${premiacoes.coroas.length} coroas, ${premiacoes.trofeus.length} troféus, ${premiacoes.medalhas.length} medalhas`)
    } catch (error) {
      console.error('❌ [Premiações Deputado] Erro ao carregar premiações:', error)
    } finally {
      setLoading(false)
    }
  }, [deputadoId, deputadoNome])

  useEffect(() => {
    if (deputadoId) {
      carregarPremiacoes()
    }
  }, [deputadoId, carregarPremiacoes])

  const formatarCategoria = useCallback((categoria: string): string => {
    return categoria
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase())
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }, [])

  const formatarMoeda = useCallback((valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor)
  }, [])

  const totalPremiacoes = useMemo(() => {
    return coroas.length + trofeus.length + medalhas.length
  }, [coroas.length, trofeus.length, medalhas.length])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Premiações e Conquistas
          </CardTitle>
          <CardDescription>
            Carregando premiações do deputado...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (totalPremiacoes === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Premiações e Conquistas
          </CardTitle>
          <CardDescription>
            Histórico de premiações do deputado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Este deputado ainda não possui premiações registradas.</p>
            <p className="text-sm text-gray-500 mt-2">
              As premiações são baseadas nos rankings de gastos por categoria e período.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Premiações e Conquistas
            <Badge variant="secondary" className="ml-2">
              {totalPremiacoes} {totalPremiacoes === 1 ? 'premiação' : 'premiações'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Troféus, coroas e medalhas conquistadas pelo deputado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Coroas - Campeões Históricos */}
          {coroas.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-600" />
                Coroas de Campeão Histórico
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  {coroas.length}
                </Badge>
              </h3>
              <div className="grid gap-3">
                {coroas.map((coroa, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                        👑
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {coroa.tipo === 'geral' 
                            ? 'Campeão Geral Histórico' 
                            : `Campeão da Categoria`
                          }
                        </h4>
                        {coroa.categoria && (
                          <p className="text-sm text-gray-600">
                            {coroa.categoria}
                          </p>
                        )}
                        <p className="text-xs text-purple-600 font-medium">
                          Maior gastador de todos os anos registrados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-purple-700">
                        {formatarMoeda(coroa.valor)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total histórico
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Troféus - Campeões Anuais */}
          {trofeus.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Troféus de Campeão Anual
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {trofeus.length}
                </Badge>
              </h3>
              <div className="grid gap-3">
                {trofeus.map((trofeu, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border border-yellow-200 rounded-lg bg-yellow-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white ${
                        trofeu.tipo === 'geral' 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-700'
                      }`}>
                        🏆
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {trofeu.tipo === 'geral' 
                            ? `Campeão Geral ${trofeu.ano}` 
                            : `Campeão da Categoria ${trofeu.ano}`
                          }
                        </h4>
                        {trofeu.categoria && (
                          <p className="text-sm text-gray-600">
                            {trofeu.categoria}
                          </p>
                        )}
                        <p className="text-xs text-yellow-600 font-medium">
                          1º lugar no ano de {trofeu.ano}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-yellow-700">
                        {formatarMoeda(trofeu.valor)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Total em {trofeu.ano}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medalhas - 2º e 3º lugares */}
          {medalhas.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Medal className="h-5 w-5 text-amber-600" />
                Medalhas de Honra ao Mérito
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  {medalhas.length}
                </Badge>
              </h3>
              <div className="grid gap-3">
                {medalhas.map((medalha, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full text-white ${
                        medalha.posicao === 2 
                          ? 'bg-gradient-to-r from-gray-400 to-gray-600' 
                          : 'bg-gradient-to-r from-amber-500 to-amber-700'
                      }`}>
                        {medalha.posicao === 2 ? '🥈' : '🥉'}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {medalha.posicao}º lugar {medalha.tipo === 'geral' ? 'Geral' : 'da Categoria'}
                          {medalha.ano ? ` ${medalha.ano}` : ' (Histórico)'}
                        </h4>
                        {medalha.categoria && (
                          <p className="text-sm text-gray-600">
                            {medalha.categoria}
                          </p>
                        )}
                        <p className="text-xs text-amber-600 font-medium">
                          {medalha.posicao === 2 ? 'Vice-campeão' : 'Terceiro colocado'}
                          {medalha.ano ? ` em ${medalha.ano}` : ' histórico'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-amber-700">
                        {formatarMoeda(medalha.valor)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {medalha.ano ? `Total em ${medalha.ano}` : 'Total histórico'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resumo das Conquistas */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-700">{coroas.length}</div>
                <div className="text-sm text-gray-600">Coroas</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-yellow-700">{trofeus.length}</div>
                <div className="text-sm text-gray-600">Troféus</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-amber-700">{medalhas.length}</div>
                <div className="text-sm text-gray-600">Medalhas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}