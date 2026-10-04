import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import ThemeForm from '../ThemeForm'
import { deleteTheme, updateTheme } from '../actions'

export default async function EditThemePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [theme, categories] = await Promise.all([
    prisma.theme.findUnique({ where: { id }, include: { _count: { select: { courses: true } } } }),
    prisma.category.findMany({ orderBy: { orderCategory: 'asc' }, select: { id: true, title: true } }),
  ])
  if (!theme) notFound()

  return (
    <>
      <PageHeader title={theme.title} crumbs={[{ label: 'Thématiques', href: '/admin/themes' }, { label: theme.title }]}
        subtitle={<>{theme._count.courses} cours dans cette thématique</>} />
      <ThemeForm
        action={updateTheme.bind(null, theme.id)}
        submitLabel="Enregistrer les modifications"
        categories={categories}
        initial={{ title: theme.title, description: theme.description, img: theme.img, categoryId: String(theme.categoryId) }}
      />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24, maxWidth: 760 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">Les cours de cette thématique ne sont pas supprimés : ils sont détachés et s’affichent seuls.</div>
          </div>
          <ConfirmDelete action={deleteTheme} fields={{ id: theme.id }} variant="button" label="Supprimer la thématique"
            title={`Supprimer « ${theme.title} » ?`}
            description={<>La thématique sera supprimée. Ses <strong>{theme._count.courses} cours</strong> seront conservés et apparaîtront individuellement sur l’accueil.</>} />
        </div>
      </section>
    </>
  )
}
