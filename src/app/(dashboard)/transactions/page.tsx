import { getTransactions, getCategories } from '@/actions/transaction'
import { getAccounts } from '@/actions/account'
import TransactionsClient from '@/components/features/transactions/transactions-client'

export default async function TransactionsPage() {
  const [{ data: transactions }, { data: categories }, { data: accounts }] = await Promise.all([
    getTransactions(),
    getCategories(),
    getAccounts(),
  ])
  return (
    <TransactionsClient
    initialTransactions={transactions ?? []}
    categories={categories ?? []}
    accounts={accounts ?? []}
    />
  )
}
