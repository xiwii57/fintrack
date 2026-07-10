// actions/goal.ts
'use server'
import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { GoalWithProgress } from '@/types'

export async function getGoals(): Promise<{ data: GoalWithProgress[] | null; error: string | null }> {
    const user = await getUser()
    if (!user) return { data: null, error: 'Unauthorized' }
    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_goals_with_progress')
    return { data, error: error?.message ?? null }
}

async function verifyAccountOwnership(
    supabase: Awaited<ReturnType<typeof createClient>>,
    accountId: string,
    userId: string
) {
    const { data } = await supabase.from('accounts').select('id').eq('id', accountId).eq('user_id', userId).single()
    return !!data
}

export async function createGoal(formData: FormData) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }
    const supabase = await createClient()

    const name = formData.get('name') as string
    const targetAmountRaw = formData.get('target_amount') as string
    const icon = (formData.get('icon') as string) || 'target'
    const color = (formData.get('color') as string) || '#6366f1'
    const deadline = (formData.get('deadline') as string) || null
    const accountId = (formData.get('account_id') as string) || null
    const currentAmountRaw = formData.get('current_amount') as string

    const target_amount = Number(targetAmountRaw)
    const current_amount = currentAmountRaw ? Number(currentAmountRaw) : 0

    if (!name?.trim()) return { error: 'Nama goal wajib diisi' }
    if (!target_amount || target_amount <= 0) return { error: 'Target nominal harus lebih dari 0' }
    if (Number.isNaN(current_amount) || current_amount < 0) return { error: 'Nominal awal tidak valid' }

    // Kalau mode terhubung ke dompet, pastikan dompetnya benar milik user
    if (accountId) {
        const ok = await verifyAccountOwnership(supabase, accountId, user.id)
        if (!ok) return { error: 'Dompet tidak valid' }
    }

    const { error } = await supabase.from('goals').insert({
        user_id: user.id,
        name: name.trim(),
                                                          target_amount,
                                                          // current_amount cuma relevan di mode manual; kalau terhubung dompet,
                                                          // kolom ini diabaikan RPC tapi tetap disimpan 0 biar konsisten
                                                          current_amount: accountId ? 0 : current_amount,
                                                          account_id: accountId,
                                                          deadline,
                                                          icon,
                                                          color,
    })

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { error: null }
}

export async function updateGoal(id: string, formData: FormData) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }
    const supabase = await createClient()

    const name = formData.get('name') as string
    const targetAmountRaw = formData.get('target_amount') as string
    const icon = (formData.get('icon') as string) || 'target'
    const color = (formData.get('color') as string) || '#6366f1'
    const deadline = (formData.get('deadline') as string) || null
    const accountId = (formData.get('account_id') as string) || null

    const target_amount = Number(targetAmountRaw)

    if (!name?.trim()) return { error: 'Nama goal wajib diisi' }
    if (!target_amount || target_amount <= 0) return { error: 'Target nominal harus lebih dari 0' }

    if (accountId) {
        const ok = await verifyAccountOwnership(supabase, accountId, user.id)
        if (!ok) return { error: 'Dompet tidak valid' }
    }

    const { error } = await supabase
    .from('goals')
    .update({ name: name.trim(), target_amount, account_id: accountId, deadline, icon, color })
    .eq('id', id)
    .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { error: null }
}

// Khusus mode manual — nambah nominal terkumpul (bukan overwrite,
// biar user bisa nabung sedikit-sedikit tanpa hitung total sendiri)
export async function addGoalContribution(id: string, amount: number) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }
    if (!amount || amount <= 0) return { error: 'Nominal harus lebih dari 0' }
    const supabase = await createClient()

    const { data: goal } = await supabase
    .from('goals')
    .select('id, current_amount, account_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

    if (!goal) return { error: 'Goal tidak ditemukan' }
    if (goal.account_id) return { error: 'Goal ini terhubung ke dompet, progress otomatis mengikuti saldo' }

    const { error } = await supabase
    .from('goals')
    .update({ current_amount: Number(goal.current_amount) + amount })
    .eq('id', id)
    .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { error: null }
}

export async function deleteGoal(id: string) {
    const user = await getUser()
    if (!user) return { error: 'Unauthorized' }
    const supabase = await createClient()

    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)
    if (error) return { error: error.message }
    revalidatePath('/goals')
    revalidatePath('/dashboard')
    return { error: null }
}
