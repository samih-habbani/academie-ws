import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ToolForm from '../ToolForm'
import { createTool } from '../actions'

export default async function NewToolPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Nouvel outil" crumbs={[{ label: 'Outils', href: '/admin/tools' }, { label: 'Nouveau' }]} />
      <ToolForm action={createTool} submitLabel="Créer l’outil" initial={{ name: '', logo: '', url: '' }} />
    </>
  )
}
