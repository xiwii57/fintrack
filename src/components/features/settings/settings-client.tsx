// settings-client.tsx
'use client'

import { useState } from 'react'
import { UserCircle2, Shield, Info } from 'lucide-react'
import AvatarUpload from './avatar-upload'
import ProfileForm from './profile-form'
import ChangePasswordForm from './change-password-form'
import BackupRestore from './backup-restore'
import type { Profile } from '@/types'

const tabs = [
    { id: 'profile',  label: 'Profil',    icon: UserCircle2 },
{ id: 'security', label: 'Keamanan',  icon: Shield },
{ id: 'account',  label: 'Akun',      icon: Info },
] as const

type Tab = (typeof tabs)[number]['id']

export default function SettingsClient({ profile }: { profile: Profile }) {
    const [activeTab, setActiveTab] = useState<Tab>('profile')

    return (
        <div className="min-h-screen bg-zinc-50">
        {/* Header — sama persis pola dashboard */}
        <div className="bg-white border-b border-zinc-200 px-6 py-4">
        <div>
        <p className="text-sm font-medium text-zinc-900">Pengaturan</p>
        <p className="text-xs text-zinc-400 mt-0.5">Kelola profil dan keamanan akun kamu</p>
        </div>
        </div>

        <div className="p-4 md:p-6 space-y-6">
        {/* Tab nav — mirip pill nav */}
        <div className="flex gap-1 bg-white border border-zinc-200 rounded-xl p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
            <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                ? 'bg-zinc-900 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
            }`}
            >
            <Icon className="w-4 h-4" />
            {label}
            </button>
        ))}
        </div>

        {/* ── TAB: PROFIL ──────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Kiri: Avatar card */}
            <div className="bg-white rounded-xl border border-zinc-200 p-6 flex flex-col items-center gap-4">
            <AvatarUpload
            currentUrl={profile.avatar_url}
            fullName={profile.full_name}
            />
            <div className="text-center space-y-0.5">
            <p className="text-sm font-semibold text-zinc-900">
            {profile.full_name ?? <span className="text-zinc-400 font-normal italic">Belum diisi</span>}
            </p>
            <p className="text-xs text-zinc-400">{profile.email}</p>
            </div>
            <p className="text-xs text-zinc-400 text-center">Klik foto untuk menggantinya<br />JPG, PNG, WebP · maks. 2 MB</p>
            </div>

            {/* Kanan: Form card */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
            <p className="text-sm font-medium text-zinc-700 mb-5">Informasi Profil</p>
            <ProfileForm profile={profile} />
            </div>
            </div>
        )}

        {/* ── TAB: KEAMANAN ────────────────────────────────────────────── */}
        {activeTab === 'security' && (
            <div className="bg-white rounded-xl border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
            <Shield className="w-4 h-4 text-zinc-600" />
            </div>
            <div>
            <p className="text-sm font-medium text-zinc-800">Ganti Password</p>
            <p className="text-xs text-zinc-400">Gunakan password yang kuat dan unik</p>
            </div>
            </div>
            <div className="px-6 py-6">
            <ChangePasswordForm />
            </div>
            </div>
        )}

        {/* ── TAB: AKUN ────────────────────────────────────────────────── */}
        {activeTab === 'account' && (
            <div className="space-y-4">
            <div className="bg-white rounded-xl border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-700">Informasi Akun</p>
            </div>
            <dl className="divide-y divide-zinc-50">
            {[
                { label: 'Email', value: profile.email },
                {
                    label: 'Bergabung sejak',
                    value: new Date(profile.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric',
                    }),
                },
                { label: 'Mata uang', value: profile.currency },
                { label: 'Status akun', value: 'Aktif', badge: true },
            ].map(({ label, value, badge }) => (
                <div key={label} className="flex items-center justify-between px-6 py-4">
                <dt className="text-sm text-zinc-500">{label}</dt>
                <dd className="text-sm text-zinc-800 font-medium">
                {badge ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {value}
                    </span>
                ) : value}
                </dd>
                </div>
            ))}
            </dl>
            </div>

            <div className="bg-white rounded-xl border border-zinc-200">
            <div className="px-6 py-4 border-b border-zinc-100">
            <p className="text-sm font-medium text-zinc-700">Backup & Restore</p>
            <p className="text-xs text-zinc-400 mt-0.5">Ekspor data keuanganmu atau pulihkan dari file backup</p>
            </div>
            <BackupRestore />
            </div>
            </div>
        )}
        </div>
        </div>
    )
}
