
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, TrendingUp, Eye, Award, CheckCircle } from 'lucide-react';
import type { PerfilComportamentalDeputado } from '../types.js';

interface InsigniasTabProps {
  perfilComportamental: PerfilComportamentalDeputado | null;
  loading: boolean;
}

export function InsigniasTab({
  perfilComportamental,
  loading
}: InsigniasTabProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p>Analisando perfil comportamental...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!perfilComportamental) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Análise comportamental não disponível</p>
            <p className="text-sm mt-2">Dados insuficientes para análise investigativa</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRiskBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'CRITICO': return 'destructive';
      case 'ALTO': return 'destructive';
      case 'MEDIO': return 'default';
      case 'BAIXO': return 'secondary';
      default: return 'outline';
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'CRITICO': return 'text-red-700 bg-red-50';
      case 'ALTO': return 'text-red-600 bg-red-50';
      case 'MEDIO': return 'text-yellow-700 bg-yellow-50';
      case 'BAIXO': return 'text-green-700 bg-green-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'CRESCENTE': return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'DECRESCENTE': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header da Análise Investigativa */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Perfil Comportamental Investigativo
          </CardTitle>
          <CardDescription>
            Análise baseada em padrões da Operação Lava Jato e técnicas da Polícia Federal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">
                {perfilComportamental.scoreComportamental}
              </div>
              <p className="text-sm text-purple-600">Score Comportamental</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">
                {perfilComportamental.indicadoresAnomalia.length}
              </div>
              <p className="text-sm text-blue-600">Indicadores Detectados</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="text-2xl font-bold text-green-700">
                {perfilComportamental.confiabilidadeAnalise}%
              </div>
              <p className="text-sm text-green-600">Confiabilidade</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Padrões de Gastos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Padrões de Gastos Identificados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Categoria Preferida</h4>
              <Badge variant="outline" className="mb-2">
                {perfilComportamental.padraoGastos.categoriaPreferida}
              </Badge>
              <p className="text-sm text-gray-600">
                Concentração: {perfilComportamental.padraoGastos.concentracaoCategoria}%
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Fornecedor Principal</h4>
              <p className="font-medium">{perfilComportamental.padraoGastos.fornecedorPrincipal}</p>
              <p className="text-sm text-gray-600">
                Concentração: {perfilComportamental.padraoGastos.concentracaoFornecedor}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Valor Médio</h5>
              <p className="text-lg font-bold text-blue-600">
                R$ {perfilComportamental.padraoGastos.valorMedio?.toLocaleString('pt-BR', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Frequência</h5>
              <p className="text-lg font-bold text-green-600">
                {perfilComportamental.padraoGastos.frequenciaTransacoes} tx/mês
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Sazonalidade</h5>
              <Badge variant={perfilComportamental.padraoGastos.sazonalidade ? 'default' : 'secondary'}>
                {perfilComportamental.padraoGastos.sazonalidade ? 'Detectada' : 'Não detectada'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comportamento Temporal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Análise Temporal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                Tendência
                {getTendenciaIcon(perfilComportamental.comportamentoTemporal.tendencia)}
              </h5>
              <Badge variant={
                perfilComportamental.comportamentoTemporal.tendencia === 'CRESCENTE' ? 'destructive' : 
                perfilComportamental.comportamentoTemporal.tendencia === 'DECRESCENTE' ? 'default' : 'secondary'
              }>
                {perfilComportamental.comportamentoTemporal.tendencia}
              </Badge>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Variabilidade</h5>
              <p className="text-lg font-bold">
                {perfilComportamental.comportamentoTemporal.variabilidade}%
              </p>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Picos Anômalos</h5>
              <p className="text-lg font-bold text-red-600">
                {perfilComportamental.comportamentoTemporal.picosAnomalia}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Riscos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Avaliação de Riscos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-lg ${getRiskColor(perfilComportamental.riscos.nivel)}`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Nível de Risco</h4>
              <Badge variant={getRiskBadgeVariant(perfilComportamental.riscos.nivel)}>
                {perfilComportamental.riscos.nivel}
              </Badge>
            </div>
            <p className="text-sm">
              Score de risco: <strong>{perfilComportamental.riscos.score}/100</strong>
            </p>
            <p className="text-sm mt-1">
              {perfilComportamental.riscos.descricao}
            </p>
          </div>

          {perfilComportamental.riscos.fatores.length > 0 && (
            <div>
              <h5 className="font-medium text-gray-700 mb-3">Fatores de Risco Identificados:</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {perfilComportamental.riscos.fatores.map((fator, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">{fator}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicadores de Anomalia */}
      {perfilComportamental.indicadoresAnomalia.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Indicadores de Anomalia Detectados
            </CardTitle>
            <CardDescription>
              Padrões que merecem atenção investigativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {perfilComportamental.indicadoresAnomalia.map((indicador, index) => (
                <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900">{indicador.tipo}</p>
                      <p className="text-sm text-red-700 mt-1">{indicador.descricao}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="destructive" className="text-xs">
                          Severidade: {indicador.severidade}
                        </Badge>
                        <span className="text-xs text-red-600">
                          Confiança: {indicador.confianca}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insígnias e Certificações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Sistema de Insígnias Investigativas
          </CardTitle>
          <CardDescription>
            Baseado em metodologias da Receita Federal e Polícia Federal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Insígnia de Transparência */}
            <div className={`p-4 rounded-lg border-2 ${
              perfilComportamental.riscos.nivel === 'BAIXO' 
                ? 'border-green-300 bg-green-50' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="text-center">
                <CheckCircle className={`h-8 w-8 mx-auto mb-2 ${
                  perfilComportamental.riscos.nivel === 'BAIXO' 
                    ? 'text-green-600' 
                    : 'text-gray-400'
                }`} />
                <h4 className="font-semibold">Transparência</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {perfilComportamental.riscos.nivel === 'BAIXO' ? 'Conquistada' : 'Não conquistada'}
                </p>
              </div>
            </div>

            {/* Insígnia de Consistência */}
            <div className={`p-4 rounded-lg border-2 ${
              perfilComportamental.comportamentoTemporal.variabilidade < 30 
                ? 'border-blue-300 bg-blue-50' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="text-center">
                <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${
                  perfilComportamental.comportamentoTemporal.variabilidade < 30 
                    ? 'text-blue-600' 
                    : 'text-gray-400'
                }`} />
                <h4 className="font-semibold">Consistência</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {perfilComportamental.comportamentoTemporal.variabilidade < 30 ? 'Conquistada' : 'Não conquistada'}
                </p>
              </div>
            </div>

            {/* Insígnia de Compliance */}
            <div className={`p-4 rounded-lg border-2 ${
              perfilComportamental.indicadoresAnomalia.length === 0 
                ? 'border-purple-300 bg-purple-50' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="text-center">
                <Shield className={`h-8 w-8 mx-auto mb-2 ${
                  perfilComportamental.indicadoresAnomalia.length === 0 
                    ? 'text-purple-600' 
                    : 'text-gray-400'
                }`} />
                <h4 className="font-semibold">Compliance</h4>
                <p className="text-xs text-gray-600 mt-1">
                  {perfilComportamental.indicadoresAnomalia.length === 0 ? 'Conquistada' : 'Não conquistada'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metodologia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Metodologia da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-600">
            Esta análise utiliza algoritmos baseados em padrões identificados em operações como a Lava Jato,
            técnicas de análise comportamental da Polícia Federal e metodologias de compliance da Receita Federal.
            Os indicadores são calibrados com base em casos reais de investigação de corrupção e lavagem de dinheiro.
            <br /><br />
            <strong>Confiabilidade da análise:</strong> {perfilComportamental.confiabilidadeAnalise}% | 
            <strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
