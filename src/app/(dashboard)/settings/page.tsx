// app/(dashboard)/settings/page.tsx
import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/profile'
import SettingsClient from '@/components/features/settings/settings-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pengaturan — FinTrack' }

export default async function SettingsPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
    return <SettingsClient profile={profile} />
}
