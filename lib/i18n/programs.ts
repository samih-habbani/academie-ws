import type { ProgramFull } from '@/lib/programs'
import type { Lang } from './config'
import { DEFAULT_LANG } from './config'
import { loadTextTranslations } from './content'

const lines = (text: string) => text.split('\n').map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean)

/**
 * Applique `f` à chaque texte traduisible d'un programme (les champs multi-lignes sont traités ligne par ligne).
 * Les noms d'outils et les références de certification ne sont pas traduits.
 * ⚠ La liste des textes est dupliquée dans `.claude/skills/translate-site-content/scripts/export-missing.mjs` : la garder identique.
 */
export function mapProgramText(p: ProgramFull, f: (text: string) => string): ProgramFull {
  const one = (s: string) => (s.trim() ? f(s) : s)
  const many = (s: string) => lines(s).map(one).join('\n')
  return {
    ...p,
    title: one(p.title), tagline: one(p.tagline), summary: one(p.summary), priceUnit: one(p.priceUnit),
    audience: many(p.audience), prerequisites: many(p.prerequisites), teachingMethods: many(p.teachingMethods),
    evaluation: many(p.evaluation), equipment: many(p.equipment), resources: many(p.resources),
    objectives: p.objectives.map(one), outcomes: p.outcomes.map(one),
    modules: p.modules.map((m) => ({
      ...m, group: one(m.group), title: one(m.title), method: one(m.method), content: many(m.content),
      workshops: m.workshops.map((w) => ({ ...w, title: one(w.title), description: one(w.description), deliverable: one(w.deliverable) })),
    })),
    certifications: p.certifications.map((c) => ({ ...c, name: one(c.name), issuer: one(c.issuer), level: one(c.level), description: one(c.description) })),
  }
}

/** Renvoie le programme avec ses textes dans la langue demandée (français si la traduction n'existe pas encore). */
export async function localizeProgram(program: ProgramFull, lang: Lang): Promise<ProgramFull> {
  if (lang === DEFAULT_LANG) return program
  const texts: string[] = []
  mapProgramText(program, (s) => (texts.push(s), s))
  const translate = await loadTextTranslations(lang, texts)
  return mapProgramText(program, translate)
}
