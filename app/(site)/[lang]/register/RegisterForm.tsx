'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import AuthField from '@/components/auth/AuthField'
import { useI18n } from '@/components/I18nProvider'
import { register } from './actions'

export default function RegisterForm({ next }: { next: string }) {
  const { lang, t, href } = useI18n()
  const [state, action, pending] = useActionState<FormState, FormData>(register, emptyState)
  const v = state.values
  const e = state.errors
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="lang" value={lang} />
      {state.message && Object.keys(e).length === 0 && <div className="auth-alert auth-alert-error" role="alert">{state.message}</div>}
      <div className="grid-2col" style={{ gap: 14 }}>
        <AuthField name="firstName" label={t.auth.firstName} required autoComplete="given-name" maxLength={100} defaultValue={v.firstName} error={e.firstName} />
        <AuthField name="lastName" label={t.auth.lastName} required autoComplete="family-name" maxLength={100} defaultValue={v.lastName} error={e.lastName} />
      </div>
      <AuthField name="email" label={t.auth.email} type="email" required autoComplete="email" maxLength={180} defaultValue={v.email} error={e.email}
        hint={t.auth.emailHint} />
      <AuthField name="password" label={t.auth.password} type="password" required autoComplete="new-password" error={e.password} hint={t.auth.passwordHint} />
      <AuthField name="confirm" label={t.auth.confirm} type="password" required autoComplete="new-password" error={e.confirm} />
      {/* Champ piège pour les robots : invisible, ne pas remplir. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>Do not fill<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifyContent: 'center' }}>
        {pending ? t.auth.creating : t.auth.createAccount}
      </button>
      <p className="auth-switch">
        {t.auth.haveAccount} <Link href={next ? `${href('/login')}?next=${encodeURIComponent(next)}` : href('/login')}>{t.auth.login}</Link>
      </p>
    </form>
  )
}
