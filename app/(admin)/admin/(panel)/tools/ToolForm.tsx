'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, TextInput } from '../../_components/FormKit'
import ImageField from '../../_components/ImageField'

export type ToolValues = { name: string; logo: string; url: string }

export default function ToolForm({ action, initial, submitLabel }: { action: (prev: FormState, fd: FormData) => Promise<FormState>; initial: ToolValues; submitLabel: string }) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (k: keyof ToolValues) => (submitted ? (state.values[k] ?? '') : initial[k])
  const err = state.errors
  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-stack" style={{ maxWidth: 640 }}>
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Outil</div></div>
          <div className="adm-card-pad adm-fields">
            <TextInput name="name" label="Nom" required defaultValue={text('name')} error={err.name} maxLength={80} placeholder="ex. Figma" />
            <ImageField name="logo" folder="tools" label="Logo" defaultValue={text('logo')} error={err.logo} hint="Optionnel : sans logo, seul le nom est affiché." />
            <TextInput name="url" label="Site officiel" type="url" defaultValue={text('url')} error={err.url} placeholder="https://…" />
          </div>
        </section>
      </div>
      <FormBar cancelHref="/admin/tools" submitLabel={submitLabel} />
    </form>
  )
}
