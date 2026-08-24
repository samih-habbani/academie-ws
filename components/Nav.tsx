import Link from 'next/link'

export default function Nav() {
  return (
    <nav className="nav-futuriste" role="navigation">
      <Link href="/" className="nav-logo">
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

      <div className="nav-links">
        <Link href="/#about">À propos</Link>
        <Link href="/#formations">Formations</Link>
        <Link href="/contact">Contact</Link>
      </div>
    </nav>
  )
}
