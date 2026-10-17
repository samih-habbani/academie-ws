import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AccountShell from '@/components/auth/AccountShell'
import { getUser, safeNext } from '@/lib/user-auth'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Connexion — Académie WS', robots: { index: false } }

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  if (await getUser()) redirect(next)
  return (
    <AccountShell>
      <h1 className="auth-title">Connexion</h1>
      <p className="auth-lead">Retrouve ton profil et gère tes informations.</p>
      <LoginForm next={next} />
    </AccountShell>
  )
}
