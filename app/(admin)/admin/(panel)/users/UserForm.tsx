'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, Switch, TextInput } from '../../_components/FormKit'

export type UserValues = { email: string; admin: boolean }

export default function UserForm({
  action,
  initial,
  submitLabel,
  isNew,
  isSelf,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: UserValues
  submitLabel: string
  isNew: boolean
  isSelf: boolean
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const email = submitted ? (state.values.email ?? '') : initial.email
  const admin = submitted ? state.values.admin === 'on' : initial.admin
  const err = state.errors

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-stack" style={{ maxWidth: 760 }}>
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Compte</div></div>
          <div className="adm-card-pad adm-fields">
            <TextInput name="email" label="Email" type="email" required defaultValue={email} error={err.email} maxLength={180} autoComplete="off" />
            <TextInput name="password" label={isNew ? 'Mot de passe' : 'Nouveau mot de passe'} type="password" required={isNew} error={err.password}
              autoComplete="new-password"
              hint={isNew ? '10 caractères minimum. Stocké sous forme hachée (argon2).' : 'Laisse vide pour conserver le mot de passe actuel. 10 caractères minimum sinon.'} />
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Droits</div></div>
          <div className="adm-card-pad adm-fields">
            <Switch name="admin" label="Administrateur" defaultChecked={admin}
              hint={isSelf ? 'C’est ton compte : tu ne peux pas retirer toi-même ce rôle.' : 'Donne accès à ce back-office. Il doit toujours rester au moins un administrateur.'} />
            {err.admin && <div className="adm-error" role="alert">{err.admin}</div>}
          </div>
        </section>
      </div>
      <FormBar cancelHref="/admin/users" submitLabel={submitLabel} />
    </form>
  )
}
