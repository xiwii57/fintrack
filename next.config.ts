import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        // Batasi hanya path foto profil Google
        pathname: '/a/**',
      },
    ],
    // Cegah SSRF lewat URL arbitrary
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'none'; script-src 'none'; sandbox;",
  },
  // Matikan header X-Powered-By
  poweredByHeader: false,
  // Header fallback — aktif kalau middleware tidak jalan (static export, dll).
  // Cache-Control untuk /_next/static TIDAK perlu diset manual di sini —
  // Next.js sudah otomatis mengirim immutable cache 1 tahun untuk semua
  // build asset di production. Menimpanya manual cuma menimbulkan warning
  // build dan berisiko konflik dengan cache invalidation Next.js saat dev.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',     value: 'off' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          // HSTS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
