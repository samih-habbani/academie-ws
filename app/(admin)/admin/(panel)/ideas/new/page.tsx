import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import IdeaForm from '../IdeaForm'
import { createIdea } from '../actions'

export default async function NewIdeaPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Nouvelle idée" crumbs={[{ label: 'Idées de vidéos', href: '/admin/ideas' }, { label: 'Nouvelle' }]} />
      <IdeaForm action={createIdea} cancelHref="/admin/ideas" submitLabel="Enregistrer l’idée" initial={{ title: '', description: '', links: [] }} />
    </>
  )
}
