// src/utils/format.ts
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string, fmt = 'd MMMM yyyy'): string {
  return format(parseISO(dateStr), fmt, { locale: id })
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'd MMM yyyy', { locale: id })
}

export function getMonthYear(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM yyyy', { locale: id })
}

export function getCurrentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}
