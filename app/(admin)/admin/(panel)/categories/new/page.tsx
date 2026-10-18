import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import CategoryForm from '../CategoryForm'
import { createCategory } from '../actions'

export default async function NewCategoryPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Nouvelle catégorie" crumbs={[{ label: 'Catégories', href: '/admin/categories' }, { label: 'Nouvelle' }]}
        subtitle="Une catégorie regroupe des cours sur la page d’accueil. Elle n’y apparaît que lorsqu’elle contient au moins un cours visible." />
      <CategoryForm action={createCategory} submitLabel="Créer la catégorie" isNew initial={{ title: '', description: '', logo: '', orderCategory: '' }} />
    </>
  )
}
