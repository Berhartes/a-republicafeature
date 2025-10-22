import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Building2, MapPin, Share2, Download, Award, Crown as CrownIcon, Users } from 'lucide-react'
import BannerPremiacaoDeputado from '@/components/premiacoes/BannerPremiacaoDeputado'

interface PerfilDeputadoHeaderProps {
  deputadoData: any
  anoSelecionado: number
  mesSelecionado: string
  anosDisponiveis: number[]
  mesesDisponiveis: Array<{ valor: string; nome: string }>
  periodDescription: string
  loading: boolean
  isConnected: boolean
  onAnoChange: (ano: number) => void
  onMesChange: (mes: string) => void
  onShare?: () => void
  onExport?: () => void
  getDeputadoCoroas?: (deputadoId: string) => any[]
  getDeputadoTrofeus?: (deputadoId: string) => any[]
  getDeputadoMedalhas?: (deputadoId: string) => any[]
}

export function PerfilDeputadoHeader({
  deputadoData,
  anoSelecionado,
  mesSelecionado,
  anosDisponiveis,
  mesesDisponiveis,
  periodDescription,
  loading,
  isConnected,
  onAnoChange,
  onMesChange,
  onShare,
  onExport,
  getDeputadoCoroas,
  getDeputadoTrofeus,
  getDeputadoMedalhas
}: PerfilDeputadoHeaderProps) {

  if (!deputadoData) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const coroas = getDeputadoCoroas ? getDeputadoCoroas(deputadoData.id?.toString() || '') : []
  const trofeus = getDeputadoTrofeus ? getDeputadoTrofeus(deputadoData.id?.toString() || '') : []
  const medalhas = getDeputadoMedalhas ? getDeputadoMedalhas(deputadoData.id?.toString() || '') : []

  const handleShare = () => {
    if (onShare) {
      onShare()
    } else {
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const handleExport = () => {
    if (onExport) {
      onExport()
    } else {
      const data = {
        deputado: deputadoData.nomeEleitoral,
        partido: deputadoData.siglaPartido,
        uf: deputadoData.siglaUf,
        periodo: periodDescription,
        exportado_em: new Date().toISOString()
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `perfil_${deputadoData.nomeEleitoral?.replace(/\s+/g, '_')}_${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium">Status de dados:</span>
        <Badge variant={loading ? 'secondary' : isConnected ? 'default' : 'outline'}>
          {loading ? 'Carregando' : isConnected ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Banner de Premiações (se houver) */}
      {(coroas.length > 0 || trofeus.length > 0 || medalhas.length > 0) && (
        <BannerPremiacaoDeputado 
          deputadoId={deputadoData.id?.toString() || ''}
          deputadoNome={deputadoData.nomeEleitoral || ''}
        />
      )}

      {/* Header Principal */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
            {/* Informações do Deputado */}
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {deputadoData.nomeEleitoral}
                  </h1>
                  {/* Coroas */}
                  {coroas.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            {coroas.slice(0, 3).map((_, index) => (
                              <CrownIcon key={index} className="h-5 w-5 text-yellow-500" />
                            ))}
                            {coroas.length > 3 && (
                              <span className="text-xs text-yellow-600">+{coroas.length - 3}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {coroas.map((coroa, index) => (
                              <div key={index} className="text-sm">{coroa.titulo}</div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {/* Troféus */}
                  {trofeus.length > 0 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="flex items-center gap-1">
                            {trofeus.slice(0, 2).map((_, index) => (
                              <Award key={index} className="h-4 w-4 text-amber-500" />
                            ))}
                            {trofeus.length > 2 && (
                              <span className="text-xs text-amber-600">+{trofeus.length - 2}</span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {trofeus.map((trofeu, index) => (
                              <div key={index} className="text-sm">{trofeu.titulo}</div>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {deputadoData.siglaPartido}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {deputadoData.siglaUf}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    ID: {deputadoData.id}
                  </Badge>
                  {deputadoData.situacao && (
                    <Badge variant={deputadoData.situacao === 'Exercício' ? 'default' : 'secondary'}>
                      {deputadoData.situacao}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Ações e Filtros */}
            <div className="flex flex-col lg:flex-row items-end gap-4">
              {/* Filtros de Período */}
              <div className="flex items-center gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Ano</label>
                  <Select value={anoSelecionado.toString()} onValueChange={(value) => onAnoChange(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {anosDisponiveis.map((ano) => (
                        <SelectItem key={ano} value={ano.toString()}>
                          {ano}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Período</label>
                  <Select value={mesSelecionado} onValueChange={onMesChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mesesDisponiveis.map((mes) => (
                        <SelectItem key={mes.valor} value={mes.valor}>
                          {mes.nomeEleitoral}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </div>

          {/* Descrição do Período */}
          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-sm text-blue-700 font-medium">
              📊 Visualizando dados de: {periodDescription}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
