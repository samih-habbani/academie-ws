'use client'

import { useActionState, useState } from 'react'
import { ExternalLink, Plus, Trash2 } from 'lucide-react'
import { emptyState, type FormState } from '@/lib/admin/form-state'
import { getYoutubeVideoId } from '@/lib/youtube'
import { FormAlert, FormBar, TextArea, TextInput } from '../../_components/FormKit'

export type IdeaLink = { url: string; title: string | null; author: string | null }
export type IdeaValues = { title: string; description: string; links: IdeaLink[] }

export default function IdeaForm({
  action,
  initial,
  cancelHref,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>
  initial: IdeaValues
  cancelHref: string
  submitLabel: string
}) {
  const [state, formAction] = useActionState(action, emptyState)
  const submitted = Object.keys(state.values).length > 0
  const text = (key: 'title' | 'description') => (submitted ? (state.values[key] ?? '') : initial[key])
  const err = state.errors

  // Après une erreur, on reprend exactement les liens saisis ; sinon ceux de l'idée (avec leurs titres déjà connus).
  const startLinks: IdeaLink[] = submitted
    ? (state.values.links ?? '').split('\n').filter(Boolean).map((url) => ({ url, title: null, author: null }))
    : initial.links
  const [links, setLinks] = useState<IdeaLink[]>(startLinks.length ? startLinks : [])
  const [draft, setDraft] = useState('')

  const draftId = draft.trim() ? getYoutubeVideoId(draft) : null
  const addDraft = () => {
    const value = draft.trim()
    if (!value || !draftId) return
    if (links.some((l) => getYoutubeVideoId(l.url) === draftId)) { setDraft(''); return }
    setLinks((prev) => [...prev, { url: value, title: null, author: null }])
    setDraft('')
  }

  return (
    <form action={formAction}>
      <FormAlert state={state} />
      <div className="adm-stack" style={{ maxWidth: 820 }}>
        <section className="adm-card">
          <div className="adm-card-head"><div className="adm-card-title">L’idée</div></div>
          <div className="adm-card-pad adm-fields">
            <TextInput name="title" label="Titre" required defaultValue={text('title')} error={err.title} maxLength={255}
              placeholder="ex. Une série sur Docker pour débutants" />
            <TextArea name="description" label="Description" rows={8} defaultValue={text('description')} error={err.description} maxLength={20000}
              hint="Le sujet, le public visé, le plan envisagé, ce que tu veux faire différemment… Visible uniquement par toi." />
          </div>
        </section>

        <section className="adm-card">
          <div className="adm-card-head">
            <div>
              <div className="adm-card-title">Vidéos d’inspiration</div>
              <div className="adm-card-hint">Des vidéos YouTube repérées pour t’en inspirer. Le titre et la chaîne sont récupérés à l’enregistrement.</div>
            </div>
          </div>
          <div className="adm-card-pad adm-fields">
            {links.length > 0 && (
              <ul className="adm-idea-links">
                {links.map((link, i) => {
                  const id = getYoutubeVideoId(link.url)
                  return (
                    <li key={`${link.url}-${i}`}>
                      <input type="hidden" name="link" value={link.url} />
                      {id ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="" loading="lazy" />
                      ) : <span className="adm-idea-noimg" />}
                      <div className="adm-idea-link-main">
                        <div className="adm-idea-link-title">{link.title ?? (id ? 'Nouvelle vidéo' : link.url)}</div>
                        <div className="adm-muted" style={{ fontSize: 12.5 }}>{link.author ?? (id ? 'Titre récupéré à l’enregistrement' : 'Lien non reconnu')}</div>
                      </div>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="adm-icon-btn" aria-label="Ouvrir sur YouTube" title="Ouvrir sur YouTube">
                        <ExternalLink size={16} aria-hidden="true" />
                      </a>
                      <button type="button" className="adm-icon-btn" aria-label="Retirer ce lien" title="Retirer"
                        onClick={() => setLinks((prev) => prev.filter((_, j) => j !== i))}>
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="adm-idea-add">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDraft() } }}
                placeholder="Colle un lien YouTube : https://www.youtube.com/watch?v=…"
                aria-label="Lien YouTube à ajouter"
                autoComplete="off"
              />
              <button type="button" className="adm-btn adm-btn-ghost" onClick={addDraft} disabled={!draftId}>
                <Plus size={16} aria-hidden="true" /> Ajouter
              </button>
            </div>
            {draft.trim() !== '' && !draftId && <div className="adm-hint">Ce n’est pas un lien de vidéo YouTube reconnu.</div>}
            {err.links && <div className="adm-error" role="alert">{err.links}</div>}
          </div>
        </section>
      </div>
      <FormBar cancelHref={cancelHref} submitLabel={submitLabel}>Cette idée n’est visible que par toi.</FormBar>
    </form>
  )
}
