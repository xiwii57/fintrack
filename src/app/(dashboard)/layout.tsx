// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()
  if (!user) redirect('/login')

    return (
      <div className="min-h-screen bg-zinc-50">
      <Sidebar />
      <main className="lg:pl-64 pt-14 lg:pt-0">
      {children}
      </main>
      </div>
    )
}
