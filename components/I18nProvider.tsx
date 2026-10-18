'use client'

import { createContext, useContext, useMemo } from 'react'
import { localizePath, type Lang } from '@/lib/i18n/config'
import type { Dict } from '@/lib/i18n/dictionaries'

type Ctx = { lang: Lang; t: Dict; href: (path: string) => string }
const I18nContext = createContext<Ctx | null>(null)

/** Donne la langue, les textes et le générateur de liens aux composants client. */
export function I18nProvider({ lang, dict, children }: { lang: Lang; dict: Dict; children: React.ReactNode }) {
  const value = useMemo<Ctx>(() => ({ lang, t: dict, href: (path) => localizePath(lang, path) }), [lang, dict])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n doit être utilisé dans <I18nProvider>.')
  return ctx
}
