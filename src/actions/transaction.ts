// actions/transactions.ts
'use server'

import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TransactionType } from '@/types'

// ── Helper: pastikan category_id & account_id benar milik user yang login ──
async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: 'categories' | 'accounts',
  id: string,
  userId: string
) {
  const { data } = await supabase.from(table).select('id').eq('id', id).eq('user_id', userId).single()
  return !!data
}

type TransactionFormData = {
  type: TransactionType
  amount: number
  description: string
  category_id: string
  account_id: string
  date: string
}

function validateTransactionInput(f: TransactionFormData): string | null {
  if (!f.amount || f.amount <= 0) return 'Nominal harus lebih dari 0'
    if (!f.description.trim()) return 'Deskripsi tidak boleh kosong'
      if (!f.category_id) return 'Pilih kategori terlebih dahulu'
        if (!f.account_id) return 'Pilih dompet terlebih dahulu'
          if (!f.date) return 'Tanggal harus diisi'
            return null
}

// Supabase balikin relasi FK sebagai array; ini dipakai berulang jadi di-satukan
function unwrapRelation<T>(rel: T | T[] | null): T | null {
  return Array.isArray(rel) ? (rel[0] ?? null) : rel
}

export async function getTransactions(filter?: {
  type?: TransactionType | 'all'
category_id?: string
account_id?: string
date_from?: string
date_to?: string
search?: string
}) {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const supabase = await createClient()

  let query = supabase
  .from('transactions')
  .select(`*, category:categories(id, name, icon, color, type), account:accounts(id, name, icon, color, type)`)
  .eq('user_id', user.id)
  .order('date', { ascending: false })
  .order('created_at', { ascending: false })

  if (filter?.type && filter.type !== 'all') query = query.eq('type', filter.type)
    if (filter?.category_id) query = query.eq('category_id', filter.category_id)
      if (filter?.account_id) query = query.eq('account_id', filter.account_id)
        if (filter?.date_from) query = query.gte('date', filter.date_from)
          if (filter?.date_to) query = query.lte('date', filter.date_to)
            if (filter?.search) query = query.ilike('description', `%${filter.search}%`)

              const { data, error } = await query
              if (error) return { data: null, error: error.message }

              const normalized = (data ?? []).map((t) => ({
                ...t,
                amount: Number(t.amount),
                                                          category: unwrapRelation(t.category),
                                                          account: unwrapRelation(t.account),
              }))

              return { data: normalized, error: null }
}

export async function getMonthlySummary() {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const supabase = await createClient()

  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data, error } = await supabase
  .from('transactions')
  .select('type, amount, date')
  .eq('user_id', user.id)
  .gte('date', from)
  .lte('date', to)

  if (error) return { data: null, error: error.message }

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    return { key, label, income: 0, expense: 0 }
  })

  for (const t of data ?? []) {
    const month = months.find((m) => m.key === t.date.slice(0, 7))
    if (!month) continue
      if (t.type === 'income') month.income += Number(t.amount)
        else month.expense += Number(t.amount)
  }

  return {
    data: months.map(({ label, income, expense }) => ({ month: label, income, expense, balance: income - expense })),
    error: null,
  }
}

