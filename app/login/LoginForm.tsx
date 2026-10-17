'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import AuthField from '@/components/auth/AuthField'
import { login, type LoginState } from './actions'

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null, email: '' })
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      {state.error && <div className="auth-alert auth-alert-error" role="alert">{state.error}</div>}
      <AuthField name="email" label="Email" type="email" required autoComplete="email" defaultValue={state.email} />
      <AuthField name="password" label="Mot de passe" type="password" required autoComplete="current-password" />
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifyContent: 'center' }}>
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
      <p className="auth-switch">Pas encore de compte ? <Link href={next === '/profile' ? '/register' : `/register?next=${encodeURIComponent(next)}`}>Créer un compte</Link></p>
    </form>
  )
}
