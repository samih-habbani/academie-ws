import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import CertificationForm from '../CertificationForm'
import { createCertification } from '../actions'

export default async function NewCertificationPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Nouvelle certification" crumbs={[{ label: 'Certifications', href: '/admin/certifications' }, { label: 'Nouvelle' }]} />
      <CertificationForm action={createCertification} submitLabel="Créer la certification" initial={{ name: '', issuer: '', reference: '', level: '', description: '', url: '', logo: '' }} />
    </>
  )
}
