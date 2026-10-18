import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ProgramForm from '../ProgramForm'
import { createProgram } from '../actions'
import { emptyProgram, loadChoices } from '../data'

export default async function NewProgramPage() {
  await requireAdmin()
  const choices = await loadChoices()
  return (
    <>
      <PageHeader title="Nouveau programme" crumbs={[{ label: 'Programmes', href: '/admin/programs' }, { label: 'Nouveau' }]} />
      <ProgramForm action={createProgram} initial={emptyProgram} cancelHref="/admin/programs" submitLabel="Créer le programme" {...choices} />
    </>
  )
}
