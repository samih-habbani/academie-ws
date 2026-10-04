'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, SelectField, TextArea, TextInput } from '../../_components/FormKit'
import ImageField from '../../_components/ImageField'

export type ThemeValues = { title: string; description: string; img: string; categoryId: string }

export default function ThemeForm({
  action,
  initial,
  categories,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: ThemeValues
  categories: { id: number; title: string }[]
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (key: keyof ThemeValues) => (submitted ? (state.values[key] ?? '') : initial[key])
  const err = state.errors

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-stack" style={{ maxWidth: 760 }}>
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Thématique</div></div>
          <div className="adm-card-pad adm-fields">
            <TextInput name="title" label="Titre" required defaultValue={text('title')} error={err.title} maxLength={255} />
            <TextArea name="description" label="Description" required rows={3} defaultValue={text('description')} error={err.description} maxLength={255}
              hint="Affichée sur la carte de la thématique et en tête de sa page." />
            <SelectField name="categoryId" label="Catégorie" required defaultValue={text('categoryId')} error={err.categoryId} placeholder="Choisir…"
              options={categories.map((c) => ({ value: c.id, label: c.title }))} />
            <ImageField name="img" folder="themes" label="Image" defaultValue={text('img')} error={err.img}
              hint="Visuel de la carte (format 16/9 conseillé), réduit en WebP avant l’envoi." />
          </div>
        </section>
      </div>
      <FormBar cancelHref="/admin/themes" submitLabel={submitLabel} />
    </form>
  )
}
