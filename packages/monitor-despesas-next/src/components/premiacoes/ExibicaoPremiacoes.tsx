
import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Crown, Trophy, Medal, Eye, Info } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { type PremiacoesGlobais } from '@/services/premiacao-unificada'
import { useGlobalData } from '@/contexts/GlobalDataContext'
import { deputadoPremiacaoUnificado, type PremiacoesDeputado } from '@/services/deputado-premiacao-unificado'
import BadgesPremiacaoDeputado from '@/components/premiacoes/BadgesPremiacaoDeputado'
import { premiacoesProcessor } from '@/services/premiacoes-processor'

interface ExibicaoPremiacoesProps {
  premiacoes: PremiacoesGlobais | null
}

const ExibicaoPremiacoesComponent = function({ premiacoes }: ExibicaoPremiacoesProps) {
  const { state } = useGlobalData()
  const [rankingData, setRankingData] = useState<any>(null)
  
  useEffect(() => {
    const fetchRankingData = async () => {
      try {
        const processed = await premiacoesProcessor.processarPremiacoes()
        setRankingData({
          ranking: processed.rankings.geral,
          estatisticas: processed.estatisticas
        })
      } catch (error) {
        console.error('Erro ao buscar dados do ranking:', error)
      }
    }
    
    fetchRankingData()
  }, [])
  
  if (!premiacoes) {
    return <GuiaAtivacao />
  }

  const getDeputadoCompleto = (deputadoId: string) => {
    return state.deputados.find(d => 
      String(d.id) === String(deputadoId) ||
      String(d.id) === String(deputadoId)
    )
  }

  const getDeputadoRanking = (deputadoId: string) => {
    if (!rankingData?.ranking) return null
    return rankingData.ranking.find((d: any) => String(d.id) === String(deputadoId))
  }

  return (
    <Tabs defaultValue="coroas" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="coroas" className="flex items-center gap-2">
          <Crown className="w-4 h-4" />
          Coroas ({premiacoes.coroas.length})
        </TabsTrigger>
        <TabsTrigger value="trofeus" className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Troféus ({premiacoes.trofeus.length})
        </TabsTrigger>
        <TabsTrigger value="medalhas" className="flex items-center gap-2">
          <Medal className="w-4 h-4" />
          Medalhas ({premiacoes.medalhas.length})
        </TabsTrigger>
      </TabsList>

      {/* Tab Coroas */}
      <TabsContent value="coroas" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-pink-500" />
              Coroas Históricas
            </CardTitle>
            <CardDescription>
              Campeões de todos os tempos (geral e por categoria)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {premiacoes.coroas.map((coroa, index) => (
                <PremiacaoItem
                  key={index}
                  tipo="coroa"
                  deputadoId={coroa.deputadoId}
                  deputadoNome={coroa.deputadoNome}
                  descricao={coroa.tipo === 'geral' ? 'Campeão Geral Histórico' : `Campeão: ${coroa.categoria}`}
                  valor={coroa.valor}
                  quantidadeTransacoes={coroa.quantidadeTransacoes || 0}
                  tipoEspecifico={coroa.tipo}
                  deputadoCompleto={getDeputadoCompleto(coroa.deputadoId)}
                  deputadoRanking={getDeputadoRanking(coroa.deputadoId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Troféus */}
      <TabsContent value="trofeus" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Troféus Anuais
            </CardTitle>
            <CardDescription>
              Campeões por ano específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {premiacoes.trofeus.map((trofeu, index) => (
                <PremiacaoItem
                  key={index}
                  tipo="trofeu"
                  deputadoId={trofeu.deputadoId}
                  deputadoNome={trofeu.deputadoNome}
                  descricao={trofeu.tipo === 'geral' ? `Campeão Geral ${trofeu.ano}` : `Campeão ${trofeu.categoria} ${trofeu.ano}`}
                  valor={trofeu.valor}
                  quantidadeTransacoes={trofeu.quantidadeTransacoes || 0}
                  tipoEspecifico={trofeu.tipo}
                  categoria={trofeu.categoria}
                  ano={trofeu.ano}
                  deputadoCompleto={getDeputadoCompleto(trofeu.deputadoId)}
                  deputadoRanking={getDeputadoRanking(trofeu.deputadoId)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Tab Medalhas */}
      <TabsContent value="medalhas" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="w-5 h-5 text-purple-500" />
              Medalhas de Honra
            </CardTitle>
            <CardDescription>
              2º e 3º lugares (histórico, anual geral e por categoria)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {premiacoes.medalhas.map((medalha, index) => {
                const isMedalhaHonraHistorica = medalha.categoria === 'geral_historico' && medalha.ano === 0
                const isMedalhaAnual = medalha.categoria === 'geral_anual' && medalha.ano && medalha.ano > 0
                const isMedalhaCategoria = medalha.tipo === 'categoria' && medalha.categoria && medalha.categoria !== 'geral_historico' && medalha.categoria !== 'geral_anual'
                
                let tipoTexto = ''
                if (isMedalhaHonraHistorica) {
                  tipoTexto = `${medalha.posicao}º lugar Histórico Geral`
                } else if (isMedalhaAnual) {
                  tipoTexto = `${medalha.posicao}º lugar Geral ${medalha.ano}`
                } else if (isMedalhaCategoria) {
                  tipoTexto = `${medalha.posicao}º lugar ${medalha.categoria} ${medalha.ano}`
                } else {
                  tipoTexto = `${medalha.posicao}º lugar ${medalha.tipo === 'geral' ? 'Geral' : 'Categoria'}`
                }
                
                return (
                  <PremiacaoItem
                    key={index}
                    tipo="medalha"
                    deputadoId={medalha.deputadoId}
                    deputadoNome={medalha.deputadoNome}
                    descricao={tipoTexto}
                    valor={medalha.valor}
                    quantidadeTransacoes={medalha.quantidadeTransacoes || 0}
                    tipoEspecifico={medalha.tipo}
                    posicao={medalha.posicao}
                    isMedalhaHistorica={isMedalhaHonraHistorica}
                    isMedalhaAnual={isMedalhaAnual}
                    categoria={medalha.categoria}
                    ano={medalha.ano}
                    deputadoCompleto={getDeputadoCompleto(medalha.deputadoId)}
                    deputadoRanking={getDeputadoRanking(medalha.deputadoId)}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

interface PremiacaoItemProps {
  tipo: 'coroa' | 'trofeu' | 'medalha'
  deputadoId: string
  deputadoNome: string
  descricao: string
  valor: number
  quantidadeTransacoes?: number
  tipoEspecifico: 'geral' | 'categoria'
  posicao?: number
  isMedalhaHistorica?: boolean
  isMedalhaAnual?: boolean
  categoria?: string
  ano?: number
  deputadoCompleto?: any
  deputadoRanking?: any
}

function QuadroDouradoPremiacoes({ deputadoId, deputadoNome }: { deputadoId: string, deputadoNome: string }) {
  const [hasPremiacoes, setHasPremiacoes] = useState(false)

  const verificarPremiacoes = useCallback(() => {
    try {
      const premiacoesGlobaisCache = localStorage.getItem('premiacoesGlobais')
      if (!premiacoesGlobaisCache) {
        setHasPremiacoes(false)
        return
      }

      const premiacoesGlobais = JSON.parse(premiacoesGlobaisCache)
      
      const coroas = premiacoesGlobais.coroas?.filter((c: any) => c.deputadoId === deputadoId) || []
      const trofeus = premiacoesGlobais.trofeus?.filter((t: any) => t.deputadoId === deputadoId) || []
      const medalhas = premiacoesGlobais.medalhas?.filter((m: any) => m.deputadoId === deputadoId) || []

      const totalPremiacoes = coroas.length + trofeus.length + medalhas.length

      setHasPremiacoes(totalPremiacoes >= 3)
    } catch (error) {
      setHasPremiacoes(false)
    }
  }, [deputadoId])

  useEffect(() => {
    verificarPremiacoes()
  }, [verificarPremiacoes])

  return (
    <div className={hasPremiacoes ? 
      "bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-lg p-1 shadow-sm inline-block" : 
      "inline-block"
    }>
      <BadgesPremiacaoDeputado 
        deputadoId={deputadoId}
        deputadoNome={deputadoNome}
        size="md"
        maxBadges={10}
        showCounter={true}
      />
    </div>
  )
}

function PremiacaoItem({
  tipo,
  deputadoId,
  deputadoNome,
  descricao,
  valor,
  quantidadeTransacoes,
  tipoEspecifico,
  posicao,
  isMedalhaHistorica,
  isMedalhaAnual,
  categoria,
  ano,
  deputadoCompleto,
  deputadoRanking
}: PremiacaoItemProps) {
  
  const getCorFundo = () => {
    if (tipo === 'coroa') {
      return tipoEspecifico === 'geral' 
        ? 'bg-gradient-to-r from-pink-400 to-pink-600 text-white' 
        : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
    }
    
    if (tipo === 'trofeu') {
      if (tipoEspecifico === 'categoria' && categoria && ano) {
        return 'bg-gradient-to-r from-blue-500 to-blue-700 text-white border-2 border-blue-300'
      }
      
      return tipoEspecifico === 'geral' 
        ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' 
        : 'bg-gradient-to-r from-blue-400 to-blue-600 text-white'
    }
    
    if (tipo === 'medalha') {
      if (isMedalhaHistorica) {
        return 'bg-gradient-to-r from-pink-400 to-pink-600 text-white'
      }
      
      if (isMedalhaAnual) {
        return posicao === 2 
          ? 'bg-gradient-to-r from-slate-300 to-slate-500 text-white' 
          : 'bg-gradient-to-r from-amber-500 to-yellow-700 text-white'
      }
      
      if (tipoEspecifico === 'categoria' && categoria && ano) {
        return posicao === 2 
          ? 'bg-gradient-to-r from-slate-400 to-slate-600 text-white border-2 border-slate-300' // Prata especial
          : 'bg-gradient-to-r from-amber-600 to-orange-800 text-white border-2 border-amber-400' // Bronze especial
      }
      
      return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white'
    }
    
    return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white'
  }

  const getEmoji = () => {
    if (tipo === 'coroa') return '👑'
    if (tipo === 'trofeu') return '🏆'
    return '🎖️'
  }

  return (
    <Card className="mb-4 overflow-hidden border-l-4" style={{ borderLeftColor: getCorFundo().includes('pink') ? '#ec4899' : getCorFundo().includes('yellow') ? '#fbbf24' : getCorFundo().includes('blue') ? '#3b82f6' : '#8b5cf6' }}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-4 flex-1">
            {/* Foto do deputado com badge da premiação */}
            {deputadoCompleto && deputadoCompleto.urlFoto ? (
              <div className="relative">
                <img 
                  src={deputadoCompleto.urlFoto} 
                  alt={deputadoNome}
                  className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
                {/* Badge da premiação no canto superior direito - 50% para fora */}
                <div className={`absolute -top-3 -right-3 p-2 rounded-full ${getCorFundo()} shadow-lg border-2 border-white`}>
                  <div className="text-sm">
                    {getEmoji()}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`p-3 rounded-full ${getCorFundo()} shadow-lg`}>
                <div className="text-2xl">
                  {getEmoji()}
                </div>
              </div>
            )}
            
            {/* Informações do deputado */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-lg text-gray-900 truncate">{deputadoNome}</h3>
              </div>
              
              {deputadoCompleto && (
                <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
                  <span className="font-medium">{deputadoCompleto.siglaPartido}</span>
                  <span>•</span>
                  <span>{deputadoCompleto.siglaUf || deputadoCompleto.siglaUf}</span>
                  <span>•</span>
                  <span>
                    {(() => {
                      const transacoesRanking = deputadoRanking?.quantidadeTransacoes || deputadoRanking?.totalTransacoes
                      const transacoesPremiacoes = quantidadeTransacoes
                      const transacoesFinal = transacoesRanking || transacoesPremiacoes || 0
                      return transacoesFinal.toLocaleString()
                    })()} transações
                  </span>
                </div>
              )}
              
              <div className="text-gray-700 font-medium mb-3">
                {descricao}
              </div>
              
              <QuadroDouradoPremiacoes 
                deputadoId={deputadoId} 
                deputadoNome={deputadoNome}
              />
            </div>
          </div>
          
          {/* Valor e ações */}
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              R$ {((typeof valor === 'number' && !isNaN(valor)) ? valor : 0).toLocaleString('pt-BR')}
            </div>
            <Link to="/gastos/perfil/$deputadoId" params={{ deputadoId }}>
              <Badge variant="outline" className="hover:bg-blue-50 cursor-pointer">
                <Eye className="w-3 h-3 mr-1" />
                Ver Perfil
              </Badge>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function GuiaAtivacao() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Ativar Sistema de Premiações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">🚀 Para ativar o sistema de premiações:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Clique no botão "Calcular Premiações" no topo da página</li>
            <li>Aguarde o processamento (pode levar alguns segundos)</li>
            <li>As premiações serão salvas e sincronizadas automaticamente</li>
            <li>Todos os deputados terão suas premiações exibidas nos cards e perfis</li>
          </ol>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">💡 Tipos de premiações:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>👑 Coroas Rosa:</strong> Campeão geral de todos os anos</li>
            <li><strong>👑 Coroas Azuis:</strong> Campeões de categorias específicas (todos os anos)</li>
            <li><strong>🏆 Troféus Dourados:</strong> Campeões anuais gerais</li>
            <li><strong>🏆 Troféus Azuis Especiais:</strong> 1º lugar anual por categoria específica</li>
            <li><strong>🎖️ Medalhas Rosa:</strong> 2º e 3º lugar histórico geral</li>
            <li><strong>🎖️ Medalhas Prata/Bronze Gerais:</strong> 2º e 3º lugar anual geral</li>
            <li><strong>🎖️ Medalhas Prata/Bronze de Categoria:</strong> 2º e 3º lugar anual por categoria</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export const ExibicaoPremiacoes = React.memo(ExibicaoPremiacoesComponent)
export default ExibicaoPremiacoes