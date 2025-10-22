
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Building2, TrendingUp, AlertCircle } from 'lucide-react';
import { useSuppliersData } from '@/hooks/useLazyData';
import { useState, useMemo } from 'react';

export function FornecedoresLazy() {
  const { data: suppliers, loading, error, reload } = useSuppliersData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    if (!searchTerm) return suppliers;

    const term = searchTerm.toLowerCase();
    return suppliers.filter(supplier => 
      supplier.nome.toLowerCase().includes(term) ||
      supplier.cnpj?.toLowerCase().includes(term)
    );
  }, [suppliers, searchTerm]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div className="space-y-2">
            <p className="text-lg font-medium">
              Carregando dados de fornecedores...
            </p>
            <p className="text-sm text-muted-foreground">
              Baixando 4.5 MB de dados (comprimido para ~650 KB)
            </p>
            <p className="text-xs text-muted-foreground">
              Isso acontece apenas uma vez, depois fica em cache
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p>Erro ao carregar fornecedores: {error.message}</p>
          <Button onClick={reload} variant="outline" size="sm">
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhum fornecedor encontrado. Verifique se os dados foram processados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">
            Fornecedores
          </h2>
          <p className="text-muted-foreground text-lg">
            {suppliers.length.toLocaleString('pt-BR')} fornecedores cadastrados
          </p>
        </div>
        <Button onClick={reload} variant="outline" size="sm">
          Atualizar
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Fornecedores
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.length.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transacionado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(
                suppliers.reduce((sum, s) => sum + (s.totalRecebido || 0), 0)
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Fornecedor
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(
                suppliers.reduce((sum, s) => sum + (s.totalRecebido || 0), 0) / suppliers.length
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Fornecedor</CardTitle>
          <CardDescription>
            Pesquise por nome ou CNPJ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Digite o nome ou CNPJ do fornecedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>
            {searchTerm ? 
              `${filteredSuppliers.length} resultado(s) encontrado(s)` :
              'Todos os Fornecedores'
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {filteredSuppliers.slice(0, 50).map((supplier, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="space-y-1">
                  <div className="font-medium">{supplier.nome}</div>
                  {supplier.cnpj && (
                    <div className="text-sm text-muted-foreground">
                      CNPJ: {supplier.cnpj}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {supplier.transacoes || 0} transações
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(supplier.totalRecebido || 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredSuppliers.length > 50 && (
            <Alert className="mt-4">
              <AlertDescription>
                Mostrando apenas os primeiros 50 resultados de {filteredSuppliers.length}.
                Use a busca para refinar os resultados.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Nota sobre lazy loading */}
      <Alert>
        <AlertDescription>
          ⚡ <strong>Lazy Loading ativo!</strong> Estes dados ({suppliers.length.toLocaleString('pt-BR')} fornecedores){' '}
          foram carregados apenas quando você acessou esta página. Agora estão em cache{' '}
          e navegação futura será instantânea.
        </AlertDescription>
      </Alert>
    </div>
  );
}
