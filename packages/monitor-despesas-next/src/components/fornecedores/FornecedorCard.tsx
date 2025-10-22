import { Building2, Users, AlertTriangle, TrendingUp, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { categoryIcons } from '@/components/filters/category-icons'
import { Badge } from '@/components/ui/badge'
import { Link } from '@tanstack/react-router'

interface FornecedorCardProps {
  fornecedor: {
    nome: string
    cnpj: string
    totalTransacionado: number
    deputadosAtendidos: string[]
    scoreSuspeicao: number
    alertas: string[]
    categorias: string[]
    transacoes: number
    valorMedioTransacao: number
    maiorTransacao: number
    menorTransacao: number
    deputadoMaiorGasto: { nome: string; valor: number } | null
  }
}

const obterCategoriaRisco = (score: number): string => {
  if (score >= 80) return 'Crítico'
  if (score >= 60) return 'Alto'
  if (score >= 40) return 'Médio'
  return 'Baixo'
}

const obterVarianteBadgeScore = (score: number): string => {
  if (score >= 80) return 'destructive'
  if (score >= 60) return 'secondary'
  if (score >= 40) return 'outline'
  return 'default'
}

export function FornecedorCard({ fornecedor }: FornecedorCardProps) {
  const getScoreColor = (score: number) => {
    return obterVarianteBadgeScore(score) === 'destructive' ? 'bg-red-500' :
           obterVarianteBadgeScore(score) === 'secondary' ? 'bg-orange-500' :
           obterVarianteBadgeScore(score) === 'outline' ? 'bg-yellow-500' : 'bg-green-500'
  }

  const getScoreText = (score: number) => {
    return obterCategoriaRisco(score)
  }

  const getFornecedorIcon = () => {
    const mainCategory = fornecedor.categorias[0]
    return categoryIcons[mainCategory] || Building2
  }

  const Icon = getFornecedorIcon()

  return (
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate" title={fornecedor.nome}>
              <Icon className="h-4 w-4 mr-2 inline" />
              {fornecedor.nome}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              CNPJ: {fornecedor.cnpj || 'Não informado'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge 
              className={`${getScoreColor(fornecedor.scoreSuspeicao)} text-white`}
            >
              {fornecedor.scoreSuspeicao}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getScoreText(fornecedor.scoreSuspeicao)}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              Total
            </div>
            <div className="font-semibold">
              R$ {fornecedor.totalTransacionado.toLocaleString('pt-BR')}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-3 w-3 mr-1" />
              Deputados
            </div>
            <div className="font-semibold">
              {fornecedor.deputadosAtendidos.length}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Transações: </span>
            <span className="font-medium">{fornecedor.transacoes}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Valor médio: </span>
            <span className="font-medium">
              R$ {fornecedor.valorMedioTransacao.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {fornecedor.alertas.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center text-amber-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              <span className="text-sm font-medium">Alertas</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {fornecedor.alertas.slice(0, 2).map((alerta, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {alerta}
                </Badge>
              ))}
              {fornecedor.alertas.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{fornecedor.alertas.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link 
            to="/gastos/fornecedor/$cnpj" 
            params={{ cnpj: fornecedor.cnpj || 'sem-cnpj' }}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
