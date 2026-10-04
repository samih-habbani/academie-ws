import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAdmin } from '@/lib/admin-auth'
import { Alert } from '../_components/ui'
import LoginForm from './LoginForm'

export default async function AdminLoginPage() {
  const secretReady = (process.env.ADMIN_SESSION_SECRET ?? '').length >= 32
  if (secretReady && (await getAdmin())) redirect('/admin')

  return (
    <div className="adm adm-login">
      <div className="adm-card adm-card-pad adm-login-card">
        <div className="adm-login-brand">
          <svg width="34" height="38" viewBox="0 0 36 40" fill="none" aria-hidden="true">
            <polygon points="18,2 34,11 34,29 18,38 2,29 2,11" fill="#7C3AED" stroke="rgba(167,139,250,.35)" strokeWidth=".8" />
            <path d="M18 10 C15.5 13.5 14 18 14 22 L16.2 22 L16.2 25.5 C16.2 26.3 17 27 18 27 C19 27 19.8 26.3 19.8 25.5 L19.8 22 L22 22 C22 18 20.5 13.5 18 10Z" fill="white" opacity=".95" />
            <circle cx="18" cy="21" r="2.8" fill="#22D3EE" />
            <ellipse cx="18" cy="28.5" rx="3.5" ry="4.5" fill="rgba(245,158,11,.85)" />
          </svg>
          <span className="adm-brand-logo">Académie<em>WS</em></span>
          <span className="adm-brand-tag">Admin</span>
        </div>

        <h1 className="adm-title" style={{ fontSize: 24 }}>Connexion</h1>
        <p className="adm-subtitle" style={{ marginBottom: 22 }}>Espace réservé à l’administrateur du site.</p>

        {secretReady ? (
          <LoginForm />
        ) : (
          <Alert tone="error">
            Configuration manquante : la variable d’environnement <code>ADMIN_SESSION_SECRET</code> (32 caractères minimum)
            n’est pas définie sur le serveur. La connexion est désactivée tant qu’elle est absente.
          </Alert>
        )}

        <p style={{ marginTop: 22, fontSize: 13 }}>
          <Link href="/" style={{ color: 'var(--text-d)' }}>← Retour au site</Link>
        </p>
      </div>
    </div>
  )
}
