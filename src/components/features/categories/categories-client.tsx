// features/categories/categories-client.tsx
'use client'

import { useState, useTransition } from 'react'
import { Category } from '@/types'
import { deleteCategory } from '@/actions/category'
import CategoryFormModal, { getCategoryIcon, CATEGORY_COLORS } from './category-form-modal'
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from 'lucide-react'

interface Props {
  categories: Category[]
}

type Filter = 'all' | 'income' | 'expense'

function getColorName(hex: string) {
  return CATEGORY_COLORS.find(c => c.value === hex)?.name ?? hex
}

export default function CategoriesClient({ categories }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | undefined>()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [isPending, startTransition] = useTransition()

  const income = categories.filter(c => c.type === 'income')
  const expense = categories.filter(c => c.type === 'expense')
  const filtered = filter === 'all' ? categories : categories.filter(c => c.type === filter)

  function openAdd() {
    setEditTarget(undefined)
    setShowModal(true)
  }

  function openEdit(cat: Category) {
    setEditTarget(cat)
    setShowModal(true)
  }

  function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini? Transaksi yang terkait tidak akan terhapus.')) return
      setDeletingId(id)
      startTransition(async () => {
        try {
          await deleteCategory(id)
        } catch (err) {
          alert(err instanceof Error ? err.message : 'Gagal menghapus')
        } finally {
          setDeletingId(null)
        }
      })
  }

  return (
    <>
    {/* Page header */}
    <div className="border-b border-zinc-200 bg-white px-6 py-5">
    <div className="flex items-start justify-between gap-4">
    <div>
    <h1 className="text-xl font-semibold text-zinc-900">Kategori</h1>
    <p className="text-sm text-zinc-500 mt-0.5">
    {categories.length} kategori — {income.length} pemasukan, {expense.length} pengeluaran
    </p>
    </div>
    <button
    onClick={openAdd}
    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
    >
    <Plus className="w-4 h-4" />
    Tambah
    </button>
    </div>

    {/* Filter tabs */}
    <div className="flex gap-1 mt-4 bg-zinc-100 rounded-lg p-1 w-fit">
    {(['all', 'expense', 'income'] as Filter[]).map(f => (
      <button
      key={f}
      onClick={() => setFilter(f)}
      className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
        filter === f
        ? 'bg-white text-zinc-900 shadow-sm'
        : 'text-zinc-500 hover:text-zinc-700'
      }`}
      >
      {f === 'all' ? 'Semua' : f === 'income' ? 'Pemasukan' : 'Pengeluaran'}
      </button>
    ))}
    </div>
    </div>

    <div className="p-6">
    {/* Empty state */}
    {filtered.length === 0 && (
      <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
      <FolderOpen className="w-6 h-6 text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-600 mb-1">Belum ada kategori</p>
      <p className="text-xs text-zinc-400 mb-5">
      {filter === 'all'
        ? 'Buat kategori untuk mengatur transaksimu'
    : `Belum ada kategori ${filter === 'income' ? 'pemasukan' : 'pengeluaran'}`}
    </p>
    <button
    onClick={openAdd}
    className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
    >
    <Plus className="w-4 h-4" />
    Buat Kategori
    </button>
    </div>
    )}

    {/* Category grid */}
    {filtered.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {filtered.map(cat => {
        const Icon = getCategoryIcon(cat.icon)
        const isDeleting = deletingId === cat.id

        return (
          <div
          key={cat.id}
          className="group relative bg-white border border-zinc-200 rounded-2xl p-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-150"
          >
          <div className="flex items-center gap-3">
          {/* Icon */}
          <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cat.color + '15' }}
          >
          <Icon className="w-5 h-5" style={{ color: cat.color }} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{cat.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
          <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: cat.color }}
          />
          <span className="text-xs text-zinc-400">
          {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
          </span>
          </div>
          </div>

          {/* Actions */}
          <div className="flex gap-0.5">
          <button
          onClick={() => openEdit(cat)}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          title="Edit"
          >
          <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
          onClick={() => handleDelete(cat.id)}
          disabled={isDeleting || isPending}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
          title="Hapus"
          >
          {isDeleting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Trash2 className="w-3.5 h-3.5" />
          }
          </button>
          </div>
          </div>
          </div>
        )
      })}

      {/* Add card shortcut */}
      <button
      onClick={openAdd}
      className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 flex items-center justify-center gap-2 text-sm text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 hover:bg-zinc-50 transition-all"
      >
      <Plus className="w-4 h-4" />
      Tambah kategori
      </button>
      </div>
    )}
    </div>

    {showModal && (
      <CategoryFormModal
      category={editTarget}
      onClose={() => setShowModal(false)}
      />
    )}
    </>
  )
}
