'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/lib/auth-actions'
import { useI18n } from '@/components/I18nProvider'
import { LANGS, localizePath, stripLang } from '@/lib/i18n/config'

export default function Nav() {
  const { lang, t, href } = useI18n()
  const [open, setOpen] = useState(false)
  // Cookie témoin posé à la connexion (sans donnée sensible) : évite toute requête serveur
  // et garde les pages publiques en cache. La vraie vérification se fait sur /profile.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const pathname = usePathname()
  useEffect(() => {
    const cookies = document.cookie.split('; ')
    setLoggedIn(cookies.includes('ws_in=1'))
    setIsAdmin(cookies.includes('ws_admin=1'))
  }, [pathname])
  const close = () => setOpen(false)
  // Sur l'accueil, les liens vers « / » et « /#ancre » pointent vers la page courante :
  // les précharger ne sert à rien (3 requêtes inutiles).
  const onHome = stripLang(pathname) === '/'
  const homePrefetch = onHome ? false : undefined

  return (
    <nav className="nav-futuriste" role="navigation">
      <Link href={href('/')} className="nav-logo" onClick={close} prefetch={homePrefetch}>
        <svg width="36" height="40" viewBox="0 0 36 40" fill="none" aria-hidden="true">
          <polygon points="18,2 34,11 34,29 18,38 2,29 2,11" fill="#7C3AED" stroke="rgba(167,139,250,.35)" strokeWidth=".8"/>
          <path d="M18 10 C15.5 13.5 14 18 14 22 L16.2 22 L16.2 25.5 C16.2 26.3 17 27 18 27 C19 27 19.8 26.3 19.8 25.5 L19.8 22 L22 22 C22 18 20.5 13.5 18 10Z" fill="white" opacity=".95"/>
          <path d="M14.2 22.5 L11.5 28.5 L15 25.5Z" fill="rgba(255,255,255,.65)"/>
          <path d="M21.8 22.5 L24.5 28.5 L21 25.5Z" fill="rgba(255,255,255,.65)"/>
          <circle cx="18" cy="21" r="2.8" fill="#22D3EE"/>
          <ellipse cx="18" cy="28.5" rx="3.5" ry="4.5" fill="rgba(245,158,11,.85)"/>
          <ellipse cx="18" cy="27.5" rx="2" ry="3" fill="rgba(253,224,71,.9)"/>
        </svg>
        <span className="logo-text">Académie<em>WS</em></span>
      </Link>

      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links${open ? ' is-open' : ''}`}>
        <Link href={`${href('/')}#about`} onClick={close} prefetch={homePrefetch}>{t.nav.about}</Link>
        <Link href={`${href('/')}#formations`} onClick={close} prefetch={homePrefetch}>{t.nav.courses}</Link>
        <Link href={href('/contact')} onClick={close}>{t.nav.contact}</Link>
        {loggedIn ? (
          <>
            {isAdmin && <a href="/admin/enter" onClick={close} className="nav-admin-link">{t.nav.admin}</a>}
            <Link href={href('/dashboard')} onClick={close} prefetch={false}>{t.nav.dashboard}</Link>
            <Link href={href('/profile')} onClick={close} prefetch={false}>{t.nav.profile}</Link>
            <form action={logout} onSubmit={() => { setLoggedIn(false); setIsAdmin(false); close() }} className="nav-form">
              <input type="hidden" name="lang" value={lang} />
              <button type="submit" className="nav-btn nav-btn-ghost">{t.nav.logout}</button>
            </form>
          </>
        ) : (
          // Tant que l'état n'est pas connu (avant l'hydratation), les boutons gardent leur place sans s'afficher.
          <>
            <Link href={href('/login')} onClick={close} className={`nav-btn nav-btn-ghost${loggedIn === null ? ' is-pending' : ''}`} prefetch={false}>{t.nav.login}</Link>
            <Link href={href('/register')} onClick={close} className={`nav-btn nav-btn-primary${loggedIn === null ? ' is-pending' : ''}`} prefetch={false}>{t.nav.register}</Link>
          </>
        )}
        <div className="lang-switch" role="group" aria-label={t.nav.language}>
          {LANGS.map((l) => (
            <Link
              key={l}
              href={localizePath(l, stripLang(pathname))}
              onClick={close}
              prefetch={false}
              hrefLang={l}
              lang={l}
              aria-current={l === lang ? 'true' : undefined}
              className={l === lang ? 'is-active' : undefined}
            >
              {l.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
