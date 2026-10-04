/** « Data Science with Python » → « data-science-with-python » (sans accents, ASCII, tirets). */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

/** Premier slug libre dérivé de `base` : « python », puis « python-2 », « python-3 »… */
export function firstFreeSlug(base: string, taken: Set<string>, fallback: string): string {
  const root = slugify(base) || fallback
  if (!taken.has(root)) return root
  for (let n = 2; ; n++) {
    const candidate = `${root}-${n}`
    if (!taken.has(candidate)) return candidate
  }
}

/** Forme valide d'un slug saisi à la main. */
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
