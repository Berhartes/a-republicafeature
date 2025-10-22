import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingAnimation } from '@/components/Loading'
import { TooltipProvider } from '@/components/ui/tooltip'

import { useAnaliseData } from '@/components/analise/hooks/useAnaliseData'

import { AnaliseHeader } from '@/components/analise/components/AnaliseHeader'

import { AnaliseVisaoGeralPage } from '@/components/analise/pages/AnaliseVisaoGeralPage'
import { AnaliseFornecedoresPage } from '@/components/analise/pages/AnaliseFornecedoresPage'
import { AnaliseDeputadosPage } from '@/components/analise/pages/AnaliseDeputadosPage'

interface AnaliseAvancadaPageProps {}

export function AnaliseAvancadaPage({}: AnaliseAvancadaPageProps) {
  const {
    dadosAnalise,
    fornecedoresAnalisados,
    analiseGeral,
    padroesSuspeitos,
    loading,
    error,
    isConnected,
    mostrarTodosFornecedores,
    setMostrarTodosFornecedores,
    filtroRisco,
    setFiltroRisco,
    ordenacao,
    setOrdenacao,
    carregarFornecedores
  } = useAnaliseData()

  const [activeTab, setActiveTab] = useState('visao-geral')
  const [filtroPartido, setFiltroPartido] = useState('TODOS')
  const [filtroUF, setFiltroUF] = useState('TODAS')
  const [ordenacaoDeputados, setOrdenacaoDeputados] = useState<'nome' | 'gasto' | 'transacoes' | 'risco'>('gasto')

  const abas = [
    { id: 'visao-geral', nome: 'Visão Geral', icone: '📊' },
    { id: 'deputados', nome: 'Deputados', icone: '👤' },
    { id: 'fornecedores', nome: 'Fornecedores', icone: '🏢' },
    { id: 'relatorios', nome: 'Relatórios', icone: '📋' }
  ]

  const handleRefresh = async () => {
    await carregarFornecedores()
  }

  const handleExport = () => {
    const dadosExport = {
      analiseGeral,
      padroesSuspeitos,
      fornecedores: fornecedoresAnalisados.slice(0, 50), // Limitar para não sobrecarregar
      deputados: dadosAnalise?.deputados.slice(0, 50) || [],
      timestamp: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(dadosExport, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analise-avancada-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mt-2">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (loading && !dadosAnalise) {
    return (
      <div className="container mx-auto py-6">
        <LoadingAnimation mode="animated" message="Carregando análise avançada..." />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Principal */}
        <AnaliseHeader
          analiseGeral={analiseGeral}
          loading={loading}
          isConnected={isConnected}
          onRefresh={handleRefresh}
          onExport={handleExport}
        />

        {/* Abas Principais */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            {abas.map(aba => (
              <TabsTrigger key={aba.id} value={aba.id} className="text-xs">
                <span className="hidden sm:inline mr-1">{aba.icone}</span>
                {aba.nomeEleitoral}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="visao-geral">
            <AnaliseVisaoGeralPage
              analiseGeral={analiseGeral}
              padroesSuspeitos={padroesSuspeitos}
            />
          </TabsContent>

          {/* Aba: Deputados */}
          <TabsContent value="deputados">
            <AnaliseDeputadosPage
              deputados={dadosAnalise?.deputados || []}
              filtroPartido={filtroPartido}
              setFiltroPartido={setFiltroPartido}
              filtroUF={filtroUF}
              setFiltroUF={setFiltroUF}
              ordenacao={ordenacaoDeputados}
              setOrdenacao={setOrdenacaoDeputados}
            />
          </TabsContent>

          {/* Aba: Fornecedores */}
          <TabsContent value="fornecedores">
            <AnaliseFornecedoresPage
              fornecedores={fornecedoresAnalisados}
              filtroRisco={filtroRisco}
              setFiltroRisco={setFiltroRisco}
              ordenacao={ordenacao}
              setOrdenacao={setOrdenacao}
              mostrarTodos={mostrarTodosFornecedores}
              setMostrarTodos={setMostrarTodosFornecedores}
            />
          </TabsContent>

          {/* Aba: Relatórios */}
          <TabsContent value="relatorios">
            <div className="text-center py-12 text-muted-foreground">
              <div className="mb-4">
                <div className="inline-block w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  📋
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Relatórios Customizados</h3>
              <p className="text-sm max-w-md mx-auto mb-4">
                Esta seção permitirá gerar relatórios personalizados com filtros avançados,
                gráficos interativos e exportação em múltiplos formatos.
              </p>
              <div className="text-xs text-muted-foreground">
                Em desenvolvimento • Próxima versão
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔧 Debug Info (Análise Modular):</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Deputados Carregados:</strong> {dadosAnalise?.deputados.length || 0}
              </div>
              <div>
                <strong>Fornecedores Analisados:</strong> {fornecedoresAnalisados.length}
              </div>
              <div>
                <strong>Padrões Suspeitos:</strong> {padroesSuspeitos.length}
              </div>
              <div>
                <strong>Total de Gastos:</strong> R$ {analiseGeral.totalGastos.toLocaleString('pt-BR')}
              </div>
              <div>
                <strong>Aba Ativa:</strong> {activeTab}
              </div>
              <div>
                <strong>Status Conexão:</strong> {isConnected ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}