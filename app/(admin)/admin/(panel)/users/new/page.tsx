import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import UserForm from '../UserForm'
import { createUser } from '../actions'

export default async function NewUserPage() {
  await requireAdmin()
  return (
    <>
      <PageHeader title="Nouvel utilisateur" crumbs={[{ label: 'Utilisateurs', href: '/admin/users' }, { label: 'Nouveau' }]} />
      <UserForm action={createUser} submitLabel="Créer l’utilisateur" isNew isSelf={false} initial={{ email: '', admin: false }} />
    </>
  )
}
