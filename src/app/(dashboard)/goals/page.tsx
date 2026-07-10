import { getGoals } from '@/actions/goal'
import { getAccounts } from '@/actions/account'
import GoalsClient from '@/components/features/goals/goals-client'

export default async function GoalsPage() {
    const [{ data: goals }, { data: accounts }] = await Promise.all([
        getGoals(),
                                                                    getAccounts(),
    ])

    return <GoalsClient initialGoals={goals ?? []} accounts={accounts ?? []} />
}
