'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { CircleCheck, TriangleAlert, X } from 'lucide-react'

type ToastData = { type: 'ok' | 'error'; text: string }

/** Affiche la notification portée par ?ok=… ou ?error=… (posée par redirectWithToast), puis nettoie l'URL. */
export default function Toast() {
  const params = useSearchParams()
  const pathname = usePathname()
  const [toast, setToast] = useState<ToastData | null>(null)
  const ok = params.get('ok')
  const error = params.get('error')

  useEffect(() => {
    const text = ok ?? error
    if (!text) return
    setToast({ type: ok ? 'ok' : 'error', text })

    const next = new URLSearchParams(params.toString())
    next.delete('ok')
    next.delete('error')
    const query = next.toString()
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)

    const timer = setTimeout(() => setToast(null), 5500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok, error, pathname])

  if (!toast) return null

  return (
    <div className="adm-toasts" role="status" aria-live="polite">
      <div className={`adm-toast adm-toast-${toast.type}`}>
        {toast.type === 'ok' ? (
          <CircleCheck size={20} color="var(--success)" aria-hidden="true" />
        ) : (
          <TriangleAlert size={20} color="var(--adm-danger)" aria-hidden="true" />
        )}
        <span style={{ flex: 1 }}>{toast.text}</span>
        <button type="button" className="adm-icon-btn" onClick={() => setToast(null)} aria-label="Fermer la notification">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
