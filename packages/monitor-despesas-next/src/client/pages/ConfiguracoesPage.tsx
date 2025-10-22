import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings, Download, Database, Bell, Info, RefreshCw } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

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

function useConfiguracoes() {
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  
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
    exportarConfiguracoes
  }
}

export function ConfiguracoesPage() {
  const {
    configuracoes,
    setConfiguracoes,
    salvarConfiguracoes,
    resetarConfiguracoes,
    exportarConfiguracoes
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
          <div className="text-center text-muted-foreground">
            Cache configuration removed during cleanup
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
                  <div className="font-medium">Versão do Sistema</div>
                  <div className="text-sm text-muted-foreground">v2.1.2</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Banco de Dados</div>
                  <div className="text-sm text-muted-foreground"></div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Última Atualização</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="font-medium">Status</div>
                  <Badge variant="default">Ativo</Badge>
                </div>
              </div>

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