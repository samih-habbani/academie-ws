'use client'

import { useActionState, useState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import AuthField from '@/components/auth/AuthField'
import { changePassword, deleteAccount, updateProfile } from './actions'

function Status({ state }: { state: FormState }) {
  if (!state.message) return null
  return <div className={`auth-alert ${state.ok ? 'auth-alert-ok' : 'auth-alert-error'}`} role={state.ok ? 'status' : 'alert'}>{state.message}</div>
}

export type ProfileInitial = { email: string; firstName: string; lastName: string; phone: string; bio: string }

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, emptyState)
  const sent = Object.keys(state.values).length > 0
  const val = (k: 'firstName' | 'lastName' | 'phone' | 'bio') => (sent ? (state.values[k] ?? '') : initial[k])
  const e = state.errors
  return (
    <form action={action} className="auth-form">
      <Status state={state} />
      <AuthField name="email" label="Email" type="email" readOnly defaultValue={initial.email} hint="L’adresse email n’est pas modifiable." />
      <div className="grid-2col" style={{ gap: 14 }}>
        <AuthField name="firstName" label="Prénom" required autoComplete="given-name" maxLength={100} defaultValue={val('firstName')} error={e.firstName} />
        <AuthField name="lastName" label="Nom" required autoComplete="family-name" maxLength={100} defaultValue={val('lastName')} error={e.lastName} />
      </div>
      <AuthField name="phone" label="Téléphone" type="tel" autoComplete="tel" maxLength={30} defaultValue={val('phone')} error={e.phone} />
      <AuthField name="bio" label="À propos de moi" rows={4} maxLength={1000} defaultValue={val('bio')} error={e.bio} hint="1 000 caractères maximum." />
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: 'flex-start' }}>
        {pending ? 'Enregistrement…' : 'Enregistrer les modifications'}
      </button>
    </form>
  )
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, emptyState)
  const e = state.errors
  return (
    <form action={action} className="auth-form">
      <Status state={state} />
      <AuthField name="current" label="Mot de passe actuel" type="password" required autoComplete="current-password" error={e.current} />
      <AuthField name="password" label="Nouveau mot de passe" type="password" required autoComplete="new-password" error={e.password} hint="10 caractères minimum." />
      <AuthField name="confirm" label="Confirmer le nouveau mot de passe" type="password" required autoComplete="new-password" error={e.confirm} />
      <button type="submit" className="btn btn-ghost" disabled={pending} style={{ alignSelf: 'flex-start' }}>
        {pending ? 'Modification…' : 'Changer le mot de passe'}
      </button>
    </form>
  )
}

export function DeleteAccountForm({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, emptyState)
  if (isAdmin) {
    return <p className="field-hint">Ton compte est un compte administrateur : il ne peut pas être supprimé depuis cette page.</p>
  }
  if (!open) {
    return <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>Supprimer mon compte…</button>
  }
  return (
    <form action={action} className="auth-form">
      <Status state={state} />
      <p className="field-hint" style={{ color: 'var(--text-m)' }}>Cette action est <strong>définitive</strong> : ton compte et tes informations seront supprimés. Confirme avec ton mot de passe.</p>
      <AuthField name="password" label="Mot de passe" type="password" required autoComplete="current-password" error={state.errors.password} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-danger" disabled={pending}>{pending ? 'Suppression…' : 'Supprimer définitivement'}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Annuler</button>
      </div>
    </form>
  )
}
