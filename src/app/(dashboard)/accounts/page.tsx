import { getAccounts } from '@/actions/account'
import AccountsClient from '@/components/features/accounts/accounts-client'

export default async function AccountsPage() {
    const { data: accounts } = await getAccounts()

    return <AccountsClient initialAccounts={accounts ?? []} />
}
