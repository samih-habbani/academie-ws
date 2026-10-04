import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { toDateInput } from '@/lib/admin/format'
import { PageHeader } from '../../../_components/ui'
import CourseForm from '../CourseForm'
import { createCourse } from '../actions'

export default async function NewCoursePage() {
  await requireAdmin()
  const [categories, themes] = await Promise.all([
    prisma.category.findMany({ orderBy: { orderCategory: 'asc' }, select: { id: true, title: true } }),
    prisma.theme.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true, category: { select: { title: true } } } }),
  ])

  return (
    <>
      <PageHeader
        title="Nouveau cours"
        subtitle="Renseigne les informations du cours ; tu pourras ensuite lui ajouter ses chapitres et son support."
        crumbs={[{ label: 'Cours', href: '/admin/courses' }, { label: 'Nouveau' }]}
      />
      <CourseForm
        action={createCourse}
        cancelHref="/admin/courses"
        submitLabel="Créer le cours"
        categories={categories}
        themes={themes.map((t) => ({ id: t.id, title: t.title, categoryTitle: t.category.title }))}
        initial={{
          title: '', description: '', categoryId: '', themeId: '', difficulty: '', date: toDateInput(new Date()),
          duration: '', author: 'Samih Habbani', price: '', oldPrice: '', chapterCount: '', logo: '', available: true,
        }}
      />
    </>
  )
}
