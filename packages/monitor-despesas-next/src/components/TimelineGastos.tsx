import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, TrendingUp, TrendingDown, Minus, AlertTriangle, Award, DollarSign } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { categoryIcons } from './filters/category-icons'

interface TimelineItem {
  data: string
  titulo: string
  descricao: string
  valor: number
  tipo: 'gasto' | 'alerta' | 'marco'
  gravidade?: 'alta' | 'media' | 'baixa'
  variacao?: number
}

interface TimelineGastosProps {
  items: TimelineItem[]
  titulo?: string
}

export function TimelineGastos({ items, titulo = "Linha do Tempo" }: TimelineGastosProps) {
  const getIcone = (item: TimelineItem) => {
    const { tipo, titulo, variacao } = item
    if (tipo === 'alerta') return AlertTriangle
    if (tipo === 'marco') return Award
    
    const CategoriaIcon = categoryIcons[titulo]
    if (CategoriaIcon) return CategoriaIcon

    if (variacao !== undefined) {
      if (variacao > 0) return TrendingUp
      if (variacao < 0) return TrendingDown
    }
    
    return DollarSign
  }

  const getCor = (tipo: string, gravidade?: string) => {
    if (tipo === 'alerta') {
      switch (gravidade) {
        case 'alta': return 'border-red-500 bg-red-50'
        case 'media': return 'border-yellow-500 bg-yellow-50'
        case 'baixa': return 'border-blue-500 bg-blue-50'
      }
    }
    if (tipo === 'marco') return 'border-purple-500 bg-purple-50'
    return 'border-gray-300 bg-gray-50'
  }

  const formatarData = (dataStr: string) => {
    try {
      const data = new Date(dataStr)
      return format(data, "dd 'de' MMMM", { locale: ptBR })
    } catch {
      return dataStr
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
          
          {/* Items */}
          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="relative flex items-start gap-4">
                {/* Círculo na timeline */}
                <div className={`
                  absolute left-2 w-4 h-4 rounded-full border-2 bg-white
                  ${item.tipo === 'alerta' ? 'border-red-500' : 
                    item.tipo === 'marco' ? 'border-purple-500' : 'border-gray-400'}
                `} />
                
                {/* Conteúdo */}
                <div className={`
                  ml-10 flex-1 p-4 rounded-lg border transition-all hover:shadow-md
                  ${getCor(item.tipo, item.gravidade)}
                `}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                        {React.createElement(getIcone(item), { className: "h-5 w-5 text-gray-600" })}
                      </div>

                      <div>
                        <h4 className="font-semibold">{item.titulo}</h4>
                        <p className="text-xs text-muted-foreground">
                          {formatarData(item.data)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      {item.variacao !== undefined && (
                        <div className="flex items-center gap-1 text-sm">
                          {item.variacao > 0 ? (
                            <TrendingUp className="h-3 w-3 text-red-600" />
                          ) : item.variacao < 0 ? (
                            <TrendingDown className="h-3 w-3 text-green-600" />
                          ) : (
                            <Minus className="h-3 w-3 text-gray-600" />
                          )}
                          <span className={
                            item.variacao > 0 ? 'text-red-600' : 
                            item.variacao < 0 ? 'text-green-600' : 'text-gray-600'
                          }>
                            {Math.abs(item.variacao)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700">{item.descricao}</p>
                  
                  {item.tipo === 'alerta' && item.gravidade && (
                    <Badge 
                      variant={
                        item.gravidade === 'alta' ? 'destructive' :
                        item.gravidade === 'media' ? 'warning' : 'secondary'
                      }
                      className="mt-2"
                    >
                      Gravidade {item.gravidade}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
