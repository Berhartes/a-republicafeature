import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDateBR(date: Date | string | any): string {
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate()
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      return 'Data inválida'
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch (error) {
    return 'Data inválida'
  }
}

export function formatDateFullBR(date: Date | string | any): string {
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate()
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      return 'Data inválida'
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch (error) {
    return 'Data inválida'
  }
}

export function formatDateShortBR(date: Date | string | any): string {
  try {
    let dateObj: Date
    
    if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date && typeof date.toDate === 'function') {
      dateObj = date.toDate()
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      return 'Data inválida'
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Data inválida'
    }
    
    return dateObj.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short'
    })
  } catch (error) {
    return 'Data inválida'
  }
}
