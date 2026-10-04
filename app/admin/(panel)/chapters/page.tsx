import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { ExternalLink, ListVideo, Pencil, Plus, Search } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PAGE_SIZE, intParam, pageParam, param, sortParam, type SearchParams } from '@/lib/admin/list'
import { CHAPTER_TYPE_LABELS } from '@/lib/admin/format'
import { getYoutubeVideoId } from '@/lib/youtube'
import { Badge, EmptyState, PageHeader, Pagination, SortHeader, type Tone } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteChapter } from './actions'

const BASE = '/admin/chapters'
const SORTS = ['order', 'title', 'id'] as const

function videoBadge(url: string): { tone: Tone; label: string } {
  if (getYoutubeVideoId(url)) return { tone: 'green', label: 'YouTube' }
  if (url.trim() === '') return { tone: 'gray', label: 'Aucune' }
  if (/vimeo/i.test(url)) return { tone: 'amber', label: 'Vimeo' }
  return { tone: 'red', label: 'Invalide' }
}

export default async function ChaptersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()
  const sp = await searchParams

  const q = param(sp, 'q')
  const course = intParam(sp, 'course')
  const type = param(sp, 'type')
  const status = param(sp, 'status')
  const video = param(sp, 'video')
  const page = pageParam(sp)
  const sort = sortParam(sp, SORTS, 'order', 'asc')

  const where: Prisma.ChapterWhereInput = {
    ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
    ...(course ? { courseId: course } : {}),
    ...(['cours', 'exo', 'tp', 'quiz'].includes(type) ? { type: type as 'cours' | 'exo' | 'tp' | 'quiz' } : {}),
    ...(status === 'visible' ? { available: true } : status === 'hidden' ? { available: false } : {}),
    ...(video === 'youtube' ? { urlVideo: { contains: 'youtu' } } : {}),
    ...(video === 'vimeo' ? { urlVideo: { contains: 'vimeo', mode: 'insensitive' } } : {}),
    ...(video === 'empty' ? { urlVideo: '' } : {}),
  }

  const orderBy: Prisma.ChapterOrderByWithRelationInput[] =
    sort.field === 'order' ? [{ courseId: 'asc' }, { numOrder: sort.dir }, { id: 'asc' }]
    : sort.field === 'title' ? [{ title: sort.dir }]
    : [{ id: sort.dir }]

  const [total, chapters, courses] = await Promise.all([
    prisma.chapter.count({ where }),
    prisma.chapter.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, title: true, numOrder: true, type: true, duration: true, urlVideo: true, available: true, chapterPart: true, courseId: true,
        course: { select: { id: true, title: true } },
      },
    }),
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])

  const filtered = Boolean(q || course || type || status || video)
  const here = `${BASE}${filtered || page > 1 ? `?${new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === 'string' && v && k !== 'ok' && k !== 'error' ? [[k, v]] : []))).toString()}` : ''}`

  return (
    <>
      <PageHeader
        title="Chapitres"
        subtitle="Toutes les vidéos du site. Filtre par cours ou par type de vidéo pour repérer celles qui restent à migrer vers YouTube."
        actions={
          <Link href={`/admin/chapters/new${course ? `?course=${course}` : ''}`} className="adm-btn adm-btn-primary" prefetch={false}>
            <Plus size={16} aria-hidden="true" /> Nouveau chapitre
          </Link>
        }
      />

      <div className="adm-card">
        <form method="get" action={BASE} className="adm-filters" role="search">
          <div className="adm-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" name="q" defaultValue={q} placeholder="Rechercher un titre…" aria-label="Rechercher un chapitre" />
          </div>
          <select name="course" defaultValue={course ?? ''} aria-label="Cours">
            <option value="">Tous les cours</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title.trim()}</option>)}
          </select>
          <select name="video" defaultValue={video} aria-label="Type de vidéo">
            <option value="">Toutes les vidéos</option>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo (à migrer)</option>
            <option value="empty">Sans vidéo</option>
          </select>
          <select name="type" defaultValue={type} aria-label="Type de chapitre">
            <option value="">Tous les types</option>
            <option value="cours">Cours</option>
            <option value="exo">Exercice</option>
            <option value="tp">TP</option>
            <option value="quiz">Quiz</option>
          </select>
          <select name="status" defaultValue={status} aria-label="Statut">
            <option value="">Tous les statuts</option>
            <option value="visible">Disponibles</option>
            <option value="hidden">Masqués</option>
          </select>
          <button type="submit" className="adm-btn adm-btn-ghost">Filtrer</button>
          {filtered && <Link href={BASE} className="adm-btn adm-btn-ghost">Réinitialiser</Link>}
        </form>

        {chapters.length === 0 ? (
          <EmptyState icon={ListVideo} title={filtered ? 'Aucun chapitre ne correspond' : 'Aucun chapitre'}>
            {filtered ? 'Essaie de modifier ou de réinitialiser les filtres.' : 'Ajoute des vidéos à tes cours.'}
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader label="Pos." field="order" basePath={BASE} sp={sp} current={sort} />
                  <SortHeader label="Chapitre" field="title" basePath={BASE} sp={sp} current={sort} />
                  <th>Cours</th>
                  <th className="adm-hide-md">Type</th>
                  <th className="adm-hide-md">Durée</th>
                  <th>Vidéo</th>
                  <th>Statut</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {chapters.map((chapter) => {
                  const badge = videoBadge(chapter.urlVideo)
                  const edit = `/admin/chapters/${chapter.id}?from=${encodeURIComponent(here)}`
                  return (
                    <tr key={chapter.id}>
                      <td className="adm-muted adm-num">{chapter.numOrder}</td>
                      <td>
                        <div className="adm-cell-title">
                          <div style={{ minWidth: 0 }}>
                            <Link href={edit} prefetch={false}>{chapter.title.trim()}</Link>
                            {chapter.chapterPart && chapter.chapterPart !== 'null' && <div className="adm-cell-sub">{chapter.chapterPart}</div>}
                          </div>
                        </div>
                      </td>
                      <td><Link href={`/admin/courses/${chapter.courseId}`} style={{ color: 'var(--text-m)' }} prefetch={false}>{chapter.course.title.trim()}</Link></td>
                      <td className="adm-hide-md">{chapter.type ? <Badge tone="cyan">{CHAPTER_TYPE_LABELS[chapter.type]}</Badge> : <span className="adm-muted">—</span>}</td>
                      <td className="adm-muted adm-hide-md">{chapter.duration}</td>
                      <td><Badge tone={badge.tone}>{badge.label}</Badge></td>
                      <td><Badge tone={chapter.available ? 'green' : 'gray'}>{chapter.available ? 'Disponible' : 'Masqué'}</Badge></td>
                      <td>
                        <div className="adm-actions">
                          <Link href={edit} className="adm-icon-btn" aria-label={`Modifier ${chapter.title.trim()}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                          <a href={`/cours/${chapter.courseId}/chapitre/${chapter.id}`} target="_blank" rel="noopener" className="adm-icon-btn" aria-label="Voir sur le site" title="Voir sur le site"><ExternalLink size={16} aria-hidden="true" /></a>
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

        <Pagination basePath={BASE} sp={sp} page={page} total={total} noun="chapitre" />
      </div>
    </>
  )
}
