import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, Search, X } from 'lucide-react'

interface AlertasFiltersProps {
  filtroTipo: string
  filtroGravidade: string
  buscaTexto: string
  tiposDisponiveis: Array<{ value: string; label: string }>
  gravidadesDisponiveis: Array<{ value: string; label: string }>
  totalOriginal: number
  totalFiltrado: number
  onTipoChange: (tipo: string) => void
  onGravidadeChange: (gravidade: string) => void
  onBuscaChange: (texto: string) => void
  onResetFilters: () => void
}

export function AlertasFilters({
  filtroTipo,
  filtroGravidade,
  buscaTexto,
  tiposDisponiveis,
  gravidadesDisponiveis,
  totalOriginal,
  totalFiltrado,
  onTipoChange,
  onGravidadeChange,
  onBuscaChange,
  onResetFilters
}: AlertasFiltersProps) {
  const hasActiveFilters = filtroTipo !== 'TODOS' || filtroGravidade !== 'TODOS' || buscaTexto.trim() !== ''
  const percentualFiltrado = totalOriginal > 0 ? (totalFiltrado / totalOriginal) * 100 : 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avançados
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {totalFiltrado} de {totalOriginal} alertas ({percentualFiltrado.toFixed(1)}%)
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Linha 1: Busca por texto */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por deputado, descrição, fornecedor..."
            value={buscaTexto}
            onChange={(e) => onBuscaChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Linha 2: Filtros por categoria */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por Tipo */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Alerta</label>
            <Select value={filtroTipo} onValueChange={onTipoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposDisponiveis.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Gravidade */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Gravidade</label>
            <Select value={filtroGravidade} onValueChange={onGravidadeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar gravidade" />
              </SelectTrigger>
              <SelectContent>
                {gravidadesDisponiveis.map((gravidade) => (
                  <SelectItem key={gravidade.value} value={gravidade.value}>
                    {gravidade.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão para limpar filtros */}
          <div className="space-y-2">
            <label className="text-sm font-medium opacity-0">Ações</label>
            <Button 
              variant="outline" 
              onClick={onResetFilters}
              disabled={!hasActiveFilters}
              className="w-full flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Indicadores de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {filtroTipo !== 'TODOS' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Tipo: {tiposDisponiveis.find(t => t.value === filtroTipo)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onTipoChange('TODOS')}
                />
              </Badge>
            )}
            {filtroGravidade !== 'TODOS' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Gravidade: {gravidadesDisponiveis.find(g => g.value === filtroGravidade)?.label}
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onGravidadeChange('TODOS')}
                />
              </Badge>
            )}
            {buscaTexto.trim() !== '' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Busca: "{buscaTexto}"
                <X 
                  className="h-3 w-3 cursor-pointer hover:text-destructive" 
                  onClick={() => onBuscaChange('')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Resumo dos resultados */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {hasActiveFilters ? (
            <>
              Mostrando <strong>{totalFiltrado}</strong> de <strong>{totalOriginal}</strong> alertas 
              ({percentualFiltrado.toFixed(1)}% do total)
            </>
          ) : (
            <>
              Mostrando todos os <strong>{totalOriginal}</strong> alertas disponíveis
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}