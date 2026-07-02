// components/features/settings/profile-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { Loader2, CheckCircle2, User } from 'lucide-react'
import { updateProfile } from '@/actions/profile'
import type { Profile } from '@/types'

export default function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const isDirty = fullName.trim() !== (profile.full_name ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isDirty) return
      setMessage(null)
      const fd = new FormData()
      fd.append('full_name', fullName)
      startTransition(async () => {
        const result = await updateProfile(fd)
        setMessage(result.error
        ? { type: 'error', text: result.error }
        : { type: 'success', text: 'Profil berhasil disimpan' }
        )
      })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
    {/* Email — read only */}
    <div className="space-y-1.5">
    <label className="block text-xs font-medium text-zinc-500">Email</label>
    <div className="relative">
    <input
    type="email"
    value={profile.email}
    disabled
    className="w-full px-3 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-400 text-sm cursor-not-allowed"
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">
    TERKUNCI
    </span>
    </div>
    </div>

    {/* Nama lengkap */}
    <div className="space-y-1.5">
    <label htmlFor="full_name" className="block text-xs font-medium text-zinc-500">
    Nama Lengkap
    </label>
    <div className="relative">
    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    <input
    id="full_name"
    type="text"
    value={fullName}
    onChange={(e) => { setFullName(e.target.value); setMessage(null) }}
    placeholder="Masukkan nama lengkap"
    maxLength={100}
    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-sm placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all"
    />
    </div>
    </div>

    {/* Feedback */}
    {message && (
      <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
        message.type === 'error'
        ? 'bg-red-50 text-red-600 border border-red-100'
        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
      }`}>
      {message.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
      {message.text}
      </div>
    )}

    <button
    type="submit"
    disabled={isPending || !isDirty}
    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
    Simpan Perubahan
    </button>
    </form>
  )
}
