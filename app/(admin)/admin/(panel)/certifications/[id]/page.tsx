import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import CertificationForm from '../CertificationForm'
import { deleteCertification, updateCertification } from '../actions'

export default async function EditCertificationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const c = await prisma.certification.findUnique({ where: { id }, include: { _count: { select: { programs: true } } } })
  if (!c) notFound()
  return (
    <>
      <PageHeader title={c.name} crumbs={[{ label: 'Certifications', href: '/admin/certifications' }, { label: c.name }]}
        subtitle={`Rattachée à ${c._count.programs} programme${c._count.programs > 1 ? 's' : ''}`} />
      <CertificationForm action={updateCertification.bind(null, c.id)} submitLabel="Enregistrer"
        initial={{ name: c.name, issuer: c.issuer, reference: c.reference, level: c.level, description: c.description, url: c.url, logo: c.logo }} />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24, maxWidth: 760 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">La certification sera retirée des programmes qui l’utilisent.</div>
          </div>
          <ConfirmDelete action={deleteCertification} fields={{ id: c.id }} variant="button" label="Supprimer la certification"
            title={`Supprimer « ${c.name} » ?`} description="Cette certification sera définitivement supprimée et retirée des programmes." />
        </div>
      </section>
    </>
  )
}
