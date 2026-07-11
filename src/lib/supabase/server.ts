// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

// Nama cookie flag kecil (bukan cookie sesi Supabase) yang nyimpen pilihan
// "Ingat saya" dari form login. Dibaca ulang di setiap request supaya
// keputusan panjang-pendeknya cookie sesi konsisten sepanjang browsing.
export const REMEMBER_COOKIE = 'dompetin-remember'
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 hari, dalam detik — dipakai HANYA kalau user centang "Ingat saya"

const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

/**
 * @param rememberOverride - dipakai HANYA saat proses login (di actions/auth.ts),
 *   karena saat itu kita baru tahu pilihan checkbox dari formData dan belum
 *   sempat ke-refleksikan ke cookie flag. Di semua pemanggilan lain, biarkan
 *   kosong — nilainya otomatis dibaca dari cookie REMEMBER_COOKIE yang sudah
 *   ada dari proses login sebelumnya.
 */
export async function createClient(rememberOverride?: boolean) {
  const cookieStore = await cookies()
  const remember = rememberOverride ?? cookieStore.get(REMEMBER_COOKIE)?.value === '1'

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const finalOptions = remember
              // "Ingat saya": paksa rolling 30 hari, menang dari maxAge bawaan library.
              ? { ...SECURE_COOKIE_OPTIONS, ...options, maxAge: COOKIE_MAX_AGE }
              // Tidak diingat: buang maxAge/expires apa pun supaya jadi cookie
              // sesi murni — otomatis hilang begitu browser ditutup.
              : { ...SECURE_COOKIE_OPTIONS, ...options, maxAge: undefined, expires: undefined }

              cookieStore.set(name, value, finalOptions)
            })
          } catch {
            // Server Component — diabaikan
          }
        },
      },
    }
  )
}

export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async () => {
  const user = await getUser()
  if (!user) return null
    const supabase = await createClient()
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    return data
})
