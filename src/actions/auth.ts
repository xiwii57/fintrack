// actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { passwordResetRateLimit } from '@/lib/rate-limit'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Verifikasi Turnstile ──────────────────────────────────────────────────────
async function verifyTurnstile(token: string): Promise<boolean> {
  if (!token) return false
    try {
      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
        }),
      })
      const data = await res.json()
      return data.success === true
    } catch {
      return false
    }
}

export async function signInWithEmail(formData: FormData) {
  const turnstileToken = formData.get('turnstileToken') as string
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: 'Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }

  // RPC idempotent (ON CONFLICT DO NOTHING) — aman dipanggil setiap login,
  // bukan cuma sekali. Ini jaring pengaman kalau kategori default gagal
  // dibuat saat daftar (mis. karena belum konfirmasi email saat itu).
  if (data.user) {
    await supabase.rpc('create_default_categories', { user_uuid: data.user.id })
  }

  redirect('/dashboard')
}

export async function signUpWithEmail(formData: FormData) {
  const turnstileToken = formData.get('turnstileToken') as string
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: 'Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  if (name && name.length > 100) return { error: 'Nama maksimal 100 karakter' }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  })
  if (error) {
    // Jangan expose detail asli (mis. "User already registered") — cegah email enumeration
    if (error.message.includes('already registered') || error.message.includes('already exists')) {
      return { error: 'Gagal membuat akun. Periksa kembali data kamu atau coba masuk.' }
    }
    return { error: 'Gagal membuat akun. Coba lagi.' }
  }
  if (!data.user) return { error: 'Gagal membuat akun.' }

  // Row profiles sudah otomatis dibuat oleh trigger handle_new_user() saat
  // auth.users di-insert. Di sini kita cuma perlu UPDATE flag is_registered
  // jadi true, memakai service role (supabaseAdmin) — BUKAN client biasa —
  // karena saat Confirm Email aktif, belum ada sesi user di request ini
  // (auth.uid() masih null), jadi RLS policy insert/update biasa pasti gagal.
  const { error: profileError } = await supabaseAdmin
  .from('profiles')
  .update({ full_name: name, is_registered: true })
  .eq('id', data.user.id)

  if (profileError) {
    console.error('SIGNUP_PROFILE_UPDATE_ERROR:', profileError.message)
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return { error: 'Gagal menyimpan data profil. Coba lagi.' }
  }

  // create_default_categories TIDAK dipanggil di sini — dipindah ke
  // signInWithEmail, karena RPC ini juga butuh auth.uid() yang valid,
  // yang belum tersedia sebelum user konfirmasi email dan login pertama kali.

  return { success: 'Akun berhasil dibuat! Cek email kamu untuk konfirmasi sebelum masuk.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ── Kirim email reset password ───────────────────────────────────────────────
export async function requestPasswordReset(formData: FormData) {
  const turnstileToken = formData.get('turnstileToken') as string
  if (!(await verifyTurnstile(turnstileToken))) {
    return { error: 'Verifikasi keamanan gagal. Muat ulang halaman dan coba lagi.' }
  }

  const emailRaw = formData.get('email') as string
  if (!emailRaw) return { error: 'Email wajib diisi' }
  const email = emailRaw.trim().toLowerCase()

  const { success } = await passwordResetRateLimit.limit(email)
  if (!success) {
    return { error: 'Terlalu banyak percobaan untuk email ini. Coba lagi dalam beberapa menit.' }
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL!

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  // Selalu balas sukses walau email tidak terdaftar — cegah email enumeration,
  // sama seperti pola di signUpWithEmail
  if (error && !error.message.toLowerCase().includes('rate limit')) {
    console.error('resetPasswordForEmail error:', error.message)
  }

  return { success: 'Kalau email terdaftar, link reset password sudah dikirim. Cek inbox kamu.' }
}

// ── Set password baru (dipanggil dari halaman /reset-password) ─────────────
export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) return { error: 'Password minimal 8 karakter' }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return { error: 'Password harus mengandung huruf dan angka' }
    if (password !== confirm) return { error: 'Konfirmasi password tidak cocok' }

    const supabase = await createClient()

    // User harus punya sesi recovery yang valid (didapat dari klik link email),
    // bukan sesi login biasa — exchangeCodeForSession di callback yang membuat ini
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Sesi reset password sudah tidak berlaku. Minta link baru.' }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }

    redirect('/dashboard')
}
