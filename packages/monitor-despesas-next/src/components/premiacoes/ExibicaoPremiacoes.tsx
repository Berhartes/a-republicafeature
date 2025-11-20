'use client'

import { Crown, Trophy, Medal } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { PremiacoesProcessadas } from '@/types/etl-deputados.types'

interface ExibicaoPremiacoesProps {
  premiacoes: PremiacoesProcessadas
  loading?: boolean
}

export function ExibicaoPremiacoes({ premiacoes, loading }: ExibicaoPremiacoesProps) {
  const totalCoroas = premiacoes.coroas?.length || 0
  const totalTrofeus = premiacoes.trofeus?.length || 0
  const totalMedalhas = premiacoes.medalhas?.length || 0

  return (
    <Tabs defaultValue="coroas" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger 
          value="coroas" 
          disabled={totalCoroas === 0}
          className="flex items-center gap-2"
        >
          <Crown className="h-4 w-4" />
          Coroas ({totalCoroas})
        </TabsTrigger>
        <TabsTrigger 
          value="trofeus" 
          disabled={totalTrofeus === 0}
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Troféus ({totalTrofeus})
        </TabsTrigger>
        <TabsTrigger 
          value="medalhas" 
          disabled={totalMedalhas === 0}
          className="flex items-center gap-2"
        >
          <Medal className="h-4 w-4" />
          Medalhas ({totalMedalhas})
        </TabsTrigger>
      </TabsList>

      {/* Coroas Tab Content */}
      <TabsContent value="coroas" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Campeões históricos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalCoroas === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma coroa disponível
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiacoes.coroas.map((coroa, index) => (
                  <Card 
                    key={`coroa-${index}`}
                    className="border-2 border-yellow-200 bg-yellow-50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-yellow-900">
                            {coroa.nomeEleitoral || coroa.titulo}
                          </CardTitle>
                          <p className="text-sm text-yellow-700 mt-1">
                            {coroa.siglaPartido} - {coroa.siglaUf}
                          </p>
                        </div>
                        <Crown className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {coroa.categoria}
                        </Badge>
                        {coroa.ano && (
                          <Badge variant="outline" className="text-xs">
                            {coroa.ano}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold text-yellow-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(coroa.valor)}
                      </p>
                      {coroa.descricao && (
                        <p className="text-xs text-yellow-700 line-clamp-2">
                          {coroa.descricao}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Troféus Tab Content */}
      <TabsContent value="trofeus" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-blue-600" />
              Campeões anuais
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalTrofeus === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhum troféu disponível
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiacoes.trofeus.map((trofeu, index) => (
                  <Card 
                    key={`trofeu-${index}`}
                    className="border-2 border-blue-200 bg-blue-50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-blue-900">
                            {trofeu.nomeEleitoral || trofeu.titulo}
                          </CardTitle>
                          <p className="text-sm text-blue-700 mt-1">
                            {trofeu.siglaPartido} - {trofeu.siglaUf}
                          </p>
                        </div>
                        <Trophy className="h-6 w-6 text-blue-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {trofeu.categoria}
                        </Badge>
                        {trofeu.ano && (
                          <Badge variant="outline" className="text-xs">
                            {trofeu.ano}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold text-blue-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(trofeu.valor)}
                      </p>
                      {trofeu.descricao && (
                        <p className="text-xs text-blue-700 line-clamp-2">
                          {trofeu.descricao}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Medalhas Tab Content */}
      <TabsContent value="medalhas" className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-orange-600" />
              Menções honrosas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalMedalhas === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                Nenhuma medalha disponível
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {premiacoes.medalhas.map((medalha, index) => (
                  <Card 
                    key={`medalha-${index}`}
                    className="border-2 border-orange-200 bg-orange-50"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold text-orange-900">
                            {medalha.nomeEleitoral || medalha.titulo}
                          </CardTitle>
                          <p className="text-sm text-orange-700 mt-1">
                            {medalha.siglaPartido} - {medalha.siglaUf}
                          </p>
                        </div>
                        <Medal className="h-6 w-6 text-orange-600 flex-shrink-0" />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {medalha.categoria}
                        </Badge>
                        {medalha.ano && (
                          <Badge variant="outline" className="text-xs">
                            {medalha.ano}
                          </Badge>
                        )}
                      </div>
                      <p className="text-lg font-bold text-orange-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(medalha.valor)}
                      </p>
                      {medalha.descricao && (
                        <p className="text-xs text-orange-700 line-clamp-2">
                          {medalha.descricao}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
