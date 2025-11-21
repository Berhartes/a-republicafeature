
import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowUpDown, User, Users, Eye, Trophy, Crown, Medal, Award, TrendingUp, AlertTriangle } from 'lucide-react'
import { Link, useNavigate } from '@tanstack/react-router'
import { getCategoriaIconJSX } from '@/components/premiacoes/utils/categoria-icons'
import { type DeputadoRanking } from '@/services/unified-ranking-service'
import { useGlobalData } from '@/contexts/GlobalDataContext'
import BadgesPremiacaoDeputado from '@/components/premiacoes/BadgesPremiacaoDeputado'

interface UnifiedRankingDisplayProps {
  ranking: DeputadoRanking[]
  loading?: boolean
  categoria?: string
  ano?: string
  deputadosExibidos?: number
  setDeputadosExibidos?: (value: number | ((prev: number) => number)) => void
  mostrarControles?: boolean
  mostrarEstatisticas?: boolean
  tamanhoCard?: 'sm' | 'md' | 'lg'
  onDeputadoClick?: (deputado: DeputadoRanking) => void
  titulo?: string
  descricao?: string
}

type OrdenacaoTipo = 'maior' | 'menor' | 'nome' | 'partido' | 'uf' | 'transacoesMaior' | 'transacoesMenor'

interface QuadroDouradoPremiacoesProps {
  deputadoId: string
  deputadoNome: string
}

