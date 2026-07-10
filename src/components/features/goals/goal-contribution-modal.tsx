// components/features/goals/goal-contibution-modal.tsx
'use client'

import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { addGoalContribution } from '@/actions/goal'
import { formatRupiah } from '@/lib/format'
import type { GoalWithProgress } from '@/types'

export default function GoalContributionModal({
    goal, onClose, onSaved,
}: {
    goal: GoalWithProgress
    onClose: () => void
    onSaved: () => void
}) {
    const [amount, setAmount] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        const numeric = Number(amount)
        if (!numeric || numeric <= 0) return setError('Nominal harus lebih dari 0')

            setIsSubmitting(true)
            const result = await addGoalContribution(goal.id, numeric)
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
        <div className="relative w-full sm:max-w-sm bg-white sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: goal.color }} />

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold text-zinc-900">Tambah Tabungan</h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
        <X className="w-4 h-4" />
        </button>
        </div>

        <form onSubmit={handleSubmit}>
        <div className="px-5 py-5 space-y-4">
        <p className="text-sm text-zinc-500">
        Menambah tabungan untuk <span className="font-semibold text-zinc-800">{goal.name}</span>
        </p>
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Nominal</label>
        <div className="relative flex items-center border-b-2 border-zinc-100 focus-within:border-zinc-900 transition-colors pb-2">
        <span className="text-2xl font-light text-zinc-300 mr-2">Rp</span>
        <input
        type="text"
        inputMode="numeric"
        autoFocus
        value={amount ? Number(amount).toLocaleString('id-ID') : ''}
        onChange={e => setAmount(e.target.value.replace(/\D/g, ''))}
        placeholder="0"
        className="flex-1 text-2xl font-semibold text-zinc-900 placeholder:text-zinc-200 border-0 outline-none bg-transparent"
        />
        </div>
        </div>
        <p className="text-xs text-zinc-400">
        Progress saat ini: {formatRupiah(goal.progress_amount)} dari {formatRupiah(goal.target_amount)}
        </p>
        </div>

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
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 bg-zinc-900 hover:bg-zinc-800"
        >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {success && <Check className="w-4 h-4" />}
        {success ? 'Tersimpan!' : isSubmitting ? 'Menyimpan…' : 'Tambah'}
        </button>
        </div>
        </div>
        </form>
        </div>
        </div>
    )
}
