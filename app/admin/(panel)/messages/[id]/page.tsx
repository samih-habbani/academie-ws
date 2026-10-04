import { notFound } from 'next/navigation'
import { Mail, MailOpen, Phone, Reply } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { formatDateTime } from '@/lib/admin/format'
import { Badge, PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import MarkRead from '../MarkRead'
import { deleteMessage, toggleMessageRead } from '../actions'

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const message = await prisma.contact.findUnique({ where: { id } })
  if (!message) notFound()

  const fullName = `${message.firstName} ${message.lastName}`
  const reply = `mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`

  return (
    <>
      <MarkRead id={message.id} isRead={message.isRead} />
      <PageHeader
        title={message.subject}
        subtitle={<>De <strong>{fullName}</strong> · {formatDateTime(message.createdAt)} {message.isRead ? <Badge tone="gray">Lu</Badge> : <Badge tone="purple">Nouveau</Badge>}</>}
        crumbs={[{ label: 'Messages', href: '/admin/messages' }, { label: message.subject }]}
        actions={
          <>
            <a href={reply} className="adm-btn adm-btn-primary"><Reply size={16} aria-hidden="true" /> Répondre</a>
            <form action={toggleMessageRead}>
              <input type="hidden" name="id" value={message.id} />
              <input type="hidden" name="read" value={String(message.isRead)} />
              <button type="submit" className="adm-btn adm-btn-ghost">
                {message.isRead ? <Mail size={15} aria-hidden="true" /> : <MailOpen size={15} aria-hidden="true" />}
                {message.isRead ? 'Marquer comme non lu' : 'Marquer comme lu'}
              </button>
            </form>
            <ConfirmDelete action={deleteMessage} fields={{ id: message.id, returnTo: '/admin/messages' }} variant="button" label="Supprimer"
              title="Supprimer ce message ?" description="Ce message sera définitivement supprimé." />
          </>
        }
      />

      <div className="adm-form-layout">
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Message</div></div>
          <div className="adm-card-pad adm-message-body">{message.message}</div>
        </section>

        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Expéditeur</div></div>
          <div className="adm-card-pad adm-fields">
            <div className="adm-field"><span className="adm-label">Nom</span><span>{fullName}</span></div>
            <div className="adm-field"><span className="adm-label">Email</span><a href={`mailto:${message.email}`} style={{ color: 'var(--purple-l)' }}>{message.email}</a></div>
            {message.phone && (
              <div className="adm-field">
                <span className="adm-label">Téléphone</span>
                <a href={`tel:${message.phone}`} style={{ color: 'var(--purple-l)', display: 'inline-flex', gap: 6, alignItems: 'center' }}><Phone size={13} aria-hidden="true" /> {message.phone}</a>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
