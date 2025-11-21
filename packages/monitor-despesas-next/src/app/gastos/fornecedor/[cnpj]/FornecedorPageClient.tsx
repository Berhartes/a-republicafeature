'use client'

import type { FornecedorResumo } from '@a-republica/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Building2, TrendingUp, FileText } from 'lucide-react'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'

interface FornecedorPageClientProps {
  fornecedor: FornecedorResumo
}

export function FornecedorPageClient({ fornecedor }: FornecedorPageClientProps) {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{fornecedor.nome}</h1>
          <p className="text-muted-foreground">CNPJ: {fornecedor.cnpjCpf}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrencyBRL(fornecedor.totalRecebido)}</div>
            <p className="text-xs text-muted-foreground">Total recebido de deputados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Número de Transações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumberBR(fornecedor.numeroTransacoes)}</div>
            <p className="text-xs text-muted-foreground">Transações com deputados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoria Principal</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fornecedor.tipoDespesaPrincipal || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Principal categoria de despesa</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
