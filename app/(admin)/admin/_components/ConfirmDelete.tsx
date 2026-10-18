'use client'

import { useActionState, useRef } from 'react'
import { Trash2, TriangleAlert } from 'lucide-react'

type ActionResult = { error?: string } | void
type State = { error?: string }

/**
 * Bouton de suppression avec fenêtre de confirmation. `action` reçoit un FormData contenant les `fields`
 * (ex. l'identifiant) ; en cas de succès elle redirige, sinon elle renvoie { error }.
 */
export default function ConfirmDelete({
  action,
  fields,
  title,
  description,
  confirmLabel = 'Supprimer',
  variant = 'icon',
  label = 'Supprimer',
  disabled = false,
  disabledReason,
}: {
  action: (formData: FormData) => Promise<ActionResult>
  fields: Record<string, string | number>
  title: string
  description: React.ReactNode
  confirmLabel?: string
  variant?: 'icon' | 'button'
  label?: string
  disabled?: boolean
  disabledReason?: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [state, formAction, pending] = useActionState<State, FormData>(async (_prev, formData) => (await action(formData)) ?? {}, {})

  const open = () => dialogRef.current?.showModal()
  const close = () => dialogRef.current?.close()

  return (
    <>
      {variant === 'icon' ? (
        <button type="button" className="adm-icon-btn is-danger" onClick={open} disabled={disabled} aria-label={label} title={disabled ? disabledReason : label}>
          <Trash2 size={16} aria-hidden="true" />
        </button>
      ) : (
        <button type="button" className="adm-btn adm-btn-danger-ghost" onClick={open} disabled={disabled} title={disabled ? disabledReason : undefined}>
          <Trash2 size={15} aria-hidden="true" /> {label}
        </button>
      )}

      <dialog
        ref={dialogRef}
        className="adm-dialog"
        aria-labelledby="confirm-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) close()
        }}
      >
        <form action={formAction}>
          {Object.entries(fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <div className="adm-dialog-body">
            <div className="adm-dialog-icon"><TriangleAlert size={22} aria-hidden="true" /></div>
            <div id="confirm-title" className="adm-dialog-title">{title}</div>
            <div className="adm-dialog-text">{description}</div>
            {state.error && (
              <div className="adm-alert adm-alert-error" style={{ marginTop: 14 }} role="alert">
                <TriangleAlert size={18} aria-hidden="true" />
                <div>{state.error}</div>
              </div>
            )}
          </div>
          <div className="adm-dialog-foot">
            <button type="button" className="adm-btn adm-btn-ghost" onClick={close} disabled={pending}>Annuler</button>
            <button type="submit" className="adm-btn adm-btn-danger" disabled={pending}>
              {pending ? 'Suppression…' : confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
