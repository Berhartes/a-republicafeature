import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, Users, MapPin, Download, Share2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { createCategoryUrl } from '@/lib/category-slugs'
import type { FornecedorStats } from '@/types/gastos'
import { DataProcessingUtils } from '../utils/dataProcessing.js'

const obterCategoriaRisco = (score: number): string => {
  if (score >= 80) return 'Crítico'
  if (score >= 60) return 'Alto'
  if (score >= 40) return 'Médio'
  return 'Baixo'
}

interface FornecedorHeaderProps {
  fornecedorData: FornecedorStats
  fornecedorInflacionado: boolean
  percentualInflacao: number
  mediasCategoria: Record<string, number>
  onExportarPerfil: () => void
}

export function FornecedorHeader({
  fornecedorData,
  fornecedorInflacionado,
  percentualInflacao,
  mediasCategoria,
  onExportarPerfil
}: FornecedorHeaderProps) {
  const Icon = DataProcessingUtils.getFornecedorIcon(fornecedorData)
  const navigate = useNavigate()

  const handleCategoryClick = (categoria: string) => {
    const categoryUrl = createCategoryUrl(categoria)
    navigate({ to: categoryUrl })
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-6">
          <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white/20 flex items-center justify-center">
            <Icon className="h-16 w-16 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{fornecedorData.nome}</h1>
            <div className="flex items-center gap-4 mt-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Badge 
                      variant="secondary" 
                      className={`${
                        obterCategoriaRisco(fornecedorData.scoreSuspeicao || 0) === 'Crítico' ? 'bg-red-500/20 text-red-200 border-red-400' :
                        obterCategoriaRisco(fornecedorData.scoreSuspeicao || 0) === 'Alto' ? 'bg-orange-500/20 text-orange-200 border-orange-400' :
                        obterCategoriaRisco(fornecedorData.scoreSuspeicao || 0) === 'Médio' ? 'bg-yellow-500/20 text-yellow-200 border-yellow-400' :
                        'bg-green-500/20 text-green-200 border-green-400'
                      }`}
                    >
                      Score: {fornecedorData.scoreSuspeicao} ({obterCategoriaRisco(fornecedorData.scoreSuspeicao || 0)})
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>O Score de Suspeição indica a probabilidade de um fornecedor estar envolvido em atividades ilícitas.</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-sm opacity-90 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                CNPJ: {fornecedorData.cnpj}
              </span>
            </div>
            
            {/* Insígnias do Fornecedor */}
            <div className="flex flex-wrap gap-2 mt-3">
              {fornecedorData.deputadosAtendidos && fornecedorData.deputadosAtendidos.length <= 3 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="bg-pink-500/20 text-pink-200 border-pink-400">
                        🤝 Parceiro Exclusivo
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fornecedor atende poucos deputados, indicando relacionamento exclusivo</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {fornecedorData.categoriaRisco === 'ALTO' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400">
                        🚨 Alto Risco
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fornecedor classificado como alto risco baseado em análise investigativa</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {fornecedorData.classificacaoLavaJato === 'SUSPEITO' && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="bg-orange-500/20 text-orange-200 border-orange-400">
                        🕵️ Suspeito
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fornecedor com padrões suspeitos identificados pela análise investigativa</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {fornecedorData.totalTransacionado > 1000000 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-200 border-purple-400">
                        💎 Grande Fornecedor
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fornecedor com alto volume de transações (&gt;R$ 1M)</p>
                  </TooltipContent>
                </Tooltip>
              )}
              {fornecedorInflacionado && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="bg-red-500/20 text-red-200 border-red-400">
                        💸 Preços Inflacionados
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Fornecedor cobra {percentualInflacao.toFixed(0)}% acima da média da categoria
                      {percentualInflacao > 50 ? ' - MUITO ACIMA' : percentualInflacao > 30 ? ' - ACIMA' : ''}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
              {Object.keys(mediasCategoria).length > 0 && !fornecedorInflacionado && percentualInflacao < -10 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Badge variant="outline" className="bg-green-500/20 text-green-200 border-green-400">
                        💰 Preços Competitivos
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Fornecedor oferece preços {Math.abs(percentualInflacao).toFixed(0)}% abaixo da média da categoria</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            
            {/* Categorias de Serviços */}
            <div className="mt-3">
              <p className="text-sm opacity-90 mb-2">Categorias de Serviços:</p>
              <div className="flex flex-wrap gap-1">
                {fornecedorData.categorias?.slice(0, 4).map((categoria, index) => (
                  <Tooltip key={index}>
                    <TooltipTrigger asChild>
                      <Badge 
                        variant="outline" 
                        className="bg-white/10 text-white border-white/30 text-xs cursor-pointer hover:bg-white/20 hover:border-white/50 transition-all duration-200 hover:scale-105"
                        onClick={() => handleCategoryClick(categoria)}
                      >
                        {categoria}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Clique para ver todos os fornecedores desta categoria</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
                {fornecedorData.categorias && fornecedorData.categorias.length > 4 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="bg-white/10 text-white border-white/30 text-xs">
                        +{fornecedorData.categorias.length - 4} mais
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-xs">
                        <p className="font-medium mb-1">Outras categorias:</p>
                        <div className="space-y-1">
                          {fornecedorData.categorias.slice(4).map((categoria, index) => (
                            <div key={index}>
                              <Badge 
                                variant="outline" 
                                className="cursor-pointer hover:bg-gray-100 text-xs"
                                onClick={() => handleCategoryClick(categoria)}
                              >
                                {categoria}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            
            <div className="flex gap-4 mt-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {Array.isArray(fornecedorData.deputadosAtendidos) ?
                  fornecedorData.deputadosAtendidos.length :
                  (typeof fornecedorData.deputadosAtendidos === 'number' ?
                    fornecedorData.deputadosAtendidos : 0)} deputados atendidos
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                R$ {fornecedorData.totalTransacionado?.toLocaleString('pt-BR') || '0'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={onExportarPerfil}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="secondary" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
    </div>
  )
}