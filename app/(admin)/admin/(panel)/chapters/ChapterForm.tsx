'use client'

import { useActionState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { FormAlert, FormBar, SelectField, Switch, TextArea, TextInput } from '../../_components/FormKit'
import YoutubeField from '../../_components/YoutubeField'

export type ChapterValues = {
  title: string
  courseId: string
  chapterPart: string
  numOrder: string
  type: string
  duration: string
  urlVideo: string
  description: string
  material: string
  free: boolean
  available: boolean
}

export default function ChapterForm({
  action,
  initial,
  courses,
  cancelHref,
  returnTo,
  submitLabel,
  isNew,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: ChapterValues
  courses: { id: number; title: string }[]
  cancelHref: string
  returnTo: string
  submitLabel: string
  isNew: boolean
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (key: Exclude<keyof ChapterValues, 'free' | 'available'>) => (submitted ? (state.values[key] ?? '') : initial[key])
  const flag = (key: 'free' | 'available') => (submitted ? state.values[key] === 'on' : initial[key])
  const err = state.errors

  return (
    <form action={formAction}>
      <input type="hidden" name="returnTo" value={returnTo} />
      <FormAlert state={state} />
      <div className="adm-form-layout">
        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Informations</div></div>
            <div className="adm-card-pad adm-fields">
              <TextInput name="title" label="Titre" required defaultValue={text('title')} error={err.title} maxLength={255} />
              <SelectField name="courseId" label="Cours" required defaultValue={text('courseId')} error={err.courseId} placeholder="Choisir un cours…"
                options={courses.map((c) => ({ value: c.id, label: c.title }))} />
              <TextInput name="chapterPart" label="Partie" defaultValue={text('chapterPart')} error={err.chapterPart}
                placeholder="ex. Les concepts clés"
                hint="Optionnel. Les chapitres consécutifs qui partagent la même partie sont regroupés sous un titre sur la page du cours." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Vidéo</div></div>
            <div className="adm-card-pad adm-fields">
              <YoutubeField name="urlVideo" label="Lien YouTube" defaultValue={text('urlVideo')} error={err.urlVideo}
                hint="Colle l’adresse de la vidéo : elle est enregistrée sous la forme https://www.youtube.com/watch?v=… (le temps de départ éventuel est ignoré)." />
              <div className="adm-fields-2">
                <TextInput name="duration" label="Durée" required defaultValue={text('duration')} error={err.duration} maxLength={75}
                  placeholder="ex. 12m30" hint="Texte libre affiché dans la liste des chapitres." />
                <SelectField name="type" label="Type" defaultValue={text('type')} error={err.type} placeholder="Non précisé"
                  options={[
                    { value: 'cours', label: 'Cours' },
                    { value: 'exo', label: 'Exercice' },
                    { value: 'tp', label: 'TP' },
                    { value: 'quiz', label: 'Quiz' },
                  ]} />
              </div>
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Contenu</div></div>
            <div className="adm-card-pad adm-fields">
              <TextArea name="description" label="Description" rows={9} defaultValue={text('description')} error={err.description}
                hint="Texte libre (le HTML est conservé tel quel). Non affiché sur le site pour l’instant." />
              <TextInput name="material" label="Support historique" defaultValue={text('material')} error={err.material} maxLength={125}
                hint="Ancien champ (chemin d’un fichier). Pour proposer un fichier à télécharger, utilise plutôt le support de cours dans la fiche du cours." />
            </div>
          </section>
        </div>

        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Publication</div></div>
            <div className="adm-card-pad adm-fields">
              <Switch name="available" label="Disponible" defaultChecked={flag('available')} hint="Masqué, le chapitre n’apparaît pas dans la liste du cours (son lien direct reste accessible)." />
              <Switch name="free" label="Gratuit" defaultChecked={flag('free')} hint="Affiche l’étiquette « Gratuit » sur le chapitre." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Position</div></div>
            <div className="adm-card-pad">
              <TextInput name="numOrder" label="Ordre dans le cours" type="number" min={0} defaultValue={text('numOrder')} error={err.numOrder}
                hint={isNew
                  ? 'Laisse vide pour ajouter à la fin. Si la position est déjà prise, les chapitres suivants sont décalés.'
                  : 'Si la position est déjà prise, les chapitres suivants sont décalés. Tu peux aussi réorganiser avec les flèches depuis la fiche du cours.'} />
            </div>
          </section>
        </div>
      </div>
      <FormBar cancelHref={cancelHref} submitLabel={submitLabel} />
    </form>
  )
}
