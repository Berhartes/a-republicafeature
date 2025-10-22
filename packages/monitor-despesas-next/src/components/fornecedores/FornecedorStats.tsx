import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, AlertTriangle, TrendingUp, Users } from 'lucide-react'

interface FornecedorStatsProps {
  totalFornecedores: number
  fornecedoresComAlertas: number
  valorTotalTransacionado: number
  mediaScore: number
}

export function FornecedorStats({
  totalFornecedores,
  fornecedoresComAlertas,
  valorTotalTransacionado,
  mediaScore
}: FornecedorStatsProps) {
  const percentualComAlertas = totalFornecedores > 0 
    ? ((fornecedoresComAlertas / totalFornecedores) * 100).toFixed(1)
    : '0'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFornecedores.toLocaleString('pt-BR')}</div>
          <p className="text-xs text-muted-foreground">
            Fornecedores únicos identificados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Com Alertas</CardTitle>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {fornecedoresComAlertas.toLocaleString('pt-BR')}
          </div>
          <p className="text-xs text-muted-foreground">
            {percentualComAlertas}% do total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R$ {(valorTotalTransacionado / 1_000_000).toFixed(1)}M
          </div>
          <p className="text-xs text-muted-foreground">
            Total transacionado
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {mediaScore.toFixed(1)}/10
          </div>
          <p className="text-xs text-muted-foreground">
            Suspeição média
          </p>
        </CardContent>
      </Card>
    </div>
  )
}