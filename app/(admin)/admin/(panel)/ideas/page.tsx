import Link from 'next/link'
import { Lightbulb, Plus, Search } from 'lucide-react'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { param, type SearchParams } from '@/lib/admin/list'
import { formatDate } from '@/lib/admin/format'
import { EmptyState, PageHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteIdea } from './actions'

export default async function IdeasPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const admin = await requireAdmin()
  const q = param(await searchParams, 'q')

  // Espace personnel : on ne lit que les idées de l'administrateur connecté.
  const where: Prisma.VideoIdeaWhereInput = {
    userId: admin.id,
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
  }
  const ideas = await prisma.videoIdea.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    take: 200,
    include: { links: { orderBy: { position: 'asc' }, select: { videoId: true } } },
  })

  return (
    <>
      <PageHeader
        title="Idées de vidéos"
        subtitle="Ton carnet d’idées de formations, avec les vidéos qui t’inspirent. Visible uniquement par toi."
        actions={<Link href="/admin/ideas/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouvelle idée</Link>}
      />

      <div className="adm-card" style={{ marginBottom: 20 }}>
        <form method="get" action="/admin/ideas" className="adm-filters" role="search">
          <div className="adm-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" name="q" defaultValue={q} placeholder="Rechercher dans mes idées…" aria-label="Rechercher une idée" />
          </div>
          <button type="submit" className="adm-btn adm-btn-ghost">Rechercher</button>
          {q && <Link href="/admin/ideas" className="adm-btn adm-btn-ghost">Réinitialiser</Link>}
        </form>
      </div>

      {ideas.length === 0 ? (
        <div className="adm-card">
          <EmptyState icon={Lightbulb} title={q ? 'Aucune idée ne correspond' : 'Aucune idée pour le moment'}>
            {q ? 'Essaie un autre mot-clé.' : 'Note ta première idée de vidéo et ajoute des liens YouTube pour t’inspirer.'}
          </EmptyState>
        </div>
      ) : (
        <div className="adm-ideas">
          {ideas.map((idea) => (
            <article key={idea.id} className="adm-idea-card">
              {idea.links.length > 0 && (
                <Link href={`/admin/ideas/${idea.id}`} className="adm-idea-thumbs" prefetch={false} aria-hidden="true" tabIndex={-1}>
                  {idea.links.slice(0, 3).map((l) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={l.videoId} src={`https://i.ytimg.com/vi/${l.videoId}/mqdefault.jpg`} alt="" loading="lazy" />
                  ))}
                </Link>
              )}
              <div className="adm-idea-body">
                <Link href={`/admin/ideas/${idea.id}`} className="adm-idea-title" prefetch={false}>{idea.title}</Link>
                {idea.description && <p className="adm-idea-excerpt">{idea.description}</p>}
                <div className="adm-idea-meta">
                  <span>{idea.links.length} lien{idea.links.length > 1 ? 's' : ''} d’inspiration</span>
                  <span>Modifiée le {formatDate(idea.updatedAt)}</span>
                </div>
              </div>
              <div className="adm-idea-actions">
                <ConfirmDelete action={deleteIdea} fields={{ id: idea.id }} label={`Supprimer ${idea.title}`}
                  title={`Supprimer « ${idea.title} » ?`} description="Cette idée et ses liens seront définitivement supprimés." />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
