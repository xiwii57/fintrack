import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { authRateLimit } from '@/lib/rate-limit'

// ── Route config ─────────────────────────────────────────────────────────────
const PROTECTED_PREFIXES = ['/dashboard', '/accounts', '/goals', '/transactions', '/categories', '/reports', '/settings']
const AUTH_ROUTES        = ['/', '/login']

// ── Nonce generator ───────────────────────────────────────────────────────────
function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Buffer.from(array).toString('base64')
}

// ── Supabase hostname dari env ────────────────────────────────────────────────
function supabaseHost(): string {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname }
  catch { return '*.supabase.co' }
}

// ── CSP builder dengan nonce per-request ─────────────────────────────────────
function buildCsp(nonce: string): string {
  const sb = supabaseHost()
  const dev = process.env.NODE_ENV !== 'production'

  const d: Record<string, string[]> = {
    'default-src':              ["'self'"],
    'script-src':               ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", 'https://challenges.cloudflare.com', ...(dev ? ["'unsafe-eval'"] : [])],
    'style-src':                ["'self'", "'unsafe-inline'"],
    'img-src':                  ["'self'", 'data:', 'blob:', `https://${sb}`, 'https://lh3.googleusercontent.com'],
    'font-src':                 ["'self'", 'https://fonts.gstatic.com'],
    'connect-src':              ["'self'", `https://${sb}`, `wss://${sb}`, 'https://accounts.google.com', 'https://challenges.cloudflare.com'],
    'frame-src':                ['https://challenges.cloudflare.com'],
    'frame-ancestors':          ["'none'"],
    'object-src':               ["'none'"],
    'base-uri':                 ["'self'"],
    'form-action':              ["'self'"],
    'media-src':                ["'none'"],
    'worker-src':               ["'self'", 'blob:'],
    'upgrade-insecure-requests': [],
  }

  return Object.entries(d)
  .map(([k, v]) => v.length ? `${k} ${v.join(' ')}` : k)
  .join('; ')
}

// ── Tempel security headers ke response ──────────────────────────────────────
function applySecurityHeaders(res: NextResponse, nonce: string, isAuthPage: boolean) {
  res.headers.set('Content-Security-Policy',   buildCsp(nonce))
  res.headers.set('X-Frame-Options',           'DENY')
  res.headers.set('X-Content-Type-Options',    'nosniff')
  res.headers.set('Referrer-Policy',           'strict-origin-when-cross-origin')
  res.headers.set('X-DNS-Prefetch-Control',    'off')
  res.headers.set('Permissions-Policy',
                  'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()'
  )
  // Cegah window pihak lain (mis. tab hasil OAuth redirect) mengakses
  // window.opener dari tab ini — mitigasi tabnabbing & cross-window leaks
  res.headers.set('Cross-Origin-Opener-Policy', 'same-origin')

  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Nonce diteruskan ke layout via header internal
  res.headers.set('x-nonce', nonce)

  if (isAuthPage) {
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    res.headers.set('Pragma', 'no-cache')
  }

  res.headers.delete('X-Powered-By')
  res.headers.delete('Server')
}

// ── IP helper ─────────────────────────────────────────────────────────────────
// PENTING: header ini bisa dipalsukan client kalau app tidak berjalan di
// belakang proxy tepercaya yang membersihkannya (Vercel & sejenisnya sudah
// menangani ini otomatis). Kalau self-host di belakang reverse proxy sendiri
// (nginx/Cloudflare Tunnel dll), pastikan proxy itu MENIMPA x-forwarded-for
// dengan IP asli, bukan sekadar meneruskan header yang dikirim client —
// kalau tidak, attacker bisa spoof header ini untuk mem-bypass rate limit.
function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// ── Middleware utama ──────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const nonce = generateNonce()

  // ── Rate limiting untuk endpoint auth ────────────────────────────────────
  const isAuthCallback = pathname.startsWith('/auth/')
  const isLoginPage    = pathname === '/login'

  if (isLoginPage || isAuthCallback) {
    const ip = getIp(request)
    const { success, reset } = await authRateLimit.limit(`auth:${ip}`)

    if (!success) {
      const res = new NextResponse('Too Many Requests', { status: 429 })
      res.headers.set('Retry-After', String(Math.ceil((reset - Date.now()) / 1000)))
      applySecurityHeaders(res, nonce, true)
      return res
    }
  }

  // ── Supabase SSR client ───────────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()  { return request.cookies.getAll() },
                                      setAll(cookiesToSet) {
                                        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                                        supabaseResponse = NextResponse.next({ request })
                                        cookiesToSet.forEach(({ name, value, options }) =>
                                        supabaseResponse.cookies.set(name, value, options)
                                        )
                                      },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  // ── Route protection ──────────────────────────────────────────────────────
  if (!user && isProtected) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    const redirect = NextResponse.redirect(loginUrl)
    applySecurityHeaders(redirect, nonce, false)
    return redirect
  }

  if (user && isAuthRoute) {
    const redirect = NextResponse.redirect(new URL('/dashboard', request.url))
    applySecurityHeaders(redirect, nonce, false)
    return redirect
  }

  // ── Normal ────────────────────────────────────────────────────────────────
  applySecurityHeaders(supabaseResponse, nonce, isAuthRoute)
  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
