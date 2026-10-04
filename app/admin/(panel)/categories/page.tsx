import Link from 'next/link'
import { Folders, ImageIcon, Pencil, Plus } from 'lucide-react'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { mediaSrc } from '@/lib/media'
import { EmptyState, PageHeader } from '../../_components/ui'
import ConfirmDelete from '../../_components/ConfirmDelete'
import { deleteCategory } from './actions'

export default async function CategoriesPage() {
  await requireAdmin()
  const categories = await prisma.category.findMany({
    orderBy: { orderCategory: 'asc' },
    include: { _count: { select: { courses: true, themes: true } } },
  })

  return (
    <>
      <PageHeader
        title="Catégories"
        subtitle="Les grandes rubriques de la page d’accueil, dans leur ordre d’affichage."
        actions={<Link href="/admin/categories/new" className="adm-btn adm-btn-primary"><Plus size={16} aria-hidden="true" /> Nouvelle catégorie</Link>}
      />
      <div className="adm-card">
        {categories.length === 0 ? (
          <EmptyState icon={Folders} title="Aucune catégorie">Crée une catégorie pour y ranger des cours.</EmptyState>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr><th style={{ width: 70 }}>Ordre</th><th>Catégorie</th><th>Cours</th><th>Thématiques</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const used = category._count.courses + category._count.themes
                  return (
                    <tr key={category.id}>
                      <td className="adm-num adm-muted">{category.orderCategory}</td>
                      <td>
                        <div className="adm-cell-title">
                          {category.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="adm-thumb" style={{ width: 40, height: 40, objectFit: 'contain' }} src={mediaSrc('categories', category.logo)} alt="" loading="lazy" />
                          ) : (
                            <span className="adm-thumb adm-thumb-empty" style={{ width: 40, height: 40 }}><ImageIcon size={16} aria-hidden="true" /></span>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/admin/categories/${category.id}`} prefetch={false}>{category.title}</Link>
                            <div className="adm-cell-sub" style={{ maxWidth: 520, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{category.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="adm-num">{category._count.courses}</td>
                      <td className="adm-num">{category._count.themes}</td>
                      <td>
                        <div className="adm-actions">
                          <Link href={`/admin/categories/${category.id}`} className="adm-icon-btn" aria-label={`Modifier ${category.title}`} title="Modifier" prefetch={false}><Pencil size={16} aria-hidden="true" /></Link>
                          <ConfirmDelete action={deleteCategory} fields={{ id: category.id }} label={`Supprimer ${category.title}`}
                            disabled={used > 0} disabledReason={`Utilisée par ${category._count.courses} cours et ${category._count.themes} thématique(s)`}
                            title={`Supprimer « ${category.title} » ?`} description="Cette catégorie sera définitivement supprimée." />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
