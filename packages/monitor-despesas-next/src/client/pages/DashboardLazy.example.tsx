
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Users, AlertTriangle, Building2 } from 'lucide-react';
import { useDashboardData } from '@/hooks/useLazyData';

export function DashboardLazy() {
  const { data, loading, error, reload } = useDashboardData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">
            Carregando dados do dashboard... (16 KB)
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados: {error.message}
        </AlertDescription>
        <Button onClick={reload} variant="outline" size="sm" className="mt-2">
          Tentar novamente
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-green-500 to-purple-500 bg-clip-text text-transparent">
            Dashboard de Análise
          </h2>
          <p className="text-muted-foreground text-lg">
            Visão geral das despesas parlamentares
          </p>
        </div>
        <Button onClick={reload} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Despesas
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalDespesas ? 
                new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(data.totalDespesas) 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Período analisado: {data?.periodo || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Deputados
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalDeputados || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Com despesas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fornecedores
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalFornecedores || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Únicos identificados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Deputado
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.mediaPorDeputado ? 
                new Intl.NumberFormat('pt-BR', { 
                  style: 'currency', 
                  currency: 'BRL' 
                }).format(data.mediaPorDeputado) 
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Despesa média mensal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top categorias */}
      {data?.topCategorias && (
        <Card>
          <CardHeader>
            <CardTitle>Top Categorias de Despesas</CardTitle>
            <CardDescription>
              Principais tipos de gastos identificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCategorias.map((categoria: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{categoria.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {categoria.transacoes} transações
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">
                      {new Intl.NumberFormat('pt-BR', { 
                        style: 'currency', 
                        currency: 'BRL' 
                      }).format(categoria.valor)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoria.percentual}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nota sobre lazy loading */}
      <Alert>
        <AlertDescription>
          ⚡ <strong>Lazy Loading ativo!</strong> Esta página carregou apenas{' '}
          <strong>16 KB</strong> de dados. Dados de fornecedores e análises{' '}
          detalhadas são carregados apenas quando você navega para essas páginas.
        </AlertDescription>
      </Alert>
    </div>
  );
}
