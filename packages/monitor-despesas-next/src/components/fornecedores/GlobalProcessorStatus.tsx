
import React from 'react'
import { Database, Zap, RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useGlobalFornecedoresProcessor } from '@/hooks/useGlobalFornecedoresProcessor'

interface GlobalProcessorStatusProps {
  compact?: boolean
  showControls?: boolean
  className?: string
}

export function GlobalProcessorStatus({ 
  compact = false, 
  showControls = true,
  className = '' 
}: GlobalProcessorStatusProps) {
  const {
    status,
    progress,
    isProcessing,
    temCacheValido,
    cacheInfo,
    iniciarProcessamento,
    limparCache
  } = useGlobalFornecedoresProcessor()

  const getStatusIcon = () => {
    if (isProcessing) return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
    if (temCacheValido) return <CheckCircle className="h-4 w-4 text-green-600" />
    return <AlertCircle className="h-4 w-4 text-gray-500" />
  }

  const getStatusText = () => {
    if (isProcessing) return 'Processando...'
    if (temCacheValido) return 'Cache Ativo'
    return 'Cache Vazio'
  }

  const getStatusColor = () => {
    if (isProcessing) return 'border-blue-200 bg-blue-50'
    if (temCacheValido) return 'border-green-200 bg-green-50'
    return 'border-gray-200 bg-gray-50'
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
        {temCacheValido && cacheInfo.totalFornecedores && (
          <Badge variant="outline" className="text-xs">
            {cacheInfo.totalFornecedores.toLocaleString()} fornecedores
          </Badge>
        )}
        {showControls && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => iniciarProcessamento(true)}
            disabled={isProcessing}
            className="text-xs"
          >
            <Zap className="h-3 w-3 mr-1" />
            {isProcessing ? 'Processando...' : 'Processar'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={`${getStatusColor()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/50">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <h3 className="font-semibold">
                  Sistema Global de Fornecedores
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isProcessing 
                  ? progress.message
                  : temCacheValido && cacheInfo.hasCache
                    ? `${cacheInfo.totalFornecedores?.toLocaleString()} fornecedores organizados em ${cacheInfo.categories} categorias • Atualizado ${cacheInfo.age} atrás`
                    : 'Nenhum dado processado ainda. Clique em "Processar" para começar.'
                }
              </p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              {isProcessing && (
                <div className="w-24">
                  <Progress value={progress.progress} className="h-2" />
                  <p className="text-xs text-center mt-1">{progress.progress.toFixed(0)}%</p>
                </div>
              )}
              
              <Button
                onClick={() => iniciarProcessamento(true)}
                disabled={isProcessing}
                variant={temCacheValido ? 'outline' : 'default'}
                size="sm"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    {temCacheValido ? 'Reprocessar' : 'Processar'}
                  </>
                )}
              </Button>
              
              {temCacheValido && (
                <Button
                  onClick={limparCache}
                  variant="ghost"
                  size="sm"
                  disabled={isProcessing}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}