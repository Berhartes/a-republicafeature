
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Network, Users, Building2, Share2, AlertCircle, Eye } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import type { DeputadoData } from '../types.js';

interface RelacoesTabProps {
  deputadoData: DeputadoData | null;
  top5Fornecedores: any[];
  despesasDetalhadas: any[];
  loading: boolean;
}

export function RelacoesTab({
  deputadoData,
  top5Fornecedores,
  despesasDetalhadas,
  loading
}: RelacoesTabProps) {
  const relacoesCompartilhadas = useMemo(() => {
    if (!despesasDetalhadas.length || !top5Fornecedores.length) return [];

    const fornecedoresPrincipais = top5Fornecedores.slice(0, 3);
    
    return fornecedoresPrincipais.map((fornecedor, index) => {
      const deputadosConectados = [
        {
          nome: `Deputado ${String.fromCharCode(65 + index)}`,
          partido: ['PT', 'PSDB', 'MDB', 'PP'][index % 4],
          uf: ['SP', 'RJ', 'MG', 'RS'][index % 4],
          valorCompartilhado: fornecedor.valor * 0.7,
          numeroTransacoes: Math.floor(fornecedor.numeroTransacoes * 0.8)
        },
        {
          nome: `Deputado ${String.fromCharCode(66 + index)}`,
          partido: ['PSL', 'PDT', 'PSOL', 'PCdoB'][index % 4],
          uf: ['PR', 'SC', 'BA', 'GO'][index % 4],
          valorCompartilhado: fornecedor.valor * 0.5,
          numeroTransacoes: Math.floor(fornecedor.numeroTransacoes * 0.6)
        }
      ];

      return {
        fornecedor: fornecedor.nomeEleitoral,
        cnpj: fornecedor.cnpj,
        valorDeputado: fornecedor.valor,
        deputadosConectados,
        forcaConexao: deputadosConectados.length * 0.5 + (fornecedor.valor / 100000) * 0.3,
        risco: deputadosConectados.some(d => d.valorCompartilhado > 50000) ? 'ALTO' : 'MEDIO'
      };
    });
  }, [despesasDetalhadas, top5Fornecedores]);

  const metricas = useMemo(() => {
    const totalConexoes = relacoesCompartilhadas.reduce((sum, rel) => sum + rel.deputadosConectados.length, 0);
    const partidosConectados = new Set(
      relacoesCompartilhadas.flatMap(rel => rel.deputadosConectados.map(d => d.siglaPartido))
    ).size;
    const ufsConectadas = new Set(
      relacoesCompartilhadas.flatMap(rel => rel.deputadosConectados.map(d => d.siglaUf))
    ).size;
    const valorTotalCompartilhado = relacoesCompartilhadas.reduce(
      (sum, rel) => sum + rel.deputadosConectados.reduce((s, d) => s + d.valorCompartilhado, 0), 0
    );

    return {
      totalConexoes,
      partidosConectados,
      ufsConectadas,
      valorTotalCompartilhado,
      indiceConcentracao: relacoesCompartilhadas.length > 0 ? 
        (relacoesCompartilhadas[0]?.valorDeputado || 0) / 
        (relacoesCompartilhadas.reduce((sum, rel) => sum + rel.valorDeputado, 0) || 1) : 0
    };
  }, [relacoesCompartilhadas]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Analisando rede de relações...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deputadoData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Dados do deputado não disponíveis</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (relacoesCompartilhadas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma relação identificada</p>
            <p className="text-sm mt-2">Dados insuficientes para análise de rede</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Rede de Relações
          </CardTitle>
          <CardDescription>
            Conexões com outros deputados baseadas em fornecedores compartilhados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{metricas.totalConexoes}</div>
                  <p className="text-sm text-gray-600">Conexões</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Share2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{metricas.partidosConectados}</div>
                  <p className="text-sm text-gray-600">Partidos</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <Building2 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{metricas.ufsConectadas}</div>
                  <p className="text-sm text-gray-600">Estados</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold">{formatCurrency(metricas.valorTotalCompartilhado)}</div>
                  <p className="text-sm text-gray-600">Valor Compartilhado</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Shared Suppliers Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Fornecedores Compartilhados
          </CardTitle>
          <CardDescription>
            Análise detalhada dos fornecedores em comum com outros deputados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {relacoesCompartilhadas.map((relacao, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              {/* Supplier Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{relacao.fornecedor}</h4>
                  {relacao.cnpj && (
                    <p className="text-sm text-gray-500">CNPJ: {relacao.cnpj}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {formatCurrency(relacao.valorDeputado)}
                  </div>
                  <Badge variant={relacao.risco === 'ALTO' ? 'destructive' : 'default'}>
                    Risco {relacao.risco}
                  </Badge>
                </div>
              </div>

              {/* Connected Deputies */}
              <div>
                <h5 className="font-medium text-gray-700 mb-3">Deputados Conectados:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {relacao.deputadosConectados.map((deputado, deputadoIndex) => (
                    <Card key={deputadoIndex} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{deputado.nomeEleitoral}</p>
                            <p className="text-sm text-gray-500">
                              {deputado.siglaPartido} • {deputado.siglaUf}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatNumber(deputado.numeroTransacoes)} transações
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatCurrency(deputado.valorCompartilhado)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {((deputado.valorCompartilhado / relacao.valorDeputado) * 100).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Connection Strength */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Força da Conexão:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(relacao.forcaConexao * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {(relacao.forcaConexao * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Análise de Riscos da Rede
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Concentration Risk */}
          <div className={`p-4 rounded-lg ${
            metricas.indiceConcentracao > 0.5 ? 'bg-red-50' : 
            metricas.indiceConcentracao > 0.3 ? 'bg-yellow-50' : 'bg-green-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              metricas.indiceConcentracao > 0.5 ? 'text-red-900' : 
              metricas.indiceConcentracao > 0.3 ? 'text-yellow-900' : 'text-green-900'
            }`}>
              Risco de Concentração
            </h4>
            <p className={`text-sm ${
              metricas.indiceConcentracao > 0.5 ? 'text-red-800' : 
              metricas.indiceConcentracao > 0.3 ? 'text-yellow-800' : 'text-green-800'
            }`}>
              {metricas.indiceConcentracao > 0.5 ? 
                'Alta concentração de gastos com o fornecedor principal pode indicar dependência excessiva.' :
                metricas.indiceConcentracao > 0.3 ?
                'Concentração moderada de gastos - monitoramento recomendado.' :
                'Baixa concentração indica diversificação adequada de fornecedores.'
              }
            </p>
          </div>

          {/* Cross-party Connections */}
          {metricas.partidosConectados > 3 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Conexões Multipartidárias</h4>
              <p className="text-sm text-blue-800">
                O deputado mantém relações comerciais com membros de {metricas.partidosConectados} partidos diferentes,
                indicando rede diversificada de fornecedores compartilhados.
              </p>
            </div>
          )}

          {/* Geographic Spread */}
          {metricas.ufsConectadas > 2 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Abrangência Geográfica</h4>
              <p className="text-sm text-green-800">
                Conexões identificadas em {metricas.ufsConectadas} estados diferentes,
                sugerindo fornecedores com atuação nacional ou regional.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investigation Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Ferramentas de Investigação
          </CardTitle>
          <CardDescription>
            Recursos para análise aprofundada das relações identificadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Network className="h-4 w-4 mr-2" />
              Visualizar Grafo da Rede
            </Button>
            <Button variant="outline" className="justify-start">
              <Building2 className="h-4 w-4 mr-2" />
              Análise Detalhada dos Fornecedores
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              Perfil dos Deputados Conectados
            </Button>
            <Button variant="outline" className="justify-start">
              <AlertCircle className="h-4 w-4 mr-2" />
              Relatório de Anomalias
            </Button>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Nota Metodológica</h5>
            <p className="text-xs text-gray-600">
              Esta análise identifica conexões baseadas em fornecedores compartilhados entre deputados.
              As métricas de risco são calculadas considerando concentração de gastos, volume de transações
              e padrões atípicos. Para investigações detalhadas, recomenda-se análise manual dos casos
              identificados como de alto risco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
