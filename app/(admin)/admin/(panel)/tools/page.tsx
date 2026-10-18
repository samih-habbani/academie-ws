import Link from 'next/link'
import { ImageIcon, Pencil, Plus, Wrench } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { mediaSrc } from '@/lib/media'
import { EmptyState, PageHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteTool } from './actions'

export default async function ToolsPage() {
  await requireAdmin()
  const tools = await prisma.tool.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { programs: true } } } })
  return (
    <>
      <PageHeader title="Outils" subtitle="La bibliothèque d’outils et de technologies que tu rattaches à tes programmes."
        actions={<Link href="/admin/tools/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouvel outil</Link>} />
      <div className="adm-card">
        {tools.length === 0 ? (
          <EmptyState icon={Wrench} title="Aucun outil">Ajoute VS Code, Figma, Git… pour les réutiliser dans tes programmes.</EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Outil</th><th>Programmes</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {tools.map((tool) => (
                  <tr key={tool.id}>
                    <td>
                      <div className="adm-cell-title">
                        {tool.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="adm-thumb" style={{ width: 36, height: 36, objectFit: 'contain' }} src={mediaSrc('tools', tool.logo)} alt="" loading="lazy" />
                        ) : (
                          <span className="adm-thumb adm-thumb-empty" style={{ width: 36, height: 36 }}><ImageIcon size={15} aria-hidden="true" /></span>
                        )}
                        <Link href={`/admin/tools/${tool.id}`} prefetch={false}>{tool.name}</Link>
                      </div>
                    </td>
                    <td className="adm-num">{tool._count.programs}</td>
                    <td>
                      <div className="adm-actions">
                        <Link href={`/admin/tools/${tool.id}`} className="adm-icon-btn" aria-label={`Modifier ${tool.name}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                        <ConfirmDelete action={deleteTool} fields={{ id: tool.id }} label={`Supprimer ${tool.name}`}
                          title={`Supprimer « ${tool.name} » ?`} description="Cet outil sera définitivement supprimé et retiré des programmes." />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
