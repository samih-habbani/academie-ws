import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import CategoryForm from '../CategoryForm'
import { deleteCategory, updateCategory } from '../actions'

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const category = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { courses: true, themes: true } } } })
  if (!category) notFound()
  const used = category._count.courses + category._count.themes

  return (
    <>
      <PageHeader title={category.title} crumbs={[{ label: 'Catégories', href: '/admin/categories' }, { label: category.title }]}
        subtitle={<>{category._count.courses} cours · {category._count.themes} thématique{category._count.themes > 1 ? 's' : ''}</>} />
      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        submitLabel="Enregistrer les modifications"
        isNew={false}
        initial={{ title: category.title, description: category.description, logo: category.logo, orderCategory: String(category.orderCategory) }}
      />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24, maxWidth: 760 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">{used > 0 ? `Cette catégorie est utilisée par ${category._count.courses} cours et ${category._count.themes} thématique(s) : déplace-les avant de la supprimer.` : 'Supprime définitivement cette catégorie.'}</div>
          </div>
          <ConfirmDelete action={deleteCategory} fields={{ id: category.id }} variant="button" label="Supprimer la catégorie"
            disabled={used > 0} disabledReason="Catégorie encore utilisée"
            title={`Supprimer « ${category.title} » ?`} description="Cette catégorie sera définitivement supprimée." />
        </div>
      </section>
    </>
  )
}
