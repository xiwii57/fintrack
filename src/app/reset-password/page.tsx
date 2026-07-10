// app/reset-password/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from '@/components/features/auth/reset-password-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reset Password — FinTrack' }

export default async function ResetPasswordPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Kalau gak ada sesi sama sekali (bukan dari klik link email), tendang ke login
    if (!user) redirect('/login?error=auth_failed')

        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
            <div className="w-full max-w-sm bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
            <div>
            <p className="text-sm font-semibold text-zinc-900">Buat Password Baru</p>
            <p className="text-xs text-zinc-400 mt-0.5">Masukkan password baru untuk akun kamu</p>
            </div>
            <ResetPasswordForm />
            </div>
            </div>
        )
}
