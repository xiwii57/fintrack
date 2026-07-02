// actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
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

  const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: data.user.id,
    email,
    full_name: name,
    is_registered: true,
  })
  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
    return { error: 'Gagal menyimpan data profil. Coba lagi.' }
  }

  await supabase.rpc('create_default_categories', { user_uuid: data.user.id })
  return { success: 'Akun berhasil dibuat! Kamu sudah bisa masuk.' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
