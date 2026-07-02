// actions/account.ts
'use server'
import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { accountRateLimit } from '@/lib/rate-limit'
import type { Account } from '@/types'

export async function getAccounts(): Promise<{ data: Account[] | null; error: string | null }> {
    const user = await getUser()
    if (!user) return { data: null, error: 'Unauthorized' }
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_accounts_with_balance')
    return { data, error: error?.message ?? null }
}

export async function createAccount(formData: FormData) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }

    const { success } = await accountRateLimit.limit(user.id)
    if (!success) return { error: 'Terlalu banyak percobaan. Coba lagi sebentar lagi.' }

    const supabase = await createClient()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const icon = (formData.get('icon') as string) || 'wallet'
    const color = (formData.get('color') as string) || '#6366f1'
    const openingBalanceRaw = formData.get('opening_balance') as string
    const opening_balance = openingBalanceRaw ? Number(openingBalanceRaw) : 0

    if (!name?.trim()) return { error: 'Nama dompet wajib diisi' }
    if (!type?.trim()) return { error: 'Tipe dompet wajib diisi' }
    if (Number.isNaN(opening_balance) || opening_balance < 0) {
        return { error: 'Saldo awal tidak valid' }
    }

    const { error } = await supabase.from('accounts').insert({
        user_id: user.id,
        name: name.trim(),
                                                             type: type.trim(),
                                                             icon,
                                                             color,
                                                             opening_balance,
    })

    if (error) return { error: error.message }
    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { error: null }
}

export async function updateAccount(id: string, formData: FormData) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }
    const supabase = await createClient()

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const icon = (formData.get('icon') as string) || 'wallet'
    const color = (formData.get('color') as string) || '#6366f1'
    const openingBalanceRaw = formData.get('opening_balance') as string
    const opening_balance = openingBalanceRaw ? Number(openingBalanceRaw) : 0

    if (!name?.trim()) return { error: 'Nama dompet wajib diisi' }
    if (!type?.trim()) return { error: 'Tipe dompet wajib diisi' }
    if (Number.isNaN(opening_balance) || opening_balance < 0) {
        return { error: 'Saldo awal tidak valid' }
    }

    const { error } = await supabase
    .from('accounts')
    .update({ name: name.trim(), type: type.trim(), icon, color, opening_balance })
    .eq('id', id)
    .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { error: null }
}

export async function deleteAccount(id: string) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }
    const supabase = await createClient()

    const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
        if (error.code === '23503') {
            return { error: 'Dompet masih punya transaksi. Pindahkan atau hapus transaksinya dulu.' }
        }
        return { error: error.message }
    }

    revalidatePath('/accounts')
    revalidatePath('/dashboard')
    return { error: null }
}
