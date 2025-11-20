'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { RefreshCw, Eye, Building2, Filter, X } from 'lucide-react'

export interface FornecedorRanking {
  nome: string
  cnpj?: string
  valor: number
  numeroTransacoes: number
  categoriaPrincipal: string
  categorias: string[]
  deputadosAtendidos?: string[] | number // Pode ser array de nomes ou número
}

interface Top5FornecedoresRankingProps {
  fornecedores: FornecedorRanking[]
  loading: boolean
  
  context: 'fornecedores-page' | 'perfil-deputado'
  
  totalReferencia: number // volumeTotal ou totalGastoDeputado
  labelPercentual: string // "do total" ou "do deputado"
  
  categorias?: string[]
  categoriaSelecionada?: string
  onCategoriaChange?: (categoria: string) => void
  
  categorySelectMode?: 'button' | 'dropdown' | 'none'
  
  title?: string
  description?: string
  
  showDeputadosCount?: boolean // true para fornecedores, false para deputado
  monetaryFormat?: 'with-cents' | 'without-cents'
  emptyMessage?: string
}

const getCategoriaColor = (categoria: string): string => {
  const colors: Record<string, string> = {
    'COMBUSTÍVEIS E LUBRIFICANTES': '#3B82F6',
    'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': '#10B981',
    'PASSAGENS AÉREAS': '#F59E0B',
    'TELEFONIA': '#EF4444',
    'ALIMENTAÇÃO': '#8B5CF6',
    'HOSPEDAGEM': '#06B6D4',
    'LOCOMOÇÃO': '#6B7280',
    'SERVIÇOS POSTAIS': '#EC4899',
  }
  return colors[categoria] || '#6B7280'
}

