import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileJson, FileText, FileSpreadsheet, FileImage } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface ExportDialogProps {
  data: any
  title?: string
  onExport?: (format: string, options: ExportOptions) => void
  children?: ReactNode
}

interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx' | 'pdf' | 'png'
  includeCharts: boolean
  includeRawData: boolean
  includeSummary: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  filters?: {
    deputados?: string[]
    partidos?: string[]
    estados?: string[]
  }
}

export function ExportDialog({ data, title = "Exportar Dados", onExport, children }: ExportDialogProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeCharts: false,
    includeRawData: true,
    includeSummary: true
  })

  const handleExport = async () => {
    try {
      switch (options.format) {
        case 'json':
          exportJSON()
          break
        case 'csv':
          exportCSV()
          break
        case 'xlsx':
          exportExcel()
          break
        case 'pdf':
          exportPDF()
          break
        case 'png':
          exportImage()
          break
      }

      if (onExport) {
        onExport(options.format, options)
      }

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${options.format.toUpperCase()} gerado com sucesso.`,
      })

      setIsOpen(false)
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  const exportJSON = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      title: title,
      options: options,
      data: data
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gastos_parlamentares_${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const exportCSV = () => {
    let csv = ''
    
    if (options.includeSummary && data.estatisticas) {
      csv += 'RESUMO ESTATÍSTICO\n'
      csv += `Total Gasto,${data.estatisticas.totalGasto}\n`
      csv += `Total Deputados,${data.estatisticas.numDeputados}\n`
      csv += `Total Alertas,${data.alertas?.length || 0}\n`
      csv += '\n'
    }

    if (options.includeRawData && data.deputadosAnalise) {
      csv += 'DEPUTADOS\n'
      csv += 'Nome,Partido,UF,Total Gasto,Score Suspeição,Alertas\n'
      
      data.deputadosAnalise.forEach((dep: any) => {
        csv += `"${dep.nomeEleitoral}","${dep.siglaPartido}","${dep.siglaUf}",${dep.totalGasto},${dep.scoreSuspeicao},${dep.alertas.length}\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gastos_parlamentares_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportExcel = async () => {
    toast({
      title: "Formato não implementado",
      description: "Exportação para Excel será implementada em breve.",
      variant: "destructive"
    })
  }

  const exportPDF = async () => {
    toast({
      title: "Formato não implementado",
      description: "Exportação para PDF será implementada em breve.",
      variant: "destructive"
    })
  }

  const exportImage = async () => {
    toast({
      title: "Formato não implementado",
      description: "Exportação de imagens será implementada em breve.",
      variant: "destructive"
    })
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json': return <FileJson className="h-4 w-4" />
      case 'csv': return <FileSpreadsheet className="h-4 w-4" />
      case 'xlsx': return <FileSpreadsheet className="h-4 w-4" />
      case 'pdf': return <FileText className="h-4 w-4" />
      case 'png': return <FileImage className="h-4 w-4" />
      default: return <Download className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Configure as opções de exportação dos dados
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Formato de Exportação */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Formato
            </Label>
            <Select
              value={options.format}
              onValueChange={(value) => setOptions({...options, format: value as any})}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
                <SelectItem value="png">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Imagem (PNG)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opções de Conteúdo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeCharts">Incluir Gráficos</Label>
                <p className="text-sm text-muted-foreground">
                  Exportar visualizações junto com os dados
                </p>
              </div>
              <Switch
                id="includeCharts"
                checked={options.includeCharts}
                onCheckedChange={(checked) => 
                  setOptions({...options, includeCharts: checked})
                }
                disabled={options.format === 'csv'}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeRawData">Dados Brutos</Label>
                <p className="text-sm text-muted-foreground">
                  Incluir todos os dados detalhados
                </p>
              </div>
              <Switch
                id="includeRawData"
                checked={options.includeRawData}
                onCheckedChange={(checked) => 
                  setOptions({...options, includeRawData: checked})
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="includeSummary">Resumo Estatístico</Label>
                <p className="text-sm text-muted-foreground">
                  Incluir sumário com totais e médias
                </p>
              </div>
              <Switch
                id="includeSummary"
                checked={options.includeSummary}
                onCheckedChange={(checked) => 
                  setOptions({...options, includeSummary: checked})
                }
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport}>
            {getFormatIcon(options.format)}
            <span className="ml-2">Exportar {options.format.toUpperCase()}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
