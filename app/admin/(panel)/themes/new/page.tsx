import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ThemeForm from '../ThemeForm'
import { createTheme } from '../actions'

export default async function NewThemePage() {
  await requireAdmin()
  const categories = await prisma.category.findMany({ orderBy: { orderCategory: 'asc' }, select: { id: true, title: true } })
  return (
    <>
      <PageHeader title="Nouvelle thématique" crumbs={[{ label: 'Thématiques', href: '/admin/themes' }, { label: 'Nouvelle' }]}
        subtitle="Une thématique regroupe plusieurs cours sous une seule carte sur la page d’accueil." />
      <ThemeForm action={createTheme} submitLabel="Créer la thématique" categories={categories} initial={{ title: '', slug: '', description: '', img: '', categoryId: '' }} />
    </>
  )
}
