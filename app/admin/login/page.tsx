import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import StarCanvas from '@/components/StarCanvas'
import { getAdmin } from '@/lib/admin-auth'
import LoginForm from './LoginForm'

export default async function AdminLoginPage() {
  const secretReady = (process.env.ADMIN_SESSION_SECRET ?? '').length >= 32
  if (secretReady && (await getAdmin())) redirect('/admin')

  return (
    <>
      <StarCanvas />
      <div className="nebula nebula-1" aria-hidden="true" />
      <div className="nebula nebula-2" aria-hidden="true" />
      <div className="grid-bg" aria-hidden="true" />

      <div className="site-content">
        <Nav />
        <main style={{ flex: 1 }}>
          <div className="container" style={{ maxWidth: 440 }}>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(26px,4vw,34px)', fontWeight: 800, margin: '64px 0 8px' }}>
              Administration
            </h1>
            <p style={{ color: 'var(--text-m)', marginBottom: 28 }}>Connexion réservée à l&apos;administrateur du site.</p>
            {secretReady ? (
              <LoginForm />
            ) : (
              <div className="admin-msg admin-msg-error">
                Configuration manquante : la variable d&apos;environnement <code>ADMIN_SESSION_SECRET</code> (32 caractères
                minimum) n&apos;est pas définie sur le serveur. La connexion est désactivée tant qu&apos;elle est absente.
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  )
}
