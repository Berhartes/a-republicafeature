import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, BarChart3, Database, Clock, CheckCircle } from 'lucide-react'

interface ProcessingStatusCardProps {
  isWorkerPoolReady: boolean
  workersStatus: Record<string, any>
}

export function ProcessingStatusCard({ 
  isWorkerPoolReady, 
  workersStatus 
}: ProcessingStatusCardProps) {
  if (!isWorkerPoolReady || Object.keys(workersStatus).length === 0) {
    return null
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-800 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Sistema Enterprise Ativo
        </CardTitle>
        <CardDescription className="text-green-700">
          Processamento não-bloqueante com Web Workers • UI sempre responsiva
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              Workers: {Object.keys(workersStatus).length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              Pool Status: Ativo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              Modo: Não-bloqueante
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              Performance: Otimizada
            </span>
          </div>
        </div>

        {/* Detalhes dos workers se disponível */}
        {Object.keys(workersStatus).length > 0 && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-sm text-green-700 mb-2">Status dos Workers:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(workersStatus).map(([workerId, status]) => (
                <div 
                  key={workerId} 
                  className="flex items-center justify-between bg-white/50 rounded px-2 py-1"
                >
                  <span className="text-sm font-mono">{workerId}</span>
                  <span className="text-xs text-green-600">
                    {typeof status === 'object' ? JSON.stringify(status) : String(status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}