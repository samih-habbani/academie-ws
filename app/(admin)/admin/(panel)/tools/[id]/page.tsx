import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { PageHeader } from '../../../_components/ui'
import ConfirmDelete from '../../../_components/ConfirmDelete'
import ToolForm from '../ToolForm'
import { deleteTool, updateTool } from '../actions'

export default async function EditToolPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const id = Number((await params).id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  const tool = await prisma.tool.findUnique({ where: { id }, include: { _count: { select: { programs: true } } } })
  if (!tool) notFound()
  return (
    <>
      <PageHeader title={tool.name} crumbs={[{ label: 'Outils', href: '/admin/tools' }, { label: tool.name }]}
        subtitle={`Utilisé dans ${tool._count.programs} programme${tool._count.programs > 1 ? 's' : ''}`} />
      <ToolForm action={updateTool.bind(null, tool.id)} submitLabel="Enregistrer" initial={{ name: tool.name, logo: tool.logo, url: tool.url }} />
      <section className="adm-card adm-danger-zone" style={{ marginTop: 24, maxWidth: 640 }}>
        <div className="adm-card-head">
          <div>
            <div className="adm-card-title">Zone dangereuse</div>
            <div className="adm-card-hint">L’outil sera retiré des programmes qui l’utilisent.</div>
          </div>
          <ConfirmDelete action={deleteTool} fields={{ id: tool.id }} variant="button" label="Supprimer l’outil"
            title={`Supprimer « ${tool.name} » ?`} description="Cet outil sera définitivement supprimé et retiré des programmes." />
        </div>
      </section>
    </>
  )
}
