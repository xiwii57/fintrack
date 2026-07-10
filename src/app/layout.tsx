// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dompetin.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Dompetin — Catat & Kelola Keuangan Pribadi dengan Mudah',
      template: '%s · Dompetin',
  },
  description:
  'Dompetin membantu kamu mencatat pemasukan, pengeluaran, dan target tabungan dalam satu tempat — sederhana, cepat, dan gratis untuk digunakan sehari-hari.',
  keywords: [
    'aplikasi keuangan pribadi',
    'catatan keuangan',
    'aplikasi tabungan',
    'pengelola keuangan',
    'budgeting Indonesia',
    'dompetin',
  ],
  authors: [{ name: 'Dompetin' }],
  creator: 'Muhamad Raehan Ramadhan',
  applicationName: 'Dompetin',
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: siteUrl,
    siteName: 'Dompetin',
    title: 'Dompetin — Catat & Kelola Keuangan Pribadi dengan Mudah',
    description:
    'Catat pemasukan, pengeluaran, dan target tabunganmu dalam satu tempat. Sederhana, cepat, dan gratis.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Dompetin' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dompetin — Catat & Kelola Keuangan Pribadi',
    description: 'Catat pemasukan, pengeluaran, dan target tabunganmu dalam satu tempat.',
    images: ['/og-image.png'],
  },
  // Default: izinkan indexing untuk halaman publik (landing, login, dll).
  // Halaman (dashboard) yang berisi data pribadi user di-override jadi
  // noindex lewat metadata di app/(dashboard)/layout.tsx.
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#18181b',
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ambil nonce yang di-set oleh middleware
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? ''

  return (
    <html lang="id" suppressHydrationWarning>
    <head>
    {/* Cegah kebocoran URL (termasuk query string sensitif seperti token)
      ke situs pihak ketiga lewat header Referer saat user klik link keluar */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className={inter.className} data-nonce={nonce}>
      {children}
      </body>
      </html>
  )
}
