import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function safeNext(next: string): string {
  // Hanya izinkan path relatif yang mulai dari "/", tolak protocol-relative ("//") dan absolute URL
  if (next.startsWith('/') && !next.startsWith('//') && !next.includes('://')) {
    return next
  }
  return '/dashboard'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const isRegistering = searchParams.get('registering') === 'true'
  const next = safeNext(searchParams.get('next') ?? '/dashboard')

  if (!code) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return NextResponse.redirect(`${origin}/login?error=auth_failed`)

        // PENTING: cek flag is_registered, BUKAN sekadar "apakah row profiles ada".
        // Row bisa saja sudah otomatis dibuat oleh trigger DB (auto-provision saat
        // auth.users insert), jadi keberadaan row tidak cukup jadi bukti user
        // pernah benar-benar menyelesaikan proses daftar.
        const { data: profile } = await supabase
        .from('profiles')
        .select('is_registered')
        .eq('id', user.id)
        .single()

        if (isRegistering) {
          // ── Flow DAFTAR via Google ──────────────────────────────────────────
          // Pakai upsert: kalau row sudah ada (mis. dibuat trigger / percobaan
          // login gagal sebelumnya), tetap di-update jadi is_registered = true.
          // Kalau belum ada, dibuat baru.
          const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email ?? '',
            full_name: user.user_metadata?.full_name ?? '',
            avatar_url: user.user_metadata?.avatar_url ?? '',
            is_registered: true,
          })
          if (upsertError) {
            await supabase.auth.signOut()
            return NextResponse.redirect(`${origin}/login?error=profile_failed`)
          }
          await ensureDefaultCategories(supabase, user.id)
          return NextResponse.redirect(`${origin}${next}`)
        }

        // ── Flow MASUK via Google ──────────────────────────────────────────────
        if (!profile?.is_registered) {
          // Belum pernah resmi menyelesaikan pendaftaran — meskipun row di
          // auth.users (dan mungkin profiles) sudah terbentuk. Tolak & sign out.
          await supabase.auth.signOut()
          return NextResponse.redirect(`${origin}/login?error=not_registered`)
        }

        await ensureDefaultCategories(supabase, user.id)
        return NextResponse.redirect(`${origin}${next}`)
}

// RPC create_default_categories sudah idempotent (ON CONFLICT DO NOTHING
// dengan unique constraint di kolom user_id+name+type), jadi aman dipanggil
// berkali-kali tanpa perlu cek count dulu — menghilangkan race condition
// TOCTOU dan menghemat 1 round-trip query per request.
async function ensureDefaultCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  await supabase.rpc('create_default_categories', { user_uuid: userId })
}
