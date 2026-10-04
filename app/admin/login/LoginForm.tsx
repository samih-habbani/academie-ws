'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '../actions'

const initialState: LoginState = { error: null, email: '' }

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 64 }}>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" defaultValue={state.email} required />
      </div>
      <div className="form-field">
        <label htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>

      {state.error && (
        <div
          role="alert"
          style={{
            padding: '12px 16px', borderRadius: 8, fontSize: 14,
            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', color: '#F87171',
          }}
        >
          {state.error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ alignSelf: 'flex-start' }}>
        {isPending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
