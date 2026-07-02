// features/auth/auth-form.tsx
'use client'

import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Turnstile } from '@marsidev/react-turnstile'
import { createClient } from '@/lib/supabase/client'
import { signInWithEmail, signUpWithEmail } from '@/actions/auth'

type Mode = 'login' | 'register'

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  )
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('login')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null)

  // ── Turnstile ──────────────────────────────────────────────────────────────
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileKey, setTurnstileKey] = useState(0) // ganti key untuk reset widget

  // ── Baca error dari URL — pakai useSearchParams, bukan window ─────────────
  const searchParams = useSearchParams()
  useEffect(() => {
    const e = searchParams.get('error')
    if (!e) return
      if (e === 'not_registered') {
        setFeedback({ type: 'error', message: 'Akun belum terdaftar. Silakan daftar terlebih dahulu.' })
      } else if (e === 'auth_failed') {
        setFeedback({ type: 'error', message: 'Autentikasi gagal. Coba lagi.' })
      } else if (e === 'profile_failed') {
        setFeedback({ type: 'error', message: 'Gagal menyimpan profil. Coba daftar ulang.' })
      }
  }, [searchParams])

  // ── Google OAuth ──────────────────────────────────────────────────────────
  async function handleGoogle() {
    setGoogleLoading(true)
    setFeedback(null)
    const supabase = createClient()

    const redirectTo = mode === 'register'
    ? `${location.origin}/auth/callback?registering=true`
    : `${location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })

    if (error) {
      setFeedback({ type: 'error', message: error.message })
      setGoogleLoading(false)
    }
  }

  // ── Email form ────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFeedback(null)

    if (!turnstileToken) {
      setFeedback({ type: 'error', message: 'Verifikasi keamanan belum selesai. Coba lagi.' })
      return
    }

    const formData = new FormData(e.currentTarget)
    formData.append('turnstileToken', turnstileToken)

      startTransition(async () => {
        const result = mode === 'login'
      ? await signInWithEmail(formData)
      : await signUpWithEmail(formData)

      if (!result) return
        if ('error' in result) {
          setFeedback({ type: 'error', message: translateError(result.error ?? 'Terjadi kesalahan.') })
          // Reset widget — token Turnstile sekali pakai, wajib diisi ulang sebelum submit berikutnya
          setTurnstileKey(k => k + 1)
          setTurnstileToken('')
        }
        if ('success' in result) setFeedback({ type: 'success', message: result.success })
      })
  }

  function switchMode(m: Mode) {
    setMode(m)
    setFeedback(null)
  }

  const isLoading = googleLoading || isPending

  return (
    <div className="space-y-5">

    {/* Tab toggle */}
    <div className="flex bg-zinc-100 rounded-lg p-1 gap-1">
    {(['login', 'register'] as Mode[]).map(m => (
      <button
      key={m}
      type="button"
      onClick={() => switchMode(m)}
      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
        mode === m
        ? 'bg-white text-zinc-900 shadow-sm'
        : 'text-zinc-500 hover:text-zinc-700'
      }`}
      >
      {m === 'login' ? 'Masuk' : 'Daftar'}
      </button>
    ))}
    </div>

    {/* Feedback */}
    {feedback && (
      <div className={`px-3.5 py-2.5 rounded-lg text-sm ${
        feedback.type === 'error'
        ? 'bg-red-50 border border-red-100 text-red-600'
        : 'bg-emerald-50 border border-emerald-100 text-emerald-700'
      }`}>
      {feedback.message}
      </div>
    )}

    {/* Google button */}
    <button
    type="button"
    onClick={handleGoogle}
    disabled={isLoading}
    className="w-full flex items-center justify-center gap-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
    {googleLoading ? <Spinner /> : <GoogleIcon />}
    {mode === 'login' ? 'Masuk' : 'Daftar'} dengan Google
    </button>

    {/* Divider */}
    <div className="flex items-center gap-3">
    <div className="flex-1 h-px bg-zinc-100" />
    <span className="text-xs text-zinc-400">atau</span>
    <div className="flex-1 h-px bg-zinc-100" />
    </div>

    {/* Email form */}
    <form onSubmit={handleSubmit} className="space-y-3">
    {mode === 'register' && (
      <div>
      <label className="block text-xs font-medium text-zinc-600 mb-1.5">Nama lengkap</label>
      <input
      name="name"
      type="text"
      required
      autoComplete="name"
      placeholder="Nama kamu"
      className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
      />
      </div>
    )}
    <div>
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Email</label>
    <input
    name="email"
    type="email"
    required
    autoComplete="email"
    placeholder="email@kamu.com"
    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
    />
    </div>
    <div>
    <label className="block text-xs font-medium text-zinc-600 mb-1.5">Password</label>
    <input
    name="password"
    type="password"
    required
    minLength={6}
    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
    placeholder={mode === 'login' ? '••••••••' : 'Minimal 6 karakter'}
    className="w-full px-3 py-2.5 rounded-lg border border-zinc-200 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 transition"
    />
    </div>

    {/* Turnstile widget */}
    <div className="flex justify-center pt-1">
    <Turnstile
    key={turnstileKey}
    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
    onSuccess={(token) => setTurnstileToken(token)}
    onExpire={() => setTurnstileToken('')}
    onError={() => setTurnstileToken('')}
    />
    </div>

    <button
    type="submit"
    disabled={isLoading}
    className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 active:bg-black text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
    >
    {isPending ? <Spinner /> : null}
    {isPending
      ? (mode === 'login' ? 'Masuk...' : 'Mendaftarkan...')
      : (mode === 'login' ? 'Masuk' : 'Buat akun')
    }
    </button>
    </form>
    </div>
  )
}

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))
    return 'Email atau password salah. Periksa kembali atau daftar terlebih dahulu.'
    if (msg.includes('Email not confirmed'))
      return 'Email belum dikonfirmasi. Cek inbox kamu.'
      if (msg.includes('User already registered'))
        return 'Email ini sudah terdaftar. Silakan masuk.'
        if (msg.includes('Password should be at least'))
          return 'Password minimal 6 karakter.'
          if (msg.includes('rate limit'))
            return 'Terlalu banyak percobaan. Tunggu beberapa menit.'
            if (msg.includes('Verifikasi keamanan'))
              return msg
              if (msg.includes('email'))
                return 'Format email tidak valid.'
                return msg
}
