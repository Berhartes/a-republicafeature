
import { useState, Suspense } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Calendar, RefreshCw } from 'lucide-react';

import { useDeputadoData } from './hooks/useDeputadoData.js';
import { useTimeFilters } from './hooks/useTimeFilters.js';
import { useDespesasData } from './hooks/useDespesasData.js';
import { useRankingData } from './hooks/useRankingData.js';
import { useFornecedoresData } from './hooks/useFornecedoresData.js';
import { usePerfilComportamental } from './hooks/usePerfilComportamental.js';

import { TabLoadingFallback } from './components/TabLoadingFallback.js';
import { AlertasUnificados } from './components/AlertasUnificados.js';

import {
  VisaoGeralTab,
  PremiacoesTab,
  TransacoesTab,
  InsigniasTab,
  RankingTab,
  FornecedoresTab,
  EvolucaoTab,
  ComparativoTab,
  RelacoesTab
} from './components/LazyTabs.js';

import { formatCurrency } from './utils/formatters.js';

export function PerfilDeputadoModular() {
  const { deputadoId } = useParams({ from: '/gastos/perfil/$deputadoId' });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('visao-geral');
  const [filtroCategorieFornecedores, setFiltroCategorieFornecedores] = useState('TODAS');

  const {
    anoSelecionado,
    mesSelecionado,
    setAnoSelecionado,
    setMesSelecionado,
    anosDisponiveis,
    mesesDisponiveis
  } = useTimeFilters(2024);

  const { 
    deputadoData, 
    loading: loadingDeputado, 
    error: errorDeputado,
    refetch: refetchDeputado
  } = useDeputadoData(deputadoId);

  const {
    despesasDetalhadas,
    loadingDespesas,
    totalGasto,
    numeroTransacoes,
    categorias,
    fornecedores,
    refetch: refetchDespesas
  } = useDespesasData(deputadoId, anoSelecionado, mesSelecionado);

  const { rankingDeputado } = useRankingData(deputadoId, anoSelecionado);

  const {
    top5Fornecedores,
    loadingFornecedores,
    error: errorFornecedores,
    totalFornecedores,
    refetch: refetchFornecedores
  } = useFornecedoresData(deputadoId, despesasDetalhadas, filtroCategorieFornecedores);

  const { perfilComportamental, loading: loadingPerfil } = usePerfilComportamental(deputadoId, despesasDetalhadas);

  const mediaDeputados = {}; // Would come from useComparativeData hook
  const maxDeputados = {}; // Would come from useComparativeData hook
  const recordistasDeputados = {}; // Would come from useComparativeData hook

  const isLoading = loadingDeputado || loadingDespesas;

  if (errorDeputado) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Erro ao Carregar Deputado</h2>
            <p className="text-gray-600 mb-4">{errorDeputado}</p>
            <Button onClick={refetchDeputado}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const refreshAllData = () => {
    refetchDeputado();
    refetchDespesas();
    refetchFornecedores();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate({ to: '/gastos' })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Lista
        </Button>
        <Button 
          variant="outline" 
          onClick={refreshAllData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar Dados
        </Button>
      </div>

      {/* Deputado Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-2xl">
                  {deputadoData?.nomeEleitoral || 'Carregando...'}
                </CardTitle>
                <CardDescription className="text-lg">
                  {deputadoData && `${deputadoData.siglaPartido} • ${deputadoData.siglaUf}`}
                </CardDescription>
              </div>
            </div>
            {deputadoData?.urlFoto && (
              <img 
                src={deputadoData.urlFoto} 
                alt={deputadoData.nomeEleitoral}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalGasto)}
              </div>
              <p className="text-sm text-blue-800">Total Gasto</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {numeroTransacoes}
              </div>
              <p className="text-sm text-green-800">Transações</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {totalFornecedores}
              </div>
              <p className="text-sm text-purple-800">Fornecedores</p>
            </div>
          </div>

          {/* Alerts */}
          <AlertasUnificados 
            alertas={[
              ...(totalGasto > 500000 ? ['Alto volume de gastos'] : []),
              ...(perfilComportamental?.riscos.nivel === 'ALTO' ? ['Perfil de risco elevado'] : [])
            ]} 
          />
        </CardContent>
      </Card>

      {/* Time Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="text-sm font-medium">Ano:</label>
                <Select 
                  value={anoSelecionado.toString()} 
                  onValueChange={(value) => setAnoSelecionado(value === 'todos' ? 'todos' : parseInt(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {anosDisponiveis.map(ano => (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Mês:</label>
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mesesDisponiveis.map(mes => (
                      <SelectItem key={mes.valor} value={mes.valor}>
                        {mes.nomeEleitoral}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs with Lazy Loading */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="premiacoes">Premiações</TabsTrigger>
          <TabsTrigger value="transacoes">Transações</TabsTrigger>
          <TabsTrigger value="insignias">Análise Investigativa</TabsTrigger>
          <TabsTrigger value="ranking">Ranking 2025</TabsTrigger>
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="relacoes">Relações</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <Suspense fallback={<TabLoadingFallback />}>
            <VisaoGeralTab
              deputadoData={deputadoData}
              totalGasto={totalGasto}
              numeroTransacoes={numeroTransacoes}
              perfilComportamental={perfilComportamental}
              rankingDeputado={rankingDeputado}
              loading={isLoading}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="premiacoes">
          <Suspense fallback={<TabLoadingFallback />}>
            <PremiacoesTab deputadoData={deputadoData} />
          </Suspense>
        </TabsContent>

        <TabsContent value="transacoes">
          <Suspense fallback={<TabLoadingFallback />}>
            <TransacoesTab
              despesasDetalhadas={despesasDetalhadas}
              categorias={categorias}
              fornecedores={fornecedores}
              loading={loadingDespesas}
              deputadoNome={deputadoData?.nomeEleitoral}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="insignias">
          <Suspense fallback={<TabLoadingFallback />}>
            <InsigniasTab
              perfilComportamental={perfilComportamental}
              loading={loadingPerfil}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="ranking">
          <Suspense fallback={<TabLoadingFallback />}>
            <RankingTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="fornecedores">
          <Suspense fallback={<TabLoadingFallback />}>
            <FornecedoresTab
              top5Fornecedores={top5Fornecedores}
              filtroCategorieFornecedores={filtroCategorieFornecedores}
              setFiltroCategorieFornecedores={setFiltroCategorieFornecedores}
              categorias={categorias}
              loading={loadingFornecedores}
              error={errorFornecedores}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="evolucao">
          <Suspense fallback={<TabLoadingFallback />}>
            <EvolucaoTab
              despesasDetalhadas={despesasDetalhadas}
              anoSelecionado={anoSelecionado}
              loading={loadingDespesas}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="comparativo">
          <Suspense fallback={<TabLoadingFallback />}>
            <ComparativoTab
              deputadoData={deputadoData}
              totalGasto={totalGasto}
              numeroTransacoes={numeroTransacoes}
              categorias={categorias}
              despesasDetalhadas={despesasDetalhadas}
              mediaDeputados={mediaDeputados}
              maxDeputados={maxDeputados}
              recordistasDeputados={recordistasDeputados}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="relacoes">
          <Suspense fallback={<TabLoadingFallback />}>
            <RelacoesTab
              deputadoData={deputadoData}
              top5Fornecedores={top5Fornecedores}
              despesasDetalhadas={despesasDetalhadas}
              loading={loadingFornecedores}
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
