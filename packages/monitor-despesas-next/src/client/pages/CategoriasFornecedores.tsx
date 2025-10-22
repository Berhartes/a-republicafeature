import { useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingAnimation } from '@/components/Loading'
import { TooltipProvider } from '@/components/ui/tooltip'

import { useCategoriaData } from '@/components/categoria-fornecedores/hooks/useCategoriaData'
import { useCategoriaFilters } from '@/components/categoria-fornecedores/hooks/useCategoriaFilters'

import { CategoriaHeader } from '@/components/categoria-fornecedores/components/CategoriaHeader'

import { CategoriaVisaoGeralPage } from '@/components/categoria-fornecedores/pages/CategoriaVisaoGeralPage'

import { EvolucaoCategoriaPage } from '@/components/categoria/EvolucaoCategoriaPage'
import { DeputadosCategoriaPage } from '@/components/categoria/DeputadosCategoriaPage'
import { TransacoesCategoriaPage } from '@/components/categoria/TransacoesCategoriaPage'
import { FornecedoresCategoriaPage } from '@/components/categoria/FornecedoresCategoriaPage'
import { RelacoesCategoriaPage } from '@/components/categoria/RelacoesCategoriaPage'
import { AlertasCategoriaPage } from '@/components/categoria/AlertasCategoriaPage'

import { CategoriaDataProcessing } from '@/components/categoria-fornecedores/utils/categoriaDataProcessing'
import { categoryToSlug } from '@/lib/category-slugs'

interface CategoriasFornecedoresPageModularProps {}

