'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { removeSupport, saveSupport } from './actions'
import { MAX_SUPPORT_BYTES, SUPPORT_EXTENSIONS, SUPPORT_TYPES, extensionOf, safeFileName } from '@/lib/support-files'

type Props = {
  courseId: number
  supportName: string | null
  downloadUrl: string | null
}

type Message = { type: 'ok' | 'error'; text: string }

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

  async function onRemove() {
    if (!window.confirm('Supprimer le support de ce cours ?')) return
    setBusy(true)
    setMessage(null)
    const result = await removeSupport(courseId)
    setBusy(false)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error })
      return
    }
    setMessage({ type: 'ok', text: 'Support supprimé.' })
    router.refresh()
  }

  const inputId = `support-${courseId}`

  return (
    <div className="admin-support">
      <div className="admin-support-current">
        {supportName && downloadUrl ? (
          <a href={downloadUrl} className="admin-support-file" title="Télécharger">
            📎 {supportName}
          </a>
        ) : (
          <span style={{ color: 'var(--text-d)' }}>Aucun support</span>
        )}
      </div>

      <div className="admin-support-actions">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={SUPPORT_EXTENSIONS.map((e) => `.${e}`).join(',')}
          onChange={onFileChange}
          disabled={busy}
          className="admin-file-input"
        />
        <label htmlFor={inputId} className={`btn btn-ghost btn-sm${busy ? ' is-disabled' : ''}`}>
          {busy ? `Envoi… ${progress}%` : supportName ? 'Remplacer' : 'Téléverser'}
        </label>
        {supportName && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove} disabled={busy}>
            Supprimer
          </button>
        )}
      </div>

      {message && (
        <div role="status" className={`admin-msg admin-msg-${message.type}`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
