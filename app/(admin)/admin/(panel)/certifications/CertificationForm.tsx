'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, TextArea, TextInput } from '../../_components/FormKit'
import ImageField from '../../_components/ImageField'

export type CertificationValues = { name: string; issuer: string; reference: string; level: string; description: string; url: string; logo: string }

export default function CertificationForm({ action, initial, submitLabel }: { action: (prev: FormState, fd: FormData) => Promise<FormState>; initial: CertificationValues; submitLabel: string }) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (k: keyof CertificationValues) => (submitted ? (state.values[k] ?? '') : initial[k])
  const err = state.errors
  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-stack" style={{ maxWidth: 760 }}>
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Certification</div></div>
          <div className="adm-card-pad adm-fields">
            <TextInput name="name" label="Intitulé" required defaultValue={text('name')} error={err.name} maxLength={200} placeholder="ex. Titre professionnel Développeur Web et Web Mobile" />
            <div className="adm-fields-2">
              <TextInput name="issuer" label="Organisme" defaultValue={text('issuer')} error={err.issuer} maxLength={120} placeholder="ex. Ministère du Travail" />
              <TextInput name="level" label="Niveau" defaultValue={text('level')} error={err.level} maxLength={80} placeholder="ex. Niveau 5 (Bac +2)" />
            </div>
            <TextInput name="reference" label="Référence" defaultValue={text('reference')} error={err.reference} maxLength={80} placeholder="ex. RNCP37674" hint="Code RNCP, numéro de fiche… à vérifier avant publication." />
            <TextArea name="description" label="Description" rows={4} defaultValue={text('description')} error={err.description} />
            <TextInput name="url" label="Lien officiel" type="url" defaultValue={text('url')} error={err.url} placeholder="https://…" />
            <ImageField name="logo" folder="certifications" label="Logo" defaultValue={text('logo')} error={err.logo} hint="Optionnel." />
          </div>
        </section>
      </div>
      <FormBar cancelHref="/admin/certifications" submitLabel={submitLabel} />
    </form>
  )
}