export const UnifiedRankingDisplay: React.FC<UnifiedRankingDisplayProps> = ({
  ranking = [],
  loading = false,
  categoria,
  ano,
  deputadosExibidos = 20,
  setDeputadosExibidos,
  mostrarControles = true,
  mostrarEstatisticas = true,
  tamanhoCard = 'md',
  onDeputadoClick,
  titulo = "Ranking de Deputados",
  descricao
}) => {
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>('maior')
  const navigate = useNavigate()
  const { state } = useGlobalData()

  const getDeputadoCompleto = useCallback((deputadoId: string) => {
    return state.deputados.find(d => 
      String(d.id) === String(deputadoId) ||
      String(d.id) === String(deputadoId)
    )
  }, [state.deputados])

  const deputadosOrdenados = useMemo(() => {
    if (!ranking || ranking.length === 0) return []
    
    const deputados = [...ranking]
    
    switch (ordenacao) {
      case 'maior':
        return deputados.sort((a, b) => (b.totalGastos || b.totalValor || 0) - (a.totalGastos || a.totalValor || 0))
      case 'menor':
        return deputados.sort((a, b) => (a.totalGastos || a.totalValor || 0) - (b.totalGastos || b.totalValor || 0))
      case 'nome':
        return deputados.sort((a, b) => a.nomeEleitoral.localeCompare(b.nomeEleitoral))
      case 'partido':
        return deputados.sort((a, b) => a.siglaPartido.localeCompare(b.siglaPartido))
      case 'uf':
        return deputados.sort((a, b) => a.siglaUf.localeCompare(b.siglaUf))
      case 'transacoesMaior':
        return deputados.sort((a, b) => (b.quantidadeTransacoes || b.totalTransacoes || 0) - (a.quantidadeTransacoes || a.totalTransacoes || 0))
      case 'transacoesMenor':
        return deputados.sort((a, b) => (a.quantidadeTransacoes || a.totalTransacoes || 0) - (b.quantidadeTransacoes || b.totalTransacoes || 0))
      default:
        return deputados
    }
  }, [ranking, ordenacao])

  const deputadosParaExibir = deputadosOrdenados.slice(0, deputadosExibidos)

  const obterCorBadge = (posicao: number) => {
    if (posicao === 1) return 'bg-yellow-500 text-white' // Ouro
    if (posicao === 2) return 'bg-gray-400 text-white'   // Prata
    if (posicao === 3) return 'bg-amber-600 text-white'  // Bronze
    if (posicao <= 10) return 'bg-blue-500 text-white'   // Top 10
    return 'bg-gray-500 text-white'                       // Outros
  }

  const obterIconePremiacoes = (posicao: number) => {
    if (posicao === 1) return <Crown className="w-4 h-4" />
    if (posicao === 2) return <Medal className="w-4 h-4" />
    if (posicao === 3) return <Award className="w-4 h-4" />
    if (posicao <= 10) return <Trophy className="w-4 h-4" />
    return null
  }

  const handleDeputadoClick = (deputado: DeputadoRanking) => {
    if (onDeputadoClick) {
      onDeputadoClick(deputado)
    } else {
      navigate({ to: `/gastos/perfil/${deputado.id}` })
    }
  }

  const QuadroDouradoPremiacoes: React.FC<{ deputadoId: string; deputadoNome: string }> = ({ deputadoId, deputadoNome }) => {
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
        'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-lg p-1 shadow-sm inline-block' :
        'inline-block'
      }>
        <BadgesPremiacaoDeputado
          deputadoId={deputadoId}
          deputadoNome={deputadoNome}
          size="sm"
          maxBadges={10}
          showCounter={true}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={tamanhoCard === 'lg' ? 'p-8' : tamanhoCard === 'sm' ? 'p-2' : 'p-4'}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 animate-pulse" />
            <span>Carregando ranking...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card className={tamanhoCard === 'lg' ? 'p-8' : tamanhoCard === 'sm' ? 'p-2' : 'p-4'}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="space-y-4">
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Dados não disponíveis
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Não foram encontrados dados de deputados para os filtros selecionados.
              </p>
              {categoria && (
                <div className="text-sm text-gray-700 bg-gray-100 p-3 rounded-lg">
                  <strong>Filtros aplicados:</strong><br/>
                  📊 Categoria: {categoria}<br/>
                  📅 Período: {ano || 'Histórico'}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-3">
                Os rankings são gerados automaticamente a partir dos dados processados.<br/>
                Verifique se o sistema ETL foi executado para este período/categoria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={tamanhoCard === 'lg' ? 'p-6' : tamanhoCard === 'sm' ? 'p-2' : 'p-4'}>
      <CardHeader className={tamanhoCard === 'sm' ? 'p-3' : 'p-6'}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {categoria && getCategoriaIconJSX(categoria)}
              {titulo}
            </CardTitle>
            <CardDescription>
              {descricao || (
                <>
                  Exibindo {deputadosParaExibir.length} de {deputadosOrdenados.length} deputados
                  {categoria && <span className="font-medium"> • Categoria: {categoria}</span>}
                  {ano && <span className="font-medium"> • Ano: {ano}</span>}
                </>
              )}
            </CardDescription>
          </div>
          
          {mostrarControles && (
            <div className="flex items-center gap-2">
              <Select value={ordenacao} onValueChange={(value: OrdenacaoTipo) => setOrdenacao(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maior">Maior Gasto</SelectItem>
                  <SelectItem value="menor">Menor Gasto</SelectItem>
                  <SelectItem value="transacoesMaior">Mais Transações</SelectItem>
                  <SelectItem value="transacoesMenor">Menos Transações</SelectItem>
                  <SelectItem value="nome">Nome (A-Z)</SelectItem>
                  <SelectItem value="partido">Partido</SelectItem>
                  <SelectItem value="uf">Estado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Estatísticas resumidas */}
        {mostrarEstatisticas && deputadosOrdenados.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Deputados</p>
              <p className="text-lg font-bold">{deputadosOrdenados.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Maior Gasto</p>
              <p className="text-lg font-bold text-green-600">
                R$ {((deputadosOrdenados[0]?.totalGastos || deputadosOrdenados[0]?.totalValor || 0)).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Gasto Total</p>
              <p className="text-lg font-bold text-blue-600">
                R$ {deputadosOrdenados.reduce((acc, d) => acc + (d.totalGastos || d.totalValor || 0), 0).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Média por Deputado</p>
              <p className="text-lg font-bold text-purple-600">
                R$ {(deputadosOrdenados.reduce((acc, d) => acc + (d.totalGastos || d.totalValor || 0), 0) / deputadosOrdenados.length).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className={tamanhoCard === 'sm' ? 'p-3' : 'p-6'}>
        <div className="space-y-3">
          {deputadosParaExibir.map((deputado, index) => {
            const posicaoAtual = ordenacao === 'maior' ? index + 1 : deputado.posicao || index + 1
            const valorGasto = deputado.totalGastos || deputado.totalValor || 0
            const totalTransacoes = deputado.quantidadeTransacoes || deputado.totalTransacoes || 0
            const deputadoCompleto = getDeputadoCompleto(deputado.id)

            return (
              <div
                key={deputado.id || `deputado-${index}`}
                className={`border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                  posicaoAtual <= 3 ? 'border-yellow-300 bg-yellow-50/50' : ''
                }`}
                onClick={() => handleDeputadoClick(deputado)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Badge de posição com ícone */}
                    <div className="flex items-center gap-2">
                      <Badge className={`${obterCorBadge(posicaoAtual)} flex items-center gap-1`}>
                        {obterIconePremiacoes(posicaoAtual)}
                        #{posicaoAtual}
                      </Badge>
                    </div>

                    {/* Foto do deputado */}
                    {deputadoCompleto && deputadoCompleto.urlFoto ? (
                      <div className="relative">
                        <img 
                          src={deputadoCompleto.urlFoto} 
                          alt={deputado.nomeEleitoral}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {deputado.nomeEleitoral.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                    )}

                    {/* Informações do deputado */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{deputado.nomeEleitoral}</h3>
                        <Badge variant="outline">{deputado.siglaPartido}</Badge>
                        <Badge variant="outline">{deputado.siglaUf}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-muted-foreground">Gasto Total:</p>
                          <p className="font-bold text-green-600">R$ {valorGasto.toLocaleString('pt-BR')}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transações:</p>
                          <p className="font-bold">{totalTransacoes.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>

                      {/* Troféus e premiações */}
                      <QuadroDouradoPremiacoes 
                        deputadoId={deputado.id} 
                        deputadoNome={deputado.nomeEleitoral}
                      />
                    </div>
                  </div>

                  {/* Botão de ação */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/gastos/perfil/${deputado.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Perfil
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Controles de paginação */}
        {setDeputadosExibidos && deputadosOrdenados.length > deputadosExibidos && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => setDeputadosExibidos(prev => Math.min(prev + 20, deputadosOrdenados.length))}
            >
              <Users className="w-4 h-4 mr-2" />
              Carregar Mais ({deputadosOrdenados.length - deputadosExibidos} restantes)
            </Button>
          </div>
        )}

        {/* Footer com informações */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
          🏆 Ranking atualizado automaticamente • {deputadosOrdenados.length} deputados processados
          {categoria && <span> • Categoria: {categoria}</span>}
          {ano && <span> • Período: {ano}</span>}
        </div>
      </CardContent>
    </Card>
  )
}

export default UnifiedRankingDisplay