
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import { AlertasUnificados } from '../components/AlertasUnificados.js';
import type { DeputadoData, PerfilComportamentalDeputado, RankingData } from '../types.js';

interface VisaoGeralTabProps {
  deputadoData: DeputadoData | null;
  totalGasto: number;
  numeroTransacoes: number;
  perfilComportamental: PerfilComportamentalDeputado | null;
  rankingDeputado: RankingData | null;
  loading: boolean;
}

export function VisaoGeralTab({
  deputadoData,
  totalGasto,
  numeroTransacoes,
  perfilComportamental,
  rankingDeputado,
  loading
}: VisaoGeralTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!deputadoData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Dados do deputado não encontrados
          </div>
        </CardContent>
      </Card>
    );
  }

  const alertas = [];
  if (totalGasto > 500000) alertas.push('Alto volume de gastos');
  if (perfilComportamental?.riscos.nivel === 'ALTO') alertas.push('Perfil de risco elevado');

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{deputadoData.nomeEleitoral}</CardTitle>
              <CardDescription className="text-lg">
                {deputadoData.siglaPartido} • {deputadoData.siglaUf}
              </CardDescription>
            </div>
            {deputadoData.urlFoto && (
              <img 
                src={deputadoData.urlFoto} 
                alt={deputadoData.nomeEleitoral}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {deputadoData.nomeCivil && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Nome Civil:</span>
                <span>{deputadoData.nomeCivil}</span>
              </div>
            )}
            {deputadoData.email && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span>{deputadoData.email}</span>
              </div>
            )}
            {deputadoData.telefone && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Telefone:</span>
                <span>{deputadoData.telefone}</span>
              </div>
            )}
          </div>
          
          <AlertasUnificados alertas={alertas} />
        </CardContent>
      </Card>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalGasto)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Número de Transações</p>
                <p className="text-2xl font-bold text-green-600">{formatNumber(numeroTransacoes)}</p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Médio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {numeroTransacoes > 0 ? formatCurrency(totalGasto / numeroTransacoes) : 'R$ 0,00'}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ranking */}
      {rankingDeputado && (
        <Card>
          <CardHeader>
            <CardTitle>Posição no Ranking</CardTitle>
            <CardDescription>Classificação entre todos os deputados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {rankingDeputado.posicao}º de {rankingDeputado.totalDeputados}
              </Badge>
              <div className="text-sm text-gray-600">
                {((rankingDeputado.posicao / rankingDeputado.totalDeputados) * 100).toFixed(1)}% dos deputados gastam mais
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Perfil Comportamental */}
      {perfilComportamental && (
        <Card>
          <CardHeader>
            <CardTitle>Perfil Comportamental</CardTitle>
            <CardDescription>Análise de padrões de gastos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Categoria Preferida</p>
                <p className="font-semibold">{perfilComportamental.padraoGastos.categoriaPreferida}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tendência</p>
                <Badge variant={
                  perfilComportamental.comportamentoTemporal.tendencia === 'CRESCENTE' ? 'destructive' : 
                  perfilComportamental.comportamentoTemporal.tendencia === 'DECRESCENTE' ? 'default' : 'secondary'
                }>
                  {perfilComportamental.comportamentoTemporal.tendencia}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Nível de Risco</p>
                <Badge variant={
                  perfilComportamental.riscos.nivel === 'CRITICO' ? 'destructive' :
                  perfilComportamental.riscos.nivel === 'ALTO' ? 'destructive' :
                  perfilComportamental.riscos.nivel === 'MEDIO' ? 'default' : 'secondary'
                }>
                  {perfilComportamental.riscos.nivel}
                </Badge>
              </div>
            </div>

            {perfilComportamental.riscos.fatores.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Fatores de Risco:</p>
                <div className="flex flex-wrap gap-2">
                  {perfilComportamental.riscos.fatores.map((fator, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {fator}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
