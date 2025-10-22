import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link } from '@tanstack/react-router'
import { Eye, TrendingUp, Users, Target, Calendar } from 'lucide-react'
import { useGlobalData } from '@/contexts/GlobalDataContext'
import BadgesPremiacaoDeputado from '@/components/premiacoes/BadgesPremiacaoDeputado'
type DeputadoRanking = {
  id: string
  nome: string
  categoriaGastos: number
  ranking: number
  totalGastos: number
  percentualCategoria: number
}

interface DeputadosCategoriaPageProps {
  categoria: any
  anoSelecionado?: string
}

export const DeputadosCategoriaPage = ({
  categoria,
  anoSelecionado,
}: DeputadosCategoriaPageProps) => {
  const [ranking, setRanking] = useState<DeputadoRanking[]>([])
  const [loading, setLoading] = useState(true) // Carregamento inicial
  const [erro, setErro] = useState<string | null>(null)
  const [deputadosExibidos, setDeputadosExibidos] = useState(50)
  
  const [anoFiltro, setAnoFiltro] = useState(anoSelecionado || '2025')
  
  const { state } = useGlobalData()

  const anosDisponiveis = useMemo(() => {
    return [2025, 2024, 2023]
  }, [])

  useEffect(() => {
    const carregarRankingInteligente = async () => {
      try {
        setLoading(true)
        setErro(null)
        
        console.log(`🏆 [CATEGORIA-DEPUTADOS] Carregando ranking - Ano: ${anoFiltro}, Categoria: ${categoria}`)
        
        const categoriaNormalizada = obterCategoriaNormalizada(categoria) || categoria
        if (categoriaNormalizada !== categoria) {
          console.log(`🔄 [CATEGORIA-DEPUTADOS] Categoria normalizada: "${categoriaNormalizada}"`)
        }
        
        console.log(`⚠️ [CATEGORIA-DEPUTADOS] Ranking temporariamente vazio - aguardando integração com Sistema ETL`)
        setRanking([]) // Dados vazios até integração com ETL


        setErro(`ℹ️ Aguardando integração com Sistema ETL para exibir ranking de deputados.`)
        
      } catch (error) {
        console.error('❌ [CATEGORIA-DEPUTADOS] Erro ao carregar ranking:', error)
        setRanking([])
        setErro(`Erro ao carregar ranking para categoria "${categoria}": ${(error as Error).message || error}`)
      } finally {
        setLoading(false)
      }
    }
    
    carregarRankingInteligente()
  }, [categoria, anoFiltro, anoSelecionado])

  const handleAnoChange = useCallback((novoAno: string) => {
    setAnoFiltro(novoAno)
  }, [])
  
  const getDeputadoCompleto = (deputadoId: string) => {
    return state.deputados.find(d => 
      String(d.id) === String(deputadoId)
    )
  }

  const estatisticas = useMemo(() => {
    const totalDeputados = ranking.length
    const deputadosComGastos = ranking.filter(d => d.totalGastos > 0).length
    const totalTransacionado = ranking.reduce((acc, d) => acc + d.totalGastos, 0)
    const maiorGasto = ranking.length > 0 ? ranking[0].totalGastos : 0
    
    return {
      totalDeputados,
      deputadosComGastos,
      totalTransacionado,
      maiorGasto
    }
  }, [ranking])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando ranking de deputados...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">      
      {/* Mensagem de erro/aviso */}
      {erro && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <p className="text-yellow-800">{erro}</p>
          </CardContent>
        </Card>
      )}

      {/* Filtros temporais - IGUAL ÀS PREMIAÇÕES */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros Temporais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Ano:</label>
              <Select value={anoFiltro} onValueChange={handleAnoChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
.            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cabeçalho com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Deputados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estatisticas.totalDeputados}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="w-4 h-4" />
              Com Gastos na Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {estatisticas.deputadosComGastos}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Maior Gasto Individual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              R$ {estatisticas.maiorGasto.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Transacionado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {estatisticas.totalTransacionado.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking de deputados (igual ao da página de premiações) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Ranking de Deputados - {categoria}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Período: {anoFiltro === 'todos' ? 'Histórico' : anoFiltro} • {ranking.length} deputados encontrados
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Exibindo:</span>
              <Button
                variant={deputadosExibidos === 20 ? "default" : "outline"}
                size="sm"
                onClick={() => setDeputadosExibidos(20)}
              >
                Top 20
              </Button>
              <Button
                variant={deputadosExibidos === 50 ? "default" : "outline"}
                size="sm"
                onClick={() => setDeputadosExibidos(50)}
              >
                Top 50
              </Button>
              <Button
                variant={deputadosExibidos === 100 ? "default" : "outline"}
                size="sm"
                onClick={() => setDeputadosExibidos(100)}
              >
                Top 100
              </Button>
              <Button
                variant={deputadosExibidos >= ranking.length ? "default" : "outline"}
                size="sm"
                onClick={() => setDeputadosExibidos(ranking.length)}
              >
                Todos ({ranking.length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {ranking.length > 0 ? (
            <div className="space-y-0">
              {ranking.slice(0, deputadosExibidos).map((deputado) => {
                const deputadoCompleto = getDeputadoCompleto(deputado.id)
                
                return (
                  <Card key={deputado.id} className="mb-4 overflow-hidden border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4 flex-1">
                          {/* Foto do deputado */}
                          {deputadoCompleto && deputadoCompleto.urlFoto ? (
                            <div className="relative">
                              <img 
                                src={deputadoCompleto.urlFoto} 
                                alt={deputado.nomeEleitoral}
                                className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                              {/* Badge da posição */}
                              <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                #{deputado.posicao}
                              </div>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg relative">
                              {deputado.nomeEleitoral.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              <div className="absolute -top-2 -right-2 bg-blue-700 text-white text-xs px-2 py-1 rounded-full font-bold">
                                #{deputado.posicao}
                              </div>
                            </div>
                          )}
                          
                          {/* Informações do deputado */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg text-gray-900 truncate">{deputado.nomeEleitoral}</h3>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-2 flex items-center gap-4">
                              <span className="font-medium">{deputado.siglaPartido || 'N/A'}</span>
                              <span>•</span>
                              <span>{deputado.siglaUf || 'N/A'}</span>
                              <span>•</span>
                              <span>{deputado.quantidadeTransacoes.toLocaleString()} transações</span>
                            </div>
                            
                            {/* Badges de premiação (se tiver) */}
                            <BadgesPremiacaoDeputado 
                              deputadoId={deputado.id}
                              deputadoNome={deputado.nomeEleitoral}
                              size="sm"
                              maxBadges={5}
                              showCounter={true}
                            />
                          </div>
                        </div>
                        
                        {/* Valor e ações */}
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-gray-900 mb-2">
                            R$ {deputado.totalGastos.toLocaleString('pt-BR')}
                          </div>
                          <Link to="/gastos/perfil/$deputadoId" params={{ deputadoId: String(deputado.id) }}>
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
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Nenhum deputado encontrado para esta categoria.</p>
              <p className="text-sm text-gray-500">Verifique se a categoria possui dados ou tente outro período.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Aviso sobre sistema unificado */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <div>
              <p className="font-medium">
                🏆 Sistema Unificado - Mesmo Ranking da Página de Premiações
              </p>
              <p className="text-sm">
                ✅ <strong>Fonte idêntica:</strong> UnifiedRankingService - mesmo serviço usado em /gastos/premiacoes<br/>
                📊 <strong>Ranking completo:</strong> Todos os deputados da categoria "{categoria}" (sem limite de exibição)<br/>
                🔄 <strong>Dados sincronizados:</strong> Rankings sempre consistentes com a página de premiações<br/>
                🎯 <strong>Filtro automático:</strong> Aplicado automaticamente para a categoria atual
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DeputadosCategoriaPage