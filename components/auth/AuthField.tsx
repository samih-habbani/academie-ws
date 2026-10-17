type Props = {
  name: string
  label: string
  type?: string
  defaultValue?: string
  error?: string
  hint?: string
  required?: boolean
  readOnly?: boolean
  autoComplete?: string
  maxLength?: number
  rows?: number
  placeholder?: string
}

/** Champ de formulaire public (même style que le formulaire de contact) avec erreur et aide. */
export default function AuthField({ name, label, type = 'text', defaultValue, error, hint, required, readOnly, autoComplete, maxLength, rows, placeholder }: Props) {
  const id = `f-${name}`
  const described = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  const common = { id, name, required, readOnly, autoComplete, maxLength, placeholder, 'aria-invalid': error ? true : undefined, 'aria-describedby': described }
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      {rows ? (
        <textarea {...common} rows={rows} defaultValue={defaultValue} />
      ) : (
        <input {...common} type={type} defaultValue={defaultValue} className={readOnly ? 'is-readonly' : undefined} />
      )}
      {error ? <span id={`${id}-err`} className="field-error">{error}</span> : hint ? <span id={`${id}-hint`} className="field-hint">{hint}</span> : null}
    </div>
  )
}
