import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { BookOpen, ExternalLink, ImageIcon, Paperclip, Pencil, Plus, Search } from 'lucide-react'
import { prisma } from '@/lib/db'
import { courseUrl } from '@/lib/urls'
import { requireAdmin } from '@/lib/admin-auth'
import { PAGE_SIZE, intParam, pageParam, param, sortParam, type SearchParams } from '@/lib/admin/list'
import { DIFFICULTY_LABELS, formatDate } from '@/lib/admin/format'
import { mediaSrc } from '@/lib/media'
import { Badge, EmptyState, PageHeader, Pagination, SortHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteCourse } from './actions'

const BASE = '/admin/courses'
const SORTS = ['id', 'title', 'date'] as const

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()
  const sp = await searchParams

  const q = param(sp, 'q')
  const category = intParam(sp, 'category')
  const status = param(sp, 'status')
  const page = pageParam(sp)
  const sort = sortParam(sp, SORTS, 'id', 'desc')

  const where: Prisma.CourseWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, ...(/^\d+$/.test(q) ? [{ id: Number(q) }] : [])] } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(status === 'visible' ? { available: true } : status === 'hidden' ? { available: false } : {}),
  }

  const [total, courses, categories] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy: [{ [sort.field]: sort.dir }, { id: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, slug: true, title: true, logo: true, date: true, difficulty: true, available: true, supportUrl: true,
        category: { select: { title: true } },
        theme: { select: { title: true } },
        _count: { select: { chapters: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { orderCategory: 'asc' }, select: { id: true, title: true } }),
  ])

  const filtered = Boolean(q || category || status)

  return (
    <>
      <PageHeader
        title="Cours"
        subtitle="Crée, modifie et organise les cours : informations, image, chapitres et support à télécharger."
        actions={<Link href="/admin/courses/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouveau cours</Link>}
      />

      <div className="adm-card">
        <form method="get" action={BASE} className="adm-filters" role="search">
          <div className="adm-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" name="q" defaultValue={q} placeholder="Rechercher un titre ou un n°…" aria-label="Rechercher un cours" />
          </div>
          <select name="category" defaultValue={category ?? ''} aria-label="Catégorie">
            <option value="">Toutes les catégories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <select name="status" defaultValue={status} aria-label="Statut">
            <option value="">Tous les statuts</option>
            <option value="visible">Visibles</option>
            <option value="hidden">Masqués</option>
          </select>
          <button type="submit" className="adm-btn adm-btn-ghost">Filtrer</button>
          {filtered && <Link href={BASE} className="adm-btn adm-btn-ghost">Réinitialiser</Link>}
        </form>

        {courses.length === 0 ? (
          <EmptyState icon={BookOpen} title={filtered ? 'Aucun cours ne correspond' : 'Aucun cours pour le moment'}>
            {filtered ? 'Essaie de modifier ou de réinitialiser les filtres.' : 'Crée ton premier cours pour le voir apparaître ici.'}
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader label="Cours" field="title" basePath={BASE} sp={sp} current={sort} />
                  <th>Catégorie</th>
                  <th className="adm-hide-md">Niveau</th>
                  <th>Chap.</th>
                  <th>Statut</th>
                  <SortHeader label="Date" field="date" basePath={BASE} sp={sp} current={sort} className="adm-hide-md" />
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <div className="adm-cell-title">
                        {course.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="adm-thumb" src={mediaSrc('courses', course.logo)} alt="" loading="lazy" />
                        ) : (
                          <span className="adm-thumb adm-thumb-empty"><ImageIcon size={16} aria-hidden="true" /></span>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/courses/${course.id}`} prefetch={false}>{course.title.trim()}</Link>
                          <div className="adm-cell-sub">
                            n° {course.id}{course.theme ? ` · ${course.theme.title}` : ''}
                            {course.supportUrl && <span title="Support de cours disponible" style={{ marginLeft: 8, color: 'var(--purple-l)' }}><Paperclip size={12} style={{ verticalAlign: '-1px' }} aria-label="Support de cours disponible" /></span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{course.category.title}</td>
                    <td className="adm-hide-md">{course.difficulty ? <Badge tone="purple">{DIFFICULTY_LABELS[course.difficulty]}</Badge> : <span className="adm-muted">—</span>}</td>
                    <td className="adm-num">{course._count.chapters}</td>
                    <td><Badge tone={course.available ? 'green' : 'gray'}>{course.available ? 'Visible' : 'Masqué'}</Badge></td>
                    <td className="adm-muted adm-num adm-hide-md">{formatDate(course.date)}</td>
                    <td>
                      <div className="adm-actions">
                        <Link href={`/admin/courses/${course.id}`} className="adm-icon-btn" aria-label={`Modifier ${course.title.trim()}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                        <a href={courseUrl(course.slug)} target="_blank" rel="noopener" className="adm-icon-btn" aria-label="Voir sur le site" title="Voir sur le site"><ExternalLink size={16} aria-hidden="true" /></a>
                        <ConfirmDelete
                          action={deleteCourse}
                          fields={{ id: course.id }}
                          title={`Supprimer « ${course.title.trim()} » ?`}
                          description={<>Le cours et ses <strong>{course._count.chapters} chapitre{course._count.chapters > 1 ? 's' : ''}</strong> seront définitivement supprimés. Cette action est irréversible.</>}
                          label={`Supprimer ${course.title.trim()}`}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination basePath={BASE} sp={sp} page={page} total={total} noun="cours" plural="cours" />
      </div>
    </>
  )
}
