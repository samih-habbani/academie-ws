import { prisma } from '@/lib/db'
import type { ProgramFull } from '@/lib/programs'
import type { ProgramValues } from './ProgramForm'

/** Listes pour les cases à cocher du formulaire. */
export async function loadChoices() {
  const [tools, certifications, courses] = await Promise.all([
    prisma.tool.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.certification.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
  ])
  return {
    tools: tools.map((t) => ({ id: t.id, label: t.name })),
    certifications: certifications.map((c) => ({ id: c.id, label: c.name })),
    courses: courses.map((c) => ({ id: c.id, label: c.title.trim() })),
  }
}

export const emptyProgram: ProgramValues = {
  title: '', slug: '', tagline: '', summary: '', domain: 'web', level: '', coverImage: '',
  audience: '', prerequisites: '', objectives: '', outcomes: '',
  maxParticipants: '', hoursPerDay: '7', teachingMethods: '', evaluation: '', equipment: '', resources: '',
  priceAmount: '', priceUnit: '', showPrice: false, status: 'draft', position: '0',
  formats: [], toolIds: [], certificationIds: [], courseIds: [], modules: [],
}

export function toFormValues(p: ProgramFull): ProgramValues {
  const hours = (n: number) => (n ? String(n) : '')
  return {
    title: p.title, slug: p.slug, tagline: p.tagline, summary: p.summary, domain: p.domain, level: p.level ?? '', coverImage: p.coverImage,
    audience: p.audience, prerequisites: p.prerequisites, objectives: p.objectives.join('\n'), outcomes: p.outcomes.join('\n'),
    maxParticipants: p.maxParticipants == null ? '' : String(p.maxParticipants), hoursPerDay: String(p.hoursPerDay),
    teachingMethods: p.teachingMethods, evaluation: p.evaluation, equipment: p.equipment, resources: p.resources,
    priceAmount: p.priceAmount == null ? '' : String(p.priceAmount), priceUnit: p.priceUnit, showPrice: p.showPrice,
    status: p.status, position: String(p.position),
    formats: p.formats, toolIds: p.tools.map((t) => t.id), certificationIds: p.certifications.map((c) => c.id), courseIds: [],
    modules: p.modules.map((m) => ({
      group: m.group, title: m.title, hours: hours(m.hours), content: m.content, method: m.method,
      workshops: m.workshops.map((w) => ({ title: w.title, hours: hours(w.hours), description: w.description, deliverable: w.deliverable })),
    })),
  }
}
