import { z } from 'zod'
import { prisma } from '@/lib/db'
import { SLUG_REGEX, firstFreeSlug, slugify } from '@/lib/slug'

/** Champ « URL » du formulaire : vide (généré depuis le titre) ou un slug valide. */
export const slugField = z
  .string()
  .trim()
  .max(60, 'L’URL : 60 caractères maximum.')
  .refine((v) => v === '' || SLUG_REGEX.test(v), 'L’URL ne peut contenir que des minuscules, des chiffres et des tirets (ex. python-poo).')

type Model = 'course' | 'theme'

async function takenSlugs(model: Model, excludeId?: number): Promise<Set<string>> {
  const where = excludeId ? { id: { not: excludeId } } : {}
  const rows = model === 'course'
    ? await prisma.course.findMany({ where, select: { slug: true } })
    : await prisma.theme.findMany({ where, select: { slug: true } })
  return new Set(rows.map((r) => r.slug))
}

/**
 * Slug à enregistrer : celui saisi (erreur s'il est déjà pris), sinon l'ancien slug conservé
 * (`current`), sinon un slug généré depuis le titre et rendu unique.
 */
export async function resolveSlug(
  model: Model,
  input: string,
  title: string,
  options: { excludeId?: number; current?: string } = {},
): Promise<{ slug: string } | { error: string }> {
  const taken = await takenSlugs(model, options.excludeId)
  if (input) return taken.has(input) ? { error: 'Cette URL est déjà utilisée par un autre élément.' } : { slug: input }
  if (options.current) return { slug: options.current }
  return { slug: firstFreeSlug(title, taken, slugify(model) || model) }
}
