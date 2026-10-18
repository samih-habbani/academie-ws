import { createHash } from 'node:crypto'
import { prisma } from '@/lib/db'
import { DEFAULT_LANG, type Lang } from './config'

export type Entity = 'course' | 'chapter' | 'category' | 'theme'

/** Empreinte du texte français : sert à repérer les traductions à refaire quand le français change. */
export const sourceHash = (text: string) => createHash('sha256').update(text).digest('hex').slice(0, 16)

/** Renvoie la traduction d'un champ, ou le texte français s'il n'y en a pas encore. */
export type Translate = (entity: Entity, id: number, field: string, fallback: string) => string

const identity: Translate = (_entity, _id, _field, fallback) => fallback

/**
 * Charge en une requête les traductions des éléments affichés sur une page.
 * Le français (langue source) ne touche pas la base.
 */
export async function loadTranslations(lang: Lang, wanted: Partial<Record<Entity, number[]>>): Promise<Translate> {
  if (lang === DEFAULT_LANG) return identity
  const filters = (Object.entries(wanted) as [Entity, number[]][])
    .filter(([, ids]) => ids.length > 0)
    .map(([entity, ids]) => ({ entity, entityId: { in: [...new Set(ids)] } }))
  if (filters.length === 0) return identity

  const rows = await prisma.translation.findMany({
    where: { lang, OR: filters },
    select: { entity: true, entityId: true, field: true, text: true },
  })
  const map = new Map(rows.map((r) => [`${r.entity}:${r.entityId}:${r.field}`, r.text]))
  return (entity, id, field, fallback) => map.get(`${entity}:${id}:${field}`) ?? fallback
}

/**
 * Traductions « par texte » (contenu des programmes) : la clé est l'empreinte du texte français
 * (entity 'text', entityId 0, field = empreinte), pas un identifiant de ligne. Les modules et ateliers sont réécrits
 * à chaque enregistrement du back-office : la traduction suit donc le texte, pas la ligne. Si le français change,
 * l'empreinte change et le texte repasse en français jusqu'à la prochaine exécution de la skill de traduction.
 */
export async function loadTextTranslations(lang: Lang, texts: string[]): Promise<(text: string) => string> {
  const same = (text: string) => text
  if (lang === DEFAULT_LANG) return same
  const hashes = [...new Set(texts.map((t) => t.trim()).filter(Boolean).map(sourceHash))]
  if (hashes.length === 0) return same
  const rows = await prisma.translation.findMany({
    where: { lang, entity: 'text', entityId: 0, field: { in: hashes } },
    select: { field: true, text: true },
  })
  const map = new Map(rows.map((r) => [r.field, r.text]))
  return (text) => map.get(sourceHash(text.trim())) ?? text
}
