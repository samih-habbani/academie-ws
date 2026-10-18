import { notFound } from 'next/navigation'
import { ExternalLink } from 'lucide-react'
import { prisma } from '@/lib/db'
import { chapterUrl } from '@/lib/urls'
import { requireAdmin } from '@/lib/admin-auth'
import { param, type SearchParams } from '@/lib/admin/list'
import { safeReturn } from '@/lib/admin/sync'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import ChapterForm from '../ChapterForm'
import { deleteChapter, updateChapter } from '../actions'

export default async function EditChapterPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()
  const { id: rawId } = await params
  const sp = await searchParams
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [chapter, courses] = await Promise.all([
    prisma.chapter.findUnique({ where: { id }, include: { course: { select: { id: true, slug: true, title: true } } } }),
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])
  if (!chapter) notFound()

  const back = safeReturn(param(sp, 'from'), `/admin/courses/${chapter.courseId}`)

  return (
    <>
      <PageHeader
        title={chapter.title.trim()}
        subtitle={<>Chapitre n° {chapter.id} · cours « {chapter.course.title.trim()} »</>}
        crumbs={[
          { label: 'Cours', href: '/admin/courses' },
          { label: chapter.course.title.trim(), href: `/admin/courses/${chapter.courseId}` },
          { label: chapter.title.trim() },
        ]}
        actions={
          <a href={chapterUrl(chapter.course.slug, chapter.id)} target="_blank" rel="noopener" className="adm-btn adm-btn-ghost">
            <ExternalLink size={15} aria-hidden="true" /> Voir sur le site
          </a>
        }
      />

      <ChapterForm
        action={updateChapter.bind(null, chapter.id)}
        cancelHref={back}
        returnTo={back}
        submitLabel="Enregistrer les modifications"
        isNew={false}
        courses={courses.map((c) => ({ id: c.id, title: c.title.trim() }))}
        initial={{
          title: chapter.title,
          courseId: String(chapter.courseId),
          chapterPart: chapter.chapterPart && chapter.chapterPart !== 'null' ? chapter.chapterPart : '',
          numOrder: String(chapter.numOrder),
          type: chapter.type ?? '',
          duration: chapter.duration,
          urlVideo: chapter.urlVideo,
          description: chapter.description ?? '',
          material: chapter.material && chapter.material !== '0' ? chapter.material : '',
          free: chapter.free,
          available: chapter.available,
        }}
      />

      <section className="adm-card adm-danger-zone" style={{ marginTop: 24 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">Supprime définitivement ce chapitre.</div>
          </div>
          <ConfirmDelete
            action={deleteChapter}
            fields={{ id: chapter.id, returnTo: back }}
            variant="button"
            label="Supprimer le chapitre"
            title={`Supprimer « ${chapter.title.trim()} » ?`}
            description="Ce chapitre sera définitivement supprimé. Cette action est irréversible."
          />
        </div>
      </section>
    </>
  )
}
