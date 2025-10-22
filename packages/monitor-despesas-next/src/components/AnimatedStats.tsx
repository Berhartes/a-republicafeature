import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedStatsProps {
  title: string
  value: number
  prefix?: string
  suffix?: string
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  decimals?: number
  duration?: number
  className?: string
}

export function AnimatedStats({
  title,
  value,
  prefix = '',
  suffix = '',
  description,
  icon: Icon,
  trend,
  decimals = 0,
  duration = 2000,
  className
}: AnimatedStatsProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)
    const startTime = Date.now()
    const startValue = displayValue
    const endValue = value

    const animate = () => {
      const now = Date.now()
      const progress = Math.min((now - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      
      const currentValue = startValue + (endValue - startValue) * easeOutQuart
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  const formatValue = (val: number) => {
    if (decimals > 0) {
      return val.toFixed(decimals)
    }
    return Math.floor(val).toLocaleString('pt-BR')
  }

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <h2 className={cn(
                "text-2xl font-bold tracking-tight transition-all",
                isAnimating && "text-primary"
              )}>
                {prefix}{formatValue(displayValue)}{suffix}
              </h2>
              {trend && (
                <span className={cn(
                  "text-sm font-medium transition-all",
                  trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={cn(
            "absolute right-4 top-4 p-3 rounded-full transition-all",
            "bg-primary/10 group-hover:bg-primary/20",
            isAnimating && "scale-110 bg-primary/20"
          )}>
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        {/* Progress bar */}
        {isAnimating && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ 
                width: `${(displayValue / value) * 100}%`,
                transition: `width ${duration}ms ease-out`
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
