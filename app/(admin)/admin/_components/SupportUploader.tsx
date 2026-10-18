'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { CircleCheck, Paperclip, TriangleAlert, Upload } from 'lucide-react'
import { removeSupport, saveSupport } from '../actions'
import { MAX_SUPPORT_BYTES, SUPPORT_EXTENSIONS, SUPPORT_TYPES, extensionOf, safeFileName } from '@/lib/support-files'
import ConfirmDelete from './ConfirmDelete'

type Props = {
  courseId: number
  supportName: string | null
  downloadUrl: string | null
}

type Message = { type: 'ok' | 'error'; text: string }

/** Envoi / remplacement / suppression du support de cours (fichier téléversé directement vers Vercel Blob). */
export default function SupportUploader({ courseId, supportName, downloadUrl }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState<Message | null>(null)

  async function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setMessage(null)

    const ext = extensionOf(file.name)
    if (!SUPPORT_EXTENSIONS.includes(ext)) {
      setMessage({ type: 'error', text: `Type non autorisé (.${ext || '?'}). Formats : ${SUPPORT_EXTENSIONS.join(', ')}.` })
      event.target.value = ''
      return
    }
    if (file.size > MAX_SUPPORT_BYTES) {
      setMessage({ type: 'error', text: `Fichier trop lourd (${Math.round(file.size / 1048576)} Mo, maximum ${MAX_SUPPORT_BYTES / 1048576} Mo).` })
      event.target.value = ''
      return
    }

    setBusy(true)
    setProgress(0)
    try {
      // 1) Envoi direct du navigateur vers Vercel Blob (jeton délivré par /api/admin/upload, réservé à l'admin).
      const blob = await upload(`supports/cours-${courseId}/${safeFileName(file.name)}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/upload',
        clientPayload: JSON.stringify({ courseId }),
        contentType: SUPPORT_TYPES[ext],
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      })
      // 2) Enregistrement en base + rafraîchissement des pages publiques.
      const result = await saveSupport(courseId, blob.url, file.name)
      if (!result.ok) throw new Error(result.error)
      setMessage({ type: 'ok', text: 'Support enregistré.' })
      router.refresh()
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : "Échec de l'envoi." })
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function onRemove(): Promise<{ error?: string } | void> {
    const result = await removeSupport(courseId)
    if (!result.ok) return { error: result.error }
    setMessage({ type: 'ok', text: 'Support supprimé.' })
    router.refresh()
  }

  const inputId = `support-${courseId}`

  return (
    <div className="adm-fields">
      <div className="adm-video-preview" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Paperclip size={20} color="var(--purple-l)" aria-hidden="true" />
          {supportName && downloadUrl ? (
            <a href={downloadUrl} style={{ color: 'var(--purple-l)', wordBreak: 'break-all' }} title="Télécharger">{supportName}</a>
          ) : (
            <span className="adm-muted">Aucun support pour ce cours</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <input ref={inputRef} id={inputId} type="file" accept={SUPPORT_EXTENSIONS.map((e) => `.${e}`).join(',')} onChange={onFileChange} disabled={busy} className="adm-file-input" />
          <label htmlFor={inputId} className="adm-btn adm-btn-ghost adm-btn-sm" aria-disabled={busy}>
            <Upload size={14} aria-hidden="true" /> {busy ? `Envoi… ${progress}%` : supportName ? 'Remplacer' : 'Téléverser'}
          </label>
          {supportName && (
            <ConfirmDelete
              action={async () => onRemove()}
              fields={{ id: courseId }}
              title="Supprimer le support ?"
              description="Le fichier sera supprimé du stockage et le bouton de téléchargement disparaîtra du site."
              variant="icon"
              label="Supprimer le support"
            />
          )}
        </div>
      </div>

      {message && (
        <div className={`adm-alert ${message.type === 'ok' ? 'adm-alert-info' : 'adm-alert-error'}`} role="status">
          {message.type === 'ok' ? <CircleCheck size={18} aria-hidden="true" /> : <TriangleAlert size={18} aria-hidden="true" />}
          <div>{message.text}</div>
        </div>
      )}
      <div className="adm-hint">Formats : PDF, ZIP, Word, PowerPoint, Excel… (100 Mo maximum). Le fichier est proposé en téléchargement sur la page du cours et sur chacune de ses vidéos.</div>
    </div>
  )
}
