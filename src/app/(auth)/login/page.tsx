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
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24">
      <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="8" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16.5" cy="14.5" r="1.4" fill="currentColor" />
      </svg>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900">Dompetin</h1>
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
