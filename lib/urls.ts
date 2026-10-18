import { localizePath, type Lang } from '@/lib/i18n/config'

/** URLs publiques du site (explicites, en anglais), dans la langue demandée. */
export const courseUrl = (slug: string, lang: Lang = 'fr') => localizePath(lang, `/course/${slug}`)
export const chapterUrl = (courseSlug: string, chapterId: number, lang: Lang = 'fr') =>
  localizePath(lang, `/course/${courseSlug}/chapter/${chapterId}`)
export const themeUrl = (slug: string, lang: Lang = 'fr') => localizePath(lang, `/theme/${slug}`)
