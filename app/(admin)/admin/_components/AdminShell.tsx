'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen, ExternalLink, Folders, Inbox, LayoutDashboard, ListVideo, LogOut, Menu, Tags, Users, X,
  type LucideIcon,
} from 'lucide-react'
import { logout } from '../actions'
import Toast from './Toast'

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: 'unread' }
type NavGroup = { label: string | null; items: NavItem[] }

const NAV: NavGroup[] = [
  { label: null, items: [{ href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true }] },
  {
    label: 'Contenu',
    items: [
      { href: '/admin/courses', label: 'Cours', icon: BookOpen },
      { href: '/admin/chapters', label: 'Chapitres', icon: ListVideo },
      { href: '/admin/categories', label: 'Catégories', icon: Folders },
      { href: '/admin/themes', label: 'Thématiques', icon: Tags },
    ],
  },
  {
    label: 'Communauté',
    items: [
      { href: '/admin/users', label: 'Utilisateurs', icon: Users },
      { href: '/admin/messages', label: 'Messages', icon: Inbox, badge: 'unread' },
    ],
  },
]

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}

function BrandMark() {
  return (
    <svg width="30" height="34" viewBox="0 0 36 40" fill="none" aria-hidden="true">
      <polygon points="18,2 34,11 34,29 18,38 2,29 2,11" fill="#7C3AED" stroke="rgba(167,139,250,.35)" strokeWidth=".8" />
      <path d="M18 10 C15.5 13.5 14 18 14 22 L16.2 22 L16.2 25.5 C16.2 26.3 17 27 18 27 C19 27 19.8 26.3 19.8 25.5 L19.8 22 L22 22 C22 18 20.5 13.5 18 10Z" fill="white" opacity=".95" />
      <circle cx="18" cy="21" r="2.8" fill="#22D3EE" />
      <ellipse cx="18" cy="28.5" rx="3.5" ry="4.5" fill="rgba(245,158,11,.85)" />
    </svg>
  )
}

export default function AdminShell({
  email,
  unread,
  children,
}: {
  email: string
  unread: number
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Referme le menu mobile à chaque navigation.
  useEffect(() => setOpen(false), [pathname])

  const current = NAV.flatMap((g) => g.items).find((item) => isActive(pathname, item))

  return (
    <div className="adm">
      <aside className="adm-sidebar" data-open={open} aria-label="Navigation du back-office">
        <Link href="/admin" className="adm-brand">
          <BrandMark />
          <span className="adm-brand-logo">Académie<em>WS</em></span>
          <span className="adm-brand-tag">Admin</span>
        </Link>

        <nav className="adm-nav">
          {NAV.map((group, i) => (
            <div key={i}>
              {group.label && <div className="adm-nav-label">{group.label}</div>}
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isActive(pathname, item)
                return (
                  <Link key={item.href} href={item.href} className="adm-nav-link" aria-current={active ? 'page' : undefined} prefetch={false}>
                    <Icon size={18} aria-hidden="true" />
                    {item.label}
                    {item.badge === 'unread' && unread > 0 && (
                      <span className="adm-nav-count" aria-label={`${unread} message(s) non lu(s)`}>{unread}</span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="adm-sidebar-foot">
          <div className="adm-user">
            <div className="adm-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</div>
            <div className="adm-user-meta">
              <div className="adm-user-email" title={email}>{email}</div>
              <div className="adm-user-role">Administrateur</div>
            </div>
          </div>
          <div className="adm-foot-actions">
            <a href="/" target="_blank" rel="noopener" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ flex: 1 }}>
              <ExternalLink size={14} aria-hidden="true" /> Voir le site
            </a>
            <form action={logout}>
              <button type="submit" className="adm-btn adm-btn-ghost adm-btn-sm" aria-label="Se déconnecter" title="Se déconnecter">
                <LogOut size={14} aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="adm-backdrop" data-open={open} onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="adm-main">
        <header className="adm-topbar">
          <button type="button" className="adm-icon-btn" onClick={() => setOpen((o) => !o)} aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={open}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="adm-topbar-title">{current?.label ?? 'Administration'}</span>
        </header>
        <main className="adm-content">{children}</main>
      </div>

      <Suspense fallback={null}>
        <Toast />
      </Suspense>
    </div>
  )
}
