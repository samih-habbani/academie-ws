import Link from 'next/link'
import type { Prisma } from '@prisma/client'
import { Eye, Inbox, Mail, MailOpen, Search } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PAGE_SIZE, pageParam, param, type SearchParams } from '@/lib/admin/list'
import { formatDateTime } from '@/lib/admin/format'
import { Badge, EmptyState, PageHeader, Pagination } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteMessage, toggleMessageRead } from './actions'

const BASE = '/admin/messages'

export default async function MessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin()
  const sp = await searchParams

  const q = param(sp, 'q')
  const status = param(sp, 'status')
  const page = pageParam(sp)

  const where: Prisma.ContactWhereInput = {
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { message: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(status === 'unread' ? { isRead: false } : status === 'read' ? { isRead: true } : {}),
  }

  const [total, messages] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { id: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, firstName: true, lastName: true, email: true, subject: true, isRead: true, createdAt: true },
    }),
  ])

  const filtered = Boolean(q || status)

  return (
    <>
      <PageHeader title="Messages" subtitle="Les messages envoyés depuis le formulaire de contact du site." />
      <div className="adm-card">
        <form method="get" action={BASE} className="adm-filters" role="search">
          <div className="adm-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" name="q" defaultValue={q} placeholder="Rechercher un nom, un email, un sujet…" aria-label="Rechercher un message" />
          </div>
          <select name="status" defaultValue={status} aria-label="Statut">
            <option value="">Tous les messages</option>
            <option value="unread">Non lus</option>
            <option value="read">Lus</option>
          </select>
          <button type="submit" className="adm-btn adm-btn-ghost">Filtrer</button>
          {filtered && <Link href={BASE} className="adm-btn adm-btn-ghost">Réinitialiser</Link>}
        </form>

        {messages.length === 0 ? (
          <EmptyState icon={Inbox} title={filtered ? 'Aucun message ne correspond' : 'Aucun message'}>
            {filtered ? 'Essaie de modifier ou de réinitialiser les filtres.' : 'Les messages du formulaire de contact apparaîtront ici.'}
          </EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th>Expéditeur</th><th>Sujet</th><th>Reçu le</th><th>Statut</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {messages.map((m) => (
                  <tr key={m.id} className={m.isRead ? undefined : 'adm-row-unread'}>
                    <td>
                      <div className="adm-cell-title">
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/messages/${m.id}`} prefetch={false}>{m.firstName} {m.lastName}</Link>
                          <div className="adm-cell-sub">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: m.isRead ? 400 : 600 }}>{m.subject}</td>
                    <td className="adm-muted adm-num">{formatDateTime(m.createdAt)}</td>
                    <td>{m.isRead ? <Badge tone="gray">Lu</Badge> : <Badge tone="purple">Nouveau</Badge>}</td>
                    <td>
                      <div className="adm-actions">
                        <Link href={`/admin/messages/${m.id}`} className="adm-icon-btn" aria-label="Ouvrir le message" title="Ouvrir" prefetch={false}><Eye size={16} aria-hidden="true" /></Link>
                        <form action={toggleMessageRead}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="read" value={String(!m.isRead)} />
                          <button type="submit" className="adm-icon-btn" aria-label={m.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'} title={m.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}>
                            {m.isRead ? <Mail size={16} aria-hidden="true" /> : <MailOpen size={16} aria-hidden="true" />}
                          </button>
                        </form>
                        <ConfirmDelete action={deleteMessage} fields={{ id: m.id, returnTo: BASE }} label="Supprimer le message"
                          title="Supprimer ce message ?" description={<>Le message de <strong>{m.firstName} {m.lastName}</strong> sera définitivement supprimé.</>} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination basePath={BASE} sp={sp} page={page} total={total} noun="message" />
      </div>
    </>
  )
}
