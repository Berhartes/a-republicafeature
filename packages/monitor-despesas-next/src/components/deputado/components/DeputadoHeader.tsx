import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Shield, Award, Download, Share2 } from 'lucide-react'
type PerfilComportamentalDeputado = {
  insignias: any[]
  scores: any
  perfil: string
}
import BannerPremiacaoDeputado from '@/components/premiacoes/BannerPremiacaoDeputado'
import type { DeputadoData } from '../hooks/useDeputadoData.js'

interface DeputadoHeaderProps {
  deputadoId: string
  deputadoData: DeputadoData
  perfilComportamental: PerfilComportamentalDeputado | null
  getDeputadoCoroas: (id: string) => any[]
  getDeputadoTrofeus: (id: string) => any[]
  getDeputadoMedalhas: (id: string) => any[]
  onExportarPerfil: () => void
  onCompartilhar?: () => void
}

export function DeputadoHeader({
  deputadoId,
  deputadoData,
  perfilComportamental,
  getDeputadoCoroas,
  getDeputadoTrofeus,
  getDeputadoMedalhas,
  onExportarPerfil,
  onCompartilhar
}: DeputadoHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Status da Conexão */}
      <div className="flex justify-end">
        {/*  status removed - using local data only */}
      </div>

      {/* Banner de Premiações */}
      <BannerPremiacaoDeputado 
        deputadoId={deputadoId}
        deputadoNome={deputadoData?.nomeEleitoral || 'Deputado'}
      />
      
      {/* Header do Perfil */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <img 
              src={deputadoData.foto} 
              alt={deputadoData.nomeEleitoral}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=Foto'
              }}
            />
            <div>
              <h1 className="text-3xl font-bold">{deputadoData.nomeEleitoral}</h1>
              
              {/* Informações Básicas */}
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {deputadoData.siglaPartido} - {deputadoData.siglaUf}
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  Total: R$ {deputadoData.totalGasto?.toLocaleString('pt-BR') || '0'}
                </Badge>
              </div>
              
              {/* Insígnias Investigativas */}
              {perfilComportamental && perfilComportamental.insignias.length > 0 && (
                <div className="mt-3 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-white" />
                    <span className="text-sm font-medium">Perfil Comportamental:</span>
                    <Badge 
                      variant="outline" 
                      className={
                        perfilComportamental.classificacaoRisco === 'CRITICO' ? 'border-red-300 text-red-200 bg-red-500/20' :
                        perfilComportamental.classificacaoRisco === 'ALTO' ? 'border-orange-300 text-orange-200 bg-orange-500/20' :
                        perfilComportamental.classificacaoRisco === 'MEDIO' ? 'border-yellow-300 text-yellow-200 bg-yellow-500/20' :
                        'border-green-300 text-green-200 bg-green-500/20'
                      }
                    >
                      {perfilComportamental.classificacaoRisco} - Score: {perfilComportamental.scoreComportamental}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {perfilComportamental.insignias.slice(0, 6).map((insignia, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`${insignia.cor} border-white/30 backdrop-blur-sm`}
                        title={`${insignia.fundamentacao} - Risco: ${insignia.risco}%`}
                      >
                        <span className="mr-1">{insignia.emoji}</span>
                        {insignia.titulo}
                      </Badge>
                    ))}
                    {perfilComportamental.insignias.length > 6 && (
                      <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                        +{perfilComportamental.insignias.length - 6} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Premiações Unificadas - Sistema Global */}
              {deputadoData?.id && (getDeputadoCoroas(deputadoData.id).length > 0 || getDeputadoTrofeus(deputadoData.id).length > 0 || getDeputadoMedalhas(deputadoData.id).length > 0) && (
                <TooltipProvider>
                  <div className="mt-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-white" />
                      <span className="text-sm font-medium text-white">Premiações</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      
                      {/* Coroas */}
                      {getDeputadoCoroas(deputadoData.id).slice(0, 2).map((coroa, idx) => (
                        <TooltipProvider key={`coroa-${idx}`}>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                                coroa.tipo === 'geral' 
                                  ? 'bg-gradient-to-r from-pink-400 to-pink-600' // Rosa para campeão geral
                                  : 'bg-gradient-to-r from-blue-400 to-blue-600'  // Azul para campeão de categoria
                              }`}>
                                👑
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>👑 {coroa.tipo === 'geral' ? 'Campeão Geral (Todos os Anos)' : 'Campeão de Categoria (Todos os Anos)'}</p>
                              <p>R$ {(coroa.valor || 0).toLocaleString('pt-BR')}</p>
                              {coroa.categoria && <p>Categoria: {coroa.categoria}</p>}
                              <p className={`text-xs ${coroa.tipo === 'geral' ? 'text-pink-600' : 'text-blue-600'}`}>
                                Coroa de campeão {coroa.tipo === 'geral' ? 'geral' : 'de categoria'} (todos os anos)
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      
                      {/* Troféus Anuais */}
                      {getDeputadoTrofeus(deputadoData.id).slice(0, 3).map((trofeu, idx) => (
                        <TooltipProvider key={`trofeu-${idx}`}>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                                (trofeu.tipo === 'geral' || !trofeu.tipo) // Assumir geral se não tiver tipo definido
                                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' // Dourado
                                  : 'bg-gradient-to-r from-blue-400 to-blue-600'     // Azul
                              }`}>
                                🏆
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>🏆 {(trofeu.tipo === 'geral' || !trofeu.tipo) ? 'Campeão Geral' : 'Campeão de Categoria'} {trofeu.ano}</p>
                              <p>R$ {(trofeu.valor || 0).toLocaleString('pt-BR')}</p>
                              {trofeu.categoria && <p>Categoria: {trofeu.categoria}</p>}
                              <p className={`text-xs ${(trofeu.tipo === 'geral' || !trofeu.tipo) ? 'text-yellow-600' : 'text-blue-600'}`}>
                                Troféu de campeão {(trofeu.tipo === 'geral' || !trofeu.tipo) ? 'geral' : 'de categoria'} anual
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      
                      {/* Medalhas (2º e 3º lugares) */}
                      {getDeputadoMedalhas(deputadoData.id).slice(0, 3).map((medalha, idx) => {
                        const isMedalhaHonraHistorica = medalha.categoria === 'geral_historico' && medalha.ano === 0
                        const isMedalhaAnual = medalha.categoria === 'geral_anual' && medalha.ano > 0
                        
                        let corFundo = ''
                        if (isMedalhaHonraHistorica) {
                          corFundo = 'bg-gradient-to-r from-pink-400 to-pink-600'
                        } else if (isMedalhaAnual) {
                          corFundo = medalha.posicao === 2 
                            ? 'bg-gradient-to-r from-slate-300 to-slate-500' // Prata
                            : 'bg-gradient-to-r from-amber-500 to-yellow-700' // Bronze
                        } else {
                          corFundo = medalha.posicao === 2 
                            ? 'bg-gradient-to-r from-gray-400 to-slate-500' 
                            : 'bg-gradient-to-r from-amber-600 to-yellow-600'
                        }
                        
                        return (
                          <TooltipProvider key={`medalha-${idx}`}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm ${corFundo}`}>
                                  🎖️
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>🎖️ {medalha.posicao}º Lugar {
                                  isMedalhaHonraHistorica ? 'Geral (Todos os Anos)' :
                                  isMedalhaAnual ? `Geral ${medalha.ano}` :
                                  medalha.tipo === 'geral' ? 'Geral' : 'de Categoria'
                                } {medalha.ano && medalha.ano > 0 && !isMedalhaAnual ? medalha.ano : isMedalhaHonraHistorica ? '' : '(Histórico)'}</p>
                                <p>R$ {(medalha.valor || 0).toLocaleString('pt-BR')}</p>
                                {medalha.categoria && medalha.categoria !== 'geral_historico' && medalha.categoria !== 'geral_anual' && <p>Categoria: {medalha.categoria}</p>}
                                <p className={`text-xs ${
                                  isMedalhaHonraHistorica ? 'text-pink-600' :
                                  isMedalhaAnual ? (medalha.posicao === 2 ? 'text-slate-600' : 'text-amber-700') :
                                  medalha.posicao === 2 ? 'text-gray-600' : 'text-amber-600'
                                }`}>
                                  {
                                    isMedalhaHonraHistorica ? 'Medalha de honra do ranking geral histórico' :
                                    isMedalhaAnual ? `Medalha de ${medalha.posicao === 2 ? 'prata' : 'bronze'} do ranking anual` :
                                    `Medalha de ${medalha.posicao}º lugar ${medalha.ano ? 'anual' : 'histórica'}`
                                  }
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )
                      })}
                      
                      {/* Indicador de mais premiações */}
                      {(getDeputadoCoroas(deputadoData.id).length + getDeputadoTrofeus(deputadoData.id).length + getDeputadoMedalhas(deputadoData.id).length) > 8 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                                +{(getDeputadoCoroas(deputadoData.id).length + getDeputadoTrofeus(deputadoData.id).length + getDeputadoMedalhas(deputadoData.id).length) - 8}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>+{(getDeputadoCoroas(deputadoData.id).length + getDeputadoTrofeus(deputadoData.id).length + getDeputadoMedalhas(deputadoData.id).length) - 8} outras premiações</p>
                              <p>Total: {getDeputadoTrofeus(deputadoData.id).length} troféus, {getDeputadoCoroas(deputadoData.id).length} coroas, {getDeputadoMedalhas(deputadoData.id).length} medalhas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </TooltipProvider>
              )}
              
              {/* Informações de Contato */}
              {(deputadoData.email || deputadoData.telefone || deputadoData.gabinete) && (
                <div className="flex gap-4 mt-4 text-sm">
                  {deputadoData.email && (
                    <span className="opacity-90">✉️ {deputadoData.email}</span>
                  )}
                  {deputadoData.telefone && (
                    <span className="opacity-90">📞 {deputadoData.telefone}</span>
                  )}
                  {deputadoData.gabinete && (
                    <span className="opacity-90">🏢 Gabinete {deputadoData.gabinete}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Ações */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onExportarPerfil}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            {onCompartilhar && (
              <Button variant="secondary" size="sm" onClick={onCompartilhar}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}