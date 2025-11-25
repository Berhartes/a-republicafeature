import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './card';
import { cn } from '@/lib/utils';
import { formatCompactCurrencyBRL, formatNumberBR } from '@/lib/formatters';

interface MiniCardStatItem {
  title: string;
  value: number | string;
  icon?: React.ElementType;
  color?: string;
  formatType?: 'number' | 'currency' | 'currencyCompactBRL';
  variant?: 'compact' | 'full';
}

interface MiniCardStatsProps {
  items: MiniCardStatItem[];
  className?: string;
  columns?: number;
}

const MiniCardStats: React.FC<MiniCardStatsProps> = ({ items, className, columns = 2 }) => {
  const formatValue = (value: number | string, formatType?: 'number' | 'currency' | 'currencyCompactBRL') => {
    if (typeof value !== 'number') return value;
    switch (formatType) {
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      case 'currencyCompactBRL':
        return formatCompactCurrencyBRL(value);
      case 'number':
        return formatNumberBR(value);
      default:
        return new Intl.NumberFormat('pt-BR').format(value);
    }
  };

  const colorStyles: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100 text-blue-600' },
    green: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', iconBg: 'bg-green-100 text-green-600' },
    purple: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100 text-purple-600' },
    amber: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600' },
    red: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', iconBg: 'bg-red-100 text-red-600' },
    indigo: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100 text-indigo-600' },
    pink: { bg: 'bg-pink-50 border-pink-200', text: 'text-pink-700', iconBg: 'bg-pink-100 text-pink-600' },
  };

  const gridColsClass = `md:grid-cols-${Math.min(columns, 6)}`;

  return (
    <div className={cn('grid gap-4', `grid-cols-1 sm:grid-cols-2 ${gridColsClass}`, className)}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const styles = item.color ? colorStyles[item.color] : undefined;

        return (
          <Card key={index} className={cn("transition-all hover:shadow-md", styles?.bg)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
              {Icon && (
                <div className={cn("p-2 rounded-full", styles?.iconBg || "bg-secondary text-secondary-foreground")}>
                  <Icon className="h-4 w-4" />
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", styles?.text)}>
                {formatValue(item.value, item.formatType)}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MiniCardStats;



