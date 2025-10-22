import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getCategoriaColor, getAllColors, getAllCategoryColors, debugCategoriaColor } from '@/lib/categoria-colors'

interface ListaCoresCategoriasProps {
  showDebugInfo?: boolean
}

const CATEGORIAS_EXEMPLO = [
  'COMBUSTÍVEIS E LUBRIFICANTES',
  'PASSAGENS AÉREAS', 
  'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR',
  'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL',
  'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES',
  'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR',
  'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS',
  'TELEFONIA',
  'SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO',
  'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS',
  'LOCAÇÃO OU FRETAMENTO DE AERONAVES',
  'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR',
  'SERVIÇOS POSTAIS',
  'ASSINATURA DE PUBLICAÇÕES',
  'AQUISIÇÃO DE TOKENS',
  'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR',
  'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA'
]

export default function ListaCoresCategorias({ showDebugInfo = false }: ListaCoresCategoriasProps) {
  const paletaCores = getAllColors()
  const mapeamentoCategorias = getAllCategoryColors()

  return (
    <div className="space-y-6">
      {/* Paleta de Cores Base */}
      <Card>
        <CardHeader>
          <CardTitle>🎨 Paleta de Cores Base</CardTitle>
          <CardDescription>
            10 cores principais utilizadas no sistema de categorização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {paletaCores.map((cor, index) => (
              <div key={index} className="text-center space-y-2">
                <div 
                  className="w-full h-16 rounded-lg border-2 border-gray-300 shadow-sm"
                  style={{ backgroundColor: cor }}
                />
                <div className="text-xs space-y-1">
                  <div className="font-medium">{cor}</div>
                  <div className="text-gray-500">Índice {index + 1}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Categorias com Cores Específicas */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Categorias de Despesas com Cores Padronizadas</CardTitle>
          <CardDescription>
            Principais categorias do módulo "Distribuição e Detalhamento de Gastos por Categoria"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {CATEGORIAS_EXEMPLO.map((categoria, index) => {
              const cor = getCategoriaColor(categoria)
              const debugInfo = showDebugInfo ? debugCategoriaColor(categoria) : null
              
              return (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg border bg-gray-50/50">
                  {/* Amostra da cor */}
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 shadow-sm flex-shrink-0"
                    style={{ backgroundColor: cor }}
                  />
                  
                  {/* Nome da categoria */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {categoria}
                    </div>
                    {debugInfo && (
                      <div className="text-xs text-gray-500 mt-1">
                        Método: {debugInfo.metodo} | Cor: {debugInfo.corNome}
                      </div>
                    )}
                  </div>
                  
                  {/* Badge com código da cor */}
                  <Badge variant="outline" className="text-xs font-mono">
                    {cor}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Exemplo de Barras (como no módulo real) */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Preview das Barras no Módulo</CardTitle>
          <CardDescription>
            Demonstração visual de como as cores aparecem nas barras do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CATEGORIAS_EXEMPLO.slice(0, 8).map((categoria, index) => {
              const cor = getCategoriaColor(categoria)
              const valorFake = 1000 - (index * 100) // Valores decrescentes para simulação
              const percentual = ((valorFake / 1000) * 100)
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate flex-1 mr-4">
                      {categoria.length > 40 ? categoria.substring(0, 40) + '...' : categoria}
                    </span>
                    <span className="font-semibold text-gray-900 whitespace-nowrap">
                      R$ {valorFake.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {/* Barra horizontal (igual ao módulo real) */}
                  <div className="relative w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="absolute top-0 left-0 h-4 rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${percentual}%`,
                        backgroundColor: cor,
                        opacity: 0.8
                      }}
                    />
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {percentual.toFixed(1)}% do maior valor
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}