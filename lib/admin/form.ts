import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { isImageBlobUrl, type ImageFolder } from '@/lib/support-files'

export { emptyState, type FormState } from './form-state'
import type { FormState } from './form-state'

/** Toutes les valeurs texte d'un FormData (une case cochée vaut 'on'). */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$ACTION')) values[key] = value
  }
  return values
}

export function failure(values: Record<string, string>, errors: Record<string, string>, message?: string): FormState {
  return { ok: false, message: message ?? 'Certains champs sont invalides.', errors, values }
}

/** Convertit les erreurs zod en { champ: message } (première erreur de chaque champ). */
export function zodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_')
    if (!(key in errors)) errors[key] = issue.message
  }
  return errors
}

/** Redirige vers une page en affichant une notification (lue par le composant Toast). */
export function redirectWithToast(path: string, message: string, type: 'ok' | 'error' = 'ok'): never {
  const sep = path.includes('?') ? '&' : '?'
  redirect(`${path}${sep}${type}=${encodeURIComponent(message)}`)
}

/** Les pages publiques sont en cache (ISR 1 h) : après une modification, on les invalide pour qu'elles se régénèrent. */
export function revalidatePublic() {
  revalidatePath('/')
  revalidatePath('/course/[slug]', 'page')
  revalidatePath('/course/[slug]/chapter/[chapterId]', 'page')
  revalidatePath('/theme/[slug]', 'page')
  revalidatePath('/cours/[id]', 'page')
  revalidatePath('/cours/[id]/chapitre/[chapterId]', 'page')
  revalidatePath('/thematique/[id]', 'page')
}

export const requiredText = (label: string, max = 255) =>
  z.string().trim().min(1, `${label} est obligatoire.`).max(max, `${label} : ${max} caractères maximum.`)

export const optionalText = (label: string, max = 255) =>
  z.string().trim().max(max, `${label} : ${max} caractères maximum.`)

export const positiveInt = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d+$/, `${label} doit être un nombre entier.`)
    .transform(Number)
    .pipe(z.number().int().min(0, `${label} doit être positif.`).max(2_000_000_000, `${label} est trop grand.`))

/** Référence d'image valide : vide, nom de fichier du site, ou URL d'une image téléversée dans le bon dossier. */
export const imageRef = (folder: ImageFolder) =>
  z
    .string()
    .trim()
    .max(500, "L'image : 500 caractères maximum.")
    .refine(
      (v) => v === '' || (/^https?:\/\//i.test(v) ? isImageBlobUrl(v, folder) : /^[A-Za-z0-9._() -]{1,120}$/.test(v)),
      "Image invalide : utilise « Téléverser une image » ou un nom de fichier existant du site.",
    )

/** Entier optionnel : '' → null. */
export const optionalInt = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d*$/, `${label} doit être un nombre entier.`)
    .transform((v) => (v === '' ? null : Number(v)))
    .refine((v) => v === null || v <= 2_000_000_000, `${label} est trop grand.`)
