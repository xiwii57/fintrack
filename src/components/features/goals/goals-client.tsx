// components/features/goals/goals-client.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Loader2, Target, Wallet, PiggyBank } from 'lucide-react'
import { deleteGoal } from '@/actions/goal'
import { formatRupiah } from '@/lib/format'
import { getGoalIcon } from '@/lib/goal-icons'
import type { GoalWithProgress, AccountWithBalance } from '@/types'
import GoalFormModal from './goal-form-modal'
import GoalContributionModal from './goal-contribution-modal'

export default function GoalsClient({
    initialGoals,
    accounts,
}: {
    initialGoals: GoalWithProgress[]
    accounts: AccountWithBalance[]
}) {
    const router = useRouter()
    const [editing, setEditing] = useState<GoalWithProgress | null>(null)
    const [contributing, setContributing] = useState<GoalWithProgress | null>(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const totalTarget = initialGoals.reduce((s, g) => s + g.target_amount, 0)
    const totalProgress = initialGoals.reduce((s, g) => s + g.progress_amount, 0)

    function handleDelete(id: string) {
        if (!confirm('Hapus goal ini? Progress yang sudah terkumpul akan hilang.')) return
            setDeletingId(id)
            startTransition(async () => {
                const result = await deleteGoal(id)
                if (result?.error) { alert(result.error); setDeletingId(null); return }
                router.refresh()
                setDeletingId(null)
            })
    }

    function formatDeadline(deadline: string) {
        const d = new Date(deadline)
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / 86400000)

        if (diffDays < 0) return { label: 'Terlewat', overdue: true }
        if (diffDays === 0) return { label: 'Hari ini', overdue: false }
        if (diffDays <= 30) return { label: `${diffDays} hari lagi`, overdue: false }
        return {
            label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            overdue: false,
        }
    }

    return (
        <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white border-b border-gray-100 px-6 pt-6 pb-4 space-y-4">
        <div className="flex items-start justify-between">
        <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Goals</h1>
        <p className="text-sm text-gray-400 mt-0.5">
        {initialGoals.length} goal · {formatRupiah(totalProgress)} / {formatRupiah(totalTarget)} terkumpul
        </p>
        </div>
        <button
        onClick={() => setIsAddOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-all"
        >
        <Plus className="w-4 h-4" />
        Tambah
        </button>
        </div>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
        {initialGoals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mb-5">
            <Target className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-700 mb-1.5">Belum ada goal</p>
            <p className="text-sm text-gray-400 mb-6 max-w-[240px]">
            Buat target tabungan pertamamu — misalnya dana darurat atau DP rumah
            </p>
            <button
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-semibold rounded-xl transition-all"
            >
            <Plus className="w-4 h-4" />
            Tambah Goal
            </button>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {initialGoals.map(goal => {
                const Icon = getGoalIcon(goal.icon)
                const isDeleting = deletingId === goal.id
                const isManual = !goal.account_id
                const deadlineInfo = goal.deadline ? formatDeadline(goal.deadline) : null
                const percent = Math.min(goal.progress_percent, 100)

                return (
                    <div
                    key={goal.id}
                    className={`group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-md hover:shadow-gray-100 transition-all p-4 ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
                    >
                    <div className="flex items-start justify-between mb-3">
                    <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: goal.color + '18' }}
                    >
                    <Icon className="w-[18px] h-[18px]" style={{ color: goal.color }} />
                    </div>
                    <div className="flex gap-0.5">
                    <button
                    onClick={() => setEditing(goal)}
                    title="Edit"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                    >
                    <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                    onClick={() => handleDelete(goal.id)}
                    disabled={isPending}
                    title="Hapus"
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                    </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-800 truncate">{goal.name}</p>

                    <div className="flex items-center gap-1 mb-2">
                    {isManual ? (
                        <span className="text-xs text-gray-400">Manual</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Wallet className="w-3 h-3" />
                        {goal.account_name}
                        </span>
                    )}
                    </div>

                    <p className="text-lg font-bold tabular-nums text-gray-900">
                    {formatRupiah(goal.progress_amount)}
                    <span className="text-sm font-medium text-gray-400"> / {formatRupiah(goal.target_amount)}</span>
                    </p>

                    <div className="mt-2.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${percent}%`, backgroundColor: goal.color }}
                    />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                    <span className="text-xs font-medium text-gray-500">{Math.round(percent)}%</span>
                    {deadlineInfo && (
                        <span className={`text-xs ${deadlineInfo.overdue ? 'text-red-500' : 'text-gray-400'}`}>
                        {deadlineInfo.label}
                        </span>
                    )}
                    </div>

                    {isManual && (
                        <button
                        onClick={() => setContributing(goal)}
                        className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl border border-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                        <PiggyBank className="w-3.5 h-3.5" />
                        Tambah Tabungan
                        </button>
                    )}
                    </div>
                )
            })}
            </div>
        )}
        </div>

        {(isAddOpen || editing) && (
            <GoalFormModal
            goal={editing}
            accounts={accounts}
            onClose={() => { setIsAddOpen(false); setEditing(null) }}
            onSaved={() => { router.refresh(); setIsAddOpen(false); setEditing(null) }}
            />
        )}

        {contributing && (
            <GoalContributionModal
            goal={contributing}
            onClose={() => setContributing(null)}
            onSaved={() => { router.refresh(); setContributing(null) }}
            />
        )}
        </div>
    )
}
