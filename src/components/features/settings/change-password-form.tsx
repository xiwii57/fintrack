// components/features/settings/change-password-form.tsx
'use client'

import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle2, Lock } from 'lucide-react'
import { changePassword } from '@/actions/profile'

export default function ChangePasswordForm() {
  const [fields, setFields] = useState({ current: '', password: '', confirm: '' })
  const [show, setShow] = useState({ current: false, password: false, confirm: false })
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const set = (key: keyof typeof fields) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields((f) => ({ ...f, [key]: e.target.value }))
    setMessage(null)
  }
  const toggle = (key: keyof typeof show) => () =>
  setShow((s) => ({ ...s, [key]: !s[key] }))

  const strength = (() => {
    const p = fields.password
    if (!p) return null
      const score = [p.length >= 8, /[A-Z]/.test(p), /[0-9]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length
      return [
        null,
        { label: 'Lemah',      color: 'bg-red-500',      idx: 1 },
        { label: 'Cukup',      color: 'bg-amber-500',    idx: 2 },
        { label: 'Kuat',       color: 'bg-blue-500',     idx: 3 },
        { label: 'Sangat kuat',color: 'bg-emerald-500',  idx: 4 },
      ][score]
  })()

  const matched = fields.confirm.length > 0 && fields.password === fields.confirm

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const fd = new FormData()
    fd.append('current_password', fields.current)
    fd.append('password', fields.password)
    fd.append('confirm', fields.confirm)
    startTransition(async () => {
      const result = await changePassword(fd)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: 'Password berhasil diperbarui' })
        setFields({ current: '', password: '', confirm: '' })
      }
    })
  }

  const inputBase = "w-full pl-9 pr-10 py-2.5 rounded-lg border text-zinc-800 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 transition-all bg-white"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
    {/* Password lama */}
    <div className="space-y-1.5">
    <label htmlFor="current_password" className="block text-xs font-medium text-zinc-500">Password Saat Ini</label>
    <div className="relative">
    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    <input
    id="current_password"
    type={show.current ? 'text' : 'password'}
    value={fields.current}
    onChange={set('current')}
    placeholder="Masukkan password saat ini"
    autoComplete="current-password"
    className={`${inputBase} border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100`}
    />
    <button type="button" onClick={toggle('current')} tabIndex={-1}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
    {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
    </div>
    </div>

    {/* Password baru */}
    <div className="space-y-1.5">
    <label htmlFor="password" className="block text-xs font-medium text-zinc-500">Password Baru</label>
    <div className="relative">
    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    <input
    id="password"
    type={show.password ? 'text' : 'password'}
    value={fields.password}
    onChange={set('password')}
    placeholder="Minimal 8 karakter"
    autoComplete="new-password"
    className={`${inputBase} border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100`}
    />
    <button type="button" onClick={toggle('password')} tabIndex={-1}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
    {show.password ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
    </div>

    {strength && (
      <div className="space-y-1">
      <div className="flex gap-1">
      {[1,2,3,4].map((i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i <= (strength.idx ?? 0) ? strength.color : 'bg-zinc-200'
        }`} />
      ))}
      </div>
      <p className="text-xs text-zinc-400">{strength.label}</p>
      </div>
    )}
    </div>

    {/* Konfirmasi */}
    <div className="space-y-1.5">
    <label htmlFor="confirm" className="block text-xs font-medium text-zinc-500">Konfirmasi Password</label>
    <div className="relative">
    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
    <input
    id="confirm"
    type={show.confirm ? 'text' : 'password'}
    value={fields.confirm}
    onChange={set('confirm')}
    placeholder="Ulangi password baru"
    autoComplete="new-password"
    className={`${inputBase} ${
      fields.confirm
      ? matched
      ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-50'
      : 'border-red-300 focus:border-red-400 focus:ring-red-50'
      : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-100'
    }`}
    />
    <button type="button" onClick={toggle('confirm')} tabIndex={-1}
    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors">
    {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
    </div>
    {fields.confirm && (
      <p className={`text-xs flex items-center gap-1.5 ${matched ? 'text-emerald-600' : 'text-red-500'}`}>
      {matched && <CheckCircle2 className="w-3 h-3" />}
      {matched ? 'Password cocok' : 'Password tidak cocok'}
      </p>
    )}
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
    disabled={isPending || !fields.current || !fields.password || !fields.confirm}
    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-zinc-900 rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
    {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
    Perbarui Password
    </button>
    </form>
  )
}
