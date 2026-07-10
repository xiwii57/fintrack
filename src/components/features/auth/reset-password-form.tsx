'use client'

import { useState, useTransition } from 'react'
import { updatePassword } from '@/actions/auth'

export default function ResetPasswordForm() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError('')
        const formData = new FormData(e.currentTarget)

        startTransition(async () => {
            const result = await updatePassword(formData)
            if (result?.error) setError(result.error)
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
            <div className="px-3.5 py-2.5 rounded-lg text-sm bg-red-50 border border-red-100 text-red-600">
            {error}
            </div>
        )}
        <div>
        <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password Baru</label>
        <input
        name="password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Minimal 8 karakter, huruf & angka"
        className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
        />
        </div>
        <div>
        <label className="block text-xs font-medium text-zinc-600 mb-1.5">Konfirmasi Password</label>
        <input
        name="confirm"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="Ulangi password baru"
        className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
        />
        </div>
        <button
        type="submit"
        disabled={isPending}
        className="w-full bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        >
        {isPending ? 'Menyimpan...' : 'Simpan Password Baru'}
        </button>
        </form>
    )
}
