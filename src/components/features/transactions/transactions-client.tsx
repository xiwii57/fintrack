// components/features/transaction/transaction-client.tsx
'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Pencil, Trash2, Loader2,
  ArrowDownLeft, ArrowUpRight, SlidersHorizontal, X, Receipt,
  TrendingUp, TrendingDown, Scale,
} from 'lucide-react'
import { formatRupiah } from '@/lib/format'
import { deleteTransaction } from '@/actions/transaction'
import { getCategoryIcon } from '@/components/features/categories/category-form-modal'
import type { TransactionType } from '@/types'
import TransactionFormModal from './transaction-form-modal'

type Account = { id: string; name: string; type: string; icon: string; color: string; balance: number }
type Category = { id: string; name: string; color: string; icon: string; type: TransactionType }
type Transaction = {
  id: string; type: TransactionType; amount: number
  description: string; date: string
  category_id: string | null; category: Category | null
  account_id: string; account: Account | null
}

function groupByDate(transactions: Transaction[]) {
  const map = new Map<string, Transaction[]>()
  for (const t of transactions) {
    if (!map.has(t.date)) map.set(t.date, [])
      map.get(t.date)!.push(t)
  }
  return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
}

function formatGroupDate(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (date.getTime() === today.getTime()) return 'Hari ini'
    if (date.getTime() === yesterday.getTime()) return 'Kemarin'
      return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TransactionsClient({
  initialTransactions, categories, accounts,
}: {
  initialTransactions: Transaction[]
  categories: Category[]
  accounts: Account[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [accountFilter, setAccountFilter] = useState('all')

  const filtered = useMemo(() => initialTransactions.filter(t => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) return false
        if (accountFilter !== 'all' && t.account_id !== accountFilter) return false
          if (startDate && t.date < startDate) return false
            if (endDate && t.date > endDate) return false
              if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
                return true
  }), [initialTransactions, typeFilter, categoryFilter, accountFilter, startDate, endDate, search])


  const grouped = useMemo(() => groupByDate(filtered), [filtered])
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense
  const hasActiveFilters = typeFilter !== 'all' || categoryFilter !== 'all' || accountFilter !== 'all' || !!startDate || !!endDate
  const activeFilterCount = [typeFilter !== 'all', categoryFilter !== 'all', accountFilter !== 'all', !!startDate, !!endDate].filter(Boolean).length

  function clearFilters() {
    setTypeFilter('all'); setCategoryFilter('all'); setAccountFilter('all'); setStartDate(''); setEndDate('')
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus transaksi ini?')) return
      setDeletingId(id)
      startTransition(async () => {
        const result = await deleteTransaction(id)
        if (result?.error) { alert(result.error); setDeletingId(null); return }
        router.refresh()
        setDeletingId(null)
      })
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">

    {/* ── TOP HEADER ── */}
    <div className="bg-white border-b border-gray-100 px-6 pt-6 pb-4 space-y-5">
    {/* Title row */}
    <div className="flex items-start justify-between">
    <div>
    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Transaksi</h1>
    <p className="text-sm text-gray-400 mt-0.5">
    {initialTransactions.length} transaksi tercatat
    </p>
    </div>
    <button
    onClick={() => setIsAddOpen(true)}
    className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all"
    >
    <Plus className="w-4 h-4" />
    Tambah
    </button>
    </div>

    {/* Summary cards */}
    {filtered.length > 0 && (
      <div className="grid grid-cols-3 gap-3">
      {/* Pemasukan */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-2">
      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
      </div>
      <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Masuk</span>
      </div>
      <p className="text-base font-bold text-emerald-700 leading-none">{formatRupiah(totalIncome)}</p>
      </div>

      {/* Pengeluaran */}
      <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-2">
      <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
      </div>
      <span className="text-[11px] font-semibold text-red-500 uppercase tracking-wide">Keluar</span>
      </div>
      <p className="text-base font-bold text-red-600 leading-none">{formatRupiah(totalExpense)}</p>
      </div>

      {/* Selisih */}
      <div className={`rounded-2xl border px-4 py-3.5 ${balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
      <div className="flex items-center gap-1.5 mb-2">
      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${balance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
      <Scale className={`w-3.5 h-3.5 ${balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`} />
      </div>
      <span className={`text-[11px] font-semibold uppercase tracking-wide ${balance >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>Selisih</span>
      </div>
      <p className={`text-base font-bold leading-none ${balance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
      {balance < 0 ? '-' : ''}{formatRupiah(Math.abs(balance))}
      </p>
      </div>
      </div>
    )}

    {/* Search + filter */}
    <div className="flex gap-2">
    <div className="relative flex-1">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
    <input
    value={search}
    onChange={e => setSearch(e.target.value)}
    placeholder="Cari transaksi…"
    className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-gray-400 transition"
    />
    {search && (
      <button
      onClick={() => setSearch('')}
      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
      >
      <X className="w-3 h-3 text-gray-500" />
      </button>
    )}
    </div>
    <button
    onClick={() => setShowFilters(v => !v)}
    className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
      hasActiveFilters
      ? 'border-indigo-500 bg-indigo-600 text-white shadow-sm shadow-indigo-200'
      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
    }`}
    >
    <SlidersHorizontal className="w-4 h-4" />
    Filter
    {hasActiveFilters && (
      <span className="w-5 h-5 rounded-full bg-white text-indigo-600 text-[10px] font-bold flex items-center justify-center">
      {activeFilterCount}
      </span>
    )}
    </button>
    </div>

    {/* Filter panel */}
    {showFilters && (
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
      <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Tipe</label>
      <select
      value={typeFilter}
      onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
      <option value="all">Semua</option>
      <option value="income">Pemasukan</option>
      <option value="expense">Pengeluaran</option>
      </select>
      </div>
      <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Kategori</label>
      <select
      value={categoryFilter}
      onChange={e => setCategoryFilter(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
      <option value="all">Semua</option>
      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      </div>
      <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Dari tanggal</label>
      <input
      type="date" value={startDate}
      onChange={e => setStartDate(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      </div>
      <div className="space-y-1">
      <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Sampai tanggal</label>
      <input
      type="date" value={endDate}
      onChange={e => setEndDate(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      </div>
      </div>
      {hasActiveFilters && (
        <button
        onClick={clearFilters}
        className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
        >
        <X className="w-3 h-3" />
        Hapus semua filter
        </button>
      )}
      </div>
    )}
    </div>

    {/* ── TRANSACTION LIST ── */}
    <div className="flex-1 overflow-auto px-6 py-5">
    {filtered.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-5">
      <Receipt className="w-7 h-7 text-gray-300" />
      </div>
      <p className="text-base font-semibold text-gray-700 mb-1.5">
      {search || hasActiveFilters ? 'Tidak ada hasil' : 'Belum ada transaksi'}
      </p>
      <p className="text-sm text-gray-400 mb-6 max-w-[220px]">
      {search || hasActiveFilters
        ? 'Coba ubah filter atau kata kunci pencarian'
    : 'Mulai catat pemasukan atau pengeluaranmu sekarang'}
    </p>
    {!search && !hasActiveFilters && (
      <button
      onClick={() => setIsAddOpen(true)}
      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-200 transition-all"
      >
      <Plus className="w-4 h-4" />
      Tambah Transaksi
      </button>
    )}
    </div>
    ) : (
      <div className="space-y-7">
      {grouped.map(([date, items]) => {
        const dayIncome = items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

        return (
          <div key={date}>
          {/* Date group header */}
          <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {formatGroupDate(date)}
          </span>
          <div className="flex items-center gap-3 text-xs font-semibold">
          {dayIncome > 0 && (
            <span className="flex items-center gap-1 text-emerald-500">
            <ArrowDownLeft className="w-3 h-3" />
            {formatRupiah(dayIncome)}
            </span>
          )}
          {dayExpense > 0 && (
            <span className="flex items-center gap-1 text-red-400">
            <ArrowUpRight className="w-3 h-3" />
            {formatRupiah(dayExpense)}
            </span>
          )}
          </div>
          </div>

          {/* Transaction cards */}
          <div className="space-y-2">
          {items.map(t => {
            const Icon = t.category ? getCategoryIcon(t.category.icon) : Receipt
            const isDeleting = deletingId === t.id
            const categoryColor = t.category?.color ?? '#94a3b8'

          return (
            <div
            key={t.id}
            className={`group flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100 transition-all duration-200 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
            >
            {/* Category icon */}
            <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: categoryColor + '18' }}
            >
            <Icon className="w-[18px] h-[18px]" style={{ color: categoryColor }} />
            </div>

            {/* Info — min-w-0 penting agar truncate bekerja */}
            <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate leading-snug">
            {t.description || '—'}
            </p>
            <span
            className="inline-flex items-center mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold"
            style={{ backgroundColor: categoryColor + '15', color: categoryColor }}
            >
            {t.category?.name ?? 'Tanpa kategori'}
            </span>
            </div>

            {/* Amount — flex-shrink-0 + max-w agar tidak melar */}
            <div className="flex flex-col items-end flex-shrink-0 max-w-[110px]">
            <span className={`text-sm font-bold tabular-nums leading-snug ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
            {t.type === 'income' ? '+' : '−'}{formatRupiah(t.amount)}
            </span>
            <span className={`text-[10px] font-medium mt-0.5 ${t.type === 'income' ? 'text-emerald-400' : 'text-red-300'}`}>
            {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
            </span>
            </div>

            {/* Actions — hanya muncul saat hover (desktop), selalu visible di mobile */}
            <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-0 max-[640px]:opacity-100 transition-opacity">
            <button
            onClick={() => setEditing(t)}
            title="Edit"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            >
            <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
            onClick={() => handleDelete(t.id)}
            disabled={isPending}
            title="Hapus"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
            >
            {isDeleting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Trash2 className="w-3.5 h-3.5" />
            }
            </button>
            </div>
            </div>
          )
          })}
          </div>
          </div>
        )
      })}
      </div>
    )}
    </div>

    {(isAddOpen || editing) && (
      <TransactionFormModal
      categories={categories}
      accounts={accounts}
      transaction={editing}
      onClose={() => { setIsAddOpen(false); setEditing(null) }}
      onSaved={() => { router.refresh(); setIsAddOpen(false); setEditing(null) }}
      />
    )}
    </div>
  )
}
