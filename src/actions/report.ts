// src/actions/report.ts
'use server'

import { createClient, getUser } from '@/lib/supabase/server'

export type ReportTransaction = {
  id: string
  type: 'income' | 'expense'
  amount: number
  description: string
  date: string
  category: { id: string; name: string; color: string; icon: string } | null
}

export type MonthlyTrend = {
  month: string
  label: string
  income: number
  expense: number
  balance: number
}

export type CategoryBreakdown = {
  id: string
  name: string
  color: string
  icon: string
  total: number
  count: number
  percentage: number
}

export type ReportData = {
  transactions: ReportTransaction[]
  monthlyTrend: MonthlyTrend[]
  incomeByCategory: CategoryBreakdown[]
  expenseByCategory: CategoryBreakdown[]
  totalIncome: number
  totalExpense: number
  balance: number
  avgMonthlyIncome: number
  avgMonthlyExpense: number
  period: { start: string; end: string }
}

export async function getReportData(
  startDate: string,
  endDate: string
): Promise<{ data: ReportData | null; error: string | null }> {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthenticated' }
  const supabase = await createClient()

  const { data: transactions, error } = await supabase
  .from('transactions')
  .select(`
  id, type, amount, description, date,
  category:categories(id, name, color, icon)
  `)
  .eq('user_id', user.id)
  .gte('date', startDate)
  .lte('date', endDate)
  .order('date', { ascending: false })

  if (error) return { data: null, error: error.message }

  const txs: ReportTransaction[] = (transactions ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
                                                                    description: t.description,
                                                                    date: t.date,
                                                                    category: Array.isArray(t.category) ? (t.category[0] ?? null) : t.category,
  }))

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const monthMap = new Map<string, { income: number; expense: number }>()
  for (const t of txs) {
    const key = t.date.slice(0, 7)
    if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 })
      const m = monthMap.get(key)!
      if (t.type === 'income') m.income += t.amount
        else m.expense += t.amount
  }
  const monthlyTrend: MonthlyTrend[] = Array.from(monthMap.entries())
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([key, val]) => {
    const [year, month] = key.split('-')
    const label = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    return {
      month: key,
      label,
      income: val.income,
      expense: val.expense,
      balance: val.income - val.expense,
    }
  })

  const monthCount = monthlyTrend.length || 1
  const avgMonthlyIncome = totalIncome / monthCount
  const avgMonthlyExpense = totalExpense / monthCount

  function buildBreakdown(type: 'income' | 'expense'): CategoryBreakdown[] {
    const filtered = txs.filter(t => t.type === type)
    const total = filtered.reduce((s, t) => s + t.amount, 0)
    const map = new Map<string, CategoryBreakdown>()
    for (const t of filtered) {
      const key = t.category?.id ?? '__none__'
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: t.category?.name ?? 'Tanpa kategori',
          color: t.category?.color ?? '#94a3b8',
          icon: t.category?.icon ?? 'circle',
          total: 0,
          count: 0,
          percentage: 0,
        })
      }
      const c = map.get(key)!
      c.total += t.amount
      c.count += 1
    }
    return Array.from(map.values())
    .map(c => ({ ...c, percentage: total > 0 ? (c.total / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
  }

  return {
    data: {
      transactions: txs,
      monthlyTrend,
      incomeByCategory: buildBreakdown('income'),
      expenseByCategory: buildBreakdown('expense'),
      totalIncome,
      totalExpense,
      balance,
      avgMonthlyIncome,
      avgMonthlyExpense,
      period: { start: startDate, end: endDate },
    },
    error: null,
  }
}
