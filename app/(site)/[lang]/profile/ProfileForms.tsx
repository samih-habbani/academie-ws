'use client'

import { useActionState, useState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import AuthField from '@/components/auth/AuthField'
import { useI18n } from '@/components/I18nProvider'
import { changePassword, deleteAccount, updateProfile } from './actions'

function Status({ state }: { state: FormState }) {
  if (!state.message) return null
  return <div className={`auth-alert ${state.ok ? 'auth-alert-ok' : 'auth-alert-error'}`} role={state.ok ? 'status' : 'alert'}>{state.message}</div>
}

export type ProfileInitial = { email: string; firstName: string; lastName: string; phone: string; bio: string }

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const { lang, t } = useI18n()
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, emptyState)
  const sent = Object.keys(state.values).length > 0
  const val = (k: 'firstName' | 'lastName' | 'phone' | 'bio') => (sent ? (state.values[k] ?? '') : initial[k])
  const e = state.errors
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="lang" value={lang} />
      <Status state={state} />
      <AuthField name="email" label={t.profile.email} type="email" readOnly defaultValue={initial.email} hint={t.profile.emailReadonly} />
      <div className="grid-2col" style={{ gap: 14 }}>
        <AuthField name="firstName" label={t.profile.firstName} required autoComplete="given-name" maxLength={100} defaultValue={val('firstName')} error={e.firstName} />
        <AuthField name="lastName" label={t.profile.lastName} required autoComplete="family-name" maxLength={100} defaultValue={val('lastName')} error={e.lastName} />
      </div>
      <AuthField name="phone" label={t.profile.phone} type="tel" autoComplete="tel" maxLength={30} defaultValue={val('phone')} error={e.phone} />
      <AuthField name="bio" label={t.profile.bio} rows={4} maxLength={1000} defaultValue={val('bio')} error={e.bio} hint={t.profile.bioHint} />
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ alignSelf: 'flex-start' }}>
        {pending ? t.profile.saving : t.profile.save}
      </button>
    </form>
  )
}

export function PasswordForm() {
  const { lang, t } = useI18n()
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, emptyState)
  const e = state.errors
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="lang" value={lang} />
      <Status state={state} />
      <AuthField name="current" label={t.profile.currentPassword} type="password" required autoComplete="current-password" error={e.current} />
      <AuthField name="password" label={t.profile.newPassword} type="password" required autoComplete="new-password" error={e.password} hint={t.auth.passwordHint} />
      <AuthField name="confirm" label={t.profile.confirmNew} type="password" required autoComplete="new-password" error={e.confirm} />
      <button type="submit" className="btn btn-ghost" disabled={pending} style={{ alignSelf: 'flex-start' }}>
        {pending ? t.profile.changing : t.profile.changePassword}
      </button>
    </form>
  )
}

export function DeleteAccountForm({ isAdmin }: { isAdmin: boolean }) {
  const { lang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, emptyState)
  if (isAdmin) return <p className="field-hint">{t.profile.adminNote}</p>
  if (!open) return <button type="button" className="btn btn-danger" onClick={() => setOpen(true)}>{t.profile.deleteOpen}</button>
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="lang" value={lang} />
      <Status state={state} />
      <p className="field-hint" style={{ color: 'var(--text-m)' }}>{t.profile.deleteWarn}</p>
      <AuthField name="password" label={t.auth.password} type="password" required autoComplete="current-password" error={state.errors.password} />
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" className="btn btn-danger" disabled={pending}>{pending ? t.profile.deleting : t.profile.deleteConfirm}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{t.profile.cancel}</button>
      </div>
    </form>
  )
}