export default function Top5FornecedoresRanking({
  fornecedores,
  loading,
  context,
  totalReferencia,
  labelPercentual,
  categorias = [],
  categoriaSelecionada = 'TODAS',
  onCategoriaChange,
  categorySelectMode = 'none',
  title,
  description,
  showDeputadosCount = true,
  monetaryFormat = 'with-cents',
  emptyMessage
}: Top5FornecedoresRankingProps) {
  const router = useRouter()
  const [showCategoryPanel, setShowCategoryPanel] = useState(false)

  const handleCategoriaChange = (novaCategoria: string) => {
    console.log('🏷️ [Top5] Mudança de categoria:', novaCategoria)
    if (onCategoriaChange) {
      onCategoriaChange(novaCategoria)
    }
    if (categorySelectMode === 'button') {
      setShowCategoryPanel(false)
    }
  }
  
  const defaultTitle = context === 'fornecedores-page' 
    ? 'Top 5 Fornecedores'
    : 'Top 5 Empresas que Mais Receberam'
    
  const defaultDescription = context === 'fornecedores-page'
    ? `Fornecedores com maior volume de transações${categoriaSelecionada !== 'TODAS' ? ` • Categoria: ${categoriaSelecionada}` : ''}`
    : `Fornecedores com maior volume de gastos${categoriaSelecionada !== 'TODAS' ? ` • Categoria: ${categoriaSelecionada}` : ''}`

  const getCorCategoriaBadge = (categoria: string) => {
    const cor = getCategoriaColor(categoria)
    const coresMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
      '#10B981': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300',
      '#F59E0B': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300',
      '#EF4444': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300',
      '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
      '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300',
      '#6B7280': 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300',
      '#EC4899': 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-300',
    }
    return coresMap[cor] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const formatarValor = (valor: number) => {
    // Usar formatação manual para evitar hydration mismatch
    const partes = valor.toFixed(monetaryFormat === 'with-cents' ? 2 : 0).split('.')
    const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const decimal = partes[1]
    return monetaryFormat === 'with-cents' && decimal ? `${inteiro},${decimal}` : inteiro
  }

  const handleVerPerfil = (cnpj?: string) => {
    if (!cnpj || cnpj.trim() === '') return
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
    if (cnpjLimpo) {
      router.push(`/gastos/fornecedor/${cnpjLimpo}`)
    }
  }

  const getNumeroDeputados = (deputadosAtendidos?: string[] | number): number => {
    if (!deputadosAtendidos) return 0
    if (typeof deputadosAtendidos === 'number') return deputadosAtendidos
    if (Array.isArray(deputadosAtendidos)) return deputadosAtendidos.length
    return 0
  }

  if (loading) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {title || defaultTitle}
          </CardTitle>
          {description && <CardDescription>{description || defaultDescription}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px]">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>
              {context === 'fornecedores-page' 
                ? 'Carregando fornecedores...' 
                : 'Carregando despesas...'
              }
            </span>
          </div>
        </CardContent>
      </>
    )
  }

  if (fornecedores.length === 0) {
    return (
      <>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {title || defaultTitle}
          </CardTitle>
          {description && <CardDescription>{description || defaultDescription}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {emptyMessage || 'Não foram encontrados fornecedores para o período selecionado.'}
            </p>
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <>
      {/* Header com seleção de categoria */}
      {(title || description || categorySelectMode !== 'none') && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {title || defaultTitle}
              </CardTitle>
              <CardDescription>{description || defaultDescription}</CardDescription>
            </div>
            
            {/* Seleção de categoria */}
            {categorySelectMode !== 'none' && categorias.length > 0 && (
              <div className="flex flex-col items-end gap-2">
                {categorySelectMode === 'dropdown' ? (
                  <>
                    <span className="text-sm text-muted-foreground">Filtrar:</span>
                    <Select value={categoriaSelecionada} onValueChange={handleCategoriaChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODAS">Todas</SelectItem>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCategoryPanel(!showCategoryPanel)}
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Filtrar categoria
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {/* Painel de seleção de categoria */}
        {showCategoryPanel && categorySelectMode === 'button' && categorias.length > 0 ? (
          <div className="border rounded-lg p-6 bg-muted/30 min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Filter className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Escolher Categoria</h3>
                  <p className="text-sm text-muted-foreground">Selecione uma categoria para filtrar os fornecedores</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCategoryPanel(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                className={`cursor-pointer w-full px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:opacity-80 flex items-center justify-center ${
                  categoriaSelecionada === 'TODAS' 
                    ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/50' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => handleCategoriaChange('TODAS')}
              >
                <Filter className="w-4 h-4 mr-2" />
                <span>Todas as Categorias</span>
              </div>
              
              {categorias.map((categoria) => {
                const corClasses = getCorCategoriaBadge(categoria)
                
                return (
                  <div
                    key={categoria}
                    className={`cursor-pointer w-full px-3 py-3 text-xs font-medium rounded-lg border transition-all duration-200 hover:opacity-80 flex items-center justify-center break-words text-center ${corClasses} ${
                      categoriaSelecionada === categoria ? 'ring-2 ring-primary shadow-lg' : ''
                    }`}
                    onClick={() => handleCategoriaChange(categoria)}
                    title={categoria}
                  >
                    <span className="mr-2">📁</span>
                    <span className="leading-tight">{categoria}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {fornecedores.map((fornecedor, index) => {
              const numeroDeputados = getNumeroDeputados(fornecedor.deputadosAtendidos)
              // Use a stable key based on position to avoid hydration issues
              const stableKey = `fornecedor-ranking-${index}`
              
              return (
                <div 
                  key={stableKey} 
                  className="flex flex-col p-4 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
                >
                  {/* Parte superior: Nome, ranking e valor */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={"w-8 h-8 mt-0.5 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"}
                        style={{
                          backgroundColor:
                            index === 0 ? '#FFD700' :
                            index === 1 ? '#C0C0C0' :
                            index === 2 ? '#CD7F32' :
                            '#3B82F6'
                        }}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate text-base">
                          {(fornecedor.nome || 'Nome não disponível').length > 40 
                            ? (fornecedor.nome || '').substring(0, 40) + '...' 
                            : (fornecedor.nome || 'Nome não disponível')}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{fornecedor.numeroTransacoes} transações</span>
                          {showDeputadosCount && numeroDeputados > 0 && (
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              {numeroDeputados} {numeroDeputados === 1 ? 'deputado' : 'deputados'}
                            </span>
                          )}
                          {fornecedor.categorias.length > 1 && (
                            <span className="text-blue-600 dark:text-blue-400">
                              +{fornecedor.categorias.length - 1} categorias
                            </span>
                          )}
                        </div>
                        {fornecedor.cnpj && fornecedor.cnpj.trim() !== '' && (
                          <div className="text-xs text-muted-foreground font-mono mt-1">
                            CNPJ: {fornecedor.cnpj}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="font-bold text-foreground text-lg">
                        R$ {formatarValor(fornecedor.valor)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(() => {
                          const percentual = totalReferencia > 0 ? (fornecedor.valor / totalReferencia) * 100 : 0
                          return `${percentual.toFixed(1)}% ${labelPercentual}`
                        })()}
                      </div>
                      {fornecedor.numeroTransacoes > 0 && (
                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                          R$ {(() => {
                            const valorPorTransacao = Math.round(fornecedor.valor / fornecedor.numeroTransacoes)
                            return valorPorTransacao.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                          })()} /transação
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de progresso proporcional ao total */}
                  <div className="mt-2">
                    <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
                      {(() => {
                        const percentual = totalReferencia > 0 ? (fornecedor.valor / totalReferencia) * 100 : 0
                        const width = Math.max(2, Math.min(100, percentual))
                        return (
                          <div
                            className="absolute top-0 left-0 h-2 rounded-full shadow-sm transition-all"
                            style={{
                              width: `${width}%`,
                              background: (index === 0 || index === 1 || index === 2)
                                ? `linear-gradient(to right, ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}, ${index === 0 ? '#FFD700AA' : index === 1 ? '#C0C0C0AA' : '#CD7F32AA'})`
                                : 'linear-gradient(to right, #3B82F6, #3B82F6AA)'
                            }}
                          />
                        )
                      })()}
                    </div>
                  </div>
                  
                  {/* Parte inferior: Badge da categoria e botão */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg text-center break-words border ${getCorCategoriaBadge(fornecedor.categoriaPrincipal)}`}>
                      📁 {fornecedor.categoriaPrincipal}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 px-3 shrink-0"
                      onClick={() => handleVerPerfil(fornecedor.cnpj)}
                      disabled={!fornecedor.cnpj || fornecedor.cnpj.trim() === ''}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Perfil
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </>
  )
}
