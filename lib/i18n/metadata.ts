import type { Metadata } from 'next'
import { LANGS, localizePath, type Lang } from './config'

/** Adresse canonique + alternatives par langue (hreflang) : indispensable pour que Google indexe chaque version. */
export function alternatesFor(lang: Lang, path: string): Metadata['alternates'] {
  return {
    canonical: localizePath(lang, path),
    languages: { ...Object.fromEntries(LANGS.map((l) => [l, localizePath(l, path)])), 'x-default': localizePath('fr', path) },
  }
}
