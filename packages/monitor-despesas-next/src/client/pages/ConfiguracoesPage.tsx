import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Download, Database, Bell, Info, RefreshCw, CheckCircle, AlertCircle, Clock, HardDrive } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { etlCacheService } from '@/services/etl-cache.service'
import { fetchManifest } from '@/data-access/monitordespesas'

interface Configuracoes {
  notificacoes: boolean
  alertasAutomaticos: boolean
  temaEscuro: boolean
  idiomaPortugues: boolean
  exportarComGraficos: boolean
  salvarNuvem: boolean
  analiseTempReal: boolean
  limitesPersonalizados: boolean
}

interface Limites {
  limiteMensal: number
  limiteTransacao: number
  limiteAlertas: number
}

interface EtlStatus {
  connected: boolean
  manifest: any | null
  cacheHealth: {
    deputies: { available: boolean; lastUpdate: string | null; size: number }
    rankings: { available: boolean; lastUpdate: string | null; size: number }
    suppliers: { available: boolean; lastUpdate: string | null; size: number }
    categories: { available: boolean; lastUpdate: string | null; size: number }
    analysis: { available: boolean; lastUpdate: string | null; size: number }
    premiacoes: { available: boolean; lastUpdate: string | null; size: number }
  }
  totalSize: number
  lastCheck: Date | null
}

function useEtlStatus() {
  const [etlStatus, setEtlStatus] = useState<EtlStatus>({
    connected: false,
    manifest: null,
    cacheHealth: {
      deputies: { available: false, lastUpdate: null, size: 0 },
      rankings: { available: false, lastUpdate: null, size: 0 },
      suppliers: { available: false, lastUpdate: null, size: 0 },
      categories: { available: false, lastUpdate: null, size: 0 },
      analysis: { available: false, lastUpdate: null, size: 0 },
      premiacoes: { available: false, lastUpdate: null, size: 0 }
    },
    totalSize: 0,
    lastCheck: null
  })
  const [isLoadingStatus, setIsLoadingStatus] = useState(false)

  const checkEtlStatus = async () => {
    setIsLoadingStatus(true)
    try {
      console.log('🔍 [ConfiguracoesPage] Verificando status do ETL...')

      // Verificar manifest
      const manifest = await fetchManifest()

      // Verificar saúde dos caches
      const cacheChecks = await Promise.allSettled([
        etlCacheService.buscarTodosDeputados(),
        etlCacheService.gerarRankings(),
        fetch('/cache/suppliers-cache.json').then(r => r.json()).catch(() => null),
        etlCacheService.fetchCategoriasCache(),
        fetch('/cache/analysis-cache.json').then(r => r.json()).catch(() => null),
        etlCacheService.fetchPremiacoesCache()
      ])

      const cacheHealth = {
        deputies: {
          available: cacheChecks[0].status === 'fulfilled',
          lastUpdate: cacheChecks[0].status === 'fulfilled' && (cacheChecks[0].value as any)?.timestamp
            ? new Date((cacheChecks[0].value as any).timestamp).toLocaleString('pt-BR')
            : null,
          size: cacheChecks[0].status === 'fulfilled'
            ? JSON.stringify(cacheChecks[0].value).length
            : 0
        },
        rankings: {
          available: cacheChecks[1].status === 'fulfilled',
          lastUpdate: cacheChecks[1].status === 'fulfilled' && (cacheChecks[1].value as any)?.metadata?.generatedAt
            ? new Date((cacheChecks[1].value as any).metadata.generatedAt).toLocaleString('pt-BR')
            : null,
          size: cacheChecks[1].status === 'fulfilled'
            ? JSON.stringify(cacheChecks[1].value).length
            : 0
        },
        suppliers: {
          available: cacheChecks[2].status === 'fulfilled',
          lastUpdate: cacheChecks[2].status === 'fulfilled' && (cacheChecks[2].value as any)?.metadata?.generatedAt
            ? new Date((cacheChecks[2].value as any).metadata.generatedAt).toLocaleString('pt-BR')
            : null,
          size: cacheChecks[2].status === 'fulfilled'
            ? JSON.stringify(cacheChecks[2].value).length
            : 0
        },
        categories: {
          available: cacheChecks[3].status === 'fulfilled',
          lastUpdate: cacheChecks[3].status === 'fulfilled' && (cacheChecks[3].value as any)?.metadata?.generatedAt
            ? new Date((cacheChecks[3].value as any).metadata.generatedAt).toLocaleString('pt-BR')
            : null,
          size: cacheChecks[3].status === 'fulfilled'
            ? JSON.stringify(cacheChecks[3].value).length
            : 0
        },
        analysis: {
          available: cacheChecks[4].status === 'fulfilled',
          lastUpdate: cacheChecks[4].status === 'fulfilled' && (cacheChecks[4].value as any)?.metadata?.generatedAt
            ? new Date((cacheChecks[4].value as any).metadata.generatedAt).toLocaleString('pt-BR')
            : null,
          size: cacheChecks[4].status === 'fulfilled'
            ? JSON.stringify(cacheChecks[4].value).length
            : 0
        },
        premiacoes: {
          available: cacheChecks[5].status === 'fulfilled',
          lastUpdate: cacheChecks[5].status === 'fulfilled' && (cacheChecks[5].value as any)?.metadata?.generatedAt
            ? new Date((cacheChecks[5].value as any).metadata.generatedAt).toLocaleString('pt-BR')
            : null,
          size: cacheChecks[5].status === 'fulfilled'
            ? JSON.stringify(cacheChecks[5].value).length
            : 0
        }
      }

      const totalSize = Object.values(cacheHealth).reduce((sum, cache) => sum + cache.size, 0)
      const connected = !!manifest && Object.values(cacheHealth).some(cache => cache.available)

      setEtlStatus({
        connected,
        manifest,
        cacheHealth,
        totalSize,
        lastCheck: new Date()
      })

      console.log('✅ [ConfiguracoesPage] Status do ETL verificado:', {
        connected,
        availableCaches: Object.entries(cacheHealth).filter(([_, cache]) => cache.available).length,
        totalSize: (totalSize / 1024 / 1024).toFixed(2) + 'MB'
      })

    } catch (error) {
      console.error('❌ [ConfiguracoesPage] Erro ao verificar status do ETL:', error)
      setEtlStatus(prev => ({
        ...prev,
        connected: false,
        lastCheck: new Date()
      }))
    } finally {
      setIsLoadingStatus(false)
    }
  }

  return { etlStatus, isLoadingStatus, checkEtlStatus }
}

