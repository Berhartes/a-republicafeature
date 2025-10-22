import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, ExternalLink, AlertTriangle, Filter, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { FornecedorStats } from '@/types/gastos'

type FornecedorAnalisado = FornecedorStats & { concentracao: 'baixo' | 'medio' | 'alto' };

interface AnaliseFornecedoresPageProps {
  fornecedores: FornecedorAnalisado[]
  filtroRisco: 'todos' | 'baixo' | 'medio' | 'alto' | 'critico'
  setFiltroRisco: (risco: 'todos' | 'baixo' | 'medio' | 'alto' | 'critico') => void
  ordenacao: 'nome' | 'valor' | 'risco' | 'transacoes'
  setOrdenacao: (ordenacao: 'nome' | 'valor' | 'risco' | 'transacoes') => void
  mostrarTodos: boolean
  setMostrarTodos: (mostrar: boolean) => void
}

export function AnaliseFornecedoresPage({
  fornecedores,
  filtroRisco,
  setFiltroRisco,
  ordenacao,
  setOrdenacao,
  mostrarTodos,
  setMostrarTodos
}: AnaliseFornecedoresPageProps) {
  const navigate = useNavigate()

  const navegarParaFornecedor = (cnpj: string) => {
    if (cnpj && cnpj !== 'N/A' && cnpj.trim()) {
      navigate({ to: `/gastos/fornecedor/${encodeURIComponent(cnpj)}` })
    }
  }

  const getRiscoColor = (risco: string) => {
    switch (risco) {
      case 'alto': return 'bg-red-500'
      case 'medio': return 'bg-orange-500'
      case 'baixo': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getRiscoBadgeVariant = (risco: string) => {
    switch (risco) {
      case 'alto': return 'destructive'
      case 'medio': return 'secondary'
      case 'baixo': return 'default'
      default: return 'outline'
    }
  }

  const estatisticasFornecedores = {
    total: fornecedores.length,
    totalTransacionado: fornecedores.reduce((acc, f) => acc + f.totalTransacionado, 0),
    altoRisco: fornecedores.filter(f => f.concentracao === 'alto').length,
    medioRisco: fornecedores.filter(f => f.concentracao === 'medio').length,
    baixoRisco: fornecedores.filter(f => f.concentracao === 'baixo').length
  }

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
            Configure os filtros para análise detalhada dos fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Nível de Risco:</label>
              <Select value={filtroRisco} onValueChange={setFiltroRisco}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Níveis</SelectItem>
                  <SelectItem value="critico">Risco Crítico</SelectItem>
                  <SelectItem value="alto">Alto Risco</SelectItem>
                  <SelectItem value="medio">Médio Risco</SelectItem>
                  <SelectItem value="baixo">Baixo Risco</SelectItem>
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
                  <SelectItem value="valor">Valor Total</SelectItem>
                  <SelectItem value="risco">Nível de Risco</SelectItem>
                  <SelectItem value="transacoes">Nº Transações</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Exibição:</label>
              <Button
                variant={mostrarTodos ? "default" : "outline"}
                onClick={() => setMostrarTodos(!mostrarTodos)}
                className="w-full flex items-center gap-2"
              >
                {mostrarTodos ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {mostrarTodos ? 'Mostrando Todos' : 'Top 20'}
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resultados:</label>
              <div className="text-2xl font-bold text-center py-2">
                {fornecedores.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Resumidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {estatisticasFornecedores.altoRisco}
              </div>
              <p className="text-xs text-muted-foreground">Alto Risco</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {estatisticasFornecedores.medioRisco}
              </div>
              <p className="text-xs text-muted-foreground">Médio Risco</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {estatisticasFornecedores.baixoRisco}
              </div>
              <p className="text-xs text-muted-foreground">Baixo Risco</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                R$ {estatisticasFornecedores.totalTransacionado.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-muted-foreground">Total Transacionado</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Fornecedores Analisados
          </CardTitle>
          <CardDescription>
            {filtroRisco === 'todos' 
              ? 'Todos os fornecedores' 
              : `Fornecedores de risco ${filtroRisco}`
            } • Ordenado por {
              ordenacao === 'valor' ? 'valor total' :
              ordenacao === 'risco' ? 'nível de risco' :
              ordenacao === 'transacoes' ? 'número de transações' :
              'nome'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fornecedores.length > 0 ? (
            <div className="space-y-4">
              {fornecedores.map((fornecedor, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{fornecedor.nomeEleitoral}</span>
                        
                        {/* Indicador de Risco */}
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${getRiscoColor(fornecedor.concentracao)}`} />
                          <Badge variant={getRiscoBadgeVariant(fornecedor.concentracao)}>
                            Risco {fornecedor.concentracao}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-2">
                        CNPJ: {fornecedor.cnpj || 'Não informado'}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Transações:</span>
                          <div className="font-medium">{fornecedor.transacoes || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Deputados:</span>
                          <div className="font-medium">{fornecedor.deputadosAtendidos?.length || 0}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Média/Transação:</span>
                          <div className="font-medium">
                            R$ {((fornecedor.transacoes || 0) > 0) 
                              ? (fornecedor.totalTransacionado / (fornecedor.transacoes || 1)).toLocaleString('pt-BR')
                              : '0'
                            }
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Score Suspeição:</span>
                          <div className={`font-medium ${
                            (fornecedor.scoreSuspeicao || 0) > 70 ? 'text-red-600' :
                            (fornecedor.scoreSuspeicao || 0) > 50 ? 'text-orange-600' :
                            'text-green-600'
                          }`}>
                            {fornecedor.scoreSuspeicao?.toFixed(1) || '0.0'}
                          </div>
                        </div>
                      </div>

                      {/* Alertas específicos para alto risco */}
                      {fornecedor.concentracao === 'alto' && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                          Fornecedor requer análise detalhada devido ao alto risco identificado
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xl font-bold mb-2">
                        R$ {fornecedor.totalTransacionado.toLocaleString('pt-BR')}
                      </div>
                      
                      {fornecedor.cnpj && fornecedor.cnpj !== 'N/A' && fornecedor.cnpj.trim() && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navegarParaFornecedor(fornecedor.cnpj)}
                          className="text-xs"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver Perfil
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum fornecedor encontrado para os filtros aplicados.</p>
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
