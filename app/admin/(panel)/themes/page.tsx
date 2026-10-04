import Link from 'next/link'
import { ImageIcon, Pencil, Plus, Tags } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { mediaSrc } from '@/lib/media'
import { EmptyState, PageHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteTheme } from './actions'

export default async function ThemesPage() {
  await requireAdmin()
  const themes = await prisma.theme.findMany({
    orderBy: [{ categoryId: 'asc' }, { title: 'asc' }],
    include: { category: { select: { title: true } }, _count: { select: { courses: true } } },
  })

  return (
    <>
      <PageHeader
        title="Thématiques"
        subtitle="Regroupements de cours : sur l’accueil, les cours d’une même thématique sont réunis sous une seule carte."
        actions={<Link href="/admin/themes/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouvelle thématique</Link>}
      />
      <div className="adm-card">
        {themes.length === 0 ? (
          <EmptyState icon={Tags} title="Aucune thématique">Crée une thématique pour regrouper plusieurs cours.</EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead><tr><th>Thématique</th><th>Catégorie</th><th>Cours</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {themes.map((theme) => (
                  <tr key={theme.id}>
                    <td>
                      <div className="adm-cell-title">
                        {theme.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="adm-thumb" src={mediaSrc('themes', theme.img)} alt="" loading="lazy" />
                        ) : (
                          <span className="adm-thumb adm-thumb-empty"><ImageIcon size={16} aria-hidden="true" /></span>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <Link href={`/admin/themes/${theme.id}`} prefetch={false}>{theme.title}</Link>
                          <div className="adm-cell-sub" style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{theme.description}</div>
                        </div>
                      </div>
                    </td>
                    <td>{theme.category.title}</td>
                    <td className="adm-num">{theme._count.courses}</td>
                    <td>
                      <div className="adm-actions">
                        <Link href={`/admin/themes/${theme.id}`} className="adm-icon-btn" aria-label={`Modifier ${theme.title}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                        <ConfirmDelete action={deleteTheme} fields={{ id: theme.id }} label={`Supprimer ${theme.title}`}
                          title={`Supprimer « ${theme.title} » ?`}
                          description={<>La thématique sera supprimée. Ses <strong>{theme._count.courses} cours</strong> seront conservés et apparaîtront individuellement sur l’accueil.</>} />
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
