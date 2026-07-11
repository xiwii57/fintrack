// components/features/settings/avatar-upload.tsx
'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { uploadAvatar } from '@/actions/profile'

interface AvatarUploadProps {
  currentUrl: string | null
  fullName: string | null
}

export default function AvatarUpload({ currentUrl, fullName }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
      const newPreview = URL.createObjectURL(file)
      setPreview((old) => {
        if (old?.startsWith('blob:')) URL.revokeObjectURL(old)
          return newPreview
      })
      const fd = new FormData()
      fd.append('avatar', file)
      setMessage(null)
      startTransition(async () => {
        const result = await uploadAvatar(fd)
        if (result.error) {
          setMessage({ type: 'error', text: result.error })
          setPreview(currentUrl)
        } else {
          setMessage({ type: 'success', text: 'Foto berhasil diperbarui' })
        }
      })
  }

  const initials = fullName
  ? fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  : '?'

  return (
    <div className="flex flex-col items-center gap-2">
    <div className="relative">
    <button
    type="button"
    onClick={() => inputRef.current?.click()}
    disabled={isPending}
    className="relative w-20 h-20 rounded-full overflow-hidden focus:outline-none group ring-2 ring-zinc-200 hover:ring-zinc-400 transition-all"
    aria-label="Ganti foto profil"
    >
    {preview ? (
      <Image src={preview} alt="Foto profil" fill className="object-cover" />
    ) : (
      <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
      <span className="text-zinc-600 font-semibold text-xl">{initials}</span>
      </div>
    )}
    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
    {isPending
      ? <Loader2 className="w-5 h-5 text-white animate-spin" />
      : <Camera className="w-5 h-5 text-white" />
    }
    </div>
    </button>
    {/* Badge kamera */}
    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-zinc-900 rounded-full flex items-center justify-center shadow pointer-events-none">
    <Camera className="w-3 h-3 text-white" />
    </div>
    </div>

    <input
    ref={inputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="hidden"
    onChange={handleFileChange}
    />

    {message && (
      <p className={`text-xs font-medium text-center ${message.type === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
      {message.text}
      </p>
    )}
    </div>
  )
}
