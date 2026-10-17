import type { Metadata } from 'next'
import Link from 'next/link'
import AccountShell from '@/components/auth/AccountShell'
import { requireUser } from '@/lib/user-auth'
import { logout } from '@/app/login/actions'
import { DeleteAccountForm, PasswordForm, ProfileForm } from './ProfileForms'

export const metadata: Metadata = { title: 'Mon profil — Académie WS', robots: { index: false } }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const user = await requireUser()
  const welcome = (await searchParams).welcome === '1'
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') || user.email[0]).toUpperCase()

  return (
    <AccountShell width={720}>
      {welcome && <div className="auth-alert auth-alert-ok" role="status">Bienvenue ! Ton compte est créé. Complète ton profil ci-dessous si tu le souhaites.</div>}

      <div className="profile-head">
        <div className="profile-avatar" aria-hidden="true">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <h1 className="auth-title" style={{ marginBottom: 2 }}>{name || 'Mon profil'}</h1>
          <p className="auth-lead" style={{ margin: 0, overflowWrap: 'anywhere' }}>{user.email} · membre depuis le {user.createdAt.toLocaleDateString('fr-FR')}</p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/dashboard" className="btn btn-ghost btn-sm" prefetch={false}>Tableau de bord</Link>
          <form action={logout}>
            <button type="submit" className="btn btn-ghost btn-sm">Se déconnecter</button>
          </form>
        </div>
      </div>

      <section className="auth-card">
        <h2>Mes informations</h2>
        <ProfileForm initial={{ email: user.email, firstName: user.firstName ?? '', lastName: user.lastName ?? '', phone: user.phone ?? '', bio: user.bio ?? '' }} />
      </section>

      <section className="auth-card">
        <h2>Mot de passe</h2>
        <PasswordForm />
      </section>

      <section className="auth-card auth-card-danger">
        <h2>Supprimer mon compte</h2>
        <DeleteAccountForm isAdmin={user.isAdmin} />
      </section>
    </AccountShell>
  )
}
