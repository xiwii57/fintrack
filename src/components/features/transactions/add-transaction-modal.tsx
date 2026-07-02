// components/features/transactions/add-transaction-modal.tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { addTransaction, getCategories } from '@/actions/transaction'
import { formatRupiah } from '@/lib/format'
import { getCategoryIcon } from '@/components/features/categories/category-form-modal'
import { useRouter } from 'next/navigation'
import type { Category, TransactionType } from '@/types'

export default function AddTransactionModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<TransactionType>('expense')
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    amount: '',
    description: '',
    category_id: '',
    date: new Date().toISOString().slice(0, 10),
  })

  useEffect(() => {
    getCategories(type).then(r => {
      setCategories(r.data ?? [])
      setForm(f => ({ ...f, category_id: '' }))
    })
  }, [type])

  // Tutup dengan Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function handleAmountInput(raw: string) {
    const numeric = raw.replace(/\D/g, '')
    setForm(f => ({ ...f, amount: numeric }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const amount = Number(form.amount)
    if (!amount || amount <= 0) return setError('Nominal harus lebih dari 0')
      if (!form.description.trim()) return setError('Deskripsi tidak boleh kosong')
        if (!form.category_id) return setError('Pilih kategori terlebih dahulu')
          if (!form.date) return setError('Tanggal harus diisi')

            startTransition(async () => {
              const result = await addTransaction({
                type,
                amount,
                description: form.description.trim(),
                                                  category_id: form.category_id,
                                                  date: form.date,
              })
              if (result.error) {
                setError(result.error)
              } else {
                setSuccess(true)
                router.refresh()
                setTimeout(onClose, 600)
              }
            })
  }

  return (
    <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
    <div className="relative w-full sm:max-w-md bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95dvh]">

    {/* Color accent bar — follows type */}
    <div className={`h-1 w-full transition-colors duration-300 ${type === 'income' ? 'bg-emerald-500' : 'bg-red-500'}`} />

    {/* Header */}
    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
    <h2 className="text-base font-semibold text-zinc-900">Transaksi Baru</h2>
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
    value={form.amount ? Number(form.amount).toLocaleString('id-ID') : ''}
    onChange={e => handleAmountInput(e.target.value)}
    placeholder="0"
    className="flex-1 text-2xl font-semibold text-zinc-900 placeholder:text-zinc-200 border-0 outline-none bg-transparent"
    />
    </div>
    {form.amount && Number(form.amount) > 0 && (
      <p className="text-xs text-zinc-400 mt-1.5">{formatRupiah(Number(form.amount))}</p>
    )}
    </div>

    {/* Description */}
    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Deskripsi</label>
    <input
    type="text"
    value={form.description}
    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
    placeholder="Contoh: Makan siang, Gaji bulan ini…"
    maxLength={100}
    className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
    />
    </div>

    {/* Category — visual picker */}
    <div>
    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Kategori</label>
    {categories.length === 0 ? (
      <p className="text-sm text-zinc-400 py-2">
      Belum ada kategori {type === 'income' ? 'pemasukan' : 'pengeluaran'}.{' '}
      <a href="/categories" className="text-zinc-600 underline">Buat sekarang</a>
      </p>
    ) : (
      <div className="grid grid-cols-3 gap-1.5">
      {categories.map(cat => {
        const Icon = getCategoryIcon(cat.icon)
        const isSelected = form.category_id === cat.id
        return (
          <button
          key={cat.id}
          type="button"
          onClick={() => setForm(f => ({ ...f, category_id: cat.id }))}
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
    value={form.date}
    max={new Date().toISOString().slice(0, 10)}
    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
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
    disabled={isPending || success}
    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95 ${
      type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-zinc-900 hover:bg-zinc-800'
    }`}
    >
    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
    {success && <Check className="w-4 h-4" />}
    {success ? 'Tersimpan!' : isPending ? 'Menyimpan…' : 'Tambah'}
    </button>
    </div>
    </div>
    </form>
    </div>
    </div>
  )
}
