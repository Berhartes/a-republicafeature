import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Loader2, FileText, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react'

type ProcessingStage = 'parsing' | 'analyzing' | 'generating' | 'complete'

interface BaseLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

interface SimpleLoadingProps extends BaseLoadingProps {
  mode: 'simple'
}

interface DetailedLoadingProps extends BaseLoadingProps {
  mode: 'detailed'
  stage: ProcessingStage
  progress: number
  fileName?: string
  totalRecords?: number
}

interface AnimatedLoadingProps extends BaseLoadingProps {
  mode: 'animated'
  type?: 'processing' | 'success'
  onComplete?: () => void
}

type LoadingProps = SimpleLoadingProps | DetailedLoadingProps | AnimatedLoadingProps

const stages = {
  parsing: {
    icon: FileText,
    title: 'Processando arquivo',
    description: 'Lendo e validando dados do CSV...'
  },
  analyzing: {
    icon: BarChart3,
    title: 'Analisando gastos',
    description: 'Detectando padrões suspeitos...'
  },
  generating: {
    icon: AlertTriangle,
    title: 'Gerando alertas',
    description: 'Criando relatório de irregularidades...'
  },
  complete: {
    icon: CheckCircle,
    title: 'Análise concluída',
    description: 'Resultados prontos para visualização'
  }
}

function SimpleLoading({ message = 'Carregando...', size = 'md' }: Omit<SimpleLoadingProps, 'mode'>) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-primary/20 border-t-primary`} />
        <div className={`absolute inset-2 animate-spin rounded-full border-2 border-secondary/20 border-t-secondary`} 
             style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
    </div>
  )
}

function DetailedLoading({ 
  stage, 
  progress, 
  fileName, 
  totalRecords, 
  message 
}: Omit<DetailedLoadingProps, 'mode'>) {
  const currentStage = stages[stage]
  const Icon = currentStage.icon

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            {stage === 'complete' ? (
              <CheckCircle className="h-16 w-16 text-green-600" />
            ) : (
              <div className="relative">
                <Loader2 className="h-16 w-16 text-primary animate-spin" />
                <Icon className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">{currentStage.title}</h3>
            <p className="text-muted-foreground">
              {message || currentStage.description}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.toFixed(1)}%</span>
              <span>{stage === 'complete' ? 'Concluído' : 'Processando...'}</span>
            </div>
          </div>

          {fileName && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Arquivo:</span>
                <span className="truncate">{fileName}</span>
              </div>
              {totalRecords && (
                <div className="flex items-center gap-2 text-sm mt-1">
                  <BarChart3 className="h-4 w-4" />
                  <span className="font-medium">Registros:</span>
                  <span>{totalRecords.toLocaleString('pt-BR')}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-center space-x-8 text-xs">
            {Object.entries(stages).map(([key, stageInfo]) => {
              const StageIcon = stageInfo.icon
              const isActive = key === stage
              const isComplete = Object.keys(stages).indexOf(key) < Object.keys(stages).indexOf(stage)
              
              return (
                <div key={key} className="flex flex-col items-center space-y-1">
                  <div className={`p-2 rounded-full ${
                    isComplete ? 'bg-green-100 text-green-600' :
                    isActive ? 'bg-primary/10 text-primary' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    <StageIcon className="h-4 w-4" />
                  </div>
                  <span className={`${
                    isActive ? 'text-primary font-medium' : 'text-muted-foreground'
                  }`}>
                    {stageInfo.title.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AnimatedLoading({ type = 'processing', onComplete }: Omit<AnimatedLoadingProps, 'mode'>) {
  const [stage, setStage] = useState(0)
  const processingStages = [
    { icon: '📊', text: 'Lendo dados...' },
    { icon: '🔍', text: 'Analisando padrões...' },
    { icon: '🤖', text: 'Detectando irregularidades...' },
    { icon: '📈', text: 'Gerando relatórios...' }
  ]

  useEffect(() => {
    if (type === 'processing') {
      const interval = setInterval(() => {
        setStage((prev) => (prev + 1) % processingStages.length)
      }, 2000)
      return () => clearInterval(interval)
    } else if (type === 'success' && onComplete) {
      const timer = setTimeout(onComplete, 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [type, onComplete])

  if (type === 'success') {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="relative">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center animate-scale-in">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" className="animate-draw-check" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-full border-4 border-green-500/50 animate-ripple" />
        </div>
        <p className="text-lg font-semibold text-green-600 dark:text-green-400 animate-fade-in">
          Análise Concluída!
        </p>
      </div>
    )
  }

  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="absolute inset-2 animate-ping rounded-full bg-secondary/20" style={{ animationDelay: '0.5s' }} />
          <div className="absolute inset-4 animate-ping rounded-full bg-accent/20" style={{ animationDelay: '1s' }} />
          
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl animate-bounce">{processingStages[stage]?.icon}</span>
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Processando Dados</h3>
          <p className="text-sm text-muted-foreground animate-pulse">
            {processingStages[stage]?.text}
          </p>
        </div>
        
        <div className="flex space-x-2">
          {processingStages.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === stage ? 'bg-primary w-8' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}

export function Loading(props: LoadingProps) {
  switch (props.mode) {
    case 'simple':
      return <SimpleLoading {...props} />
    case 'detailed':
      return <DetailedLoading {...props} />
    case 'animated':
      return <AnimatedLoading {...props} />
    default:
      return <SimpleLoading message="Carregando..." size="md" />
  }
}

export { Loading as LoadingAnimation }
export { Loading as LoadingState }

export function DataProcessingAnimation() {
  return <Loading mode="animated" type="processing" />
}

export function SuccessAnimation({ onComplete }: { onComplete?: () => void }) {
  return <Loading mode="animated" type="success" onComplete={onComplete} />
}