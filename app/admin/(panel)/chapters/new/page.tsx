import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { intParam, param, type SearchParams } from '@/lib/admin/list'
import { safeReturn } from '@/lib/admin/sync'
import { PageHeader } from '../../../_components/ui'
import ChapterForm from '../ChapterForm'
import { createChapter } from '../actions'

export default async function NewChapterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()
  const sp = await searchParams
  const courseId = intParam(sp, 'course')
  const courses = await prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } })
  const back = safeReturn(param(sp, 'from'), courseId ? `/admin/courses/${courseId}` : '/admin/chapters')

  return (
    <>
      <PageHeader
        title="Nouveau chapitre"
        subtitle="Ajoute une vidéo à un cours."
        crumbs={[{ label: 'Chapitres', href: '/admin/chapters' }, { label: 'Nouveau' }]}
      />
      <ChapterForm
        action={createChapter}
        cancelHref={back}
        returnTo={back}
        submitLabel="Créer le chapitre"
        isNew
        courses={courses.map((c) => ({ id: c.id, title: c.title.trim() }))}
        initial={{
          title: '', courseId: courseId ? String(courseId) : '', chapterPart: '', numOrder: '', type: 'cours', duration: '',
          urlVideo: '', description: '', material: '', free: true, available: true,
        }}
      />
    </>
  )
}
