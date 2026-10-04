export const PAGE_SIZE = 20

export type SearchParams = Record<string, string | string[] | undefined>

/** Première valeur d'un paramètre d'URL, sans espaces superflus ('' si absent). */
export function param(sp: SearchParams, key: string): string {
  const value = sp[key]
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? ''
}

/** Paramètre entier positif, ou null. */
export function intParam(sp: SearchParams, key: string): number | null {
  const n = Number(param(sp, key))
  return Number.isInteger(n) && n > 0 ? n : null
}

export function pageParam(sp: SearchParams): number {
  return intParam(sp, 'page') ?? 1
}

export function pageCount(total: number, size = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / size))
}

/** Reconstruit une query string en conservant les paramètres actuels, avec des surcharges (null = retirer). */
export function withParams(sp: SearchParams, overrides: Record<string, string | number | null>): string {
  const query = new URLSearchParams()
  for (const [key, raw] of Object.entries(sp)) {
    const value = Array.isArray(raw) ? raw[0] : raw
    if (value !== undefined && value !== '' && key !== 'ok' && key !== 'error') query.set(key, value)
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === '') query.delete(key)
    else query.set(key, String(value))
  }
  const text = query.toString()
  return text ? `?${text}` : ''
}

/** Valide un champ de tri contre une liste blanche (jamais de nom de colonne venant de l'URL tel quel). */
export function sortParam<T extends string>(
  sp: SearchParams,
  allowed: readonly T[],
  fallback: T,
  fallbackDir: 'asc' | 'desc' = 'asc',
): { field: T; dir: 'asc' | 'desc' } {
  const field = allowed.find((f) => f === param(sp, 'sort')) ?? fallback
  const raw = param(sp, 'dir')
  const dir = raw === 'asc' || raw === 'desc' ? raw : fallbackDir
  return { field, dir }
}
