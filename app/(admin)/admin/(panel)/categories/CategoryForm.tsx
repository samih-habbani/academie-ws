'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, TextArea, TextInput } from '../../_components/FormKit'
import ImageField from '../../_components/ImageField'

export type CategoryValues = { title: string; description: string; logo: string; orderCategory: string }

export default function CategoryForm({
  action,
  initial,
  submitLabel,
  isNew,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: CategoryValues
  submitLabel: string
  isNew: boolean
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (key: keyof CategoryValues) => (submitted ? (state.values[key] ?? '') : initial[key])
  const err = state.errors

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-stack" style={{ maxWidth: 760 }}>
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">Catégorie</div></div>
          <div className="adm-card-pad adm-fields">
            <TextInput name="title" label="Titre" required defaultValue={text('title')} error={err.title} maxLength={75} />
            <TextArea name="description" label="Description" required rows={3} defaultValue={text('description')} error={err.description} maxLength={255}
              hint="Affichée sous le titre de la catégorie sur la page d’accueil (255 caractères maximum)." />
            <TextInput name="orderCategory" label="Ordre d’affichage" type="number" min={0} defaultValue={text('orderCategory')} error={err.orderCategory}
              hint={isNew ? 'Laisse vide pour la placer en dernier.' : '1 s’affiche en premier sur l’accueil.'} />
            <ImageField name="logo" folder="categories" label="Icône" defaultValue={text('logo')} error={err.logo}
              hint="Petite icône affichée à côté du titre. Sans icône, une pastille 📚 est utilisée." />
          </div>
        </section>
      </div>
      <FormBar cancelHref="/admin/categories" submitLabel={submitLabel} />
    </form>
  )
}
