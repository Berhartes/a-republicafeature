
import React, { useState, useMemo, useEffect } from 'react'
import { Search, Filter, CheckCircle, Circle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { categoryRegistry, CategoryDefinition } from '@/core/categories/CategoryRegistry'

export interface CategorySelectorProps {
  selectedCategoryId?: number
  
  onCategorySelect: (categoryId: number | undefined) => void
  
  multiple?: boolean
  
  selectedCategoryIds?: number[]
  
  onMultipleSelect?: (categoryIds: number[]) => void
  
  showAllOption?: boolean
  
  size?: 'sm' | 'md' | 'lg'
  
  title?: string
  
  description?: string
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  multiple = false,
  selectedCategoryIds = [],
  onMultipleSelect,
  showAllOption = true,
  size = 'md',
  title = 'Selecionar Categoria',
  description = 'Escolha uma categoria para filtrar os dados'
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  
  useEffect(() => {
    const loadCategories = () => {
      const activeCategories = categoryRegistry.getAllActive()
      setCategories(activeCategories)
    }
    
    loadCategories()
  }, [])
  
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return categories
    }
    
    const searchLower = searchTerm.toLowerCase()
    
    return categories.filter(category => {
      if (category.displayName.toLowerCase().includes(searchLower)) {
        return true
      }
      
      if (category.aliases.some(alias => alias.toLowerCase().includes(searchLower))) {
        return true
      }
      
      if (category.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))) {
        return true
      }
      
      return false
    })
  }, [categories, searchTerm])
  
  const handleCategoryClick = (categoryId: number) => {
    if (multiple) {
      if (!onMultipleSelect) return
      
      const currentSelected = selectedCategoryIds || []
      const isSelected = currentSelected.includes(categoryId)
      
      if (isSelected) {
        onMultipleSelect(currentSelected.filter(id => id !== categoryId))
      } else {
        onMultipleSelect([...currentSelected, categoryId])
      }
    } else {
      const newSelection = selectedCategoryId === categoryId ? undefined : categoryId
      onCategorySelect(newSelection)
    }
  }
  
  const handleAllOption = () => {
    if (multiple) {
      onMultipleSelect?.(categories.map(c => c.id))
    } else {
      onCategorySelect(undefined)
    }
  }
  
  const isCategorySelected = (categoryId: number) => {
    if (multiple) {
      return selectedCategoryIds.includes(categoryId)
    } else {
      return selectedCategoryId === categoryId
    }
  }
  
  const sizeClasses = {
    sm: {
      card: 'p-3',
      grid: 'grid-cols-2 gap-2',
      button: 'h-auto p-2 text-xs',
      input: 'h-8 text-sm'
    },
    md: {
      card: 'p-4',
      grid: 'grid-cols-2 md:grid-cols-3 gap-3',
      button: 'h-auto p-3 text-sm',
      input: 'h-9 text-sm'
    },
    lg: {
      card: 'p-6',
      grid: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
      button: 'h-auto p-4 text-base',
      input: 'h-10 text-base'
    }
  }
  
  const currentSizeClasses = sizeClasses[size]
  
  return (
    <Card className={currentSizeClasses.card}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-500" />
          {title}
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-9 ${currentSizeClasses.input}`}
          />
        </div>
        
        {/* Estatísticas */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredCategories.length} de {categories.length} categorias
          </span>
          {multiple && selectedCategoryIds.length > 0 && (
            <Badge variant="secondary">
              {selectedCategoryIds.length} selecionadas
            </Badge>
          )}
        </div>
        
        {/* Opção "Todas" */}
        {showAllOption && (
          <Button
            variant={!selectedCategoryId && !multiple ? 'default' : 'outline'}
            className={`justify-start ${currentSizeClasses.button} w-full`}
            onClick={handleAllOption}
          >
            <div className="flex items-center gap-3 w-full">
              <div className="flex-shrink-0">
                <Filter className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium">Todas as Categorias</div>
                <div className="text-xs text-muted-foreground">
                  Ranking geral sem filtro de categoria
                </div>
              </div>
              {!selectedCategoryId && !multiple && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
            </div>
          </Button>
        )}
        
        {/* Lista de categorias */}
        <div className={`grid ${currentSizeClasses.grid}`}>
          {filteredCategories.map(category => {
            const isSelected = isCategorySelected(category.id)
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? 'default' : 'outline'}
                className={`justify-start ${currentSizeClasses.button} relative`}
                onClick={() => handleCategoryClick(category.id)}
                style={{
                  borderColor: isSelected ? category.color : undefined,
                  backgroundColor: isSelected ? category.color : undefined
                }}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 text-lg">
                    {category.icon}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="font-medium truncate">
                      {category.displayName}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {category.code}
                    </div>
                  </div>
                  {multiple && (
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </div>
              </Button>
            )
          })}
        </div>
        
        {/* Mensagem quando não há resultados */}
        {filteredCategories.length === 0 && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma categoria encontrada para "{searchTerm}"</p>
            <p className="text-xs mt-1">
              Tente usar termos como "locação", "combustível" ou "alimentação"
            </p>
          </div>
        )}
        
        {/* Rodapé com informações */}
        <div className="pt-2 border-t text-xs text-muted-foreground text-center">
          💡 Sistema V4 • Busca inteligente com {categories.reduce((sum, c) => sum + c.aliases.length, 0)} aliases
        </div>
      </CardContent>
    </Card>
  )
}

export default CategorySelector