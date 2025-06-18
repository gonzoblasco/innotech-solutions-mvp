import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function truncateText(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function getTimeAgo(date: string | Date) {
  const now = new Date()
  const past = new Date(date)
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'Hace un momento'
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Hace ${diffInHours} horas`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `Hace ${diffInDays} días`
  
  return formatDate(date)
}