/** État renvoyé par les actions de formulaire (useActionState). Fichier sans code serveur : importable côté navigateur. */
export type FormState = {
  ok: boolean
  message: string | null
  errors: Record<string, string>
  /** Valeurs saisies, renvoyées pour que React 19 (qui vide les champs après une action) les réaffiche. */
  values: Record<string, string>
}

export const emptyState: FormState = { ok: false, message: null, errors: {}, values: {} }
