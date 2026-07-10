// components/features/transaction/transaction-form-modal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { addTransaction, updateTransaction } from '@/actions/transaction'
import { formatRupiah } from '@/lib/format'
import { getCategoryIcon } from '@/components/features/categories/category-form-modal'
import type { TransactionType } from '@/types'

// components/features/transaction/transaction-form-modal.tsx

type Category = { id: string; name: string; color: string; icon: string; type: TransactionType }
type Account = { id: string; name: string; type: string; icon: string; color: string; balance: number }
type Transaction = {
  id: string
  type: TransactionType
  amount: number
  description: string
  date: string
  category_id: string | null
  account_id: string
}
export default function TransactionFormModal({
  categories, accounts, transaction, onClose, onSaved,
}: {
  categories: Category[]
  accounts: Account[]
  transaction: Transaction | null
  onClose: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction?.amount?.toString() ?? '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [date, setDate] = useState(transaction?.date ?? new Date().toISOString().slice(0, 10))
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? '')
  const [accountId, setAccountId] = useState(transaction?.account_id ?? accounts[0]?.id ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const filteredCategories = categories.filter(c => c.type === type)
  const selectedCategory = filteredCategories.find(c => c.id === categoryId)

  useEffect(() => {
    if (categoryId && !filteredCategories.some(c => c.id === categoryId)) setCategoryId('')
  }, [type])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAmount(e.target.value.replace(/\D/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return setError('Nominal harus lebih dari 0')
      if (!description.trim()) return setError('Deskripsi tidak boleh kosong')
        if (!categoryId) return setError('Pilih kategori terlebih dahulu')
          if (!accountId) return setError('Pilih dompet terlebih dahulu')
            if (!date) return setError('Tanggal harus diisi')

              setIsSubmitting(true)
              const payload = { type, amount: numericAmount, description: description.trim(), date, category_id: categoryId, account_id: accountId }
              const result = transaction ? await updateTransaction(transaction.id, payload) : await addTransaction(payload)
              setIsSubmitting(false)

              if (result?.error) { setError(result.error); return }
              setSuccess(true)
              setTimeout(onSaved, 600)
  }

  return (
    <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
    <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">

    {/* Color accent bar — follows type */}
    <div className={`h-1 w-full transition-colors duration-300 ${type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />

    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
    <h2 className="text-base font-semibold text-zinc-900">
    {transaction ? 'Edit Transaksi' : 'Transaksi Baru'}
    </h2>
    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
    <X className="w-4 h-4" />
    </button>
    </div>

    <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

    {/* Type toggle */}
    <div className="grid grid-cols-2 gap-2">
    {(['expense', 'income'] as TransactionType[]).map(t => (
      <button
      key={t}
      type="button"
      onClick={() => setType(t)}
      className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
        type === t
        ? t === 'expense'
        ? 'border-red-500 bg-red-50 text-red-600'
        : 'border-emerald-500 bg-emerald-50 text-emerald-600'
        : 'border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600'
      }`}
      >
      {t === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
      </button>
    ))}
    </div>

    {/* Amount — large display */}
    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Nominal</label>
    <div className="relative flex items-center border-b-2 border-zinc-100 focus-within:border-zinc-900 transition-colors pb-2">
    <span className="text-2xl font-light text-zinc-300 mr-2">Rp</span>
    <input
    type="text"
    inputMode="numeric"
    value={amount ? Number(amount).toLocaleString('id-ID') : ''}
    onChange={handleAmountChange}
    placeholder="0"
    className="flex-1 text-2xl font-semibold text-zinc-900 placeholder:text-zinc-200 border-0 outline-none bg-transparent"
    />
    </div>
    {amount && Number(amount) > 0 && (
      <p className="text-xs text-zinc-400 mt-1.5">{formatRupiah(Number(amount))}</p>
    )}
    </div>

    {/* Description */}
    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Deskripsi</label>
    <input
    type="text"
    value={description}
    onChange={e => setDescription(e.target.value)}
    placeholder="Contoh: Makan siang, Gaji bulan ini…"
    maxLength={100}
    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
    />
    </div>

    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Dompet</label>
    {accounts.length === 0 ? (
      <p className="text-sm text-zinc-400 py-2">
      Belum ada dompet. <a href="/accounts" className="text-zinc-600 underline">Buat sekarang</a>
      </p>
    ) : (
      <select
      value={accountId}
      onChange={e => setAccountId(e.target.value)}
      className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
      >
      {accounts.map(acc => (
        <option key={acc.id} value={acc.id}>{acc.name} · {formatRupiah(acc.balance)}</option>
      ))}
      </select>
    )}
    </div>

    {/* Category — visual picker */}
    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Kategori</label>
    {filteredCategories.length === 0 ? (
      <p className="text-sm text-zinc-400 py-2">
      Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}.{' '}
      <a href="/categories" className="text-zinc-600 underline">Buat sekarang</a>
      </p>
    ) : (
      <div className="grid grid-cols-3 gap-1.5">
      {filteredCategories.map(cat => {
        const Icon = getCategoryIcon(cat.icon)
        const isSelected = categoryId === cat.id
        return (
          <button
          key={cat.id}
          type="button"
          onClick={() => setCategoryId(cat.id)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left transition-all ${
            isSelected ? 'border-current' : 'border-zinc-100 hover:border-zinc-200'
          }`}
          style={isSelected ? { borderColor: cat.color, backgroundColor: cat.color + '10' } : {}}
          >
          <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cat.color + '20' }}
          >
          <Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
          </div>
          <span className="text-xs font-medium text-zinc-700 truncate">{cat.name}</span>
          </button>
        )
      })}
      </div>
    )}
    </div>

    {/* Date */}
    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Tanggal</label>
    <input
    type="date"
    value={date}
    max={new Date().toISOString().slice(0, 10)}
    onChange={e => setDate(e.target.value)}
    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
    />
    </div>

    </div>

    {/* Footer */}
    <div className="px-5 py-4 border-t border-zinc-100 space-y-3">
    {error && (
      <p className="text-sm text-red-500 bg-red-50 px-3 py-2.5 rounded-xl">{error}</p>
    )}
    <div className="flex gap-2.5">
    <button type="button" onClick={onClose}
    className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors">
    Batal
    </button>
    <button
    type="submit"
    disabled={isSubmitting || success}
    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 ${
      type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-zinc-900 hover:bg-zinc-800'
    }`}
    >
    {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
    {success && <Check className="w-4 h-4" />}
    {success ? 'Tersimpan!' : isSubmitting ? 'Menyimpan…' : transaction ? 'Simpan' : 'Tambah'}
    </button>
    </div>
    </div>
    </form>
    </div>
    </div>
  )
}
