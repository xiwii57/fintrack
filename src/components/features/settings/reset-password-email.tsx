'use client'

import { useState, useTransition } from 'react'
import { Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { requestPasswordResetFromSettings } from '@/actions/profile'

export default function ResetPasswordEmail({ email }: { email: string }) {
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

    function handleClick() {
        setMessage(null)
        startTransition(async () => {
            const result = await requestPasswordResetFromSettings()
            if (result?.error) {
                setMessage({ type: 'error', text: result.error })
                return
            }
            setMessage({ type: 'success', text: `Link reset dikirim ke ${email}. Cek inbox kamu.` })
        })
    }

    return (
        <div className="space-y-3">
        <p className="text-xs text-zinc-400">
        Lupa password saat ini, atau masuk pakai Google dan belum pernah punya password?
        Kami bisa kirim link reset ke email kamu, tanpa perlu password lama.
        </p>
        {message && (
            <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                message.type === 'error'
                ? 'bg-red-50 text-red-600 border border-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}>
            {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {message.text}
            </div>
        )}
        <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        Kirim Link Reset ke Email
        </button>
        </div>
    )
}
