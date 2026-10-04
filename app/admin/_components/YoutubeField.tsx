'use client'

import { useState } from 'react'
import { ExternalLink, TriangleAlert } from 'lucide-react'
import { getYoutubeVideoId } from '@/lib/youtube'
import { Field } from './FormKit'

/** Champ « lien de la vidéo » avec contrôle en direct et miniature YouTube. */
export default function YoutubeField({
  name,
  label,
  defaultValue,
  error,
  hint,
  required,
}: {
  name: string
  label: string
  defaultValue?: string | null
  error?: string
  hint?: React.ReactNode
  required?: boolean
}) {
  const [value, setValue] = useState(defaultValue ?? '')
  const id = value.trim() ? getYoutubeVideoId(value) : null
  const filled = value.trim() !== ''

  return (
    <Field id={`f-${name}`} label={label} required={required} hint={hint} error={error}>
      <input
        id={`f-${name}`}
        name={name}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://www.youtube.com/watch?v=…"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
      />
      {id && (
        <div className="adm-video-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://i.ytimg.com/vi/${id}/mqdefault.jpg`} alt="Miniature de la vidéo" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600 }}>Vidéo YouTube reconnue</div>
            <div className="adm-muted" style={{ fontSize: 12.5 }}>Identifiant : {id}</div>
            <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, color: 'var(--purple-l)', display: 'inline-flex', gap: 5, alignItems: 'center' }}>
              Ouvrir sur YouTube <ExternalLink size={12} aria-hidden="true" />
            </a>
          </div>
        </div>
      )}
      {filled && !id && (
        <div className="adm-alert adm-alert-warn">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>
            Ce n’est pas un lien YouTube reconnu (ancienne vidéo Vimeo ?). Le site affichera « Vidéo non disponible »
            tant qu’un lien YouTube n’est pas renseigné.
          </div>
        </div>
      )}
    </Field>
  )
}
