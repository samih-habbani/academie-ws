export const LANGS = ['fr', 'en'] as const
export type Lang = (typeof LANGS)[number]
export const DEFAULT_LANG: Lang = 'fr'

export const hasLang = (value: string): value is Lang => (LANGS as readonly string[]).includes(value)

/** Locale pour les dates et nombres (Intl). */
export const INTL_LOCALE: Record<Lang, string> = { fr: 'fr-FR', en: 'en-GB' }

/**
 * Chemin public dans la langue demandée. Le français est à la racine (`/course/python`),
 * les autres langues sont préfixées (`/en/course/python`).
 */
export function localizePath(lang: Lang, path: string): string {
  if (lang === DEFAULT_LANG) return path || '/'
  if (path === '/' || path === '') return `/${lang}`
  return `/${lang}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Retire le préfixe de langue d'un chemin : `/en/course/x` → `/course/x`. */
export function stripLang(pathname: string): string {
  for (const lang of LANGS) {
    if (lang === DEFAULT_LANG) continue
    if (pathname === `/${lang}`) return '/'
    if (pathname.startsWith(`/${lang}/`)) return pathname.slice(lang.length + 1)
  }
  return pathname
}

/** Remplace {nom} par sa valeur : fmt('{n} vidéos', { n: 3 }). */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))
}
