'use client'

import { useActionState, useState } from 'react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { DOMAIN_LABELS, DOMAINS, FORMATS, LEVELS } from '@/lib/programs'
import { FormAlert, FormBar, SelectField, Switch, TextArea, TextInput } from '../../_components/FormKit'
import ImageField from '../../_components/ImageField'
import ModulesEditor, { type ModuleDraft } from './ModulesEditor'

export type ProgramValues = {
  title: string; slug: string; tagline: string; summary: string; domain: string; level: string; coverImage: string; coverHeadline: string
  audience: string; prerequisites: string; objectives: string; outcomes: string
  maxParticipants: string; hoursPerDay: string; teachingMethods: string; evaluation: string; equipment: string; resources: string
  priceAmount: string; priceUnit: string; showPrice: boolean; status: string; position: string
  formats: string[]; toolIds: number[]; certificationIds: number[]; courseIds: number[]
  modules: ModuleDraft[]
}

const LEVEL_LABELS: Record<string, string> = { debutant: 'Débutant', intermediaire: 'Intermédiaire', confirme: 'Confirmé' }
const FORMAT_LABELS: Record<string, string> = { presentiel: 'Présentiel', distanciel: 'Distanciel', mixte: 'Mixte' }

type Option = { id: number; label: string }

function CheckGrid({ name, label, options, selected, hint, empty }: { name: string; label: string; options: Option[]; selected: number[]; hint?: string; empty: string }) {
  return (
    <div className="adm-field">
      <div className="adm-label">{label}</div>
      {options.length === 0 ? <div className="adm-hint">{empty}</div> : (
        <div className="adm-checks">
          {options.map((o) => (
            <label key={o.id} className="adm-check">
              <input type="checkbox" name={name} value={o.id} defaultChecked={selected.includes(o.id)} /> <span>{o.label}</span>
            </label>
          ))}
        </div>
      )}
      {hint && <div className="adm-hint">{hint}</div>}
    </div>
  )
}

