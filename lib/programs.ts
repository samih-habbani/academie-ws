import type { Prisma } from '@prisma/client'
import type { Lang } from '@/lib/i18n/config'

// L'ordre ci-dessous est celui d'affichage du catalogue public (regroupé par domaine).
export const DOMAINS = ['cursus', 'dev', 'web', 'backend', 'mobile', 'data', 'ai', 'aidev', 'compliance', 'marketing', 'systems', 'design', 'other'] as const
export type Domain = (typeof DOMAINS)[number]
/** Libellés français des domaines (back-office). Ceux du site public sont dans les dictionnaires (`programs.domain`). */
export const DOMAIN_LABELS: Record<Domain, string> = {
  cursus: 'Cursus & titres professionnels', dev: 'Fondamentaux du développement', web: 'Développement web front-end', backend: 'Back-end & frameworks',
  mobile: 'Développement mobile', data: 'Data science', ai: 'IA générative & assistants', aidev: 'IA pour développeurs',
  compliance: 'Conformité & gouvernance de l’IA', marketing: 'SEO, SEA & analytics', systems: 'Systèmes & réseaux', design: 'Design & UX', other: 'Autre',
}
export const LEVELS = ['debutant', 'intermediaire', 'confirme'] as const
export const FORMATS = ['presentiel', 'distanciel', 'mixte'] as const
export const STATUSES = ['draft', 'published'] as const

/** Tout ce qu'il faut pour afficher une fiche programme complète (modules, ateliers, outils, certifications, cours liés). */
export const programInclude = {
  modules: { orderBy: { position: 'asc' }, include: { workshops: { orderBy: { position: 'asc' } } } },
  tools: { orderBy: { name: 'asc' } },
  certifications: { orderBy: { name: 'asc' } },
  courses: {
    where: { available: true },
    select: { id: true, slug: true, title: true, logo: true, description: true, difficulty: true, chapterCount: true, duration: true },
    orderBy: { title: 'asc' },
  },
} satisfies Prisma.ProgramInclude

export type ProgramFull = Prisma.ProgramGetPayload<{ include: typeof programInclude }>

export const totalHours = (modules: { hours: number }[]) => modules.reduce((sum, m) => sum + (m.hours || 0), 0)

const trim = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

/** « 21 h · 3 jours » (jours calculés sur la base de `hoursPerDay`, par demi-journée). */
export function formatHours(hours: number, hoursPerDay: number, lang: Lang): string {
  if (!hours) return ''
  const h = lang === 'fr' ? trim(hours) : trim(hours).replace(',', '.')
  const days = Math.round((hours / Math.max(hoursPerDay, 1)) * 2) / 2
  if (days < 1) return `${h} h`
  const d = lang === 'fr' ? trim(days) : trim(days).replace(',', '.')
  const unit = lang === 'fr' ? (days > 1 ? 'jours' : 'jour') : days > 1 ? 'days' : 'day'
  return `${h} h · ${d} ${unit}`
}

/** Texte multi-lignes → liste (puces « - » ou « • » ignorées, lignes vides retirées). */
export const toLines = (text: string): string[] =>
  text.split('\n').map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean)

/** Prix à afficher publiquement : seulement si l'administrateur l'a autorisé et renseigné. */
export function publicPrice(p: { showPrice: boolean; priceAmount: number | null; priceUnit: string }, lang: Lang): string | null {
  if (!p.showPrice || p.priceAmount == null) return null
  const amount = new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB').format(p.priceAmount)
  return `${amount} € ${lang === 'fr' ? 'HT' : 'excl. VAT'}${p.priceUnit ? ` · ${p.priceUnit}` : ''}`
}
