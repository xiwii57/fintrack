// actions/profile.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getUser } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { passwordResetRateLimit } from '@/lib/rate-limit'
import { headers } from 'next/headers'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Update nama / full_name ──────────────────────────────────────────────────
export async function updateProfile(formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }
  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'Nama tidak boleh kosong' }
  if (full_name.length > 100) return { error: 'Nama maksimal 100 karakter' }
  const supabase = await createClient()
  const { error } = await supabase
  .from('profiles')
  .update({ full_name, updated_at: new Date().toISOString() })
  .eq('id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

// ── Upload avatar ────────────────────────────────────────────────────────────
const MAGIC_BYTES: Record<string, number[]> = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
}

async function isValidImage(file: File): Promise<boolean> {
  const expected = MAGIC_BYTES[file.type]
  if (!expected) return false
    const buffer = new Uint8Array(await file.slice(0, expected.length).arrayBuffer())
    return expected.every((byte, i) => buffer[i] === byte)
}

export async function uploadAvatar(formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Tidak terautentikasi' }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) return { error: 'File tidak ditemukan' }

  const maxSize = 2 * 1024 * 1024 // 2 MB
  if (file.size > maxSize) return { error: 'Ukuran file maksimal 2 MB' }

  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowed.includes(file.type)) return { error: 'Format harus JPG, PNG, atau WebP' }

  if (!(await isValidImage(file))) return { error: 'File bukan gambar yang valid' }

  const supabase = await createClient()
  const ext = file.name.split('.').pop()
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
  .from('avatars')
  .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
  const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`

  const { error: dbError } = await supabase
  .from('profiles')
  .update({ avatar_url, updated_at: new Date().toISOString() })
  .eq('id', user.id)
  if (dbError) return { error: dbError.message }

  revalidatePath('/settings')
  return { success: true, avatar_url }
}

// ── Ganti password ───────────────────────────────────────────────────────────
export async function changePassword(formData: FormData) {
  const user = await getUser()
  if (!user || !user.email) return { error: 'Tidak terautentikasi' }

  const currentPassword = formData.get('current_password') as string
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!currentPassword) return { error: 'Password lama wajib diisi' }
  if (!password || password.length < 8) return { error: 'Password minimal 8 karakter' }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))
    return { error: 'Password harus mengandung huruf dan angka' }
    if (password !== confirm) return { error: 'Konfirmasi password tidak cocok' }
    if (password === currentPassword) return { error: 'Password baru harus berbeda dari password lama' }

    const supabase = await createClient()

    // Verifikasi password lama sebelum mengizinkan perubahan —
    // mencegah session hijack digunakan untuk mengunci akses user asli
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (verifyError) return { error: 'Password lama salah' }

    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }

    return { success: true }
}

// ── Ambil profil ─────────────────────────────────────────────────────────────
export async function getProfile() {
  const user = await getUser()
  if (!user) return null
    const supabase = await createClient()
    const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
    return data
}

// ── Kirim link reset password ke email akun sendiri, dari halaman Settings ──
export async function requestPasswordResetFromSettings() {
  const user = await getUser()
  if (!user || !user.email) return { error: 'Tidak terautentikasi' }

  const { success } = await passwordResetRateLimit.limit(user.email.toLowerCase())
  if (!success) {
    return { error: 'Terlalu banyak percobaan. Coba lagi dalam beberapa menit.' }
  }

  const supabase = await createClient()
  const origin = (await headers()).get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL!

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })
  if (error) return { error: 'Gagal mengirim email. Coba lagi.' }

  return { success: true }
}
