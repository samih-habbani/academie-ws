import Link from 'next/link'
import { Copy, ExternalLink, GraduationCap, Pencil, Plus } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { param, type SearchParams } from '@/lib/admin/list'
import { formatDate } from '@/lib/admin/format'
import { DOMAIN_LABELS, formatHours } from '@/lib/programs'
import { Badge, EmptyState, PageHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteProgram, duplicateProgram } from './actions'

// Dupliquer ne demande pas de confirmation : la copie est un brouillon, sans risque.
async function duplicate(formData: FormData) {
  'use server'
  await duplicateProgram(formData)
}

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()
  const sp = await searchParams
  const q = param(sp, 'q')
  const status = param(sp, 'status')

  const where: Prisma.ProgramWhereInput = {
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { tagline: { contains: q, mode: 'insensitive' } }] } : {}),
    ...(status === 'published' || status === 'draft' ? { status } : {}),
  }
  const programs = await prisma.program.findMany({
    where,
    orderBy: [{ position: 'asc' }, { updatedAt: 'desc' }],
    include: { modules: { select: { hours: true } }, _count: { select: { tools: true, certifications: true } } },
  })

  return (
    <>
      <PageHeader
        title="Programmes"
        subtitle="Le catalogue de programmes de formation pour tes clients (entreprises et centres de formation)."
        actions={<Link href="/admin/programs/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouveau programme</Link>}
      />
      <div className="adm-card">
        <form method="get" action="/admin/programs" className="adm-filters" role="search">
          <div className="adm-search"><input type="search" name="q" defaultValue={q} placeholder="Rechercher un programme…" aria-label="Rechercher un programme" /></div>
          <select name="status" defaultValue={status} aria-label="Statut">
            <option value="">Tous les statuts</option>
            <option value="published">Publiés</option>
            <option value="draft">Brouillons</option>
          </select>
          <button type="submit" className="adm-btn adm-btn-ghost">Filtrer</button>
          {(q || status) && <Link href="/admin/programs" className="adm-btn adm-btn-ghost">Réinitialiser</Link>}
        </form>

        {programs.length === 0 ? (
          <EmptyState icon={GraduationCap} title={q || status ? 'Aucun programme ne correspond' : 'Aucun programme'}>
            {q || status ? 'Modifie ou réinitialise les filtres.' : 'Crée ton premier programme pour l’afficher dans le catalogue.'}
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Programme</th><th className="adm-hide-md">Domaine</th><th>Durée</th><th className="adm-hide-md">Modifié</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {programs.map((p) => {
                  const hours = p.modules.reduce((s, m) => s + m.hours, 0)
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/admin/programs/${p.id}`} prefetch={false}>{p.title}</Link>
                        <div className="adm-cell-sub">{p.modules.length} module{p.modules.length > 1 ? 's' : ''} · {p._count.tools} outil{p._count.tools > 1 ? 's' : ''} · {p._count.certifications} certification{p._count.certifications > 1 ? 's' : ''}</div>
                      </td>
                      <td className="adm-hide-md">{(DOMAIN_LABELS as Record<string, string>)[p.domain] ?? p.domain}</td>
                      <td className="adm-muted">{hours ? formatHours(hours, p.hoursPerDay, 'fr') : '—'}</td>
                      <td className="adm-muted adm-hide-md">{formatDate(p.updatedAt)}</td>
                      <td><Badge tone={p.status === 'published' ? 'green' : 'gray'}>{p.status === 'published' ? 'Publié' : 'Brouillon'}</Badge></td>
                      <td>
                        <div className="adm-actions">
                          <Link href={`/admin/programs/${p.id}`} className="adm-icon-btn" aria-label={`Modifier ${p.title}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                          <a href={p.status === 'published' ? `/programs/${p.slug}` : `/programs/preview/${p.id}`} target="_blank" rel="noopener" className="adm-icon-btn" aria-label="Voir" title={p.status === 'published' ? 'Voir sur le site' : 'Aperçu du brouillon'}><ExternalLink size={16} aria-hidden="true" /></a>
                          <form action={duplicate}>
                            <input type="hidden" name="id" value={p.id} />
                            <button type="submit" className="adm-icon-btn" aria-label={`Dupliquer ${p.title}`} title="Dupliquer (crée un brouillon)"><Copy size={16} aria-hidden="true" /></button>
                          </form>
                          <ConfirmDelete action={deleteProgram} fields={{ id: p.id }} label={`Supprimer ${p.title}`}
                            title={`Supprimer « ${p.title} » ?`} description="Ce programme, ses modules et ses ateliers seront définitivement supprimés." />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
