
import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createCategoryUrl } from '@/lib/category-slugs'
import { getCategoriaColor } from '@/lib/categoria-colors'
import { ExternalLink } from 'lucide-react'

interface CategoryButtonProps {
  categoria: string
  variant?: 'button' | 'badge' | 'link'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showIcon?: boolean
  maxLength?: number
  showFullText?: boolean
  className?: string
  onClick?: (categoria: string) => void
}

export function CategoryButton({ 
  categoria, 
  variant = 'button',
  size = 'sm',
  showIcon = false,
  maxLength = 25,
  showFullText = false,
  className = '',
  onClick
}: CategoryButtonProps) {
  const navigate = useNavigate()

  const handleClick = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    
    if (onClick) {
      onClick(categoria)
    } else {
      const categoryUrl = createCategoryUrl(categoria)
      navigate({ to: categoryUrl })
    }
  }

  const displayText = showFullText || categoria.length <= maxLength
    ? categoria
    : `${categoria.substring(0, maxLength)}...`

  const getSizeClasses = () => {
    switch (size) {
      case 'xs': return 'text-xs h-5 px-2 py-0'
      case 'sm': return 'text-xs h-5 px-2 py-0'
      case 'md': return 'text-sm h-6 px-3 py-1'
      case 'lg': return 'text-sm h-8 px-4 py-2'
      default: return 'text-xs h-5 px-2 py-0'
    }
  }

  if (variant === 'badge') {
    const categoriaColor = getCategoriaColor(categoria)
    
    return (
      <Badge
        variant="outline"
        className={`
          bg-gray-50 text-gray-600 
          hover:bg-blue-50 hover:text-blue-700 
          cursor-pointer transition-colors border-2
          ${showFullText ? 'max-w-none' : 'max-w-[200px]'} 
          ${getSizeClasses()} ${className}
        `}
        style={{
          borderColor: categoriaColor,
          '--category-color': categoriaColor
        } as React.CSSProperties}
        onClick={handleClick}
        title={categoria} // Tooltip com texto completo
      >
        {displayText}
        {showIcon && <ExternalLink className="ml-1 h-3 w-3" />}
      </Badge>
    )
  }

  if (variant === 'link') {
    return (
      <button
        className={`
          text-blue-700 hover:text-blue-800 hover:underline 
          font-medium transition-colors cursor-pointer
          ${size === 'xs' ? 'text-xs' : size === 'sm' ? 'text-sm' : 'text-base'}
          ${className}
        `}
        onClick={handleClick}
      >
        {displayText}
        {showIcon && <ExternalLink className="ml-1 h-3 w-3 inline" />}
      </button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={`
        bg-blue-50 text-blue-700 border-blue-200 
        hover:bg-blue-100 hover:border-blue-300 
        font-medium transition-colors
        ${getSizeClasses()} ${className}
      `}
      onClick={handleClick}
    >
      {displayText}
      {showIcon && <ExternalLink className="ml-1 h-3 w-3" />}
    </Button>
  )
}

interface MultipleCategoryButtonsProps {
  categorias: string[]
  maxVisible?: number
  variant?: CategoryButtonProps['variant']
  size?: CategoryButtonProps['size']
  showFullText?: boolean
  className?: string
}

export function MultipleCategoryButtons({ 
  categorias, 
  maxVisible = 2,
  variant = 'badge',
  size = 'xs',
  showFullText = true,
  className = ''
}: MultipleCategoryButtonsProps) {
  if (!categorias || categorias.length === 0) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs">
        Sem categoria
      </Badge>
    )
  }

  const visibleCategorias = categorias.slice(0, maxVisible)
  const hiddenCount = categorias.length - maxVisible

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visibleCategorias.map((categoria, idx) => (
        <CategoryButton
          key={idx}
          categoria={categoria}
          variant={variant}
          size={size}
          showFullText={showFullText}
        />
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs h-5">
          +{hiddenCount} mais
        </Badge>
      )}
    </div>
  )
}