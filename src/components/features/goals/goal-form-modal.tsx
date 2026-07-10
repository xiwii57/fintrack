// components/features/goals/goal-form-mocal.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { createGoal, updateGoal } from '@/actions/goal'
import { formatRupiah } from '@/lib/format'
import { getGoalIcon, GOAL_COLORS } from '@/lib/goal-icons'
import GoalIconPicker from './goal-icon-picker'
import type { GoalWithProgress, AccountWithBalance } from '@/types'

export default function GoalFormModal({
    goal, accounts, onClose, onSaved,
}: {
    goal: GoalWithProgress | null
    accounts: AccountWithBalance[]
    onClose: () => void
    onSaved: () => void
}) {
    const [name, setName] = useState(goal?.name ?? '')
    const [targetAmount, setTargetAmount] = useState(goal ? String(goal.target_amount) : '')
    const [currentAmount, setCurrentAmount] = useState(
        goal && !goal.account_id ? String(goal.progress_amount) : ''
    )
    const [deadline, setDeadline] = useState(goal?.deadline ?? '')
    const [icon, setIcon] = useState(goal?.icon ?? 'target')
    const [color, setColor] = useState(goal?.color ?? '#6366f1')
    const [mode, setMode] = useState<'manual' | 'account'>(goal?.account_id ? 'account' : 'manual')
    const [accountId, setAccountId] = useState(goal?.account_id ?? accounts[0]?.id ?? '')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const SelectedIcon = getGoalIcon(icon)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    function handleNumericChange(setter: (v: string) => void) {
        return (e: React.ChangeEvent<HTMLInputElement>) => setter(e.target.value.replace(/\D/g, ''))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        if (!name.trim()) return setError('Nama goal wajib diisi')
            const target = Number(targetAmount)
            if (!target || target <= 0) return setError('Target nominal harus lebih dari 0')
                if (mode === 'account' && !accountId) return setError('Pilih dompet terlebih dahulu')

                    const formData = new FormData()
                    formData.set('name', name.trim())
                        formData.set('target_amount', targetAmount)
                            formData.set('icon', icon)
                                formData.set('color', color)
                                    if (deadline) formData.set('deadline', deadline)
                                        if (mode === 'account') {
                                            formData.set('account_id', accountId)
                                        } else {
                                            formData.set('current_amount', currentAmount || '0')
                                        }

                                        setIsSubmitting(true)
                                        const result = goal
                                        ? await updateGoal(goal.id, formData)
                                        : await createGoal(formData)
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
        <div className="h-1 w-full transition-colors duration-300" style={{ backgroundColor: color }} />

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold text-zinc-900">
        {goal ? 'Edit Goal' : 'Goal Baru'}
        </h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
        <X className="w-4 h-4" />
        </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* Preview + Name */}
        <div className="flex items-center gap-4">
        <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors duration-200"
        style={{ backgroundColor: color + '20' }}
        >
        <SelectedIcon className="w-6 h-6 transition-colors duration-200" style={{ color }} />
        </div>
        <div className="flex-1">
        <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Nama goal…"
        maxLength={50}
        className="w-full text-lg font-semibold text-zinc-900 placeholder:text-zinc-300 border-0 border-b-2 border-zinc-100 focus:border-zinc-900 outline-none pb-1.5 transition-colors bg-transparent"
        />
        <p className="text-xs text-zinc-400 mt-1.5">Contoh: Dana Darurat, DP Rumah, Liburan…</p>
        </div>
        </div>

        {/* Target amount */}
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Target Nominal</label>
        <div className="relative flex items-center border-b-2 border-zinc-100 focus-within:border-zinc-900 transition-colors pb-2">
        <span className="text-xl font-light text-zinc-300 mr-2">Rp</span>
        <input
        type="text"
        inputMode="numeric"
        value={targetAmount ? Number(targetAmount).toLocaleString('id-ID') : ''}
        onChange={handleNumericChange(setTargetAmount)}
        placeholder="0"
        className="flex-1 text-xl font-semibold text-zinc-900 placeholder:text-zinc-200 border-0 outline-none bg-transparent"
        />
        </div>
        </div>

        {/* Mode toggle */}
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Progress Dihitung Dari</label>
        <div className="grid grid-cols-2 gap-2">
        <button
        type="button"
        onClick={() => setMode('manual')}
        className={`py-3 rounded-xl text-sm font-medium border-2 transition-all ${
            mode === 'manual'
            ? 'border-zinc-900 bg-zinc-50 text-zinc-900'
            : 'border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600'
        }`}
        >
        Input Manual
        </button>
        <button
        type="button"
        onClick={() => setMode('account')}
        disabled={accounts.length === 0}
        className={`py-3 rounded-xl text-sm font-medium border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            mode === 'account'
            ? 'border-zinc-900 bg-zinc-50 text-zinc-900'
            : 'border-zinc-100 text-zinc-400 hover:border-zinc-200 hover:text-zinc-600'
        }`}
        >
        Saldo Dompet
        </button>
        </div>
        {accounts.length === 0 && mode === 'account' && (
            <p className="text-xs text-zinc-400 mt-1.5">Belum ada dompet untuk dihubungkan</p>
        )}
        </div>

        {/* Mode-specific field */}
        {mode === 'manual' ? (
            <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">
            Nominal Terkumpul {goal && !goal.account_id ? '(saat ini)' : '(awal)'}
            </label>
            <div className="relative flex items-center border-b-2 border-zinc-100 focus-within:border-zinc-900 transition-colors pb-2">
            <span className="text-xl font-light text-zinc-300 mr-2">Rp</span>
            <input
            type="text"
            inputMode="numeric"
            value={currentAmount ? Number(currentAmount).toLocaleString('id-ID') : ''}
            onChange={handleNumericChange(setCurrentAmount)}
            placeholder="0"
            className="flex-1 text-xl font-semibold text-zinc-900 placeholder:text-zinc-200 border-0 outline-none bg-transparent"
            />
            </div>
            {goal && !goal.account_id && (
                <p className="text-xs text-zinc-400 mt-1.5">
                Untuk menambah tabungan sedikit-sedikit, gunakan tombol "Tambah" di kartu goal, bukan di sini.
                </p>
            )}
            </div>
        ) : (
            <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Dompet</label>
            <select
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
            >
            {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} · {formatRupiah(acc.balance)}</option>
            ))}
            </select>
            <p className="text-xs text-zinc-400 mt-1.5">Progress otomatis mengikuti saldo dompet ini</p>
            </div>
        )}

        {/* Deadline */}
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Tenggat (Opsional)</label>
        <input
        type="date"
        value={deadline}
        min={new Date().toISOString().slice(0, 10)}
        onChange={e => setDeadline(e.target.value)}
        className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
        />
        </div>

        {/* Icon picker */}
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Ikon</label>
        <GoalIconPicker value={icon} color={color} onChange={setIcon} />
        </div>

        {/* Color */}
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Warna</label>
        <div className="flex flex-wrap gap-2.5">
        {GOAL_COLORS.map(({ value: c, name: cName }) => (
            <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            title={cName}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
            style={{ backgroundColor: c }}
            >
            {color === c && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
            </button>
        ))}
        </div>
        </div>

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
        disabled={isSubmitting || success || !name.trim()}
        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95"
        style={{ backgroundColor: color }}
        >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {success && <Check className="w-4 h-4" />}
        {success ? 'Tersimpan!' : isSubmitting ? 'Menyimpan…' : goal ? 'Simpan' : 'Tambah'}
        </button>
        </div>
        </div>
        </form>
        </div>
        </div>
    )
}
