import Link from 'next/link'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Info, TriangleAlert, type LucideIcon } from 'lucide-react'
import { PAGE_SIZE, pageCount, withParams, type SearchParams } from '@/lib/admin/list'

/* ---------- En-tête de page ---------- */
export function PageHeader({
  title,
  subtitle,
  crumbs,
  actions,
}: {
  title: string
  subtitle?: React.ReactNode
  crumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
}) {
  return (
    <div className="adm-header">
      <div>
        {crumbs && crumbs.length > 0 && (
          <nav className="adm-crumbs" aria-label="Fil d'Ariane">
            {crumbs.map((crumb, i) => (
              <span key={i} style={{ display: 'inline-flex', gap: 6 }}>
                {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                {i < crumbs.length - 1 && <span aria-hidden="true">/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="adm-title">{title}</h1>
        {subtitle && <p className="adm-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="adm-header-actions">{actions}</div>}
    </div>
  )
}

/* ---------- Badges / alertes / état vide ---------- */
export type Tone = 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'gray'

export function Badge({ tone = 'gray', children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`adm-badge adm-badge-${tone}`}>{children}</span>
}

export function Alert({ tone, children }: { tone: 'error' | 'warn' | 'info'; children: React.ReactNode }) {
  const Icon = tone === 'info' ? Info : TriangleAlert
  return (
    <div className={`adm-alert adm-alert-${tone}`} role={tone === 'error' ? 'alert' : undefined}>
      <Icon size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-icon"><Icon size={26} aria-hidden="true" /></div>
      <div className="adm-empty-title">{title}</div>
      {children && <div>{children}</div>}
    </div>
  )
}

/* ---------- Pagination ---------- */
export function Pagination({
  basePath,
  sp,
  page,
  total,
  size = PAGE_SIZE,
  noun,
  plural,
}: {
  basePath: string
  sp: SearchParams
  page: number
  total: number
  size?: number
  noun: string
  /** Pluriel si différent de « nom + s » (ex. « cours »). */
  plural?: string
}) {
  const pages = pageCount(total, size)
  const current = Math.min(page, pages)
  const from = total === 0 ? 0 : (current - 1) * size + 1
  const to = Math.min(current * size, total)
  const href = (p: number) => `${basePath}${withParams(sp, { page: p === 1 ? null : p })}`

  return (
    <div className="adm-pagination">
      <span>
        {total === 0 ? `Aucun ${noun}` : `${from}–${to} sur ${total} ${total > 1 ? (plural ?? `${noun}s`) : noun}`}
      </span>
      {pages > 1 && (
        <div className="adm-pagination-nav">
          {current > 1 ? (
            <Link href={href(current - 1)} className="adm-btn adm-btn-ghost adm-btn-sm"><ChevronLeft size={14} aria-hidden="true" /> Précédent</Link>
          ) : (
            <span className="adm-btn adm-btn-ghost adm-btn-sm" aria-disabled="true"><ChevronLeft size={14} aria-hidden="true" /> Précédent</span>
          )}
          <span className="adm-muted adm-num">Page {current} / {pages}</span>
          {current < pages ? (
            <Link href={href(current + 1)} className="adm-btn adm-btn-ghost adm-btn-sm">Suivant <ChevronRight size={14} aria-hidden="true" /></Link>
          ) : (
            <span className="adm-btn adm-btn-ghost adm-btn-sm" aria-disabled="true">Suivant <ChevronRight size={14} aria-hidden="true" /></span>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- En-tête de colonne triable ---------- */
export function SortHeader({
  label,
  field,
  basePath,
  sp,
  current,
  className,
}: {
  label: string
  field: string
  basePath: string
  sp: SearchParams
  current: { field: string; dir: 'asc' | 'desc' }
  className?: string
}) {
  const active = current.field === field
  const nextDir = active && current.dir === 'asc' ? 'desc' : 'asc'
  const Icon = !active ? ArrowUpDown : current.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className={className} aria-sort={active ? (current.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
      <Link href={`${basePath}${withParams(sp, { sort: field, dir: nextDir, page: null })}`} data-active={active}>
        {label} <Icon size={12} aria-hidden="true" />
      </Link>
    </th>
  )
}
