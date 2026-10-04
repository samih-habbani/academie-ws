export const ROLE_ADMIN = 'ROLE_ADMIN'
export const ROLE_USER = 'ROLE_USER'

/** Les rôles sont stockés en JSON ; cette fonction lit n'importe quelle valeur en tableau de chaînes. */
export function rolesOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((r): r is string => typeof r === 'string') : []
}

export const isAdmin = (value: unknown) => rolesOf(value).includes(ROLE_ADMIN)
