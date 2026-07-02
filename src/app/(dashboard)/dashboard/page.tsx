import { getDashboardData } from '@/actions/transaction'
import { getUser, getProfile } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const [user, profile, { data }] = await Promise.all([
    getUser(),
                                                      getProfile(),
                                                      getDashboardData(),
  ])
  return (
    <DashboardClient
    user={{
      name: profile?.full_name ?? user?.email ?? '',
      email: user?.email ?? '',
      avatar: profile?.avatar_url ?? null,
    }}
    stats={data?.stats ?? null}
    totalBalance={data?.totalBalance ?? 0}
    accounts={data?.accounts ?? []}
    monthly={data?.monthly ?? []}
    recentTransactions={data?.recentTransactions ?? []}
    />
  )
}
