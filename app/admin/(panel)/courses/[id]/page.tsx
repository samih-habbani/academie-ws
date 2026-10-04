import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getDownloadUrl } from '@vercel/blob'
import { ArrowDown, ArrowUp, ExternalLink, ListVideo, Pencil, Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { courseUrl } from '@/lib/urls'
import { CHAPTER_TYPE_LABELS, toDateInput } from '@/lib/admin/format'
import { getYoutubeVideoId } from '@/lib/youtube'
import { Alert, Badge, EmptyState, PageHeader, type Tone } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import SupportUploader from '../../../_components/SupportUploader'
import CourseForm from '../CourseForm'
import { deleteCourse, updateCourse } from '../actions'
import { deleteChapter, moveChapter } from '../../chapters/actions'

function videoBadge(url: string): { tone: Tone; label: string } {
  if (getYoutubeVideoId(url)) return { tone: 'green', label: 'YouTube' }
  if (url.trim() === '') return { tone: 'gray', label: 'Aucune' }
  if (/vimeo/i.test(url)) return { tone: 'amber', label: 'Vimeo' }
  return { tone: 'red', label: 'Invalide' }
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [course, categories, themes] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        chapters: {
          orderBy: [{ numOrder: 'asc' }, { id: 'asc' }],
          select: { id: true, title: true, numOrder: true, type: true, duration: true, urlVideo: true, available: true, chapterPart: true },
        },
      },
    }),
    prisma.category.findMany({ orderBy: { orderCategory: 'asc' }, select: { id: true, title: true } }),
    prisma.theme.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true, category: { select: { title: true } } } }),
  ])
  if (!course) notFound()

  const here = `/admin/courses/${course.id}`
  const storageReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN)

  return (
    <>
      <PageHeader
        title={course.title.trim()}
        subtitle={<>Cours n° {course.id} · {course.chapters.length} chapitre{course.chapters.length > 1 ? 's' : ''}</>}
        crumbs={[{ label: 'Cours', href: '/admin/courses' }, { label: course.title.trim() }]}
        actions={
          <a href={courseUrl(course.slug)} target="_blank" rel="noopener" className="adm-btn adm-btn-ghost">
            <ExternalLink size={15} aria-hidden="true" /> Voir sur le site
          </a>
        }
      />

      <CourseForm
        action={updateCourse.bind(null, course.id)}
        cancelHref="/admin/courses"
        submitLabel="Enregistrer les modifications"
        categories={categories}
        themes={themes.map((t) => ({ id: t.id, title: t.title, categoryTitle: t.category.title }))}
        initial={{
          title: course.title,
          slug: course.slug,
          description: course.description,
          categoryId: String(course.categoryId),
          themeId: course.themeId ? String(course.themeId) : '',
          difficulty: course.difficulty ?? '',
          date: toDateInput(course.date),
          duration: course.duration,
          author: course.author ?? '',
          price: course.price ?? '',
          oldPrice: course.oldPrice,
          chapterCount: course.chapterCount === null ? '' : String(course.chapterCount),
          logo: course.logo,
          available: course.available,
        }}
      />

      <div className="adm-stack" style={{ marginTop: 24 }}>
        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <div className="adm-card-title">Support de cours</div>
              <div className="adm-card-hint">Fichier à télécharger depuis la page du cours et depuis ses vidéos.</div>
            </div>
          </div>
          <div className="adm-card-pad adm-fields">
            {!storageReady && (
              <Alert tone="warn">Stockage non configuré (<code>BLOB_READ_WRITE_TOKEN</code> absent) : l’envoi de fichiers est indisponible.</Alert>
            )}
            <SupportUploader
              courseId={course.id}
              supportName={course.supportName}
              downloadUrl={course.supportUrl ? getDownloadUrl(course.supportUrl) : null}
            />
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <div className="adm-card-title">Chapitres</div>
              <div className="adm-card-hint">Dans l’ordre d’affichage sur le site. Utilise les flèches pour réorganiser.</div>
            </div>
            <Link href={`/admin/chapters/new?course=${course.id}&from=${encodeURIComponent(here)}`} className="adm-btn adm-btn-primary adm-btn-sm" prefetch={false}>
              <Plus size={14} aria-hidden="true" /> Ajouter un chapitre
            </Link>
          </div>

          {course.chapters.length === 0 ? (
            <EmptyState icon={ListVideo} title="Aucun chapitre">Ajoute la première vidéo de ce cours.</EmptyState>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th style={{ width: 56 }}>#</th>
                    <th>Titre</th>
                    <th className="adm-hide-md">Type</th>
                    <th className="adm-hide-md">Durée</th>
                    <th>Vidéo</th>
                    <th>Statut</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {course.chapters.map((chapter, index) => {
                    const video = videoBadge(chapter.urlVideo)
                    const edit = `/admin/chapters/${chapter.id}?from=${encodeURIComponent(here)}`
                    return (
                      <tr key={chapter.id}>
                        <td className="adm-muted adm-num">{index + 1}</td>
                        <td>
                          <div className="adm-cell-title">
                            <div style={{ minWidth: 0 }}>
                              <Link href={edit} prefetch={false}>{chapter.title.trim()}</Link>
                              {chapter.chapterPart && chapter.chapterPart !== 'null' && <div className="adm-cell-sub">{chapter.chapterPart}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="adm-hide-md">{chapter.type ? <Badge tone="cyan">{CHAPTER_TYPE_LABELS[chapter.type]}</Badge> : <span className="adm-muted">—</span>}</td>
                        <td className="adm-muted adm-hide-md">{chapter.duration}</td>
                        <td><Badge tone={video.tone}>{video.label}</Badge></td>
                        <td><Badge tone={chapter.available ? 'green' : 'gray'}>{chapter.available ? 'Disponible' : 'Masqué'}</Badge></td>
                        <td>
                          <div className="adm-actions">
                            <form action={moveChapter}>
                              <input type="hidden" name="id" value={chapter.id} />
                              <input type="hidden" name="dir" value="up" />
                              <button type="submit" className="adm-icon-btn" disabled={index === 0} aria-label="Monter" title="Monter"><ArrowUp size={16} aria-hidden="true" /></button>
                            </form>
                            <form action={moveChapter}>
                              <input type="hidden" name="id" value={chapter.id} />
                              <input type="hidden" name="dir" value="down" />
                              <button type="submit" className="adm-icon-btn" disabled={index === course.chapters.length - 1} aria-label="Descendre" title="Descendre"><ArrowDown size={16} aria-hidden="true" /></button>
                            </form>
                            <Link href={edit} className="adm-icon-btn" aria-label={`Modifier ${chapter.title.trim()}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                            <ConfirmDelete
                              action={deleteChapter}
                              fields={{ id: chapter.id, returnTo: here }}
                              title={`Supprimer « ${chapter.title.trim()} » ?`}
                              description="Ce chapitre sera définitivement supprimé. Cette action est irréversible."
                              label={`Supprimer ${chapter.title.trim()}`}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="adm-card adm-danger-zone">
          <div className="adm-card-head">
            <div>
              <div className="adm-card-title">Zone dangereuse</div>
              <div className="adm-card-hint">Supprime ce cours, ses chapitres, son image et son support.</div>
            </div>
            <ConfirmDelete
              action={deleteCourse}
              fields={{ id: course.id }}
              variant="button"
              label="Supprimer le cours"
              title={`Supprimer « ${course.title.trim()} » ?`}
              description={<>Le cours et ses <strong>{course.chapters.length} chapitre{course.chapters.length > 1 ? 's' : ''}</strong> seront définitivement supprimés. Cette action est irréversible.</>}
            />
          </div>
        </section>
      </div>
    </>
  )
}