export function CategoriasFornecedores({}: CategoriasFornecedoresPageModularProps) {
  
  const {
    categoria,
    categoriaSlug,
    categoriaData,
    fornecedoresDaCategoria,
    transacoesDaCategoria,
    transacoesProcessadas,
    evolucaoMensalCategoria,
    estatisticasCategoria,
    anosDisponiveis,
    redeRelacoes,
    isLoading,
    carregandoTransacoes,
    deputadosCarregados,
    evolucaoInicializada,
    progressoCarregamento,
    erro,
    carregarDadosCategoria,
    carregarEvolucaoMensal,
    gerarRedeRelacoes,
    setDeputadosCarregados,
    setEvolucaoInicializada
  } = useCategoriaData()

  const {
    activeTab,
    anoSelecionado,
    mesSelecionado,
    filtroPartido,
    filtroUF,
    mostrarApenasTop,
    mostrarApenasVIP,
    deputadosExibidos,
    buscaFornecedor,
    ordenacaoFornecedor,
    direcaoOrdenacao,
    filtroRiscoFornecedor,
    fornecedoresExibidos,
    mostrarLabelsValores,
    deputadosVisiveisEvolucao,
    deputadoModalAberto,
    deputadoSelecionado,
    abas,
    navegarParaAba,
    setAnoSelecionado,
    setMesSelecionado,
    abrirModalDeputado,
    fecharModalDeputado,
    resetarFiltrosDeputados,
    resetarFiltrosFornecedores,
    alternarVisibilidadeDeputado,
    limparEvolucaoVisivel,
    setBuscaFornecedor,
    setOrdenacaoFornecedor,
    setDirecaoOrdenacao,
    setFiltroRiscoFornecedor
  } = useCategoriaFilters()

  const handleAnoChange = async (novoAno: number | 'todos') => {
    setAnoSelecionado(novoAno)
    if (categoria) {
      await carregarDadosCategoria(novoAno)
      if (typeof novoAno === 'number') {
        await carregarEvolucaoMensal(categoria, novoAno)
      }
    }
  }

  const handleMesChange = (novoMes: string) => {
    setMesSelecionado(novoMes)
  }

  const handleRefresh = async () => {
    if (categoria) {
      await carregarDadosCategoria(anoSelecionado)
    }
  }

  const handleExport = () => {
    const estatisticas = CategoriaDataProcessing.calcularEstatisticasCategoria(
      fornecedoresDaCategoria,
      transacoesDaCategoria
    )
    
    const dadosExport = CategoriaDataProcessing.exportarDadosCategoria(
      categoria,
      estatisticas,
      fornecedoresDaCategoria.slice(0, 100), // Limitar para não sobrecarregar
      'json'
    )

    const blob = new Blob([dadosExport], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `categoria-${categoryToSlug(categoria)}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Categoria: ${categoria}`,
        text: `Análise da categoria ${categoria} - Gastos dos Deputados`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado para a área de transferência!')
    }
  }

  useEffect(() => {
    if (transacoesDaCategoria.length > 0) {
      gerarRedeRelacoes(transacoesDaCategoria)
    }
  }, [transacoesDaCategoria, gerarRedeRelacoes])

  if (erro) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Erro ao carregar categoria</h2>
          <p className="text-muted-foreground mt-2">{erro}</p>
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

  if (isLoading && !categoriaData) {
    return (
      <div className="container mx-auto py-6">
        <LoadingAnimation mode="animated" message={`Carregando categoria ${categoria}...`} />
        {progressoCarregamento.total > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-muted-foreground">
              Progresso: {progressoCarregamento.atual}/{progressoCarregamento.total}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Principal */}
        <CategoriaHeader
          categoria={categoria}
          categoriaSlug={categoriaSlug}
          estatisticasCategoria={estatisticasCategoria}
          anosDisponiveis={anosDisponiveis}
          anoSelecionado={anoSelecionado}
          mesSelecionado={mesSelecionado}
          loading={isLoading || carregandoTransacoes}
          erro={erro}
          onAnoChange={handleAnoChange}
          onMesChange={handleMesChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          onShare={handleShare}
        />

        {/* Abas Principais */}
        <Tabs value={activeTab} onValueChange={navegarParaAba}>
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            {abas.map(aba => (
              <TabsTrigger key={aba.id} value={aba.id} className="text-xs">
                <span className="hidden sm:inline mr-1">{aba.icone}</span>
                <span className="hidden md:inline">{aba.nome || 'Sem nome'}</span>
                <span className="md:hidden">{(aba.nome || 'Sem nome').split(' ')[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="visao-geral">
            <CategoriaVisaoGeralPage
              categoria={categoria}
              estatisticasCategoria={estatisticasCategoria}
              fornecedoresDaCategoria={fornecedoresDaCategoria}
              transacoesProcessadas={transacoesProcessadas}
              evolucaoMensalCategoria={evolucaoMensalCategoria}
              anoSelecionado={anoSelecionado}
              mesSelecionado={mesSelecionado}
              anosDisponiveis={anosDisponiveis}
              onAnoChange={handleAnoChange}
              onMesChange={handleMesChange}
            />
          </TabsContent>

          {/* Aba: Transações */}
          <TabsContent value="transacoes">
            <TransacoesCategoriaPage
              todasTransacoesCategoria={transacoesDaCategoria}
              transacoesProcessadas={transacoesDaCategoria}
              anoSelecionado={anoSelecionado}
              carregandoTransacoes={carregandoTransacoes}
            />
          </TabsContent>

          {/* Aba: Fornecedores */}
          <TabsContent value="fornecedores">
            <FornecedoresCategoriaPage
              fornecedores={fornecedoresDaCategoria}
              categoria={categoria}
              busca={buscaFornecedor}
              setBusca={setBuscaFornecedor}
              ordenacao={ordenacaoFornecedor}
              setOrdenacao={(value: string) => setOrdenacaoFornecedor(value as any)}
              direcao={direcaoOrdenacao}
              setDirecao={(value: string) => setDirecaoOrdenacao(value as any)}
              filtroRisco={filtroRiscoFornecedor}
              setFiltroRisco={(value: string) => setFiltroRiscoFornecedor(value as any)}
              exibidos={fornecedoresExibidos}
              onResetFiltros={resetarFiltrosFornecedores}
            />
          </TabsContent>

          {/* Aba: Deputados */}
          <TabsContent value="deputados">
            <DeputadosCategoriaPage
              categoria={categoria}
              mostrarApenasTop={mostrarApenasTop}
              mostrarApenasVIP={mostrarApenasVIP}
              deputadosExibidos={deputadosExibidos}
              onDeputadoClick={abrirModalDeputado}
              onResetFiltros={resetarFiltrosDeputados}
              deputadosCarregados={deputadosCarregados}
              setDeputadosCarregados={setDeputadosCarregados}
            />
          </TabsContent>

          {/* Aba: Evolução */}
          <TabsContent value="evolucao">
            <EvolucaoCategoriaPage
              categoria={categoria}
              deputadosVisiveis={deputadosVisiveisEvolucao}
              onToggleDeputado={alternarVisibilidadeDeputado}
              onLimparVisiveis={limparEvolucaoVisivel}
              mostrarLabels={mostrarLabelsValores}
              evolucaoInicializada={evolucaoInicializada}
              setEvolucaoInicializada={setEvolucaoInicializada}
            />
          </TabsContent>

          {/* Aba: Relacionamentos */}
          <TabsContent value="relacoes">
            <RelacoesCategoriaPage
              redeRelacoes={redeRelacoes}
              filtroPartido=""
              setFiltroPartido={() => {}}
              filtroUF=""
              setFiltroUF={() => {}}
              filtroValorMinimo={0}
              setFiltroValorMinimo={() => {}}
              filtroValorMaximo={1000000}
              setFiltroValorMaximo={() => {}}
              mostrarApenasTop={false}
              setMostrarApenasTop={() => {}}
              chartDataPartidos={[]}
            />
          </TabsContent>

          {/* Aba: Alertas */}
          <TabsContent value="alertas">
            <AlertasCategoriaPage
              categoriaData={categoria}
              estatisticasCategoria={estatisticasCategoria}
              anosDisponiveis={anosDisponiveis}
              fornecedorInflacionado={null}
              percentualInflacao={0}
              mediasCategoria={{}}
            />
          </TabsContent>
        </Tabs>

        {/* Modal de Deputado (se implementado) */}
        {deputadoModalAberto && deputadoSelecionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {deputadoSelecionado.nomeEleitoral} ({deputadoSelecionado.siglaPartido} - {deputadoSelecionado.siglaUf})
                </h2>
                <button
                  onClick={fecharModalDeputado}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <p>Modal de deputado será implementado aqui...</p>
                <button
                  onClick={fecharModalDeputado}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info (desenvolvimento) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-xs">
            <h4 className="font-bold mb-2">🔧 Debug Info (Categoria Modular):</h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>Categoria:</strong> {categoria}
              </div>
              <div>
                <strong>Slug:</strong> {categoriaSlug}
              </div>
              <div>
                <strong>Fornecedores:</strong> {fornecedoresDaCategoria.length}
              </div>
              <div>
                <strong>Transações:</strong> {transacoesDaCategoria.length}
              </div>
              <div>
                <strong>Ano Selecionado:</strong> {anoSelecionado}
              </div>
              <div>
                <strong>Aba Ativa:</strong> {activeTab}
              </div>
              <div>
                <strong>Loading:</strong> {isLoading ? 'Sim' : 'Não'}
              </div>
              <div>
                <strong>Erro:</strong> {erro || 'Nenhum'}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}