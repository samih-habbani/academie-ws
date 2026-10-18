import Link from 'next/link'
import { Award, Pencil, Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { EmptyState, PageHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteCertification } from './actions'

export default async function CertificationsPage() {
  await requireAdmin()
  const items = await prisma.certification.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { programs: true } } } })
  return (
    <>
      <PageHeader title="Certifications" subtitle="Les certifications préparées ou délivrées, à rattacher à tes programmes."
        actions={<Link href="/admin/certifications/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouvelle certification</Link>} />
      <div className="adm-card">
        {items.length === 0 ? (
          <EmptyState icon={Award} title="Aucune certification">Ajoute une certification pour l’afficher sur les programmes concernés.</EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Certification</th><th className="adm-hide-md">Organisme</th><th className="adm-hide-md">Référence</th><th>Programmes</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/certifications/${c.id}`} prefetch={false}>{c.name}</Link>
                      {c.level && <div className="adm-cell-sub">{c.level}</div>}
                    </td>
                    <td className="adm-muted adm-hide-md">{c.issuer || '—'}</td>
                    <td className="adm-muted adm-hide-md">{c.reference || '—'}</td>
                    <td className="adm-num">{c._count.programs}</td>
                    <td>
                      <div className="adm-actions">
                        <Link href={`/admin/certifications/${c.id}`} className="adm-icon-btn" aria-label={`Modifier ${c.name}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                        <ConfirmDelete action={deleteCertification} fields={{ id: c.id }} label={`Supprimer ${c.name}`}
                          title={`Supprimer « ${c.name} » ?`} description="Cette certification sera définitivement supprimée et retirée des programmes." />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
