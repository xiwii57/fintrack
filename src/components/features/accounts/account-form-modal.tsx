'use client'

import { useEffect, useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { createAccount, updateAccount } from '@/actions/account'
import { formatRupiah } from '@/lib/format'
import { getAccountIcon, ACCOUNT_COLORS } from '@/lib/account-icons'
import AccountIconPicker from './account-icon-picker'
import type { AccountWithBalance } from '@/types'

export default function AccountFormModal({
    account, onClose, onSaved,
}: {
    account: AccountWithBalance | null
    onClose: () => void
    onSaved: () => void
}) {
    const [name, setName] = useState(account?.name ?? '')
    const [type, setType] = useState(account?.type ?? '')
    const [icon, setIcon] = useState(account?.icon ?? 'wallet')
    const [color, setColor] = useState(account?.color ?? '#6366f1')
    const [openingBalance, setOpeningBalance] = useState(
        account ? String(account.opening_balance) : ''
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    const SelectedIcon = getAccountIcon(icon)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    function handleBalanceChange(e: React.ChangeEvent<HTMLInputElement>) {
        setOpeningBalance(e.target.value.replace(/\D/g, ''))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        if (!name.trim()) return setError('Nama dompet wajib diisi')
            if (!type.trim()) return setError('Tipe dompet wajib diisi')

                const formData = new FormData()
                formData.set('name', name.trim())
                    formData.set('type', type.trim())
                        formData.set('icon', icon)
                            formData.set('color', color)
                                formData.set('opening_balance', openingBalance || '0')

                                    setIsSubmitting(true)
                                    const result = account
                                    ? await updateAccount(account.id, formData)
                                    : await createAccount(formData)
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

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
        <h2 className="text-base font-semibold text-zinc-900">
        {account ? 'Edit Dompet' : 'Dompet Baru'}
        </h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors">
        <X className="w-4 h-4" />
        </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* Preview + Name — samain layout dengan kategori */}
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
        placeholder="Nama dompet…"
        maxLength={50}
        className="w-full text-lg font-semibold text-zinc-900 placeholder:text-zinc-300 border-0 border-b-2 border-zinc-100 focus:border-zinc-900 outline-none pb-1.5 transition-colors bg-transparent"
        />
        <p className="text-xs text-zinc-400 mt-1.5">Contoh: BCA, GoPay, Dompet Cash…</p>
        </div>
        </div>

        {/* Type — free text */}
        <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Tipe</label>
        <input
        type="text"
        value={type}
        onChange={e => setType(e.target.value)}
        placeholder="Contoh: Bank, E-Wallet, Cash, Tabungan…"
        maxLength={30}
        className="w-full px-4 py-2.5 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition"
        />
        <p className="text-xs text-zinc-400">Bebas isi sesuai kebutuhanmu</p>
        </div>

        {/* Icon picker */}
        <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Ikon</label>
        <AccountIconPicker value={icon} color={color} onChange={setIcon} />
        </div>

        {/* Color */}
        <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Warna</label>
        <div className="flex flex-wrap gap-2.5">
        {ACCOUNT_COLORS.map(({ value: c, name: cName }) => (
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

        {/* Opening balance */}
        <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2 block">Saldo Awal</label>
        <div className="relative flex items-center border-b-2 border-zinc-100 focus-within:border-zinc-900 transition-colors pb-2">
        <span className="text-xl font-light text-zinc-300 mr-2">Rp</span>
        <input
        type="text"
        inputMode="numeric"
        value={openingBalance ? Number(openingBalance).toLocaleString('id-ID') : ''}
        onChange={handleBalanceChange}
        placeholder="0"
        className="flex-1 text-xl font-semibold text-zinc-900 placeholder:text-zinc-200 border-0 outline-none bg-transparent"
        />
        </div>
        {account && (
            <p className="text-xs text-zinc-400 mt-1.5">
            Saldo saat ini: {formatRupiah(account.balance)} (dihitung otomatis dari transaksi)
            </p>
        )}
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
        {success ? 'Tersimpan!' : isSubmitting ? 'Menyimpan…' : account ? 'Simpan' : 'Tambah'}
        </button>
        </div>
        </div>
        </form>
        </div>
        </div>
    )
}
