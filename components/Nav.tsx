'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'

export default function Nav() {
  const [open, setOpen] = useState(false)
  // Cookie témoin posé à la connexion (sans donnée sensible) : évite toute requête serveur
  // et garde les pages publiques en cache. La vraie vérification se fait sur /profile.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const pathname = usePathname()
  useEffect(() => {
    setLoggedIn(document.cookie.split('; ').includes('ws_in=1'))
  }, [pathname])
  const close = () => setOpen(false)
  // Sur l'accueil, les liens vers « / » et « /#ancre » pointent vers la page courante :
  // les précharger ne sert à rien (3 requêtes inutiles).
  const onHome = pathname === '/'
  const homePrefetch = onHome ? false : undefined

  return (
    <nav className="nav-futuriste" role="navigation">
      <Link href="/" className="nav-logo" onClick={close} prefetch={homePrefetch}>
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
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className={`nav-links${open ? ' is-open' : ''}`}>
        <Link href="/#about" onClick={close} prefetch={homePrefetch}>À propos</Link>
        <Link href="/#formations" onClick={close} prefetch={homePrefetch}>Formations</Link>
        <Link href="/contact" onClick={close}>Contact</Link>
        {loggedIn ? (
          <>
            <Link href="/dashboard" onClick={close} prefetch={false}>Tableau de bord</Link>
            <Link href="/profile" onClick={close} prefetch={false}>Mon profil</Link>
            <form action={logout} onSubmit={() => { setLoggedIn(false); close() }} className="nav-form">
              <button type="submit" className="nav-btn nav-btn-ghost">Se déconnecter</button>
            </form>
          </>
        ) : (
          // Tant que l'état n'est pas connu (avant l'hydratation), les boutons gardent leur place sans s'afficher.
          <>
            <Link href="/login" onClick={close} className={`nav-btn nav-btn-ghost${loggedIn === null ? ' is-pending' : ''}`} prefetch={false}>Connexion</Link>
            <Link href="/register" onClick={close} className={`nav-btn nav-btn-primary${loggedIn === null ? ' is-pending' : ''}`} prefetch={false}>S’inscrire</Link>
          </>
        )}
      </div>
    </nav>
  )
}
