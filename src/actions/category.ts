// versi baru Category.ts
'use server'
import { createClient, getUser } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Category, TransactionType } from '@/types'
export async function getCategories(): Promise<{ data: Category[] | null; error: string | null }> {
  const user = await getUser()
  if (!user) return { data: null, error: 'Unauthorized' }
  const supabase = await createClient()
  const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', user.id)
  .order('name')
  return { data, error: error?.message ?? null }
}
export async function createCategory(formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabase = await createClient()
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string
  const color = formData.get('color') as string
  const type = formData.get('type') as TransactionType
  if (!name?.trim()) return { error: 'Nama kategori wajib diisi' }
  const { error } = await supabase.from('categories').insert({
    user_id: user.id, name: name.trim(), icon, color, type,
  })
  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { error: null }
}
export async function updateCategory(id: string, formData: FormData) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabase = await createClient()
  const name = formData.get('name') as string
  const icon = formData.get('icon') as string
  const color = formData.get('color') as string
  const type = formData.get('type') as TransactionType
  if (!name?.trim()) return { error: 'Nama kategori wajib diisi' }
  const { error } = await supabase
  .from('categories')
  .update({ name: name.trim(), icon, color, type })
  .eq('id', id)
  .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { error: null }
}
export async function deleteCategory(id: string) {
  const user = await getUser()
  if (!user) return { error: 'Unauthorized' }
  const supabase = await createClient()
  const { error } = await supabase
  .from('categories')
  .delete()
  .eq('id', id)
  .eq('user_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/categories')
  return { error: null }
}
