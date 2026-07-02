// app/(auth)/login/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import AuthForm from '@/components/features/auth/auth-form'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border border-zinc-200 p-8 shadow-sm">
      <div className="text-center mb-7">
      <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center mx-auto mb-4">
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900">FinTrack</h1>
      <p className="text-sm text-zinc-500 mt-1">Catat keuangan kamu dengan mudah</p>
      </div>
      <Suspense fallback={null}>
      <AuthForm />
      </Suspense>
      <p className="text-xs text-zinc-400 text-center mt-6">
      Dengan masuk atau mendaftar, kamu menyetujui penggunaan data untuk keperluan aplikasi ini.
      </p>
      </div>
      </div>
      </div>
    )
}
