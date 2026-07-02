import { getCategories } from '@/actions/category'
import CategoriesClient from '@/components/features/categories/categories-client'

export default async function CategoriesPage() {
  const { data: categories, error } = await getCategories()
  if (error) return <div>Gagal memuat kategori: {error}</div>
    return <CategoriesClient categories={categories ?? []} />
}
