'use client'

import { useActionState } from 'react'
import { LoaderCircle, LogIn, TriangleAlert } from 'lucide-react'
import { login, type LoginState } from '../actions'

const initialState: LoginState = { error: null, email: '' }

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction} className="adm-fields">
      <div className="adm-field">
        <label className="adm-label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.email} required />
      </div>
      <div className="adm-field">
        <label className="adm-label" htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      {state.error && (
        <div className="adm-alert adm-alert-error" role="alert">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>{state.error}</div>
        </div>
      )}

      <button type="submit" className="adm-btn adm-btn-primary" disabled={isPending} style={{ height: 42 }}>
        {isPending ? <LoaderCircle size={16} className="adm-spin" aria-hidden="true" /> : <LogIn size={16} aria-hidden="true" />}
        {isPending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
