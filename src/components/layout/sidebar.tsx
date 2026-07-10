// components/layout/sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  BarChart2,
  Settings,
  TrendingUp,
  Wallet,
  Target,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',    label: 'Dashboard',  icon: LayoutDashboard },
{ href: '/accounts',     label: 'Dompet',     icon: Wallet },
{ href: '/transactions', label: 'Transaksi',  icon: ArrowLeftRight },
{ href: '/goals',        label: 'Goals',      icon: Target },
{ href: '/categories',   label: 'Kategori',   icon: Tag },
{ href: '/reports',      label: 'Laporan',    icon: BarChart2 },
{ href: '/settings',     label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Tutup drawer otomatis setiap pindah halaman
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Kunci scroll body & tutup dengan Escape saat drawer terbuka
  useEffect(() => {
    if (!isOpen) return
      document.body.style.overflow = 'hidden'
  const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
  window.addEventListener('keydown', onKeyDown)
  return () => {
    document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeyDown)
  }
  }, [isOpen])

  return (
    <>
    {/* Topbar mobile/tablet (di bawah lg) */}
    <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4 z-40">
    <div className="flex items-center gap-2.5">
    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
    <svg className="w-3.5 h-3.5 text-zinc-900" fill="none" viewBox="0 0 24 24">
    <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="8" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="16.5" cy="14.5" r="1.4" fill="currentColor" />
    </svg>
    </div>
    <span className="font-semibold text-white text-sm">Dompetin</span>
    </div>
    <button
    onClick={() => setIsOpen(true)}
    aria-label="Buka menu"
    aria-expanded={isOpen}
    className="p-2 text-zinc-400 hover:text-white"
    >
    <Menu className="w-5 h-5" />
    </button>
    </header>

    {/* Backdrop mobile */}
    {isOpen && (
      <div
      onClick={() => setIsOpen(false)}
      className="lg:hidden fixed inset-0 bg-black/60 z-40"
      aria-hidden="true"
      />
    )}

    {/* Sidebar: drawer di mobile, statis di desktop */}
    <aside
    role="dialog"
    aria-modal={isOpen}
    className={cn(
      'fixed lg:static inset-y-0 left-0 z-50 w-72 lg:w-60 min-h-screen bg-zinc-900 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}
    >
    <div className="hidden lg:flex items-center gap-2.5 px-6 py-5 border-b border-zinc-800">
    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
    <TrendingUp className="w-4 h-4 text-zinc-900" />
    </div>
    <span className="font-semibold text-white text-sm">FinTrack</span>
    </div>

    <div className="lg:hidden flex justify-end px-3 pt-3">
    <button
    onClick={() => setIsOpen(false)}
    aria-label="Tutup menu"
    className="p-2 text-zinc-400 hover:text-white"
    >
    <X className="w-5 h-5" />
    </button>
    </div>

    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
    {navItems.map(({ href, label, icon: Icon }) => {
      const active = pathname === href || pathname.startsWith(href + '/')
      return (
        <Link
        key={href}
        href={href}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
          active
          ? 'bg-white text-zinc-900 font-medium'
          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
        )}
        >
        <Icon className="w-4 h-4 shrink-0" />
        {label}
        </Link>
      )
    })}
    </nav>

    <div className="px-3 py-4 border-t border-zinc-800">
    <LogoutButton />
    </div>
    </aside>
    </>
  )
}

function LogoutButton() {
  async function handleLogout() {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }
  return (
    <button
    onClick={handleLogout}
    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
    >
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
    Keluar
    </button>
  )
}
