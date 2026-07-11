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
  Wallet,
  Target,
  Menu,
  X,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navGroups = [
  {
    label: 'Menu Utama',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/accounts', label: 'Dompet', icon: Wallet },
      { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
      { href: '/goals', label: 'Goals', icon: Target },
    ],
  },
{
  label: 'Lainnya',
  items: [
    { href: '/categories', label: 'Kategori', icon: Tag },
    { href: '/reports', label: 'Laporan', icon: BarChart2 },
    { href: '/settings', label: 'Pengaturan', icon: Settings },
  ],
},
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0">
    <svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24">
    <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="8" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="16.5" cy="14.5" r="1.4" fill="currentColor" />
    </svg>
    </div>
    <div className="leading-tight">
    <div className="font-semibold text-white text-sm tracking-tight">Dompetin</div>
    <div className="text-[11px] text-zinc-500">Kelola uangmu</div>
    </div>
    </div>
  )
}

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
    <header className="lg:hidden fixed top-0 inset-x-0 h-14 bg-zinc-950/95 backdrop-blur border-b border-zinc-800/80 flex items-center justify-between px-4 z-40">
    <Logo />
    <button
    onClick={() => setIsOpen(true)}
    aria-label="Buka menu"
    aria-expanded={isOpen}
    className="p-2 rounded-lg text-zinc-400 bg-zinc-900 hover:text-white hover:bg-zinc-800 transition-colors"
    >
    <Menu className="w-4.5 h-4.5" />
    </button>
    </header>

    {/* Backdrop mobile */}
    {isOpen && (
      <div
      onClick={() => setIsOpen(false)}
      className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      aria-hidden="true"
      />
    )}

    {/* Sidebar: drawer di mobile, statis di desktop */}
    <aside
    role="dialog"
    aria-modal={isOpen}
    className={cn(
      'fixed inset-y-0 left-0 z-50 w-72 lg:w-64 h-screen',
      'bg-zinc-950 flex flex-col shrink-0 border-r border-zinc-800/80 transition-transform duration-200 ease-in-out lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )}
    >
    <div className="hidden lg:flex items-center px-5 py-5 border-b border-zinc-800/80">
    <Logo />
    </div>

    <div className="lg:hidden flex items-center justify-between px-4 pt-3 pb-1">
    <Logo />
    <button
    onClick={() => setIsOpen(false)}
    aria-label="Tutup menu"
    className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
    >
    <X className="w-4.5 h-4.5" />
    </button>
    </div>

    <nav className="flex-1 min-h-0 px-3 pt-3 pb-4 space-y-5 overflow-y-auto">
    {navGroups.map((group) => (
      <div key={group.label}>
      <div className="px-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-600">
      {group.label}
      </div>
      <div className="space-y-0.5">
      {group.items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
          key={href}
          href={href}
          className={cn(
            'group relative flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-xl text-sm transition-colors',
            active
            ? 'bg-white/[0.06] text-white font-medium'
            : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
          )}
          >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-white" />
          )}
          <span
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg shrink-0 transition-colors',
            active
            ? 'bg-white/10 text-white'
            : 'text-zinc-500 group-hover:text-zinc-300'
          )}
          >
          <Icon className="w-4 h-4" />
          </span>
          {label}
          </Link>
        )
      })}
      </div>
      </div>
    ))}
    </nav>

    <div className="shrink-0 px-3 py-4 border-t border-zinc-800/80">
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
    className="w-full flex items-center gap-3 pl-3.5 pr-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-white hover:bg-white/[0.04] transition-colors"
    >
    <span className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0">
    <LogOut className="w-4 h-4" />
    </span>
    Keluar
    </button>
  )
}
