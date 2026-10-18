import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { formatDate } from '@/lib/admin/format'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import IdeaForm from '../IdeaForm'
import { deleteIdea, updateIdea } from '../actions'

export default async function EditIdeaPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  // Une idée n'est accessible qu'à son auteur : l'identifiant seul ne suffit pas.
  const idea = await prisma.videoIdea.findFirst({
    where: { id, userId: admin.id },
    include: { links: { orderBy: { position: 'asc' } } },
  })
  if (!idea) notFound()

  return (
    <>
      <PageHeader
        title={idea.title}
        crumbs={[{ label: 'Idées de vidéos', href: '/admin/ideas' }, { label: idea.title }]}
        subtitle={<>Créée le {formatDate(idea.createdAt)} · modifiée le {formatDate(idea.updatedAt)}</>}
      />
      <IdeaForm
        action={updateIdea.bind(null, idea.id)}
        cancelHref="/admin/ideas"
        submitLabel="Enregistrer les modifications"
        initial={{
          title: idea.title,
          description: idea.description,
          links: idea.links.map((l) => ({ url: l.url, title: l.title, author: l.author })),
        }}
      />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24, maxWidth: 820 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">Supprime définitivement cette idée et ses liens.</div>
          </div>
          <ConfirmDelete action={deleteIdea} fields={{ id: idea.id }} variant="button" label="Supprimer l’idée"
            title={`Supprimer « ${idea.title} » ?`} description="Cette idée et ses liens seront définitivement supprimés." />
        </div>
      </section>
    </>
  )
}
