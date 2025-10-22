import { Button } from '@/components/ui/button'
import { RefreshCw, Download, BarChart3, Users, DollarSign } from 'lucide-react'

interface AlertasHeaderProps {
  totalAlertas: number
  deputadosUnicos: number
  valorTotal: number
  loading: boolean
  onRefresh: () => void
  onExport: () => void
}

export function AlertasHeader({
  totalAlertas,
  deputadosUnicos,
  valorTotal,
  loading,
  onRefresh,
  onExport
}: AlertasHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
          Central de Alertas
        </h1>
        <p className="text-muted-foreground text-lg">
          Monitoramento inteligente de irregularidades parlamentares
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            {totalAlertas} alertas ativos
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {deputadosUnicos} deputados envolvidos
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            R$ {valorTotal.toLocaleString('pt-BR')} em irregularidades
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {/*  status removed - using local data only */}
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        <Button onClick={onExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>
    </div>
  )
}