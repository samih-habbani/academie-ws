'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import AuthField from '@/components/auth/AuthField'
import { register } from './actions'

export default function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(register, emptyState)
  const v = state.values
  const e = state.errors
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      {state.message && Object.keys(e).length === 0 && <div className="auth-alert auth-alert-error" role="alert">{state.message}</div>}
      <div className="grid-2col" style={{ gap: 14 }}>
        <AuthField name="firstName" label="Prénom" required autoComplete="given-name" maxLength={100} defaultValue={v.firstName} error={e.firstName} />
        <AuthField name="lastName" label="Nom" required autoComplete="family-name" maxLength={100} defaultValue={v.lastName} error={e.lastName} />
      </div>
      <AuthField name="email" label="Email" type="email" required autoComplete="email" maxLength={180} defaultValue={v.email} error={e.email}
        hint="Il ne pourra plus être modifié ensuite." />
      <AuthField name="password" label="Mot de passe" type="password" required autoComplete="new-password" error={e.password} hint="10 caractères minimum." />
      <AuthField name="confirm" label="Confirmer le mot de passe" type="password" required autoComplete="new-password" error={e.confirm} />
      {/* Champ piège pour les robots : invisible, ne pas remplir. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Ne pas remplir<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifyContent: 'center' }}>
        {pending ? 'Création…' : 'Créer mon compte'}
      </button>
      <p className="auth-switch">Déjà inscrit ? <Link href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}>Se connecter</Link></p>
    </form>
  )
}
