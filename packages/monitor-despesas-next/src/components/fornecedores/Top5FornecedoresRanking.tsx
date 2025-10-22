import React, { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RefreshCw, Eye, Building2, Filter, X } from 'lucide-react'
import { getCategoriaColor } from '@/lib/categoria-colors'
import { createCategoryUrl } from '@/lib/category-slugs'

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
  const navigate = useNavigate()
  
  const [showCategoryPanel, setShowCategoryPanel] = useState(false)
  
  const normalizeString = (str: string): string => {
    if (!str) return ''
    return str
      .normalize('NFD') // Decompor acentos
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .toLowerCase()
      .trim()
  }

  const matchCategoria = (categoriaFornecedor: string, categoriaFiltro: string): boolean => {
    if (!categoriaFornecedor || !categoriaFiltro) return false
    if (categoriaFiltro === 'TODAS') return true
    
    return normalizeString(categoriaFornecedor) === normalizeString(categoriaFiltro)
  }

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
    ? '🏢 Top 5 Fornecedores por Volume'
    : '🏢 Top 5 Empresas que Mais Receberam'
    
  const defaultDescription = context === 'fornecedores-page'
    ? `Fornecedores com maior volume de transações no sistema${categoriaSelecionada !== 'TODAS' ? ` • Categoria: ${categoriaSelecionada}` : ''}`
    : `Fornecedores com maior volume de gastos no período selecionado${categoriaSelecionada !== 'TODAS' ? ` • Categoria: ${categoriaSelecionada}` : ''}`

  const getCorCategoriaBadge = (categoria: string) => {
    const cor = getCategoriaColor(categoria);
    const coresMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-300',      // Azul
      '#10B981': 'bg-green-100 text-green-800 border-green-300',   // Verde
      '#F59E0B': 'bg-yellow-100 text-yellow-800 border-yellow-300', // Amarelo
      '#EF4444': 'bg-red-100 text-red-800 border-red-300',         // Vermelho
      '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-300', // Roxo
      '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-300',      // Ciano
      '#6B7280': 'bg-gray-100 text-gray-800 border-gray-300',      // Cinza
      '#EC4899': 'bg-pink-100 text-pink-800 border-pink-300',      // Rosa
      '#14B8A6': 'bg-teal-100 text-teal-800 border-teal-300',      // Verde-água
      '#F97316': 'bg-orange-100 text-orange-800 border-orange-300' // Laranja
    };
    
    return coresMap[cor] || 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const formatarValor = (valor: number) => {
    if (monetaryFormat === 'with-cents') {
      return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })
  }

  const handleVerPerfil = (cnpj?: string) => {
    if (!cnpj || cnpj.trim() === '') return
    
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
    if (cnpjLimpo) {
      navigate({ to: `/gastos/fornecedor/${cnpjLimpo}` })
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
      <div className="flex items-center justify-center h-[300px]">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>
          {context === 'fornecedores-page' 
            ? 'Carregando fornecedores...' 
            : 'Carregando despesas...'
          }
        </span>
      </div>
    )
  }

  if (fornecedores.length === 0) {
    return (
      <div className="text-center py-8">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
        <p className="text-muted-foreground mb-4">
          {emptyMessage || 'Não foram encontrados fornecedores para o período selecionado.'}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Header com seleção de categoria */}
      {(title || description || categorySelectMode !== 'none') && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {title || defaultTitle}
                </CardTitle>
              )}
              {description && <CardDescription>{description || defaultDescription}</CardDescription>}
            </div>
            
            {/* Seleção de categoria */}
            {categorySelectMode !== 'none' && categorias.length > 0 && (
              <div className="flex flex-col items-end gap-2">
                {categorySelectMode === 'dropdown' ? (
                  <>
                    <span className="text-sm text-gray-600">Filtrar:</span>
                    <Select value={categoriaSelecionada} onValueChange={handleCategoriaChange}>
                      <SelectTrigger className="w-[150px]">
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
                    {/* Badge colorido da categoria selecionada */}
                    {categoriaSelecionada === 'TODAS' ? (
                      <div className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg bg-gray-100 text-gray-800 border border-gray-300">
                        <Filter className="w-3 h-3 mr-1" />
                        <span>Todas as categorias</span>
                      </div>
                    ) : (
                      <div className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg border ${getCorCategoriaBadge(categoriaSelecionada)}`}>
                        <span className="mr-1">📁</span>
                        <span className="truncate max-w-[200px]">{categoriaSelecionada}</span>
                      </div>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowCategoryPanel(!showCategoryPanel)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Filter className="w-4 h-4 mr-2" />
                      Escolher categoria
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      {/* Painel de seleção de categoria (modo button) - ocupa todo o espaço quando aberto */}
      {showCategoryPanel && categorySelectMode === 'button' && categorias.length > 0 ? (
        <div className="border rounded-lg p-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Escolher Categoria</h3>
                <p className="text-sm text-gray-600">Selecione uma categoria para filtrar os fornecedores</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCategoryPanel(false)}
              className="hover:bg-red-100 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Badge "Todas as Categorias" */}
            <div
              className={`cursor-pointer w-full px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:opacity-80 flex items-center justify-center ${
                categoriaSelecionada === 'TODAS' 
                  ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-500 shadow-lg' 
                  : 'bg-gray-100 text-gray-800 border-gray-300 hover:border-blue-400'
              }`}
              onClick={() => handleCategoriaChange('TODAS')}
            >
              <Filter className="w-4 h-4 mr-2" />
              <span>Todas as Categorias</span>
            </div>
            
            {/* Badges coloridos completos das categorias */}
            {categorias.map((categoria) => {
              const corClasses = getCorCategoriaBadge(categoria);
              
              return (
                <div
                  key={categoria}
                  className={`cursor-pointer w-full px-3 py-3 text-xs font-medium rounded-lg border transition-all duration-200 hover:opacity-80 flex items-center justify-center break-words text-center ${corClasses} ${
                    categoriaSelecionada === categoria ? 'ring-2 ring-blue-500 shadow-lg' : ''
                  }`}
                  onClick={() => handleCategoriaChange(categoria)}
                  title={categoria}
                >
                  <span className="mr-2">📁</span>
                  <span className="leading-tight">{categoria}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
        {fornecedores.map((fornecedor, index) => {
        const numeroDeputados = getNumeroDeputados(fornecedor.deputadosAtendidos)
        
        return (
          <div key={`${fornecedor.cnpj || fornecedor.nome}-${index}`} className="flex flex-col p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
            {/* Parte superior: Nome, transações, CNPJ e valor */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 mt-1 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-amber-600' :
                  'bg-blue-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {(fornecedor.nome || '').length > 35 ? (fornecedor.nome || '').substring(0, 35) + '...' : (fornecedor.nome || 'Nome não disponível')}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{fornecedor.numeroTransacoes} transações</span>
                    {showDeputadosCount && numeroDeputados > 0 && (
                      <span className="text-purple-600">
                        {numeroDeputados} {numeroDeputados === 1 ? 'deputado' : 'deputados'}
                      </span>
                    )}
                    {fornecedor.categorias.length > 1 && (
                      <span className="text-blue-600">+{fornecedor.categorias.length - 1} categorias</span>
                    )}
                  </div>
                  {fornecedor.cnpj && fornecedor.cnpj.trim() !== '' && (
                    <div className="text-xs text-gray-600 font-mono mt-1">
                      CNPJ: {fornecedor.cnpj}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <div className="font-bold text-gray-900">
                  R$ {formatarValor(fornecedor.valor)}
                </div>
                <div className="text-xs text-gray-600">
                  {(() => {
                    const percentual = totalReferencia > 0 ? (fornecedor.valor / totalReferencia) * 100 : 0;
                    return `${percentual.toFixed(1)}% ${labelPercentual}`;
                  })()}
                </div>
                {fornecedor.numeroTransacoes > 0 && (
                  <div className="text-xs text-blue-600 font-medium mt-1">
                    R$ {(fornecedor.valor / fornecedor.numeroTransacoes).toLocaleString('pt-BR', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })} /transação
                  </div>
                )}
              </div>
            </div>
            
            {/* Parte inferior: Badge da categoria e botão Ver Perfil alinhados */}
            <div className="flex items-center gap-2">
              <Link to={createCategoryUrl(fornecedor.categoriaPrincipal)} className="flex-1">
                <span className={`block w-full px-2 py-1 text-xs font-medium rounded-lg text-center break-words cursor-pointer hover:opacity-80 transition-opacity h-7 flex items-center justify-center border ${getCorCategoriaBadge(fornecedor.categoriaPrincipal)}`}>
                  📁 {fornecedor.categoriaPrincipal}
                </span>
              </Link>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 px-3 flex-shrink-0"
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
    </>
  )
}