function useConfiguracoes() {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const { etlStatus, isLoadingStatus, checkEtlStatus } = useEtlStatus()
  
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>({
    notificacoes: true,
    alertasAutomaticos: true,
    temaEscuro: false,
    idiomaPortugues: true,
    exportarComGraficos: true,
    salvarNuvem: false,
    analiseTempReal: false,
    limitesPersonalizados: false
  })

  const [limites, setLimites] = useState<Limites>({
    limiteMensal: 45000,
    limiteTransacao: 5000,
    limiteAlertas: 10
  })

  useEffect(() => {
    const configSalvas = localStorage.getItem('configuracoes')
    if (configSalvas) {
      try {
        const parsed = JSON.parse(configSalvas)
        setConfiguracoes(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Erro ao carregar configurações:', error)
      }
    }

    const limitesSalvos = localStorage.getItem('limites')
    if (limitesSalvos) {
      try {
        const parsed = JSON.parse(limitesSalvos)
        setLimites(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error('Erro ao carregar limites:', error)
      }
    }
  }, [])

  const salvarConfiguracoes = () => {
    try {
      localStorage.setItem('configuracoes', JSON.stringify(configuracoes))
      localStorage.setItem('limites', JSON.stringify(limites))
      
      document.documentElement.classList.toggle('dark', configuracoes.temaEscuro)
      
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      })
    }
  }

  const resetarConfiguracoes = () => {
    setConfiguracoes({
      notificacoes: true,
      alertasAutomaticos: true,
      temaEscuro: false,
      idiomaPortugues: true,
      exportarComGraficos: true,
      salvarNuvem: false,
      analiseTempReal: false,
      limitesPersonalizados: false
    })
    setLimites({
      limiteMensal: 45000,
      limiteTransacao: 5000,
      limiteAlertas: 10
    })
    
    toast({
      title: "Configurações resetadas",
      description: "Todas as configurações foram restauradas aos valores padrão.",
    })
  }

  const exportarConfiguracoes = () => {
    const dados = {
      configuracoes,
      limites,
      exportado_em: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `configuracoes_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    // Check ETL status on component mount
    checkEtlStatus()
  }, [])

  return {
    configuracoes,
    limites,
    isProcessing,
    isScanning,
    setConfiguracoes,
    setLimites,
    setIsProcessing,
    setIsScanning,
    salvarConfiguracoes,
    resetarConfiguracoes,
    exportarConfiguracoes,
    etlStatus,
    isLoadingStatus,
    checkEtlStatus
  }
}

export function ConfiguracoesPage() {
  const {
    configuracoes,
    setConfiguracoes,
    salvarConfiguracoes,
    resetarConfiguracoes,
    exportarConfiguracoes,
    etlStatus,
    isLoadingStatus,
    checkEtlStatus
  } = useConfiguracoes()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-green-500 to-purple-500 bg-clip-text text-transparent">
            Configurações
          </h1>
          <p className="text-muted-foreground text-lg">
            Personalize sua experiência com o sistema de monitoramento
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportarConfiguracoes} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={resetarConfiguracoes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button onClick={salvarConfiguracoes}>
            <Settings className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Tabs de Configurações */}
      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Aba Geral */}
        <TabsContent value="geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências Gerais</CardTitle>
              <CardDescription>
                Configure a aparência e comportamento básico do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tema-escuro">Tema Escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar interface escura para reduzir fadiga visual
                  </p>
                </div>
                <Switch 
                  id="tema-escuro"
                  checked={configuracoes.temaEscuro}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, temaEscuro: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="idioma">Idioma Português</Label>
                  <p className="text-sm text-muted-foreground">
                    Interface e mensagens em português brasileiro
                  </p>
                </div>
                <Switch 
                  id="idioma"
                  checked={configuracoes.idiomaPortugues}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, idiomaPortugues: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="graficos">Exportar com Gráficos</Label>
                  <p className="text-sm text-muted-foreground">
                    Incluir visualizações nos relatórios exportados
                  </p>
                </div>
                <Switch 
                  id="graficos"
                  checked={configuracoes.exportarComGraficos}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, exportarComGraficos: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Notificações */}
        <TabsContent value="notificacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Notificações</CardTitle>
              <CardDescription>
                Controle quando e como receber alertas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notificacoes">Notificações Ativas</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber notificações do sistema
                  </p>
                </div>
                <Switch 
                  id="notificacoes"
                  checked={configuracoes.notificacoes}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, notificacoes: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="alertas-auto">Alertas Automáticos</Label>
                  <p className="text-sm text-muted-foreground">
                    Gerar alertas automaticamente para irregularidades
                  </p>
                </div>
                <Switch 
                  id="alertas-auto"
                  checked={configuracoes.alertasAutomaticos}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, alertasAutomaticos: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="tempo-real">Análise em Tempo Real</Label>
                  <p className="text-sm text-muted-foreground">
                    Monitorar e analisar dados continuamente
                  </p>
                </div>
                <Switch 
                  id="tempo-real"
                  checked={configuracoes.analiseTempReal}
                  onCheckedChange={(checked) => 
                    setConfiguracoes(prev => ({ ...prev, analiseTempReal: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Cache */}
        <TabsContent value="cache" className="space-y-4">
          <div className="grid gap-4">
            {/* ETL Status Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Status do Sistema ETL
                    </CardTitle>
                    <CardDescription>
                      Monitoramento em tempo real dos serviços de dados
                    </CardDescription>
                  </div>
                  <Button
                    onClick={checkEtlStatus}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingStatus}
                  >
                    {isLoadingStatus ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Connection Status */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {etlStatus.connected ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">
                          {etlStatus.connected ? 'Sistema Conectado' : 'Sistema Desconectado'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {etlStatus.lastCheck
                            ? `Última verificação: ${etlStatus.lastCheck.toLocaleString('pt-BR')}`
                            : 'Nunca verificado'
                          }
                        </div>
                      </div>
                    </div>
                    <Badge variant={etlStatus.connected ? "default" : "destructive"}>
                      {etlStatus.connected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>

                  {/* Manifest Info */}
                  {etlStatus.manifest && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-900 mb-2">Informações do Manifest</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">Versão:</span>
                          <span className="ml-2 font-mono">{etlStatus.manifest.version || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-blue-700">Legislatura:</span>
                          <span className="ml-2">{etlStatus.manifest.legislatura || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-blue-700">Gerado em:</span>
                          <span className="ml-2">
                            {etlStatus.manifest.generatedAt
                              ? new Date(etlStatus.manifest.generatedAt).toLocaleString('pt-BR')
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cache Health Grid */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HardDrive className="h-4 w-4" />
                      <span className="font-medium">Saúde dos Caches</span>
                      <Badge variant="outline">
                        {Object.values(etlStatus.cacheHealth).filter(cache => cache.available).length}/
                        {Object.values(etlStatus.cacheHealth).length} ativos
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(etlStatus.cacheHealth).map(([name, cache]) => (
                        <div key={name} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium capitalize">
                              {name === 'deputies' ? 'Deputados' :
                               name === 'rankings' ? 'Rankings' :
                               name === 'suppliers' ? 'Fornecedores' :
                               name === 'categories' ? 'Categorias' :
                               name === 'analysis' ? 'Análises' :
                               name === 'premiacoes' ? 'Premiações' : name}
                            </span>
                            {cache.available ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>
                              Status: <span className={cache.available ? 'text-green-600' : 'text-red-600'}>
                                {cache.available ? 'Disponível' : 'Indisponível'}
                              </span>
                            </div>
                            {cache.lastUpdate && (
                              <div>Atualizado: {cache.lastUpdate}</div>
                            )}
                            <div>Tamanho: {(cache.size / 1024).toFixed(1)} KB</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Storage Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Resumo de Armazenamento</div>
                        <div className="text-sm text-muted-foreground">
                          Total de dados em cache
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {(etlStatus.totalSize / 1024 / 1024).toFixed(1)} MB
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Object.values(etlStatus.cacheHealth).filter(cache => cache.available).length} caches ativos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cache Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações de Cache</CardTitle>
                <CardDescription>
                  Gerenciar dados armazenados localmente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      localStorage.clear()
                      window.location.reload()
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpar Cache Local
                  </Button>
                  <Button
                    onClick={checkEtlStatus}
                    variant="outline"
                    size="sm"
                    disabled={isLoadingStatus}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Revalidar Caches
                  </Button>
                  <Button
                    onClick={() => {
                      const data = {
                        etlStatus,
                        timestamp: new Date().toISOString()
                      }
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `etl-status-${new Date().toISOString().split('T')[0]}.json`
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Status
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba Sistema */}
        <TabsContent value="sistema" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>
                Detalhes sobre o sistema e configurações avançadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Versão do ETL</div>
                  <div className="text-sm text-muted-foreground">
                    {etlStatus.manifest?.version || 'v2.4-l41-fixed'}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Legislatura</div>
                  <div className="text-sm text-muted-foreground">
                    {etlStatus.manifest?.legislatura ? `${etlStatus.manifest.legislatura}ª Legislatura` : '57ª Legislatura'}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Última Geração ETL</div>
                  <div className="text-sm text-muted-foreground">
                    {etlStatus.manifest?.generatedAt
                      ? new Date(etlStatus.manifest.generatedAt).toLocaleDateString('pt-BR')
                      : 'Não disponível'
                    }
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Status do Sistema</div>
                  <Badge variant={etlStatus.connected ? "default" : "destructive"}>
                    {etlStatus.connected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Fonte dos Dados</div>
                  <div className="text-sm text-muted-foreground">
                    {etlStatus.manifest?.source || 'ETL Python Pipeline'}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Caches Ativos</div>
                  <div className="text-sm text-muted-foreground">
                    {Object.values(etlStatus.cacheHealth).filter(cache => cache.available).length} de {Object.values(etlStatus.cacheHealth).length}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Tamanho Total</div>
                  <div className="text-sm text-muted-foreground">
                    {(etlStatus.totalSize / 1024 / 1024).toFixed(1)} MB
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Última Verificação</div>
                  <div className="text-sm text-muted-foreground">
                    {etlStatus.lastCheck
                      ? etlStatus.lastCheck.toLocaleString('pt-BR')
                      : 'Nunca verificado'
                    }
                  </div>
                </div>
              </div>

              {/* Detailed ETL Information */}
              {etlStatus.connected && etlStatus.manifest && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-medium text-green-900 mb-3">Informações Detalhadas do ETL</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(etlStatus.manifest).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-green-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                        </span>
                        <span className="font-mono text-green-800">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="nuvem">Sincronização na Nuvem</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar dados com serviços em nuvem
                    </p>
                  </div>
                  <Switch 
                    id="nuvem"
                    checked={configuracoes.salvarNuvem}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, salvarNuvem: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="limites">Limites Personalizados</Label>
                    <p className="text-sm text-muted-foreground">
                      Configurar limites customizados para alertas
                    </p>
                  </div>
                  <Switch 
                    id="limites"
                    checked={configuracoes.limitesPersonalizados}
                    onCheckedChange={(checked) => 
                      setConfiguracoes(prev => ({ ...prev, limitesPersonalizados: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Debug Info (desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
          <h4 className="font-bold mb-2">🔧 Debug Info (Configurações Modular):</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Tema Escuro:</strong> {configuracoes.temaEscuro ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Notificações:</strong> {configuracoes.notificacoes ? 'Ativas' : 'Inativas'}
            </div>
            <div>
              <strong>Alertas Auto:</strong> {configuracoes.alertasAutomaticos ? 'Sim' : 'Não'}
            </div>
            <div>
              <strong>Sincronização:</strong> {configuracoes.salvarNuvem ? 'Ativa' : 'Inativa'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}