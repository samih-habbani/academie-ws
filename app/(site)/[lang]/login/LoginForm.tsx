'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import AuthField from '@/components/auth/AuthField'
import { useI18n } from '@/components/I18nProvider'
import { login, type LoginState } from './actions'

export default function LoginForm({ next }: { next: string }) {
  const { lang, t, href } = useI18n()
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null, email: '' })
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="lang" value={lang} />
      {state.error && <div className="auth-alert auth-alert-error" role="alert">{state.error}</div>}
      <AuthField name="email" label={t.auth.email} type="email" required autoComplete="email" defaultValue={state.email} />
      <AuthField name="password" label={t.auth.password} type="password" required autoComplete="current-password" />
      <button type="submit" className="btn btn-primary" disabled={pending} style={{ justifyContent: 'center' }}>
        {pending ? t.auth.loggingIn : t.auth.login}
      </button>
      <p className="auth-switch">
        {t.auth.noAccount} <Link href={`${href('/register')}${next === href('/profile') ? '' : `?next=${encodeURIComponent(next)}`}`}>{t.auth.createAccount}</Link>
      </p>
    </form>
  )
}
