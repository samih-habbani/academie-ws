'use server'

import { z } from 'zod'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import {
  failure, formValues, imageRef, optionalText, redirectWithToast, requiredText, revalidatePublic, zodErrors, type FormState,
} from '@/lib/admin/form'
import { resolveSlug, slugField } from '@/lib/admin/slug'
import { DOMAINS, FORMATS, LEVELS, STATUSES } from '@/lib/programs'

const hours = z.coerce.number({ message: 'Durée invalide.' }).min(0, 'Durée invalide.').max(2000, 'Durée trop longue.')

const workshopSchema = z.object({
  title: requiredText('Le titre de l’atelier'),
  hours: hours,
  description: optionalText('La description de l’atelier', 5000),
  deliverable: optionalText('Le livrable', 255),
})
const moduleSchema = z.object({
  group: optionalText('Le regroupement', 120),
  title: requiredText('Le titre du module'),
  hours: hours,
  content: optionalText('Le contenu du module', 10000),
  method: optionalText('La méthode', 255),
  workshops: z.array(workshopSchema).max(30, '30 ateliers maximum par module.'),
})
const modulesSchema = z.array(moduleSchema).max(80, '80 modules maximum.')

const optionalInt = (label: string, min: number, max: number) =>
  z.string().trim().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), `${label} : valeur invalide.`)
    .transform((v) => (v === '' ? null : Number(v)))

const programSchema = z.object({
  title: requiredText('Le titre'),
  slug: slugField,
  tagline: optionalText('L’accroche', 255),
  summary: optionalText('La présentation', 20000),
  domain: z.enum(DOMAINS, { message: 'Domaine invalide.' }),
  level: z.enum(['', ...LEVELS], { message: 'Niveau invalide.' }).transform((v) => (v === '' ? null : v)),
  coverImage: imageRef('programs'),
  coverHeadline: optionalText('Le titre d’illustration', 60),
  audience: optionalText('Le public visé', 10000),
  prerequisites: optionalText('Les prérequis', 10000),
  objectives: optionalText('Les objectifs', 10000),
  outcomes: optionalText('Les débouchés', 10000),
  maxParticipants: optionalInt('L’effectif', 1, 500),
  hoursPerDay: optionalInt('Les heures par jour', 1, 24),
  teachingMethods: optionalText('Les méthodes pédagogiques', 10000),
  evaluation: optionalText('L’évaluation', 10000),
  equipment: optionalText('Le matériel', 10000),
  resources: optionalText('Les ressources', 10000),
  priceAmount: optionalInt('Le tarif', 0, 10_000_000),
  priceUnit: optionalText('L’unité du tarif', 60),
  status: z.enum(STATUSES, { message: 'Statut invalide.' }),
  position: optionalInt('La position', 0, 100000),
})

const lines = (text: string) => text.split('\n').map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean)
const ids = (value: string | undefined) => (value ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0)

type Parsed = z.infer<typeof programSchema>

/** Lit tout le formulaire (champs simples + cases à cocher + JSON des modules). */
function readForm(formData: FormData) {
  const values = formValues(formData)
  const formats = formData.getAll('formats').map(String).filter((f): f is (typeof FORMATS)[number] => (FORMATS as readonly string[]).includes(f))
  const toolIds = formData.getAll('toolIds').map(Number).filter(Number.isInteger)
  const certificationIds = formData.getAll('certificationIds').map(Number).filter(Number.isInteger)
  const courseIds = formData.getAll('courseIds').map(Number).filter(Number.isInteger)
  const kept = {
    ...values,
    formats: formats.join(','),
    toolIds: toolIds.join(','),
    certificationIds: certificationIds.join(','),
    courseIds: courseIds.join(','),
  }
  let modules: unknown = []
  try {
    modules = JSON.parse(values.modules || '[]')
  } catch {
    modules = null
  }
  return { values: kept, formats, toolIds, certificationIds, courseIds, modules, showPrice: values.showPrice === 'on' }
}

function validate(form: ReturnType<typeof readForm>) {
  const parsed = programSchema.safeParse(form.values)
  const modules = modulesSchema.safeParse(form.modules)
  const errors: Record<string, string> = parsed.success ? {} : zodErrors(parsed.error)
  if (!modules.success) {
    const issue = modules.error.issues[0]
    const where = typeof issue.path[0] === 'number' ? `Module ${Number(issue.path[0]) + 1} : ` : ''
    errors.modules = `${where}${issue.message}`
  }
  return { parsed, modules, errors }
}

function toData(p: Parsed, form: ReturnType<typeof readForm>, slug: string) {
  return {
    slug,
    title: p.title,
    tagline: p.tagline,
    summary: p.summary,
    domain: p.domain,
    level: p.level,
    coverImage: p.coverImage,
    coverHeadline: p.coverHeadline,
    audience: p.audience,
    prerequisites: p.prerequisites,
    objectives: lines(p.objectives),
    outcomes: lines(p.outcomes),
    formats: form.formats,
    maxParticipants: p.maxParticipants,
    hoursPerDay: p.hoursPerDay ?? 7,
    teachingMethods: p.teachingMethods,
    evaluation: p.evaluation,
    equipment: p.equipment,
    resources: p.resources,
    priceAmount: p.priceAmount,
    priceUnit: p.priceUnit,
    showPrice: form.showPrice,
    status: p.status,
    position: p.position ?? 0,
  }
}

