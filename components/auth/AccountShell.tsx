import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import type { Lang } from '@/lib/i18n/config'

/** Habillage commun des pages de compte (connexion, inscription, profil, tableau de bord). */
export default function AccountShell({ children, lang, width = 460 }: { children: React.ReactNode; lang: Lang; width?: number }) {
  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />
      <div className="site-content">
        <Nav />
        <main style={{ flex: 1 }}>
          <div className="container" style={{ maxWidth: width, paddingTop: 48, paddingBottom: 72 }}>{children}</div>
        </main>
        <Footer lang={lang} />
      </div>
    </>
  )
}