export default function ProgramForm({
  action, initial, tools, certifications, courses, cancelHref, submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: ProgramValues
  tools: Option[]
  certifications: Option[]
  courses: Option[]
  cancelHref: string
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const v = state.values
  const text = (key: keyof ProgramValues & string) => (submitted ? (v[key] ?? '') : String(initial[key] ?? ''))
  const listIds = (key: 'toolIds' | 'certificationIds' | 'courseIds') => (submitted ? (v[key] ?? '').split(',').map(Number).filter(Boolean) : initial[key])
  const formats = submitted ? (v.formats ?? '').split(',').filter(Boolean) : initial.formats
  const err = state.errors

  // Après une erreur, on reprend les modules tels qu'envoyés ; sinon ceux du programme.
  const startModules: ModuleDraft[] = (() => {
    if (!submitted) return initial.modules
    try {
      const raw = JSON.parse(v.modules || '[]') as { group: string; title: string; hours: number; content: string; method: string; workshops: { title: string; hours: number; description: string; deliverable: string }[] }[]
      return raw.map((m) => ({ ...m, hours: m.hours ? String(m.hours) : '', workshops: m.workshops.map((w) => ({ ...w, hours: w.hours ? String(w.hours) : '' })) }))
    } catch {
      return initial.modules
    }
  })()
  const hpd = Number(text('hoursPerDay')) || 7
  const [showPrice, setShowPrice] = useState(submitted ? v.showPrice === 'on' : initial.showPrice)

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-form-layout">
        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Présentation</div></div>
            <div className="adm-card-pad adm-fields">
              <TextInput name="title" label="Titre du programme" required defaultValue={text('title')} error={err.title} maxLength={255} placeholder="ex. Développeur web et web mobile" />
              <TextInput name="tagline" label="Accroche" defaultValue={text('tagline')} error={err.tagline} maxLength={255} placeholder="Une phrase qui donne envie" />
              <TextArea name="summary" label="Présentation" rows={5} defaultValue={text('summary')} error={err.summary} hint="Quelques lignes sur le programme, son contexte et sa valeur." />
              <div className="adm-fields-2">
                <SelectField name="domain" label="Domaine" required defaultValue={text('domain')} error={err.domain} options={DOMAINS.map((d) => ({ value: d, label: DOMAIN_LABELS[d] }))} />
                <SelectField name="level" label="Niveau" defaultValue={text('level')} error={err.level} placeholder="Non précisé" options={LEVELS.map((l) => ({ value: l, label: LEVEL_LABELS[l] }))} />
              </div>
              <TextInput name="coverHeadline" label="Titre d’illustration (en anglais)" defaultValue={text('coverHeadline')} error={err.coverHeadline} maxLength={60} placeholder="ex. Build UIs that react." hint="Phrase courte et accrocheuse affichée sur l’illustration de la carte. Laisser vide pour reprendre le titre du programme." />
              <ImageField name="coverImage" folder="programs" label="Image de couverture" defaultValue={text('coverImage')} error={err.coverImage} hint="Optionnelle. Sans image, un fond dégradé est utilisé." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Public visé, prérequis et objectifs</div></div>
            <div className="adm-card-pad adm-fields">
              <TextArea name="audience" label="À qui s’adresse le programme" rows={4} defaultValue={text('audience')} error={err.audience} />
              <TextArea name="prerequisites" label="Prérequis" rows={4} defaultValue={text('prerequisites')} error={err.prerequisites} hint="Une ligne par prérequis." />
              <TextArea name="objectives" label="Objectifs pédagogiques" rows={6} defaultValue={text('objectives')} error={err.objectives} hint="Une ligne par objectif." />
              <TextArea name="outcomes" label="Débouchés" rows={4} defaultValue={text('outcomes')} error={err.outcomes} hint="Une ligne par débouché ou poursuite d’études." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head">
              <div>
                <div className="adm-card-title">Découpage et ateliers</div>
                <div className="adm-card-hint">Les modules dans l’ordre du programme, chacun avec sa durée et ses ateliers pratiques.</div>
              </div>
            </div>
            <div className="adm-card-pad">
              <ModulesEditor initial={startModules} hoursPerDay={hpd} error={err.modules} />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Modalités</div></div>
            <div className="adm-card-pad adm-fields">
              <TextArea name="teachingMethods" label="Méthodes pédagogiques" rows={4} defaultValue={text('teachingMethods')} error={err.teachingMethods} hint="Une ligne par méthode." />
              <TextArea name="evaluation" label="Évaluation" rows={4} defaultValue={text('evaluation')} error={err.evaluation} hint="Une ligne par modalité d’évaluation." />
              <TextArea name="equipment" label="Matériel requis" rows={3} defaultValue={text('equipment')} error={err.equipment} hint="Une ligne par élément." />
              <TextArea name="resources" label="Ressources fournies" rows={3} defaultValue={text('resources')} error={err.resources} hint="Une ligne par ressource." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Outils, certifications et cours liés</div></div>
            <div className="adm-card-pad adm-fields">
              <CheckGrid name="toolIds" label="Outils et technologies" options={tools} selected={listIds('toolIds')} empty="Aucun outil pour l’instant : ajoute-en dans « Outils »." />
              <CheckGrid name="certificationIds" label="Certifications" options={certifications} selected={listIds('certificationIds')} empty="Aucune certification pour l’instant : ajoute-en dans « Certifications »." />
              <CheckGrid name="courseIds" label="Cours en ligne associés" options={courses} selected={listIds('courseIds')} hint="Supports vidéo de la plateforme liés à ce programme." empty="Aucun cours." />
            </div>
          </section>
        </div>

        <div className="adm-stack">
          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Publication</div></div>
            <div className="adm-card-pad adm-fields">
              <SelectField name="status" label="Statut" required defaultValue={text('status')} error={err.status}
                options={[{ value: 'draft', label: 'Brouillon (invisible)' }, { value: 'published', label: 'Publié sur le site' }]} />
              <TextInput name="slug" label="Adresse de la page (URL)" defaultValue={text('slug')} error={err.slug} maxLength={60} placeholder="ex. developpeur-web-mobile"
                hint="/programs/… — laisse vide pour la générer depuis le titre." />
              <TextInput name="position" label="Ordre dans le catalogue" type="number" min={0} defaultValue={text('position')} error={err.position} hint="Plus petit = affiché en premier." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Format</div></div>
            <div className="adm-card-pad adm-fields">
              <div className="adm-field">
                <div className="adm-label">Formats possibles</div>
                <div className="adm-checks">
                  {FORMATS.map((f) => (
                    <label key={f} className="adm-check"><input type="checkbox" name="formats" value={f} defaultChecked={formats.includes(f)} /> <span>{FORMAT_LABELS[f]}</span></label>
                  ))}
                </div>
              </div>
              <TextInput name="maxParticipants" label="Effectif maximum" type="number" min={1} defaultValue={text('maxParticipants')} error={err.maxParticipants} />
              <TextInput name="hoursPerDay" label="Heures par journée" type="number" min={1} defaultValue={text('hoursPerDay')} error={err.hoursPerDay} hint="Sert à convertir les heures en jours (ex. 7)." />
            </div>
          </section>

          <section className="adm-card">
            <div className="adm-card-head"><div className="adm-card-title">Tarif</div></div>
            <div className="adm-card-pad adm-fields">
              <TextInput name="priceAmount" label="Montant (€ HT)" type="number" min={0} defaultValue={text('priceAmount')} error={err.priceAmount} hint="Reste privé tant que l’affichage est désactivé." />
              <TextInput name="priceUnit" label="Unité" defaultValue={text('priceUnit')} error={err.priceUnit} maxLength={60} placeholder="ex. par jour, par participant, forfait" />
              <Switch name="showPrice" label="Afficher le tarif sur le site" defaultChecked={showPrice}
                hint="Désactivé, le tarif n’apparaît nulle part publiquement." />
            </div>
          </section>
        </div>
      </div>
      <FormBar cancelHref={cancelHref} submitLabel={submitLabel} />
    </form>
  )
}
