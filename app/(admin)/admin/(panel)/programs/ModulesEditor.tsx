'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'

export type WorkshopDraft = { title: string; hours: string; description: string; deliverable: string }
export type ModuleDraft = { group: string; title: string; hours: string; content: string; method: string; workshops: WorkshopDraft[] }

const emptyWorkshop = (): WorkshopDraft => ({ title: '', hours: '', description: '', deliverable: '' })
const emptyModule = (): ModuleDraft => ({ group: '', title: '', hours: '', content: '', method: '', workshops: [] })

const num = (v: string) => Number(v.replace(',', '.')) || 0

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/** Éditeur du découpage : modules ordonnables, chacun avec ses ateliers. Sérialisé en JSON dans le champ caché « modules ». */
export default function ModulesEditor({ initial, hoursPerDay, error }: { initial: ModuleDraft[]; hoursPerDay: number; error?: string }) {
  const [modules, setModules] = useState<ModuleDraft[]>(initial)
  const [open, setOpen] = useState<Set<number>>(new Set(initial.length <= 1 ? [0] : []))

  const total = modules.reduce((s, m) => s + num(m.hours), 0)
  const days = hoursPerDay > 0 ? Math.round((total / hoursPerDay) * 2) / 2 : 0

  const update = (i: number, patch: Partial<ModuleDraft>) => setModules((prev) => prev.map((m, k) => (k === i ? { ...m, ...patch } : m)))
  const updateWorkshop = (i: number, j: number, patch: Partial<WorkshopDraft>) =>
    setModules((prev) => prev.map((m, k) => (k === i ? { ...m, workshops: m.workshops.map((w, l) => (l === j ? { ...w, ...patch } : w)) } : m)))
  const toggle = (i: number) => setOpen((prev) => { const next = new Set(prev); if (next.has(i)) next.delete(i); else next.add(i); return next })

  const payload = JSON.stringify(
    modules.map((m) => ({
      group: m.group, title: m.title, hours: num(m.hours), content: m.content, method: m.method,
      workshops: m.workshops.map((w) => ({ title: w.title, hours: num(w.hours), description: w.description, deliverable: w.deliverable })),
    })),
  )

  return (
    <div className="adm-fields">
      <input type="hidden" name="modules" value={payload} />

      <div className="adm-mod-total">
        <strong>{modules.length} module{modules.length > 1 ? 's' : ''}</strong>
        <span>{String(total).replace('.', ',')} h{days >= 1 ? ` · ${String(days).replace('.', ',')} jour${days > 1 ? 's' : ''}` : ''}</span>
        <span className="adm-muted">(base : {hoursPerDay} h par jour)</span>
      </div>

      {modules.map((m, i) => {
        const isOpen = open.has(i)
        const workshopHours = m.workshops.reduce((s, w) => s + num(w.hours), 0)
        return (
          <div key={i} className="adm-mod">
            <div className="adm-mod-head">
              <button type="button" className="adm-mod-toggle" onClick={() => toggle(i)} aria-expanded={isOpen}>
                {isOpen ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                <span className="adm-mod-num">{i + 1}</span>
                <span className="adm-mod-title">{m.title || 'Module sans titre'}</span>
                {m.group && <span className="adm-mod-group">{m.group}</span>}
                <span className="adm-muted">{m.hours ? `${m.hours} h` : ''}{m.workshops.length ? ` · ${m.workshops.length} atelier${m.workshops.length > 1 ? 's' : ''}` : ''}</span>
              </button>
              <div className="adm-actions">
                <button type="button" className="adm-icon-btn" aria-label="Monter" title="Monter" disabled={i === 0} onClick={() => setModules((p) => move(p, i, i - 1))}><ArrowUp size={16} aria-hidden="true" /></button>
                <button type="button" className="adm-icon-btn" aria-label="Descendre" title="Descendre" disabled={i === modules.length - 1} onClick={() => setModules((p) => move(p, i, i + 1))}><ArrowDown size={16} aria-hidden="true" /></button>
                <button type="button" className="adm-icon-btn" aria-label="Supprimer le module" title="Supprimer" onClick={() => setModules((p) => p.filter((_, k) => k !== i))}><Trash2 size={16} aria-hidden="true" /></button>
              </div>
            </div>

            {isOpen && (
              <div className="adm-mod-body">
                <div className="adm-fields-2">
                  <label className="adm-mod-field">Titre du module *
                    <input value={m.title} onChange={(e) => update(i, { title: e.target.value })} maxLength={255} placeholder="ex. Intégration HTML5 / CSS3" />
                  </label>
                  <label className="adm-mod-field">Durée (heures)
                    <input value={m.hours} onChange={(e) => update(i, { hours: e.target.value })} inputMode="decimal" placeholder="ex. 14" />
                  </label>
                </div>
                <div className="adm-fields-2">
                  <label className="adm-mod-field">Regroupement (optionnel)
                    <input value={m.group} onChange={(e) => update(i, { group: e.target.value })} maxLength={120} placeholder="ex. Bloc 1 — Front-end, ou Jour 1" />
                  </label>
                  <label className="adm-mod-field">Méthode (optionnel)
                    <input value={m.method} onChange={(e) => update(i, { method: e.target.value })} maxLength={255} placeholder="ex. 30 % théorie · 70 % pratique" />
                  </label>
                </div>
                <label className="adm-mod-field">Contenu (une ligne par point)
                  <textarea rows={5} value={m.content} onChange={(e) => update(i, { content: e.target.value })} placeholder={'Balises sémantiques\nFlexbox et Grid\nResponsive design'} />
                </label>

                <div className="adm-mod-workshops">
                  <div className="adm-mod-ws-head">
                    <strong>Ateliers pratiques</strong>
                    {workshopHours > 0 && <span className="adm-muted">{String(workshopHours).replace('.', ',')} h d’ateliers</span>}
                  </div>
                  {m.workshops.map((w, j) => (
                    <div key={j} className="adm-ws">
                      <div className="adm-fields-2">
                        <label className="adm-mod-field">Titre de l’atelier *
                          <input value={w.title} onChange={(e) => updateWorkshop(i, j, { title: e.target.value })} maxLength={255} />
                        </label>
                        <label className="adm-mod-field">Durée (heures)
                          <input value={w.hours} onChange={(e) => updateWorkshop(i, j, { hours: e.target.value })} inputMode="decimal" />
                        </label>
                      </div>
                      <label className="adm-mod-field">Description
                        <textarea rows={2} value={w.description} onChange={(e) => updateWorkshop(i, j, { description: e.target.value })} />
                      </label>
                      <div className="adm-ws-foot">
                        <label className="adm-mod-field" style={{ flex: 1 }}>Livrable
                          <input value={w.deliverable} onChange={(e) => updateWorkshop(i, j, { deliverable: e.target.value })} maxLength={255} placeholder="ex. Un site vitrine responsive en ligne" />
                        </label>
                        <button type="button" className="adm-icon-btn" aria-label="Supprimer l’atelier" title="Supprimer l’atelier"
                          onClick={() => update(i, { workshops: m.workshops.filter((_, l) => l !== j) })}><Trash2 size={16} aria-hidden="true" /></button>
                      </div>
                    </div>
                  ))}
                  <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => update(i, { workshops: [...m.workshops, emptyWorkshop()] })}>
                    <Plus size={14} aria-hidden="true" /> Ajouter un atelier
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div>
        <button type="button" className="adm-btn adm-btn-ghost" onClick={() => { setModules((p) => [...p, emptyModule()]); setOpen((p) => new Set(p).add(modules.length)) }}>
          <Plus size={16} aria-hidden="true" /> Ajouter un module
        </button>
      </div>
      {error && <div className="adm-error" role="alert">{error}</div>}
    </div>
  )
}