type Tx = Prisma.TransactionClient
type ModuleInput = {
  group: string; title: string; hours: number; content: string; method: string
  workshops: { title: string; hours: number; description: string; deliverable: string }[]
}

/**
 * Écrit les modules et leurs ateliers en 2 requêtes groupées (au lieu d'une par ligne) : la base est distante,
 * un programme de 11 modules prenait plus de 30 s en insertions imbriquées.
 */
async function writeModules(tx: Tx, programId: number, modules: ModuleInput[]) {
  if (modules.length === 0) return
  const created = await tx.programModule.createManyAndReturn({
    data: modules.map((m, i) => ({ programId, position: i, group: m.group, title: m.title, hours: m.hours, content: m.content, method: m.method })),
    select: { id: true, position: true },
  })
  const idAt = new Map(created.map((c) => [c.position, c.id]))
  const workshops = modules.flatMap((m, i) =>
    m.workshops.map((w, j) => ({ moduleId: idAt.get(i)!, position: j, title: w.title, hours: w.hours, description: w.description, deliverable: w.deliverable })),
  )
  if (workshops.length) await tx.programWorkshop.createMany({ data: workshops })
}

const TX = { timeout: 60_000, maxWait: 15_000 }

const connect = (list: number[]) => list.map((id) => ({ id }))

export async function createProgram(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const form = readForm(formData)
  const { parsed, modules, errors } = validate(form)
  if (!parsed.success || !modules.success) return failure(form.values, errors)

  const slug = await resolveSlug('program', parsed.data.slug, parsed.data.title)
  if ('error' in slug) return failure(form.values, { ...errors, slug: slug.error })

  const program = await prisma.$transaction(async (tx) => {
    const created = await tx.program.create({
      data: {
        ...toData(parsed.data, form, slug.slug),
        tools: { connect: connect(form.toolIds) },
        certifications: { connect: connect(form.certificationIds) },
        courses: { connect: connect(form.courseIds) },
      },
    })
    await writeModules(tx, created.id, modules.data)
    return created
  }, TX)
  revalidatePublic()
  redirectWithToast(`/admin/programs/${program.id}`, 'Programme créé.')
}

export async function updateProgram(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const form = readForm(formData)
  const { parsed, modules, errors } = validate(form)
  if (!parsed.success || !modules.success) return failure(form.values, errors)

  const existing = await prisma.program.findUnique({ where: { id }, select: { slug: true } })
  if (!existing) return failure(form.values, {}, 'Ce programme n’existe plus.')
  const slug = await resolveSlug('program', parsed.data.slug, parsed.data.title, { excludeId: id, current: existing.slug })
  if ('error' in slug) return failure(form.values, { ...errors, slug: slug.error })

  await prisma.$transaction(async (tx) => {
    await tx.programModule.deleteMany({ where: { programId: id } })
    await tx.program.update({
      where: { id },
      data: {
        ...toData(parsed.data, form, slug.slug),
        tools: { set: connect(form.toolIds) },
        certifications: { set: connect(form.certificationIds) },
        courses: { set: connect(form.courseIds) },
      },
    })
    await writeModules(tx, id, modules.data)
  }, TX)
  revalidatePublic()
  redirectWithToast(`/admin/programs/${id}`, 'Programme enregistré.')
}

export async function duplicateProgram(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }
  const src = await prisma.program.findUnique({
    where: { id },
    include: { modules: { orderBy: { position: 'asc' }, include: { workshops: { orderBy: { position: 'asc' } } } }, tools: { select: { id: true } }, certifications: { select: { id: true } }, courses: { select: { id: true } } },
  })
  if (!src) return { error: 'Ce programme n’existe plus.' }

  const title = `${src.title} (copie)`
  const slug = await resolveSlug('program', '', title)
  if ('error' in slug) return { error: slug.error }
  const { id: _id, createdAt: _c, updatedAt: _u, modules, tools, certifications, courses, ...fields } = src
  const copy = await prisma.$transaction(async (tx) => {
    const created = await tx.program.create({
      data: {
        ...fields,
        title,
        slug: slug.slug,
        status: 'draft',
        tools: { connect: connect(tools.map((t) => t.id)) },
        certifications: { connect: connect(certifications.map((c) => c.id)) },
        courses: { connect: connect(courses.map((c) => c.id)) },
      },
    })
    await writeModules(tx, created.id, modules.map((m) => ({ ...m, workshops: m.workshops })))
    return created
  }, TX)
  redirectWithToast(`/admin/programs/${copy.id}`, 'Programme dupliqué en brouillon.')
}

export async function deleteProgram(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }
  const { count } = await prisma.program.deleteMany({ where: { id } })
  if (count === 0) return { error: 'Ce programme n’existe plus.' }
  revalidatePublic()
  redirectWithToast('/admin/programs', 'Programme supprimé.')
}
