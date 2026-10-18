import { notFound } from 'next/navigation'
import { ExternalLink, Eye } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { programInclude } from '@/lib/programs'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import ProgramForm from '../ProgramForm'
import { deleteProgram, updateProgram } from '../actions'
import { loadChoices, toFormValues } from '../data'

export default async function EditProgramPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()

  const [program, choices, linked] = await Promise.all([
    prisma.program.findUnique({ where: { id }, include: programInclude }),
    loadChoices(),
    prisma.program.findUnique({ where: { id }, select: { courses: { select: { id: true } } } }),
  ])
  if (!program) notFound()
  const values = { ...toFormValues(program), courseIds: linked?.courses.map((c) => c.id) ?? [] }
  const published = program.status === 'published'

  return (
    <>
      <PageHeader
        title={program.title}
        crumbs={[{ label: 'Programmes', href: '/admin/programs' }, { label: program.title }]}
        subtitle={published ? 'Publié sur le site.' : 'Brouillon : invisible pour les visiteurs.'}
        actions={
          published ? (
            <a href={`/programs/${program.slug}`} target="_blank" rel="noopener" className="adm-btn adm-btn-ghost"><ExternalLink size={15} aria-hidden="true" /> Voir sur le site</a>
          ) : (
            <a href={`/programs/preview/${program.id}`} target="_blank" rel="noopener" className="adm-btn adm-btn-ghost"><Eye size={15} aria-hidden="true" /> Aperçu</a>
          )
        }
      />
      <ProgramForm action={updateProgram.bind(null, program.id)} initial={values} cancelHref="/admin/programs" submitLabel="Enregistrer les modifications" {...choices} />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">Supprime définitivement ce programme, ses modules et ses ateliers.</div>
          </div>
          <ConfirmDelete action={deleteProgram} fields={{ id: program.id }} variant="button" label="Supprimer le programme"
            title={`Supprimer « ${program.title} » ?`} description="Ce programme, ses modules et ses ateliers seront définitivement supprimés." />
        </div>
      </section>
    </>
  )
}
