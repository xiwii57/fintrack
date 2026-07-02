// src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'FinTrack — Catatan Keuangan',
  description: 'Aplikasi pencatatan keuangan pribadi',
  // Cegah indexing halaman dashboard
  robots: { index: false, follow: false },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ambil nonce yang di-set oleh middleware
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? ''

  return (
    <html lang="id" suppressHydrationWarning>
    <head>
    {/* Nonce untuk inline scripts jika diperlukan Next.js */}
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    </head>
    <body className={inter.className} data-nonce={nonce}>
    {children}
    </body>
    </html>
  )
}
