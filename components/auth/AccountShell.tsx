import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'

/** Habillage commun des pages de compte (connexion, inscription, profil). */
export default function AccountShell({ children, width = 460 }: { children: React.ReactNode; width?: number }) {
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
        <Footer />
      </div>
    </>
  )
}
