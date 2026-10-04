'use client'

import Link from 'next/link'
import { useFormStatus } from 'react-dom'
import { LoaderCircle, Save, TriangleAlert } from 'lucide-react'
import type { FormState } from '@/lib/admin/form-state'

/* ---------- Champ générique (libellé, aide, erreur) ---------- */
export function Field({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="adm-field">
      <label className="adm-label" htmlFor={id}>
        {label}
        {required && <span className="adm-req" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <div className="adm-hint" id={`${id}-hint`}>{hint}</div>}
      {error && (
        <div className="adm-error" id={`${id}-error`} role="alert">
          <TriangleAlert size={14} aria-hidden="true" /> {error}
        </div>
      )}
    </div>
  )
}

type CommonProps = {
  name: string
  label: string
  required?: boolean
  hint?: React.ReactNode
  error?: string
}

export function TextInput({
  name, label, required, hint, error, defaultValue, type = 'text', placeholder, maxLength, min, step, autoComplete, inputMode,
}: CommonProps & {
  defaultValue?: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'url'
  placeholder?: string
  maxLength?: number
  min?: number
  step?: number
  autoComplete?: string
  inputMode?: 'numeric' | 'text' | 'email' | 'decimal'
}) {
  const id = `f-${name}`
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        min={min}
        step={step}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
    </Field>
  )
}

export function TextArea({
  name, label, required, hint, error, defaultValue, rows = 5, maxLength,
}: CommonProps & { defaultValue?: string; rows?: number; maxLength?: number }) {
  const id = `f-${name}`
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      />
    </Field>
  )
}

export function SelectField({
  name, label, required, hint, error, defaultValue, options, placeholder,
}: CommonProps & {
  defaultValue?: string | number | null
  options: { value: string | number; label: string }[]
  placeholder?: string
}) {
  const id = `f-${name}`
  return (
    <Field id={id} label={label} required={required} hint={hint} error={error}>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue === null || defaultValue === undefined ? '' : String(defaultValue)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={String(o.value)}>{o.label}</option>
        ))}
      </select>
    </Field>
  )
}

export function Switch({
  name, label, hint, defaultChecked,
}: { name: string; label: string; hint?: React.ReactNode; defaultChecked?: boolean }) {
  const id = `f-${name}`
  return (
    <div className="adm-field">
      <label className="adm-switch" htmlFor={id}>
        <input id={id} name={name} type="checkbox" defaultChecked={defaultChecked} />
        <span className="adm-switch-track" aria-hidden="true" />
        <span className="adm-switch-text">{label}</span>
      </label>
      {hint && <div className="adm-hint">{hint}</div>}
    </div>
  )
}

/* ---------- Message d'erreur global du formulaire ---------- */
export function FormAlert({ state }: { state: FormState }) {
  if (state.ok || !state.message) return null
  return (
    <div className="adm-alert adm-alert-error" role="alert" style={{ marginBottom: 20 }}>
      <TriangleAlert size={18} aria-hidden="true" />
      <div>{state.message}</div>
    </div>
  )
}

/* ---------- Barre d'enregistrement ---------- */
export function FormBar({
  cancelHref,
  submitLabel = 'Enregistrer',
  children,
}: {
  cancelHref: string
  submitLabel?: string
  children?: React.ReactNode
}) {
  const { pending } = useFormStatus()
  return (
    <div className="adm-formbar">
      <div className="adm-muted" style={{ fontSize: 12.5 }}>{children ?? 'Les champs marqués d’une * sont obligatoires.'}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href={cancelHref} className="adm-btn adm-btn-ghost" aria-disabled={pending}>Annuler</Link>
        <button type="submit" className="adm-btn adm-btn-primary" disabled={pending}>
          {pending ? <LoaderCircle size={16} className="adm-spin" aria-hidden="true" /> : <Save size={16} aria-hidden="true" />}
          {pending ? 'Enregistrement…' : submitLabel}
        </button>
      </div>
    </div>
  )
}
