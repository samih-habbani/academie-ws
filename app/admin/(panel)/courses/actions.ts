'use server'

import { z } from 'zod'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import {
  failure, formValues, imageRef, optionalInt, optionalText, redirectWithToast, requiredText, revalidatePublic, zodErrors,
  type FormState,
} from '@/lib/admin/form'
import { deleteBlobIfOwned } from '@/lib/admin/blob'
import { resolveSlug, slugField } from '@/lib/admin/slug'

const courseSchema = z.object({
  title: requiredText('Le titre'),
  slug: slugField,
  description: z.string().trim().min(1, 'La description est obligatoire.').max(20000, 'La description est trop longue.'),
  categoryId: z.string().regex(/^\d+$/, 'Choisis une catégorie.').transform(Number),
  themeId: z.string().regex(/^\d*$/, 'Thématique invalide.').transform((v) => (v === '' ? null : Number(v))),
  difficulty: z.enum(['', 'debutant', 'intermediaire', 'confirme'], { message: 'Niveau invalide.' }).transform((v) => (v === '' ? null : v)),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide.')
    .refine((v) => !Number.isNaN(Date.parse(v)), 'Date invalide.'),
  duration: requiredText('La durée', 75),
  author: optionalText('L’auteur', 75),
  price: optionalText('Le prix'),
  oldPrice: optionalText('L’ancien prix'),
  chapterCount: optionalInt('Le nombre de chapitres'),
  logo: imageRef('courses'),
})

type CourseInput = z.infer<typeof courseSchema>

async function checkRelations(input: CourseInput): Promise<Record<string, string> | null> {
  const [category, theme] = await Promise.all([
    prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }),
    input.themeId ? prisma.theme.findUnique({ where: { id: input.themeId }, select: { id: true } }) : Promise.resolve({ id: 0 }),
  ])
  const errors: Record<string, string> = {}
  if (!category) errors.categoryId = 'Cette catégorie n’existe pas.'
  if (!theme) errors.themeId = 'Cette thématique n’existe pas.'
  return Object.keys(errors).length ? errors : null
}

function toData(input: CourseInput, slug: string, available: boolean) {
  return {
    title: input.title,
    slug,
    description: input.description,
    logo: input.logo,
    date: new Date(`${input.date}T00:00:00.000Z`),
    duration: input.duration,
    categoryId: input.categoryId,
    themeId: input.themeId,
    difficulty: input.difficulty,
    available,
    price: input.price || null,
    oldPrice: input.oldPrice,
    chapterCount: input.chapterCount,
    author: input.author || null,
  }
}

export async function createCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = courseSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  const relationErrors = await checkRelations(parsed.data)
  if (relationErrors) return failure(values, relationErrors)

  const slug = await resolveSlug('course', parsed.data.slug, parsed.data.title)
  if ('error' in slug) return failure(values, { slug: slug.error })

  const course = await prisma.course.create({ data: toData(parsed.data, slug.slug, values.available === 'on') })
  revalidatePublic()
  redirectWithToast(`/admin/courses/${course.id}`, 'Cours créé. Tu peux maintenant lui ajouter des chapitres.')
}

export async function updateCourse(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin()
  const values = formValues(formData)
  const parsed = courseSchema.safeParse(values)
  if (!parsed.success) return failure(values, zodErrors(parsed.error))
  const relationErrors = await checkRelations(parsed.data)
  if (relationErrors) return failure(values, relationErrors)

  const existing = await prisma.course.findUnique({ where: { id }, select: { logo: true, slug: true } })
  if (!existing) return failure(values, {}, 'Ce cours n’existe plus.')

  const slug = await resolveSlug('course', parsed.data.slug, parsed.data.title, { excludeId: id, current: existing.slug })
  if ('error' in slug) return failure(values, { slug: slug.error })

  await prisma.course.update({ where: { id }, data: toData(parsed.data, slug.slug, values.available === 'on') })
  if (existing.logo !== parsed.data.logo) await deleteBlobIfOwned(existing.logo)
  revalidatePublic()
  redirectWithToast(`/admin/courses/${id}`, 'Modifications enregistrées.')
}

export async function deleteCourse(formData: FormData): Promise<{ error?: string } | void> {
  await requireAdmin()
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id) || id <= 0) return { error: 'Identifiant invalide.' }

  const course = await prisma.course.findUnique({ where: { id }, select: { logo: true, supportUrl: true } })
  if (!course) return { error: 'Ce cours n’existe plus.' }

  // Les chapitres dépendent du cours : ils sont supprimés avec lui, en une seule transaction.
  await prisma.$transaction([prisma.chapter.deleteMany({ where: { courseId: id } }), prisma.course.delete({ where: { id } })])
  await Promise.all([deleteBlobIfOwned(course.logo), deleteBlobIfOwned(course.supportUrl)])
  revalidatePublic()
  redirectWithToast('/admin/courses', 'Cours supprimé.')
}
