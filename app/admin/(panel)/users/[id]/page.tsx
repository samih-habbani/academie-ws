import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { isAdmin } from '@/lib/admin/roles'
import { Badge, PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import UserForm from '../UserForm'
import { deleteUser, updateUser } from '../actions'

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, email: true, roles: true } })
  if (!user) notFound()
  const isSelf = user.id === me.id

  return (
    <>
      <PageHeader
        title={user.email}
        subtitle={<>Utilisateur n° {user.id} {isSelf && <Badge tone="purple">C’est toi</Badge>}</>}
        crumbs={[{ label: 'Utilisateurs', href: '/admin/users' }, { label: user.email }]}
      />
      <UserForm
        action={updateUser.bind(null, user.id)}
        submitLabel="Enregistrer les modifications"
        isNew={false}
        isSelf={isSelf}
        initial={{ email: user.email, admin: isAdmin(user.roles) }}
      />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24, maxWidth: 760 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">{isSelf ? 'Tu ne peux pas supprimer ton propre compte.' : 'Supprime définitivement ce compte.'}</div>
          </div>
          <ConfirmDelete action={deleteUser} fields={{ id: user.id }} variant="button" label="Supprimer l’utilisateur"
            disabled={isSelf} disabledReason="Tu ne peux pas supprimer ton propre compte"
            title={`Supprimer ${user.email} ?`} description="Ce compte sera définitivement supprimé. Cette action est irréversible." />
        </div>
      </section>
    </>
  )
}
