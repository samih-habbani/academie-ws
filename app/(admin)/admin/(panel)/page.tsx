import Link from 'next/link'
import { BookOpen, ExternalLink, Inbox, ListVideo, Plus, Users, Video } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { Alert, Badge, EmptyState, PageHeader } from '../_components/ui'
import { formatDate } from '@/lib/admin/format'

export default async function DashboardPage() {
  await requireAdmin()

  const [courses, visibleCourses, chapters, availableChapters, youtubeChapters, users, unread, totalMessages, withSupport, recentCourses, recentMessages] =
    await Promise.all([
      prisma.course.count(),
      prisma.course.count({ where: { available: true } }),
      prisma.chapter.count(),
      prisma.chapter.count({ where: { available: true } }),
      prisma.chapter.count({ where: { available: true, urlVideo: { contains: 'youtu' } } }),
      prisma.user.count(),
      prisma.contact.count({ where: { isRead: false } }),
      prisma.contact.count(),
      prisma.course.count({ where: { supportUrl: { not: null } } }),
      prisma.course.findMany({ orderBy: { id: 'desc' }, take: 5, select: { id: true, title: true, available: true, date: true, category: { select: { title: true } } } }),
      prisma.contact.findMany({ orderBy: { id: 'desc' }, take: 5, select: { id: true, firstName: true, lastName: true, subject: true, isRead: true, createdAt: true } }),
    ])

  const storageReady = Boolean(process.env.BLOB_READ_WRITE_TOKEN)
  const migrated = availableChapters === 0 ? 0 : Math.round((youtubeChapters / availableChapters) * 100)

  const stats = [
    { href: '/admin/courses', icon: BookOpen, label: `${visibleCourses} visible${visibleCourses > 1 ? 's' : ''} sur le site`, title: 'Cours', value: courses, color: 'var(--purple-l)', bg: 'rgba(124,58,237,.15)' },
    { href: '/admin/chapters', icon: ListVideo, label: `${availableChapters} disponible${availableChapters > 1 ? 's' : ''}`, title: 'Chapitres', value: chapters, color: 'var(--cyan)', bg: 'rgba(34,211,238,.12)' },
    { href: '/admin/users', icon: Users, label: 'comptes enregistrés', title: 'Utilisateurs', value: users, color: 'var(--success)', bg: 'rgba(16,185,129,.12)' },
    { href: '/admin/messages', icon: Inbox, label: `${unread} non lu${unread > 1 ? 's' : ''} sur ${totalMessages}`, title: 'Messages', value: unread, color: 'var(--amber)', bg: 'rgba(245,158,11,.12)' },
  ]

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d’ensemble du site et accès rapide à la gestion du contenu."
        actions={
          <>
            <a href="/" target="_blank" rel="noopener" className="adm-btn adm-btn-ghost"><ExternalLink size={15} aria-hidden="true" /> Voir le site</a>
            <Link href="/admin/courses/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouveau cours</Link>
          </>
        }
      />

      {!storageReady && (
        <div style={{ marginBottom: 20 }}>
          <Alert tone="warn">
            Stockage de fichiers non configuré : la variable <code>BLOB_READ_WRITE_TOKEN</code> est absente. L’envoi d’images et de
            supports de cours est désactivé. Crée un store <strong>Vercel Blob</strong>, relie-le au projet, puis redéploie.
          </Alert>
        </div>
      )}

      <div className="adm-stats">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.href} href={s.href} className="adm-card adm-stat" prefetch={false}>
              <div className="adm-stat-icon" style={{ background: s.bg, color: s.color }}><Icon size={22} aria-hidden="true" /></div>
              <div>
                <div className="adm-stat-value">{s.value}</div>
                <div className="adm-stat-label"><strong style={{ color: 'var(--text)' }}>{s.title}</strong> · {s.label}</div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="adm-card adm-card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Video size={20} color="var(--purple-l)" aria-hidden="true" />
            <div>
              <div className="adm-card-title">Migration des vidéos vers YouTube</div>
              <div className="adm-card-hint">{youtubeChapters} chapitre{youtubeChapters > 1 ? 's' : ''} sur {availableChapters} disponible{availableChapters > 1 ? 's' : ''} ont une vidéo YouTube · {withSupport} cours avec un support</div>
            </div>
          </div>
          <Link href="/admin/chapters?video=vimeo" className="adm-btn adm-btn-ghost adm-btn-sm" prefetch={false}>Voir les vidéos Vimeo restantes</Link>
        </div>
        <div className="adm-progress" role="progressbar" aria-valuenow={migrated} aria-valuemin={0} aria-valuemax={100} aria-label="Avancement de la migration YouTube">
          <div className="adm-progress-bar" style={{ width: `${migrated}%` }} />
        </div>
        <div className="adm-muted" style={{ fontSize: 12.5, marginTop: 8 }}>{migrated} % migrés</div>
      </div>

      <div className="adm-grid-2">
        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-card-title">Derniers cours</div>
            <Link href="/admin/courses" className="adm-btn adm-btn-ghost adm-btn-sm" prefetch={false}>Tout voir</Link>
          </div>
          {recentCourses.length === 0 ? (
            <EmptyState icon={BookOpen} title="Aucun cours" />
          ) : (
            recentCourses.map((c) => (
              <Link key={c.id} href={`/admin/courses/${c.id}`} className="adm-list-item" prefetch={false}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title.trim()}</div>
                  <div className="adm-cell-sub">{c.category.title} · {formatDate(c.date)}</div>
                </div>
                <Badge tone={c.available ? 'green' : 'gray'}>{c.available ? 'Visible' : 'Masqué'}</Badge>
              </Link>
            ))
          )}
        </div>

        <div className="adm-card">
          <div className="adm-card-head">
            <div className="adm-card-title">Derniers messages</div>
            <Link href="/admin/messages" className="adm-btn adm-btn-ghost adm-btn-sm" prefetch={false}>Tout voir</Link>
          </div>
          {recentMessages.length === 0 ? (
            <EmptyState icon={Inbox} title="Aucun message" />
          ) : (
            recentMessages.map((m) => (
              <Link key={m.id} href={`/admin/messages/${m.id}`} className="adm-list-item" prefetch={false}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: m.isRead ? 500 : 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.subject}</div>
                  <div className="adm-cell-sub">{m.firstName} {m.lastName} · {formatDate(m.createdAt)}</div>
                </div>
                {!m.isRead && <Badge tone="purple">Nouveau</Badge>}
              </Link>
            ))
          )}
        </div>
      </div>
    </>
  )
}
