
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

export function formatDate(dateValue: any): string {
  if (!dateValue) return 'N/A';
  
  try {
    if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
      const date = new Date(dateValue.seconds * 1000);
      return date.toLocaleDateString('pt-BR');
    }
    
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString('pt-BR');
    }
    
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? dateValue : date.toLocaleDateString('pt-BR');
    }
    
    if (dateValue && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString('pt-BR');
    }
    
    return String(dateValue);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return 'Data inválida';
  }
}

export function formatMonth(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[month - 1] || `Mês ${month}`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  
  const digitsOnly = cnpj.replace(/\D/g, '');
  
  if (digitsOnly.length === 14) {
    return digitsOnly.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  return cnpj; // Return original if not 14 digits
}

export function getRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'há poucos segundos';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  if (diffInSeconds < 31536000) return `há ${Math.floor(diffInSeconds / 2592000)} meses`;
  
  return `há ${Math.floor(diffInSeconds / 31536000)} anos`;
}

export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();
}

export function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function getGrowthColor(percentage: number): string {
  if (percentage > 10) return 'text-red-600'; // High growth (potentially suspicious)
  if (percentage > 0) return 'text-green-600'; // Positive growth
  if (percentage < -10) return 'text-red-600'; // High decrease
  return 'text-gray-600'; // Stable or small changes
}