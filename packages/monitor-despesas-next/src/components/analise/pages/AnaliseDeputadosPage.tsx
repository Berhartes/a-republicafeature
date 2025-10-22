import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, ExternalLink, AlertTriangle, TrendingUp, Users, Filter } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

type DeputadoProcessado = {
  nome: string
  partido: string
  uf: string
  totalGasto: number
  numTransacoes: number
}

interface AnaliseDeputadosPageProps {
  deputados: DeputadoProcessado[]
  filtroPartido: string
  setFiltroPartido: (partido: string) => void
  filtroUF: string
  setFiltroUF: (uf: string) => void
  ordenacao: 'nome' | 'gasto' | 'transacoes' | 'risco'
  setOrdenacao: (ordenacao: 'nome' | 'gasto' | 'transacoes' | 'risco') => void
}

export function AnaliseDeputadosPage({
  deputados,
  filtroPartido,
  setFiltroPartido,
  filtroUF,
  setFiltroUF,
  ordenacao,
  setOrdenacao
}: AnaliseDeputadosPageProps) {
  const navigate = useNavigate()

  const partidosDisponiveis = useMemo(() => {
    const partidos = Array.from(new Set(deputados.map(d => d.siglaPartido).filter(Boolean))).sort()
    return [{ valor: 'TODOS', nome: 'Todos os Partidos' }, ...partidos.map(p => ({ valor: p, nome: p }))]
  }, [deputados])

  const ufsDisponiveis = useMemo(() => {
    const ufs = Array.from(new Set(deputados.map(d => d.siglaUf).filter(Boolean))).sort()
    return [{ valor: 'TODAS', nome: 'Todas as UFs' }, ...ufs.map(u => ({ valor: u, nome: u }))]
  }, [deputados])

  const deputadosFiltrados = useMemo(() => {
    let filtrados = deputados

    if (filtroPartido !== 'TODOS') {
      filtrados = filtrados.filter(d => d.siglaPartido === filtroPartido)
    }
    if (filtroUF !== 'TODAS') {
      filtrados = filtrados.filter(d => d.siglaUf === filtroUF)
    }

    filtrados.sort((a, b) => {
      switch (ordenacao) {
        case 'nome':
          return a.nomeEleitoral.localeCompare(b.nomeEleitoral)
        case 'gasto':
          return (b.totalGasto || 0) - (a.totalGasto || 0)
        case 'transacoes':
          return (b.numTransacoes || 0) - (a.numTransacoes || 0)
        case 'risco':
          return (b.totalGasto || 0) - (a.totalGasto || 0)
        default:
          return 0
      }
    })

    return filtrados
  }, [deputados, filtroPartido, filtroUF, ordenacao])

  const navegarParaDeputado = (deputadoId: string) => {
    navigate({ to: `/gastos/perfil/${deputadoId}` })
  }

  const calcularIndicadorRisco = (deputado: DeputadoProcessado): { nivel: string, cor: string, motivo: string } => {
    const gasto = deputado.totalGasto || 0
    const transacoes = deputado.numTransacoes || 0
    const mediaTransacao = transacoes > 0 ? gasto / transacoes : 0

    let pontuacao = 0
    const motivos: string[] = []

    if (gasto > 500000) {
      pontuacao += 30
      motivos.push('Gasto total elevado')
    } else if (gasto > 300000) {
      pontuacao += 20
      motivos.push('Gasto acima da média')
    }

    if (transacoes > 100 && mediaTransacao < 1000) {
      pontuacao += 20
      motivos.push('Muitas transações pequenas')
    } else if (transacoes < 10 && mediaTransacao > 10000) {
      pontuacao += 25
      motivos.push('Poucas transações de alto valor')
    }

    if (pontuacao >= 40) {
      return { nivel: 'Alto', cor: 'text-red-600', motivo: motivos.join(', ') }
    } else if (pontuacao >= 20) {
      return { nivel: 'Médio', cor: 'text-orange-600', motivo: motivos.join(', ') }
    } else {
      return { nivel: 'Baixo', cor: 'text-green-600', motivo: 'Padrão normal' }
    }
  }

  const estatisticas = useMemo(() => {
    const total = deputadosFiltrados.length
    const totalGasto = deputadosFiltrados.reduce((acc, d) => acc + (d.totalGasto || 0), 0)
    const totalTransacoes = deputadosFiltrados.reduce((acc, d) => acc + (d.numTransacoes || 0), 0)
    const deputadosAltoRisco = deputadosFiltrados.filter(d => calcularIndicadorRisco(d).nivel === 'Alto').length

    return {
      total,
      totalGasto,
      totalTransacoes,
      mediaGasto: total > 0 ? totalGasto / total : 0,
      mediaTransacoes: total > 0 ? totalTransacoes / total : 0,
      deputadosAltoRisco
    }
  }, [deputadosFiltrados])

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Ordenação
          </CardTitle>
          <CardDescription>
            Configure os filtros para análise detalhada dos deputados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Partido:</label>
              <Select value={filtroPartido} onValueChange={setFiltroPartido}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {partidosDisponiveis.map(partido => (
                    <SelectItem key={partido.valor} value={partido.valor}>
                      {partido.nomeEleitoral}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">UF:</label>
              <Select value={filtroUF} onValueChange={setFiltroUF}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ufsDisponiveis.map(uf => (
                    <SelectItem key={uf.valor} value={uf.valor}>
                      {uf.nomeEleitoral}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por:</label>
              <Select value={ordenacao} onValueChange={setOrdenacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasto">Maior Gasto</SelectItem>
                  <SelectItem value="transacoes">Mais Transações</SelectItem>
                  <SelectItem value="risco">Maior Risco</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resultados:</label>
              <div className="text-2xl font-bold text-center py-2">
                {deputadosFiltrados.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {estatisticas.totalGasto.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Total de Gastos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {estatisticas.mediaGasto.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Média por Deputado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-bold">
                  {estatisticas.totalTransacoes.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Total Transações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                estatisticas.deputadosAltoRisco > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
              <div>
                <div className={`text-lg font-bold ${
                  estatisticas.deputadosAltoRisco > 0 ? 'text-red-600' : ''
                }`}>
                  {estatisticas.deputadosAltoRisco}
                </div>
                <p className="text-xs text-muted-foreground">Alto Risco</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Deputados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Deputados Analisados
          </CardTitle>
          <CardDescription>
            {filtroPartido === 'TODOS' && filtroUF === 'TODAS' 
              ? 'Todos os deputados' 
              : `Filtrado por ${filtroPartido !== 'TODOS' ? filtroPartido : 'todos os partidos'} - ${filtroUF !== 'TODAS' ? filtroUF : 'todas as UFs'}`
            } • Ordenado por {
              ordenacao === 'gasto' ? 'maior gasto' :
              ordenacao === 'transacoes' ? 'mais transações' :
              ordenacao === 'risco' ? 'maior risco' :
              'nome'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deputadosFiltrados.length > 0 ? (
            <div className="space-y-4">
              {deputadosFiltrados.map((deputado, index) => {
                const indicadorRisco = calcularIndicadorRisco(deputado)
                return (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{deputado.nomeEleitoral}</span>
                          
                          {/* Indicador de Risco */}
                          <Badge variant={
                            indicadorRisco.nivel === 'Alto' ? 'destructive' :
                            indicadorRisco.nivel === 'Médio' ? 'secondary' :
                            'default'
                          }>
                            Risco {indicadorRisco.nivel}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {deputado.siglaPartido} - {deputado.siglaUf}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Total Gasto:</span>
                            <div className="font-medium">R$ {(deputado.totalGasto || 0).toLocaleString('pt-BR')}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Transações:</span>
                            <div className="font-medium">{deputado.numTransacoes || 0}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Média/Transação:</span>
                            <div className="font-medium">
                              R$ {(deputado.numTransacoes || 0) > 0 
                                ? ((deputado.totalGasto || 0) / (deputado.numTransacoes || 1)).toLocaleString('pt-BR')
                                : '0'
                              }
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Posição Ranking:</span>
                            <div className="font-medium">#{index + 1}</div>
                          </div>
                        </div>

                        {/* Motivo do risco */}
                        {indicadorRisco.motivo && indicadorRisco.nivel !== 'Baixo' && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <strong>Fatores:</strong> {indicadorRisco.motivo}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xl font-bold mb-2 ${indicadorRisco.cor}`}>
                          R$ {(deputado.totalGasto || 0).toLocaleString('pt-BR')}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navegarParaDeputado(String(deputado.id))}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Perfil
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum deputado encontrado para os filtros aplicados.</p>
              <p className="text-sm mt-2">
                Tente ajustar os filtros ou verificar se há dados disponíveis.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}