import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock } from 'lucide-react'

interface DeputadoStatsCardsProps {
  anoSelecionado: number
  mesSelecionado: string
  anosDisponiveis: number[]
  mesesDisponiveis: Array<{ valor: string; nome: string }>
  atualizarAno: (ano: number) => void
  atualizarMes: (mes: string) => void
  loading?: boolean
}

export function DeputadoStatsCards({
  anoSelecionado,
  mesSelecionado,
  anosDisponiveis,
  mesesDisponiveis,
  atualizarAno,
  atualizarMes,
  loading = false
}: DeputadoStatsCardsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Filtros Temporais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Seletor de Ano */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Ano
            </label>
            <Select 
              value={anoSelecionado.toString()} 
              onValueChange={(value) => atualizarAno(parseInt(value))}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {anosDisponiveis.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Mês */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Mês
            </label>
            <Select 
              value={mesSelecionado} 
              onValueChange={atualizarMes}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mesesDisponiveis.map(mes => (
                  <SelectItem key={mes.valor} value={mes.valor}>
                    {mes.nomeEleitoral}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
              Carregando dados...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}