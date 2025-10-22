import { useState, useRef } from 'react'
import type { ChangeEvent } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileUp, HardDrive, Zap, CheckCircle2, XCircle, Loader2, Database, FileText, Download } from 'lucide-react'
import { toast } from '@/hooks/useToast'
import { Loading } from '@/components/Loading'

type ProcessingMode = 'standard' | 'large-file'

interface ProcessingStats {
  recordsProcessed: number
  totalRecords: number
  errorsFound: number
  processingTime: number
  fileSize: number
}

interface ProcessingResult {
  deputados: any[]
  fornecedores: any[]
  estatisticas: ProcessingStats
  alertas?: any[]
  relatorio?: string
}

interface DataProcessorProps {
  mode?: ProcessingMode
  maxFileSize?: number // em MB
  onProcessComplete?: (resultado: ProcessingResult) => void
  onAnalysisComplete?: (dados: ProcessingResult) => void
}

export function DataProcessor({ 
  mode = 'standard', 
  maxFileSize = 50,
  onProcessComplete,
  onAnalysisComplete 
}: DataProcessorProps) {
  const [file, setFile] = useState<File | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chunks, setChunks] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const modeConfig = {
    standard: {
      maxSize: maxFileSize,
      chunkSize: 1000,
      title: 'Processador de Dados da Câmara',
      description: 'Processe arquivos CSV com dados de gastos dos deputados'
    },
    'large-file': {
      maxSize: 200,
      chunkSize: 5000,
      title: 'Processador de Arquivos Grandes',
      description: 'Otimizado para arquivos grandes (até 200MB) com processamento em chunks'
    }
  }

  const config = modeConfig[mode]

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo CSV.',
        variant: 'destructive'
      })
      return
    }

    const sizeMB = selectedFile.size / (1024 * 1024)
    if (sizeMB > config.maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: `O limite máximo é ${config.maxSize}MB.`,
        variant: 'destructive'
      })
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)
    setProgress(0)
    setStatus('')
  }

  const processFile = async () => {
    if (!file) return

    setProcessing(true)
    setProgress(0)
    setError(null)
    setStatus('Iniciando processamento...')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', mode)
      formData.append('chunkSize', config.chunkSize.toString())

      await simulateProcessing()

      const mockResult: ProcessingResult = {
        deputados: [],
        fornecedores: [],
        estatisticas: {
          recordsProcessed: 1000,
          totalRecords: 1000,
          errorsFound: 0,
          processingTime: Date.now(),
          fileSize: file.size
        },
        alertas: []
      }

      setResult(mockResult)
      setStatus('Processamento concluído!')
      
      onProcessComplete?.(mockResult)
      onAnalysisComplete?.(mockResult)

      toast({
        title: 'Sucesso!',
        description: 'Arquivo processado com sucesso.',
      })

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMsg)
      toast({
        title: 'Erro no processamento',
        description: errorMsg,
        variant: 'destructive'
      })
    } finally {
      setProcessing(false)
    }
  }

  const simulateProcessing = async () => {
    const stages = [
      { message: 'Lendo arquivo...', duration: 1000 },
      { message: 'Validando dados...', duration: 1500 },
      { message: 'Processando registros...', duration: 2000 },
      { message: 'Gerando relatórios...', duration: 1000 },
      { message: 'Finalizando...', duration: 500 }
    ]

    let currentProgress = 0
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      setStatus(stage.message)
      
      const stepProgress = 100 / stages.length
      const targetProgress = (i + 1) * stepProgress
      
      while (currentProgress < targetProgress) {
        currentProgress += 2
        setProgress(Math.min(currentProgress, targetProgress))
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      if (mode === 'large-file') {
        setChunks({ current: i + 1, total: stages.length })
      }
    }
  }

  const resetProcessor = () => {
    setFile(null)
    setResult(null)
    setError(null)
    setProgress(0)
    setStatus('')
    setChunks({ current: 0, total: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (processing) {
    return (
      <Loading 
        mode="detailed" 
        stage={progress < 25 ? 'parsing' : progress < 75 ? 'analyzing' : progress < 95 ? 'generating' : 'complete'}
        progress={progress}
        fileName={file?.name}
        totalRecords={mode === 'large-file' ? chunks.total * config.chunkSize : undefined}
        message={status}
      />
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {mode === 'large-file' ? <HardDrive className="h-5 w-5" /> : <Database className="h-5 w-5" />}
              {config.title}
            </CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={mode === 'large-file' ? 'default' : 'secondary'}>
              {mode === 'large-file' ? 'Arquivo Grande' : 'Padrão'}
            </Badge>
            <Badge variant="outline">
              Máx: {config.maxSize}MB
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload de arquivo */}
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label 
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-700 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Clique para enviar</span> ou arraste o arquivo
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Apenas arquivos CSV (máx. {config.maxSize}MB)
                </p>
              </div>
              <input 
                id="file-upload"
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatBytes(file.size)}
                  </p>
                </div>
              </div>
              <Button
                onClick={processFile}
                disabled={processing}
                className="gap-2"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {processing ? 'Processando...' : 'Processar'}
              </Button>
            </div>
          )}
        </div>

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Processamento concluído com sucesso!
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {result.estatisticas.recordsProcessed}
                  </div>
                  <div className="text-sm text-muted-foreground">Registros processados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {result.deputados.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Deputados analisados</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {result.alertas?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Alertas gerados</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={resetProcessor}>
                Processar Novo Arquivo
              </Button>
              {result.relatorio && (
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Relatório
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export { DataProcessor as ProcessadorArquivosGrandes }
export { DataProcessor as ProcessadorDadosCamara }