// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'

const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
}

export async function createClient() {
  const cookieStore = await cookies()
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
            cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...SECURE_COOKIE_OPTIONS, ...options })
            )
          } catch {
            // Server Component — diabaikan
          }
        },
      },
    }
  )
}

// lib/supabase/server.ts
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