// ── Total saldo sekarang dari get_accounts_with_balance (aman, sudah
// ── dikunci ke auth.uid() di dalam RPC), BUKAN dari get_total_balance
// ── lama yang terima p_user_id dari client (rawan IDOR).
export async function getDashboardData() {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const supabase = await createClient()

  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const [{ data: allTx, error: e1 }, { data: recentTx, error: e2 }, { data: accounts, error: e3 }] = await Promise.all([
    supabase
    .from('transactions')
    .select('type, amount, date, category:categories(name, color)')
    .eq('user_id', user.id)
    .gte('date', sixMonthsAgo)
    .lte('date', monthEnd),
                                                                                                                       supabase
                                                                                                                       .from('transactions')
                                                                                                                       .select('*, category:categories(id, name, icon, color, type), account:accounts(id, name, icon, color, type)')
                                                                                                                       .eq('user_id', user.id)
                                                                                                                       .order('date', { ascending: false })
                                                                                                                       .order('created_at', { ascending: false })
                                                                                                                       .limit(5),
                                                                                                                       supabase.rpc('get_accounts_with_balance'), // no param — RPC kunci sendiri ke auth.uid()
  ])

  if (e1 || e2 || e3) return { data: null, error: (e1 ?? e2 ?? e3)!.message }

  const thisMonth = (allTx ?? []).filter((t) => t.date >= monthStart)
  const income = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

  const catMap = new Map<string, { name: string; color: string; amount: number }>()
  for (const t of thisMonth) {
    const cat = unwrapRelation(t.category)
    if (!cat) continue
      const existing = catMap.get(cat.name)
      if (existing) existing.amount += Number(t.amount)
        else catMap.set(cat.name, { name: cat.name, color: cat.color, amount: Number(t.amount) })
  }
  const categoryBreakdown = Array.from(catMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5)

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    return { key, label, income: 0, expense: 0 }
  })

  for (const t of allTx ?? []) {
    const m = months.find((x) => x.key === t.date.slice(0, 7))
    if (!m) continue
      if (t.type === 'income') m.income += Number(t.amount)
        else m.expense += Number(t.amount)
  }

  const totalBalance = (accounts ?? []).reduce((s, a) => s + Number(a.balance), 0)

  return {
    data: {
      stats: { income, expense, balance: income - expense, categoryBreakdown },
      totalBalance,
      accounts: accounts ?? [],
      monthly: months.map(({ label, income, expense }) => ({ month: label, income, expense, balance: income - expense })),
      recentTransactions: recentTx ?? [],
    },
    error: null,
  }
}

export async function getCurrentMonthStats() {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const supabase = await createClient()

  const now = new Date()
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const { data } = await supabase
  .from('transactions')
  .select('type, amount, category:categories(name, color)')
  .eq('user_id', user.id)
  .gte('date', from)
  .lte('date', to)

  const income = data?.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0) ?? 0
  const expense = data?.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0) ?? 0

  const categoryMap = new Map<string, { name: string; color: string; amount: number }>()
  data?.forEach((t) => {
    const cat = unwrapRelation(t.category)
    if (!cat) return
      const existing = categoryMap.get(cat.name)
      if (existing) existing.amount += Number(t.amount)
        else categoryMap.set(cat.name, { name: cat.name, color: cat.color, amount: Number(t.amount) })
  })

  return {
    data: {
      income, expense, balance: income - expense,
      categoryBreakdown: Array.from(categoryMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5),
    },
    error: null,
  }
}

export async function addTransaction(formData: TransactionFormData) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabase = await createClient()

  const validationError = validateTransactionInput(formData)
  if (validationError) return { error: validationError }

  const [categoryOk, accountOk] = await Promise.all([
    verifyOwnership(supabase, 'categories', formData.category_id, user.id),
                                                    verifyOwnership(supabase, 'accounts', formData.account_id, user.id),
  ])
  if (!categoryOk) return { error: 'Kategori tidak valid' }
  if (!accountOk) return { error: 'Dompet tidak valid' }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    type: formData.type,
    amount: formData.amount,
    description: formData.description.trim(),
                                                               category_id: formData.category_id,
                                                               account_id: formData.account_id,
                                                               date: formData.date,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { error: null }
}

export async function updateTransaction(id: string, formData: TransactionFormData) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabase = await createClient()

  const validationError = validateTransactionInput(formData)
  if (validationError) return { error: validationError }

  const [categoryOk, accountOk] = await Promise.all([
    verifyOwnership(supabase, 'categories', formData.category_id, user.id),
                                                    verifyOwnership(supabase, 'accounts', formData.account_id, user.id),
  ])
  if (!categoryOk) return { error: 'Kategori tidak valid' }
  if (!accountOk) return { error: 'Dompet tidak valid' }

  const { error } = await supabase
  .from('transactions')
  .update({
    type: formData.type,
    amount: formData.amount,
    description: formData.description.trim(),
          category_id: formData.category_id,
          account_id: formData.account_id,
          date: formData.date,
  })
  .eq('id', id)
  .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { error: null }
}

export async function deleteTransaction(id: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabase = await createClient()

  const { data: existing } = await supabase
  .from('transactions')
  .select('id')
  .eq('id', id)
  .eq('user_id', user.id)
  .single()

  if (!existing) return { error: 'Transaksi tidak ditemukan' }

  const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return { error: null }
}

export async function getCategories(type?: TransactionType) {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const supabase = await createClient()

  let query = supabase.from('categories').select('*').eq('user_id', user.id).order('name')
  if (type) query = query.eq('type', type)

    const { data, error } = await query
    return { data, error: error?.message ?? null }
}
