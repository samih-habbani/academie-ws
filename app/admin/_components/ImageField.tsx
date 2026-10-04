'use client'

import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { ImageIcon, TriangleAlert, Upload, X } from 'lucide-react'
import { mediaSrc, type MediaFolder } from '@/lib/media'
import { MAX_IMAGE_BYTES, extensionOf, safeFileName } from '@/lib/support-files'
import { Field } from './FormKit'

/** Largeur maximale après réduction : les cartes du site font ≤ 362 px (×2 pour les écrans Retina). */
const MAX_WIDTH: Record<MediaFolder, number> = { courses: 960, themes: 960, categories: 480 }

/** Réduit et convertit l'image en WebP dans le navigateur : les images sont servies telles quelles, elles doivent être légères. */
async function toLightImage(file: File, maxWidth: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Impossible de traiter l'image dans ce navigateur.")
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Conversion de l’image impossible.'))), 'image/webp', 0.82),
  )
}

export default function ImageField({
  name,
  folder,
  label,
  defaultValue,
  error,
  hint,
  required,
}: {
  name: string
  folder: MediaFolder
  label: string
  defaultValue?: string | null
  error?: string
  hint?: React.ReactNode
  required?: boolean
}) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const fileId = `f-${name}-file`
  const src = value.trim() ? mediaSrc(folder, value.trim()) : null

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setProblem(null)
    if (!file.type.startsWith('image/')) {
      setProblem('Choisis un fichier image (PNG, JPG, WebP…).')
      event.target.value = ''
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setProblem('Image trop lourde (25 Mo maximum avant réduction).')
      event.target.value = ''
      return
    }
    setBusy(true)
    try {
      const light = await toLightImage(file, MAX_WIDTH[folder])
      if (light.size > MAX_IMAGE_BYTES) throw new Error('Image encore trop lourde après réduction.')
      const ext = light.type === 'image/webp' ? 'webp' : extensionOf(file.name) || 'png'
      const base = safeFileName(file.name).replace(/\.[^.]+$/, '')
      const blob = await upload(`images/${folder}/${base}.${ext}`, light, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        clientPayload: JSON.stringify({ kind: 'image' }),
        contentType: light.type || 'image/webp',
      })
      setValue(blob.url)
    } catch (e) {
      setProblem(e instanceof Error ? e.message : "Échec de l'envoi de l'image.")
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Field id={`f-${name}`} label={label} required={required} hint={hint} error={error}>
      <div className="adm-media">
        <div className="adm-media-preview">
          {src ? <img src={src} alt="Aperçu" /> : <ImageIcon size={24} aria-hidden="true" />}
        </div>
        <div className="adm-media-body">
          <input
            id={`f-${name}`}
            name={name}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="nom-du-fichier.webp ou URL complète"
            aria-invalid={error ? true : undefined}
          />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input ref={fileRef} id={fileId} type="file" accept="image/*" className="adm-file-input" onChange={onFile} disabled={busy} />
            <label htmlFor={fileId} className="adm-btn adm-btn-ghost adm-btn-sm" aria-disabled={busy}>
              <Upload size={14} aria-hidden="true" /> {busy ? 'Envoi…' : 'Téléverser une image'}
            </label>
            {value && (
              <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => setValue('')} disabled={busy}>
                <X size={14} aria-hidden="true" /> Retirer
              </button>
            )}
          </div>
          {problem && (
            <div className="adm-error" role="alert">
              <TriangleAlert size={14} aria-hidden="true" /> {problem}
            </div>
          )}
        </div>
      </div>
    </Field>
  )
}
