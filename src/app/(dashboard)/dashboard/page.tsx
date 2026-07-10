import { getDashboardData } from '@/actions/transaction'
import { getGoals } from '@/actions/goal'
import { getUser, getProfile } from '@/lib/supabase/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const [user, profile, { data }, { data: goals }] = await Promise.all([
    getUser(),
                                                                       getProfile(),
                                                                       getDashboardData(),
                                                                       getGoals(),
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
    goals={goals ?? []}
    />
  )
}
