
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, TrendingUp, Package, Users, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import type { FornecedorRanking } from '../types.js';

interface FornecedoresTabProps {
  top5Fornecedores: FornecedorRanking[];
  filtroCategorieFornecedores: string;
  setFiltroCategorieFornecedores: (categoria: string) => void;
  categorias: string[];
  loading: boolean;
  error: string | null;
}

export function FornecedoresTab({
  top5Fornecedores,
  filtroCategorieFornecedores,
  setFiltroCategorieFornecedores,
  categorias,
  loading,
  error
}: FornecedoresTabProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando fornecedores...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Erro ao carregar fornecedores: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalFornecedores = top5Fornecedores.length;
  const totalValor = top5Fornecedores.reduce((sum, f) => sum + f.valor, 0);
  const totalTransacoes = top5Fornecedores.reduce((sum, f) => sum + f.numeroTransacoes, 0);

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filtrar por categoria:</label>
            <Select 
              value={filtroCategorieFornecedores} 
              onValueChange={setFiltroCategorieFornecedores}
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as categorias</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria} value={categoria}>
                    {categoria}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Fornecedores</p>
                <p className="text-xl font-bold">{formatNumber(totalFornecedores)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalValor)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Transações</p>
                <p className="text-xl font-bold text-purple-600">{formatNumber(totalTransacoes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Médio</p>
                <p className="text-xl font-bold text-orange-600">
                  {totalFornecedores > 0 ? formatCurrency(totalValor / totalFornecedores) : 'R$ 0,00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Suppliers Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Fornecedores
            {filtroCategorieFornecedores !== 'TODAS' && (
              <Badge variant="secondary" className="ml-2">
                {filtroCategorieFornecedores}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Principais fornecedores por valor recebido
          </CardDescription>
        </CardHeader>
        <CardContent>
          {top5Fornecedores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum fornecedor encontrado para esta categoria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {top5Fornecedores.map((fornecedor, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <span className="font-bold text-blue-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {fornecedor.nomeEleitoral}
                          </h3>
                          {fornecedor.cnpj && (
                            <p className="text-sm text-gray-500">
                              CNPJ: {fornecedor.cnpj}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {fornecedor.categoriaPrincipal}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatNumber(fornecedor.numeroTransacoes)} transações
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(fornecedor.valor)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((fornecedor.valor / totalValor) * 100).toFixed(1)}% do total
                        </div>
                      </div>
                    </div>

                    {/* Categories served */}
                    {fornecedor.categorias && fornecedor.categorias.length > 1 && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs text-gray-600 mb-2">
                          Outras categorias atendidas:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {fornecedor.categorias
                            .filter(cat => cat !== fornecedor.categoriaPrincipal)
                            .slice(0, 3)
                            .map(categoria => (
                              <Badge key={categoria} variant="outline" className="text-xs">
                                {categoria}
                              </Badge>
                            ))}
                          {fornecedor.categorias.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{fornecedor.categorias.length - 4} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      {top5Fornecedores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Análise dos Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Concentration Analysis */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Concentração de Gastos</h4>
              <p className="text-sm text-blue-800">
                {top5Fornecedores.length > 0 && (
                  <>
                    O fornecedor principal ({top5Fornecedores[0].nomeEleitoral}) representa{' '}
                    <strong>{((top5Fornecedores[0].valor / totalValor) * 100).toFixed(1)}%</strong>{' '}
                    do total de gastos com fornecedores.
                  </>
                )}
              </p>
            </div>

            {/* Diversity Analysis */}
            {totalFornecedores > 1 && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Diversificação</h4>
                <p className="text-sm text-green-800">
                  O deputado trabalha com <strong>{totalFornecedores}</strong> fornecedores diferentes
                  {filtroCategorieFornecedores !== 'TODAS' && ` na categoria ${filtroCategorieFornecedores}`},
                  com uma média de <strong>{formatNumber(totalTransacoes / totalFornecedores)}</strong> transações
                  por fornecedor.
                </p>
              </div>
            )}

            {/* Risk Analysis */}
            {top5Fornecedores.some(f => f.valor > totalValor * 0.5) && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">Alerta de Concentração</h4>
                <p className="text-sm text-yellow-800">
                  Há alta concentração de gastos em poucos fornecedores. 
                  Considere analisar a justificativa para esta concentração.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
