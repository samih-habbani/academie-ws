import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Pencil, Plus, Search, Users } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PAGE_SIZE, pageParam, param, sortParam, type SearchParams } from '@/lib/admin/list'
import { ROLE_ADMIN, isAdmin } from '@/lib/admin/roles'
import { Badge, EmptyState, PageHeader, Pagination, SortHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteUser } from './actions'

const BASE = '/admin/users'
const SORTS = ['id', 'email'] as const

export default async function UsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const me = await requireAdmin()
  const sp = await searchParams

  const q = param(sp, 'q')
  const role = param(sp, 'role')
  const page = pageParam(sp)
  const sort = sortParam(sp, SORTS, 'id', 'desc')

  const where: Prisma.UserWhereInput = {
    ...(q ? { email: { contains: q, mode: 'insensitive' } } : {}),
    ...(role === 'admin' ? { roles: { array_contains: [ROLE_ADMIN] } } : {}),
    ...(role === 'user' ? { NOT: { roles: { array_contains: [ROLE_ADMIN] } } } : {}),
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { [sort.field]: sort.dir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, email: true, roles: true },
    }),
  ])

  const filtered = Boolean(q || role)

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Les comptes du site. Les administrateurs ont accès à ce back-office."
        actions={<Link href="/admin/users/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouvel utilisateur</Link>}
      />
      <div className="adm-card">
        <form method="get" action={BASE} className="adm-filters" role="search">
          <div className="adm-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" name="q" defaultValue={q} placeholder="Rechercher un email…" aria-label="Rechercher un utilisateur" />
          </div>
          <select name="role" defaultValue={role} aria-label="Rôle">
            <option value="">Tous les rôles</option>
            <option value="admin">Administrateurs</option>
            <option value="user">Utilisateurs</option>
          </select>
          <button type="submit" className="adm-btn adm-btn-ghost">Filtrer</button>
          {filtered && <Link href={BASE} className="adm-btn adm-btn-ghost">Réinitialiser</Link>}
        </form>

        {users.length === 0 ? (
          <EmptyState icon={Users} title={filtered ? 'Aucun utilisateur ne correspond' : 'Aucun utilisateur'}>
            {filtered ? 'Essaie de modifier ou de réinitialiser les filtres.' : undefined}
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <SortHeader label="N°" field="id" basePath={BASE} sp={sp} current={sort} />
                  <SortHeader label="Email" field="email" basePath={BASE} sp={sp} current={sort} />
                  <th>Rôle</th>
                  <th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const self = user.id === me.id
                  return (
                    <tr key={user.id}>
                      <td className="adm-muted adm-num">{user.id}</td>
                      <td>
                        <div className="adm-cell-title">
                          <Link href={`/admin/users/${user.id}`} prefetch={false}>{user.email}</Link>
                          {self && <Badge tone="purple">Toi</Badge>}
                        </div>
                      </td>
                      <td>{isAdmin(user.roles) ? <Badge tone="amber">Administrateur</Badge> : <Badge tone="gray">Utilisateur</Badge>}</td>
                      <td>
                        <div className="adm-actions">
                          <Link href={`/admin/users/${user.id}`} className="adm-icon-btn" aria-label={`Modifier ${user.email}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                          <ConfirmDelete action={deleteUser} fields={{ id: user.id }} label={`Supprimer ${user.email}`}
                            disabled={self} disabledReason="Tu ne peux pas supprimer ton propre compte"
                            title={`Supprimer ${user.email} ?`} description="Ce compte sera définitivement supprimé. Cette action est irréversible." />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination basePath={BASE} sp={sp} page={page} total={total} noun="utilisateur" />
      </div>
    </>
  )
}
