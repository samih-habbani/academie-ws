'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, SelectField, Switch, TextArea, TextInput } from '../../_components/FormKit'
import ImageField from '../../_components/ImageField'

export type CourseValues = {
  title: string
  slug: string
  description: string
  categoryId: string
  themeId: string
  difficulty: string
  date: string
  duration: string
  author: string
  price: string
  oldPrice: string
  chapterCount: string
  logo: string
  available: boolean
}

export default function CourseForm({
  action,
  initial,
  categories,
  themes,
  cancelHref,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: CourseValues
  categories: { id: number; title: string }[]
  themes: { id: number; title: string; categoryTitle: string }[]
  cancelHref: string
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (key: Exclude<keyof CourseValues, 'available'>) => (submitted ? (state.values[key] ?? '') : initial[key])
  const available = submitted ? state.values.available === 'on' : initial.available
  const err = state.errors

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-form-layout">
        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Informations générales</div></div>
            <div className="adm-card-pad adm-fields">
              <TextInput name="title" label="Titre" required defaultValue={text('title')} error={err.title} maxLength={255} />
              <TextInput name="slug" label="Adresse de la page (URL)" defaultValue={text('slug')} error={err.slug} maxLength={60}
                placeholder="ex. python" hint="Page du cours : /course/… — laisse vide pour la générer depuis le titre. Modifier l’URL d’un cours déjà publié casse ses anciens liens." />
              <TextArea name="description" label="Description" required defaultValue={text('description')} error={err.description} rows={5}
                hint="Affichée sur la carte du cours et en tête de sa page." />
              <div className="adm-fields-2">
                <TextInput name="duration" label="Durée" required defaultValue={text('duration')} error={err.duration} maxLength={75}
                  placeholder="ex. 48m ou 6h00" hint="Texte libre affiché sur la carte." />
                <TextInput name="date" label="Date de publication" type="date" required defaultValue={text('date')} error={err.date} />
              </div>
              <div className="adm-fields-2">
                <TextInput name="author" label="Auteur" defaultValue={text('author')} error={err.author} maxLength={75} placeholder="ex. Samih Habbani" />
                <TextInput name="chapterCount" label="Nombre de chapitres affiché" type="number" min={0} defaultValue={text('chapterCount')} error={err.chapterCount}
                  hint="Recalculé automatiquement quand tu ajoutes, modifies ou supprimes des chapitres." />
              </div>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Image du cours</div></div>
            <div className="adm-card-pad">
              <ImageField name="logo" folder="courses" label="Visuel de la carte" defaultValue={text('logo')} error={err.logo}
                hint="Le visuel est réduit en WebP (960 px) avant l’envoi pour rester léger. Format conseillé : 16/9." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Tarification</div></div>
            <div className="adm-card-pad adm-fields-2">
              <TextInput name="price" label="Prix" defaultValue={text('price')} error={err.price} placeholder="ex. 12,99" hint="Laisse vide pour un cours gratuit." />
              <TextInput name="oldPrice" label="Ancien prix" defaultValue={text('oldPrice')} error={err.oldPrice} placeholder="ex. 19,99" />
            </div>
          </section>
        </div>

        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Publication</div></div>
            <div className="adm-card-pad">
              <Switch name="available" label="Visible sur le site" defaultChecked={available}
                hint="Désactivé, le cours n’apparaît ni sur l’accueil ni dans les listes du site (son lien direct reste accessible, pratique pour prévisualiser)." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Classement</div></div>
            <div className="adm-card-pad adm-fields">
              <SelectField name="categoryId" label="Catégorie" required defaultValue={text('categoryId')} error={err.categoryId}
                placeholder="Choisir…" options={categories.map((c) => ({ value: c.id, label: c.title }))} />
              <SelectField name="themeId" label="Thématique" defaultValue={text('themeId')} error={err.themeId}
                placeholder="Aucune" hint="Regroupe plusieurs cours sous une même carte sur l’accueil."
                options={themes.map((t) => ({ value: t.id, label: `${t.title} (${t.categoryTitle})` }))} />
              <SelectField name="difficulty" label="Niveau" defaultValue={text('difficulty')} error={err.difficulty} placeholder="Non précisé"
                options={[
                  { value: 'debutant', label: 'Débutant' },
                  { value: 'intermediaire', label: 'Intermédiaire' },
                  { value: 'confirme', label: 'Confirmé' },
                ]} />
            </div>
          </section>
        </div>
      </div>
      <FormBar cancelHref={cancelHref} submitLabel={submitLabel} />
    </form>
  )
}
