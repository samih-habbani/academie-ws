import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AccountShell from '@/components/auth/AccountShell'
import { getUser, safeNext } from '@/lib/user-auth'
import RegisterForm from './RegisterForm'

export const metadata: Metadata = { title: 'Créer un compte — Académie WS', robots: { index: false } }

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const raw = (await searchParams).next
  const next = raw ? safeNext(raw) : ''
  if (await getUser()) redirect(next || '/profile')
  return (
    <AccountShell width={520}>
      <h1 className="auth-title">Créer un compte</h1>
      <p className="auth-lead">Gratuit, en moins d’une minute.</p>
      <RegisterForm next={next} />
    </AccountShell>
  )
}
